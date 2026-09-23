<?php

namespace Workdo\Recruitment\Http\Controllers;

use Workdo\Recruitment\Models\Interview;
use Workdo\Recruitment\Http\Requests\StoreInterviewRequest;
use Workdo\Recruitment\Http\Requests\UpdateInterviewRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Recruitment\Models\Candidate;
use Workdo\Recruitment\Models\JobPosting;
use Workdo\Recruitment\Models\InterviewRound;
use Workdo\Recruitment\Models\InterviewType;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Workdo\Recruitment\Events\CreateInterview;
use Workdo\Recruitment\Events\UpdateInterview;
use Workdo\Recruitment\Events\DestroyInterview;
use Carbon\Carbon;

class InterviewController extends Controller
{
    public function index()
    {
        if (Auth::user()->can('manage-interviews')) {
            $baseQuery = Interview::query()
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-interviews')) {
                        $q->where('interviews.created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-interviews')) {
                        $q->where(function ($query) {
                            $query->where('interviews.creator_id', Auth::id())
                                ->orWhereJsonContains('interviews.interviewer_ids', Auth::id());
                        });
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            // Upcoming interviews
            $now = Carbon::now();
            $upcomingInterviews = (clone $baseQuery)
                ->with(['candidate:id,first_name,last_name', 'interviewRound:id,name', 'interviewType:id,name'])
                ->where('interviews.status', 0)
                ->where(function ($query) use ($now) {
                    if (!checkDemo()) {
                        $query
                            ->whereDate('interviews.scheduled_date', '>', $now->toDateString())
                            ->orWhere(function ($query) use ($now) {
                                $query
                                    ->whereDate('interviews.scheduled_date', $now->toDateString())
                                    ->whereTime('interviews.scheduled_time', '>=', $now->format('H:i:s'));
                            });
                    }
                })
                ->select('interviews.*')
                ->orderBy('interviews.scheduled_date', 'asc')
                ->orderBy('interviews.scheduled_time', 'asc')
                ->get()
                ->map(fn($i) => [
                    'id'             => $i->id,
                    'scheduled_date' => $i->scheduled_date,
                    'scheduled_time' => $i->scheduled_time,
                    'duration'       => $i->duration,
                    'location'       => $i->location,
                    'meeting_link'   => $i->meeting_link,
                    'candidate_name' => $i->candidate ? trim($i->candidate->first_name . ' ' . $i->candidate->last_name) : '-',
                    'candidate_id'   => $i->candidate_id,
                    'round_name'     => $i->interviewRound?->name,
                    'type_name'      => $i->interviewType?->name,
                ]);

            // Selected date summary
            $selectedDate = request('selected_date', today());
            $dateQuery    = (clone $baseQuery)->when(!checkDemo(), function ($query) use ($selectedDate) {
                $query->whereDate('interviews.scheduled_date', $selectedDate);
            });
            $selectedDateSummary = [
                'date'             => $selectedDate,
                'total'            => (clone $dateQuery)->count(),
                'scheduled'        => (clone $dateQuery)->where('interviews.status', 0)->count(),
                'completed'        => (clone $dateQuery)->where('interviews.status', 1)->count(),
                'cancelled'        => (clone $dateQuery)->where('interviews.status', 2)->count(),
                'no_show'          => (clone $dateQuery)->where('interviews.status', 3)->count(),
                'pending_feedback' => (clone $dateQuery)->where('interviews.feedback_submitted', 0)->count(),
            ];

            // Filtered query (search / date / type / feedback — excludes status tab)
            $filteredQuery = (clone $baseQuery)
                ->when(request('search'), function ($q) {
                    $s = request('search');
                    $q->where(function ($query) use ($s) {
                        $query->where('interviews.location', 'like', "%{$s}%")
                            ->orWhereHas('candidate', fn($c) => $c->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$s}%"]))
                            ->orWhereHas('jobPosting', fn($j) => $j->where('title', 'like', "%{$s}%"))
                            ->orWhereHas('interviewRound', fn($r) => $r->where('name', 'like', "%{$s}%"))
                            ->orWhereHas('interviewType', fn($t) => $t->where('name', 'like', "%{$s}%"));
                    });
                })
                ->when(!checkDemo(), function ($query) {
                    $query->whereDate('interviews.scheduled_date', request('selected_date', today()));
                })
                ->when(request('feedback'), function ($q) {
                    if (request('feedback') === 'submitted') {
                        $q->where('interviews.feedback_submitted', 1);
                    } elseif (request('feedback') === 'pending') {
                        $q->where(fn($query) => $query->where('interviews.feedback_submitted', 0)->orWhereNull('interviews.feedback_submitted'));
                    }
                })
                ->when(request('interview_type_id') && request('interview_type_id') !== 'all', fn($q) => $q->where('interviews.interview_type_id', request('interview_type_id')));

            $summary = [
                'total'     => (clone $filteredQuery)->count(),
                'scheduled' => (clone $filteredQuery)->where('interviews.status', '0')->count(),
                'completed' => (clone $filteredQuery)->where('interviews.status', '1')->count(),
                'cancelled' => (clone $filteredQuery)->where('interviews.status', '2')->count(),
                'no_show'   => (clone $filteredQuery)->where('interviews.status', '3')->count(),
            ];

            // Apply status tab filter
            $itemsQuery = (clone $filteredQuery)
                ->when(request('status') !== null && request('status') !== '' && request('status') !== 'all', fn($q) => $q->where('interviews.status', request('status')))
                ->with([
                    'candidate',
                    'jobPosting:id,title,location_id',
                    'jobPosting.location:id,name,remote_work',
                    'interviewRound:id,name',
                    'interviewType:id,name',
                ])
                ->when(request('sort'), function ($q) {
                    $sort = request('sort');
                    $direction = request('direction', 'asc');
                    switch ($sort) {
                        case 'candidate_name':
                            $q->leftJoin('candidates', 'interviews.candidate_id', '=', 'candidates.id')
                                ->select('interviews.*', DB::raw("CONCAT(candidates.first_name, ' ', candidates.last_name) as candidate_name"))
                                ->orderBy('candidate_name', $direction);
                            break;
                        case 'round_name':
                            $q->leftJoin('interview_rounds', 'interviews.round_id', '=', 'interview_rounds.id')
                                ->select('interviews.*', 'interview_rounds.name as round_name')
                                ->orderBy('round_name', $direction);
                            break;
                        case 'interview_type_name':
                            $q->leftJoin('interview_types', 'interviews.interview_type_id', '=', 'interview_types.id')
                                ->select('interviews.*', 'interview_types.name as interview_type_name')
                                ->orderBy('interview_type_name', $direction);
                            break;
                        default:
                            $q->select('interviews.*')->orderBy('interviews.' . $sort, $direction);
                    }
                }, fn($q) => $q->select('interviews.*')->orderBy('interviews.scheduled_date', 'asc')->orderBy('interviews.scheduled_time', 'asc'));

            $interviews = $itemsQuery->paginate(request('per_page', 10))->withQueryString();

            $interviews->getCollection()->transform(function ($interview) {
                if ($interview->interviewer_ids) {
                    $ids = is_array($interview->interviewer_ids) ? $interview->interviewer_ids : json_decode($interview->interviewer_ids, true);
                    if ($ids) {
                        $interview->interviewer_names = User::emp()->whereIn('id', $ids)->pluck('name')->implode(', ');
                    }
                }
                return $interview;
            });

            $candidates = Candidate::where('created_by', creatorId())
                ->where('status', '2')
                ->select('id', 'first_name', 'last_name')->get()->map(function ($candidate) {
                    return [
                        'id' => $candidate->id,
                        'name' => $candidate->first_name . ' ' . $candidate->last_name
                    ];
                });

            $jobPostings = JobPosting::where('created_by', creatorId())->where('is_published', 1)->where('status', 'active')->select('id', 'title')->get()->map(function ($job) {
                return [
                    'id' => $job->id,
                    'name' => $job->title,
                    'title' => $job->title
                ];
            });

            $interviewRounds = InterviewRound::where('created_by', creatorId())->where('status', 0)->select('id', 'name')->get();

            $interviewTypes = InterviewType::where('created_by', creatorId())->where('is_active', 1)->select('id', 'name')->get();

            $users = User::emp()->where('created_by', creatorId())->select('id', 'name')->get();

            return Inertia::render('Recruitment/Interviews/Index', [
                'interviews'          => $interviews,
                'summary'             => $summary,
                'upcomingInterviews'  => $upcomingInterviews,
                'selectedDateSummary' => $selectedDateSummary,
                'candidates' => $candidates,
                'jobpostings'    => $jobPostings,
                'interviewrounds' => $interviewRounds,
                'interviewtypes'  => $interviewTypes,
                'employees'       => $users,
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function show(Interview $interview)
    {
        if (Auth::user()->can('manage-interviews')) {

            // Get interviewer detailed users
            $interviewers = User::emp()
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-interview-feedbacks')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-interview-feedbacks')) {
                        $q->where('creator_id', Auth::id())->orWhere('id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->whereIn('id', $interview->interviewer_ids)
                ->select('id', 'name', 'email', 'avatar', 'type')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'avatar' => $user->avatar,
                        'role' => $user->type ?? 'Interviewer',
                    ];
                });

            $interviewerIds = $interviewers->pluck('id');

            // Get feedbacks for this interview
            $feedbacks = \Workdo\Recruitment\Models\InterviewFeedback::where('interview_id', $interview->id)->whereIn('interviewer_id', $interviewerIds)->get()->map(function ($fb) {
                return [
                    'id' => $fb->id,
                    'technical_rating' => $fb->technical_rating,
                    'communication_rating' => $fb->communication_rating,
                    'cultural_fit_rating' => $fb->cultural_fit_rating,
                    'overall_rating' => $fb->overall_rating,
                    'strengths' => $fb->strengths,
                    'weaknesses' => $fb->weaknesses,
                    'comments' => $fb->comments,
                    'recommendation' => $fb->recommendation,
                    'interviewer_id' => $fb->interviewer_id,
                    'creator_id' => $fb->creator_id,
                    'created_at' => $fb->created_at,
                ];
            });

            $interview = $interview->load([
                'candidate',
                'jobPosting:id,title,location_id',
                'jobPosting.location:id,name,remote_work',
                'interviewRound:id,name',
                'interviewType:id,name'
            ]);

            $interview->interviewers = User::emp()
                ->whereIn('id', $interview->interviewer_ids ?? [])
                ->select('id', 'name', 'email', 'avatar', 'type')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'avatar' => $user->avatar,
                        'role' => $user->type ?? 'Interviewer',
                    ];
                });

