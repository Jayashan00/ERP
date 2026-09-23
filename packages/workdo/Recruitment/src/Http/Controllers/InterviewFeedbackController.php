<?php

namespace Workdo\Recruitment\Http\Controllers;

use Workdo\Recruitment\Models\InterviewFeedback;
use Workdo\Recruitment\Http\Requests\StoreInterviewFeedbackRequest;
use Workdo\Recruitment\Http\Requests\UpdateInterviewFeedbackRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Recruitment\Models\Interview;
use App\Models\User;
use Workdo\Recruitment\Events\CreateInterviewFeedback;
use Workdo\Recruitment\Events\UpdateInterviewFeedback;
use Workdo\Recruitment\Events\DestroyInterviewFeedback;

class InterviewFeedbackController extends Controller
{
    public function index()
    {
        if (Auth::user()->can('manage-interview-feedbacks')) {
            $query = InterviewFeedback::query()
                ->with(['interview.candidate', 'interview.jobPosting'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-interview-feedbacks')) {
                        $q->where('interview_feedbacks.created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-interview-feedbacks')) {
                        $q->where(function ($query) {
                            $query->where('interview_feedbacks.creator_id', Auth::id())
                                ->orWhereJsonContains('interview_feedbacks.interviewer_ids', (string) Auth::id());
                        });
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('strengths'), function ($q) {
                    $searchTerm = request('strengths');
                    $q->where(function ($query) use ($searchTerm) {
                        // Search in feedback fields
                        $query->where('interview_feedbacks.strengths', 'like', '%' . $searchTerm . '%')
                            ->orWhere('interview_feedbacks.weaknesses', 'like', '%' . $searchTerm . '%')
                            ->orWhere('interview_feedbacks.comments', 'like', '%' . $searchTerm . '%');

                        // Search in candidate names
                        $query->orWhereHas('interview.candidate', function ($candidateQuery) use ($searchTerm) {
                            $candidateQuery->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $searchTerm . '%']);
                        });

                        // Search in job titles
                        $query->orWhereHas('interview.jobPosting', function ($jobQuery) use ($searchTerm) {
                            $jobQuery->where('title', 'like', '%' . $searchTerm . '%');
                        });

                        // Search in interviewer names
                        $interviewerIds = User::emp()->where('name', 'like', '%' . $searchTerm . '%')->pluck('id')->toArray();
                        if (!empty($interviewerIds)) {
                            foreach ($interviewerIds as $id) {
                                $query->orWhereJsonContains('interview_feedbacks.interviewer_ids', (string) $id)
                                    ->orWhereJsonContains('interview_feedbacks.interviewer_ids', (int) $id);
                            }
                        }
                    });
                })
                ->when(request('interview_id') && request('interview_id') !== 'all', fn($q) => $q->where('interview_feedbacks.interview_id', request('interview_id')))
                ->when(request('interviewer_id') && request('interviewer_id') !== 'all', function ($q) {
                    $q->where(function ($query) {
                        $interviewerId = request('interviewer_id');
                        $query->whereJsonContains('interview_feedbacks.interviewer_ids', (string) $interviewerId)
                            ->orWhereJsonContains('interview_feedbacks.interviewer_ids', (int) $interviewerId);
                    });
                });

            $summary = [
                'total'         => (clone $query)->count(),
                'strong_hire'   => (clone $query)->where('interview_feedbacks.recommendation', '0')->count(),
                'strong_hire_count' => (clone $query)->where('interview_feedbacks.recommendation', '0')->count(), // alias just in case
                'hire'          => (clone $query)->where('interview_feedbacks.recommendation', '1')->count(),
                'maybe'         => (clone $query)->where('interview_feedbacks.recommendation', '2')->count(),
                'reject'        => (clone $query)->where('interview_feedbacks.recommendation', '3')->count(),
                'strong_reject' => (clone $query)->where('interview_feedbacks.recommendation', '4')->count(),
            ];

            $query->when(request('recommendation') !== null && request('recommendation') !== '' && request('recommendation') !== 'all', fn($q) => $q->where('interview_feedbacks.recommendation', request('recommendation')));

            $sort = request('sort');
            if ($sort === 'candidate') {
                $query->join('interviews', 'interview_feedbacks.interview_id', '=', 'interviews.id')
                    ->join('candidates', 'interviews.candidate_id', '=', 'candidates.id')
                    ->select('interview_feedbacks.*')
                    ->orderByRaw("CONCAT(candidates.first_name, ' ', candidates.last_name) " . request('direction', 'asc'));
            } elseif ($sort === 'interviewer_names') {
                $query->orderBy('interviewer_ids', request('direction', 'asc'));
            } elseif ($sort) {
                $query->orderBy($sort, request('direction', 'asc'));
            } else {
                $query->latest();
            }

            $interviewfeedbacks = $query
                ->paginate(request('per_page', 10))
                ->withQueryString();

            // Load interviewer names and details for each feedback
            $interviewfeedbacks->getCollection()->transform(function ($feedback) {
                $feedback->interviewers = [];
                if ($feedback->interviewer_ids) {
                    $interviewerIds = is_array($feedback->interviewer_ids) ? $feedback->interviewer_ids : json_decode($feedback->interviewer_ids, true);
                    if (!empty($interviewerIds)) {
                        $users = User::emp()->whereIn('id', $interviewerIds)->select('id', 'name', 'avatar')->get();
                        $feedback->interviewer_names = $users->pluck('name')->implode(', ');
                        $feedback->interviewers = $users->map(function ($user) {
                            return [
                                'id' => $user->id,
                                'name' => $user->name,
                                'avatar' => $user->avatar,
                            ];
                        })->toArray();
                    }
                }
                return $feedback;
            });

            return Inertia::render('Recruitment/InterviewFeedbacks/Index', [
                'interviewfeedbacks' => $interviewfeedbacks,
                'summary' => $summary,
                'interviews' => Interview::with(['candidate', 'jobPosting'])
                    ->where('created_by', creatorId())
                    ->where('status', '1') // Only completed interviews
                    ->select('id', 'candidate_id', 'job_id', 'interviewer_ids')
                    ->get()
                    ->map(function ($interview) {
                        $interviewerIds = $interview->interviewer_ids;
                        if (is_string($interviewerIds)) {
                            $interviewerIds = json_decode($interviewerIds, true);
                        }
                        return [
                            'id' => $interview->id,
                            'name' => ($interview->candidate ? $interview->candidate->first_name . ' ' . $interview->candidate->last_name : 'Unknown') .
                                ' - ' . ($interview->jobPosting ? $interview->jobPosting->title : 'Unknown Job'),
                            'interviewers' => $interviewerIds ?: []
                        ];
                    }),
                'users' => User::emp()->where('created_by', creatorId())->select('id', 'name')->get(),
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function create(\Illuminate\Http\Request $request, $interview_id, $interviewer_id)
    {
        if (Auth::user()->can('create-interview-feedbacks')) {
            $interview = Interview::with(['candidate', 'jobPosting', 'interviewType'])->find($interview_id);
            if (!$interview) {
                return redirect()->back()->with('error', __('Interview not found'));
            }

            // Get selected interviewer id or fall back to current user
            $interviewer = User::emp()
                ->where('id', $interviewer_id)
                ->select('id', 'name', 'email', 'avatar', 'type')
                ->first();

            if (!$interviewer) {
                return redirect()->back()->with('error', __('Interviewer not found'));
            }

            return Inertia::render('Recruitment/Interviews/CreateFeedback', [
                'interview' => $interview,
                'interviewer' => [
                    'id' => $interviewer->id,
                    'name' => $interviewer->name,
                    'email' => $interviewer->email,
                    'avatar' => $interviewer->avatar,
                    'role' => $interviewer->type ?? 'Interviewer',
                ],
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreInterviewFeedbackRequest $request)
    {
        if (Auth::user()->can('create-interview-feedbacks')) {
            $validated = $request->validated();

            $interviewfeedback = new InterviewFeedback();
            $interviewfeedback->technical_rating = $validated['technical_rating'];
            $interviewfeedback->communication_rating = $validated['communication_rating'];
            $interviewfeedback->cultural_fit_rating = $validated['cultural_fit_rating'];

            // Calculate overall rating as average of the three ratings
            $ratings = array_filter([
                $validated['technical_rating'],
                $validated['communication_rating'],
                $validated['cultural_fit_rating']
            ]);
            $interviewfeedback->overall_rating = !empty($ratings) ? round(array_sum($ratings) / count($ratings), 1) : 0;
            $interviewfeedback->strengths = $validated['strengths'];
            $interviewfeedback->weaknesses = $validated['weaknesses'];
            $interviewfeedback->comments = $validated['comments'];
            $interviewfeedback->recommendation = $validated['recommendation'];
            $interviewfeedback->interview_id = $validated['interview_id'];
            $interviewfeedback->interviewer_id = $validated['interviewer_id'];

            $interviewfeedback->creator_id = Auth::id();
            $interviewfeedback->created_by = creatorId();
            $interviewfeedback->save();

            CreateInterviewFeedback::dispatch($request, $interviewfeedback);

            // Update interview feedback_submitted status
            $interview = Interview::find($validated['interview_id']);
            if ($interview) {
                $interview->feedback_submitted = 1;
                $interview->save();
            }

            return redirect()->route('recruitment.interviews.show', $validated['interview_id'])->with('success', __('The interview feedback has been created successfully.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function edit(InterviewFeedback $interviewfeedback)
    {
        if (Auth::user()->can('edit-interview-feedbacks')) {
            $interview = Interview::with(['candidate', 'jobPosting', 'interviewType'])->find($interviewfeedback->interview_id);
            if (!$interview) {
                return redirect()->back()->with('error', __('Interview not found'));
            }

            $interviewer = User::emp()
                ->where('id', $interviewfeedback->interviewer_id)
                ->select('id', 'name', 'email', 'avatar', 'type')
                ->first();

            // Fallback to feedback creator if interviewer not found/not set
            if (!$interviewer) {
                $interviewer = User::emp()
                    ->where('id', $interviewfeedback->creator_id)
                    ->select('id', 'name', 'email', 'avatar', 'type')
                    ->first();
            }

            if (!$interviewer) {
                return redirect()->back()->with('error', __('Interviewer not found'));
            }

            return Inertia::render('Recruitment/Interviews/EditFeedback', [
                'interviewfeedback' => $interviewfeedback,
                'interview' => $interview,
                'interviewer' => [
                    'id' => $interviewer->id,
                    'name' => $interviewer->name,
                    'email' => $interviewer->email,
                    'avatar' => $interviewer->avatar,
                    'role' => $interviewer->type ?? 'Interviewer',
                ],
            ]);
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateInterviewFeedbackRequest $request, InterviewFeedback $interviewfeedback)
    {
        if (Auth::user()->can('edit-interview-feedbacks')) {
            $validated = $request->validated();

            $interviewfeedback->technical_rating = $validated['technical_rating'];
            $interviewfeedback->communication_rating = $validated['communication_rating'];
            $interviewfeedback->cultural_fit_rating = $validated['cultural_fit_rating'];

            // Calculate overall rating as average of the three ratings
            $ratings = array_filter([
                $validated['technical_rating'],
                $validated['communication_rating'],
                $validated['cultural_fit_rating']
            ]);
            $interviewfeedback->overall_rating = !empty($ratings) ? round(array_sum($ratings) / count($ratings), 1) : 0;
            $interviewfeedback->strengths = $validated['strengths'];
            $interviewfeedback->weaknesses = $validated['weaknesses'];
            $interviewfeedback->comments = $validated['comments'];
            $interviewfeedback->recommendation = $validated['recommendation'];
            $interviewfeedback->interview_id = $validated['interview_id'];
            $interviewfeedback->interviewer_id = $validated['interviewer_id'];

            $interviewfeedback->save();

            UpdateInterviewFeedback::dispatch($request, $interviewfeedback);

            // Update interview feedback_submitted status
            $interview = Interview::find($validated['interview_id']);
            if ($interview) {
                $interview->feedback_submitted = 1;
                $interview->save();
            }

            return redirect()->route('recruitment.interviews.show', $validated['interview_id'])->with('success', __('The interview feedback details are updated successfully.'));
        } else {
            return redirect()->route('recruitment.interview-feedbacks.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(InterviewFeedback $interviewfeedback)
    {
        if (Auth::user()->can('delete-interview-feedbacks')) {
            DestroyInterviewFeedback::dispatch($interviewfeedback);
            $interviewfeedback->delete();

            return redirect()->back()->with('success', __('The interview feedback has been deleted.'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }
}
