<?php

namespace Workdo\Goal\Http\Controllers;

use Workdo\Goal\Http\Requests\StoreGoalRequest;
use Workdo\Goal\Http\Requests\UpdateGoalRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Workdo\Goal\Models\Goal;
use Workdo\Goal\Models\GoalCategory;
use Workdo\Goal\Events\CreateGoal;
use Workdo\Goal\Events\UpdateGoal;
use Workdo\Goal\Events\DestroyGoal;
use Workdo\Account\Models\ChartOfAccount;
use Workdo\Goal\Services\GoalService;

class GoalController extends Controller
{
    public function index()
    {
        if (Auth::user()->can('manage-goals')) {
            $goalsQuery = Goal::query()
                ->with(['category', 'account'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-goals')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-goals')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            $stats = [
                'total'         => (clone $goalsQuery)->count(),
                'active'        => (clone $goalsQuery)->where('status', 'active')->count(),
                'completed'     => (clone $goalsQuery)->where('status', 'completed')->count(),
                'draft'         => (clone $goalsQuery)->where('status', 'draft')->count(),
                'total_target'  => (clone $goalsQuery)->sum('target_amount'),
                'total_current' => (clone $goalsQuery)->sum('current_amount'),
            ];

            $goalsQuery = (clone $goalsQuery)
                ->when(request('goal_name'), fn($q) => $q->where('goal_name', 'like', '%' . request('goal_name') . '%'))
                ->when(request('goal_type'), fn($q) => $q->where('goal_type', request('goal_type')))
                ->when(request('priority'), fn($q) => $q->where('priority', request('priority')))
                ->when(request('category_id'), fn($q) => $q->where('category_id', request('category_id')));

            $summary = [
                'total'     => (clone $goalsQuery)->count(),
                'active'    => (clone $goalsQuery)->where('status', 'active')->count(),
                'completed' => (clone $goalsQuery)->where('status', 'completed')->count(),
                'draft'     => (clone $goalsQuery)->where('status', 'draft')->count(),
            ];

            $goals = (clone $goalsQuery)
                ->when(request('status'), fn($q) => $q->where('status', request('status')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $categories = GoalCategory::where('is_active', true)->where('created_by', creatorId())->get();
            $chartOfAccounts = ChartOfAccount::where('created_by', creatorId())
                ->select('id', 'account_code', 'account_name', 'normal_balance')
                ->orderBy('account_code')
                ->get();
            return Inertia::render('Goal/Goals/Index', [
                'goals' => $goals,
                'categories' => $categories,
                'chartOfAccounts' => $chartOfAccounts,
                'stats' => $stats,
                'summary' => $summary,
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreGoalRequest $request)
    {
        if (Auth::user()->can('create-goals')) {
            $validated = $request->validated();

            $goal = new Goal();
            $goal->goal_name = $validated['goal_name'];
            $goal->goal_description = $validated['goal_description'];
            $goal->category_id = $validated['category_id'];
            $goal->goal_type = $validated['goal_type'];
            $goal->target_amount = $validated['target_amount'];
            $goal->current_amount = 0;
            $goal->start_date = $validated['start_date'];
            $goal->target_date = $validated['target_date'];
            $goal->priority = $validated['priority'];
            $goal->status = 'draft';
            $goal->account_id = $validated['account_id'];
            $goal->creator_id = Auth::id();
            $goal->created_by = creatorId();
            $goal->save();

            // Create initial tracking
            $goalService = new GoalService();
            $goalService->updateGoalTracking($goal->id);

            CreateGoal::dispatch($request, $goal);

            return redirect()->route('goal.goals.index')->with('success', __('The goal has been created successfully.'));
        } else {
            return redirect()->route('goal.goals.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateGoalRequest $request, Goal $goal)
    {
        if (Auth::user()->can('edit-goals')) {
            $validated = $request->validated();

            $goal->goal_name = $validated['goal_name'];
            $goal->goal_description = $validated['goal_description'];
            $goal->category_id = $validated['category_id'];
            $goal->goal_type = $validated['goal_type'];
            $goal->target_amount = $validated['target_amount'];
            $goal->current_amount = $validated['current_amount'] ?? 0;
            $goal->start_date = $validated['start_date'];
            $goal->target_date = $validated['target_date'];
            $goal->priority = $validated['priority'];
            $goal->status = $validated['status'];
            $goal->account_id = $validated['account_id'];
            $goal->save();

            UpdateGoal::dispatch($request, $goal);

            return back()->with('success', __('The goal details are updated successfully.'));
        } else {
            return redirect()->route('goal.goals.index')->with('error', __('Permission denied'));
        }
    }

    public function show(Goal $goal)
    {
        if (Auth::user()->can('view-goals') && $goal->created_by == creatorId()) {
            $goal->load(['category', 'account']);

            return Inertia::render('Goal/Goals/View', [
                'goal' => $goal,
            ]);
        } else {
            return redirect()->route('goal.goals.index')->with('error', __('Permission denied'));
        }
    }

    public function active(Goal $goal)
    {
        if (Auth::user()->can('active-goals') && $goal->created_by == creatorId()) {
            $goal->update(['status' => 'active']);
            return back()->with('success', __('Goal activated successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function destroy(Goal $goal)
    {
        if (Auth::user()->can('delete-goals')) {
            DestroyGoal::dispatch($goal);

            $goal->delete();

            return redirect()->back()->with('success', __('The goal has been deleted.'));
        } else {
            return redirect()->route('goal.goals.index')->with('error', __('Permission denied'));
        }
    }
}