            return Inertia::render('Recruitment/Interviews/Show', [
                'interview' => $interview,
                'interviewers' => $interviewers,
                'feedbacks' => $feedbacks,
                'users' => User::emp()->where('created_by', creatorId())->select('id', 'name')->get(),
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function create()
    {
        if (Auth::user()->can('create-interviews')) {
            return Inertia::render('Recruitment/Interviews/Create', [
                'candidates' => Candidate::where('created_by', creatorId())
                    ->where('status', '2')
                    ->select('id', 'first_name', 'last_name')->get()->map(function ($candidate) {
                        return [
                            'id' => $candidate->id,
                            'name' => $candidate->first_name . ' ' . $candidate->last_name,
                            'first_name' => $candidate->first_name,
                            'last_name' => $candidate->last_name
                        ];
                    }),
                'jobpostings' => JobPosting::where('created_by', creatorId())->where('is_published', 1)->where('status', 'active')->select('id', 'title')->get(),
                'interviewrounds' => InterviewRound::where('created_by', creatorId())->where('status', 0)->select('id', 'name')->get(),
                'interviewtypes' => InterviewType::where('created_by', creatorId())->where('is_active', 1)->select('id', 'name')->get(),
                'employees' => User::emp()->where('created_by', creatorId())->select('id', 'name')->get(),
            ]);
        } else {
            return redirect()->route('recruitment.interviews.index')->with('error', __('Permission denied'));
        }
    }

    public function store(StoreInterviewRequest $request)
    {
        if (Auth::user()->can('create-interviews')) {
            $validated = $request->validated();

            $candidate = Candidate::with(['job_posting.location'])->find($validated['candidate_id']);

            $interview = new Interview();
            $interview->candidate_id = $validated['candidate_id'];
            $interview->job_id = $candidate->job_id;
            $interview->round_id = $validated['round_id'];
            $interview->interview_type_id = $validated['interview_type_id'];
            $interview->scheduled_date = $validated['scheduled_date'];
            $interview->scheduled_time = $validated['scheduled_time'];
            $interview->duration = $validated['duration'];

            // Set location to 'Online' for remote work jobs
            if ($candidate->job_posting && $candidate->job_posting->location && $candidate->job_posting->location->remote_work) {
                $interview->location = 'Online';
            } else {
                $interview->location = $validated['location'];
            }

            $interview->meeting_link = $validated['meeting_link'];
            $interview->interviewer_ids = $validated['interviewer_ids'] ?? [];
            $interview->status = $validated['status'];

            $interview->creator_id = Auth::id();
            $interview->created_by = creatorId();
            $interview->save();

            CreateInterview::dispatch($request, $interview);

            return redirect()->back()->with('success', __('The interview has been created successfully.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function edit(Interview $interview)
    {
        if (Auth::user()->can('edit-interviews')) {
            return Inertia::render('Recruitment/Interviews/Edit', [
                'interview' => $interview,
                'candidates' => Candidate::where('created_by', creatorId())
                    ->where('status', '2')
                    ->select('id', 'first_name', 'last_name')->get()->map(function ($candidate) {
                        return [
                            'id' => $candidate->id,
                            'name' => $candidate->first_name . ' ' . $candidate->last_name,
                            'first_name' => $candidate->first_name,
                            'last_name' => $candidate->last_name
                        ];
                    }),
                'jobpostings' => JobPosting::where('created_by', creatorId())->where('is_published', 1)->where('status', 'active')->select('id', 'title')->get(),
                'interviewrounds' => InterviewRound::where('created_by', creatorId())->where('status', 0)->select('id', 'name')->get(),
                'interviewtypes' => InterviewType::where('created_by', creatorId())->where('is_active', 1)->select('id', 'name')->get(),
                'employees' => User::emp()->where('created_by', creatorId())->select('id', 'name')->get(),
            ]);
        } else {
            return redirect()->route('recruitment.interviews.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateInterviewRequest $request, Interview $interview)
    {
        if (Auth::user()->can('edit-interviews')) {
            $validated = $request->validated();

            $candidate = Candidate::with(['job_posting.location'])->find($validated['candidate_id']);
            if (!$candidate) {
                return redirect()->back()->with('error', __('Candidate not found'));
            }

            // Store old status to check for changes
            $oldStatus = $interview->status;

            $interview->candidate_id = $validated['candidate_id'];
            $interview->job_id = $candidate->job_id;
            $interview->round_id = $validated['round_id'];
            $interview->interview_type_id = $validated['interview_type_id'];
            $interview->scheduled_date = $validated['scheduled_date'];
            $interview->scheduled_time = $validated['scheduled_time'];
            $interview->duration = $validated['duration'];
            $interview->location = $validated['location'];
            $interview->meeting_link = $validated['meeting_link'];
            $interview->interviewer_ids = $validated['interviewer_ids'] ?? [];
            $interview->status = $validated['status'];

            $interview->save();

            // Auto-update candidate status when interview is completed
            if ($oldStatus !== '1' && $validated['status'] === '1' && $candidate->status === '2') {
                $candidate->status = '3'; // Change from Interview to Offer
                $candidate->save();
            }

            UpdateInterview::dispatch($request, $interview);

            return redirect()->back()->with('success', __('The interview details are updated successfully.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function destroy(Interview $interview)
    {
        if (Auth::user()->can('delete-interviews')) {
            DestroyInterview::dispatch($interview);
            $interview->delete();

            return redirect()->back()->with('success', __('The interview has been deleted.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function getInterviewRoundsByCandidate($candidateId)
    {
        if (Auth::user()->can('manage-interview-rounds') || Auth::user()->can('create-interviews') || Auth::user()->can('edit-interviews')) {
            $candidate = Candidate::find($candidateId);
            if (!$candidate || !$candidate->job_id) {
                return response()->json([]);
            }

            $rounds = InterviewRound::where('job_id', $candidate->job_id)
                ->where('status', 0)
                ->where('created_by', creatorId())
                ->select('id', 'name')
                ->get();

            return response()->json($rounds);
        } else {
            return response()->json([], 403);
        }
    }

    public function kanban()
    {
        if (Auth::user()->can('manage-interviews')) {
            $interviews = Interview::query()
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-interviews')) {
                        $q->where('interviews.created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-interviews')) {
                        $q->where(function ($query) {
                            $query->where('interviews.creator_id', Auth::id())
                                ->orWhereJsonContains('interviews.interviewer_ids', Auth::id());
                        });
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->with([
                    'candidate',
                    'jobPosting:id,title,location_id',
                    'jobPosting.location:id,name,remote_work',
                    'interviewRound:id,name',
                    'interviewType:id,name',
                ])
                ->get();

            $interviews->transform(function ($interview) {
                $interview->interviewers = [];
                if ($interview->interviewer_ids) {
                    $ids = is_array($interview->interviewer_ids) ? $interview->interviewer_ids : json_decode($interview->interviewer_ids, true);
                    if ($ids) {
                        $interview->interviewers = User::emp()->whereIn('id', $ids)->select('id', 'name', 'avatar')->get()->map(function ($user) {
                            return [
                                'id' => $user->id,
                                'name' => $user->name,
                                'avatar' => $user->avatar,
                            ];
                        });
                    }
                }
                return $interview;
            });

            $candidates = Candidate::where('created_by', creatorId())
                ->where('status', '2')
                ->select('id', 'first_name', 'last_name')->get()->map(function ($candidate) {
                    return [
                        'id' => $candidate->id,
                        'name' => $candidate->first_name . ' ' . $candidate->last_name
                    ];
                });

            $jobPostings = JobPosting::where('created_by', creatorId())->where('is_published', 1)->where('status', 'active')->select('id', 'title')->get()->map(function ($job) {
                return [
                    'id' => $job->id,
                    'name' => $job->title,
                    'title' => $job->title
                ];
            });

            $interviewRounds = InterviewRound::where('created_by', creatorId())->where('status', 0)->select('id', 'name')->get();

            $interviewTypes = InterviewType::where('created_by', creatorId())->where('is_active', 1)->select('id', 'name')->get();

            $users = User::emp()->where('created_by', creatorId())->select('id', 'name')->get();

            return Inertia::render('Recruitment/Interviews/Kanban', [
                'interviews' => $interviews,
                'candidates' => $candidates,
                'jobpostings'    => $jobPostings,
                'interviewrounds' => $interviewRounds,
                'interviewtypes'  => $interviewTypes,
                'employees'       => $users,
            ]);
        } else {
            return redirect()->route('recruitment.interviews.index')->with('error', __('Permission denied'));
        }
    }

    public function updateStatus(\Illuminate\Http\Request $request, Interview $interview)
    {
        if (Auth::user()->can('edit-interviews')) {
            $validated = $request->validate([
                'status' => 'required|in:0,1,2,3',
            ]);

            $oldStatus = $interview->status;
            $interview->status = $validated['status'];
            $interview->save();

            // Auto-update candidate status when interview is completed
            $candidate = Candidate::find($interview->candidate_id);
            if ($candidate && (string)$oldStatus !== '1' && (string)$validated['status'] === '1' && (string)$candidate->status === '2') {
                $candidate->status = '3'; // Change from Interview to Offer
                $candidate->save();
            }

            return redirect()->back()->with('success', __('The interview status has been updated successfully.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }
}
