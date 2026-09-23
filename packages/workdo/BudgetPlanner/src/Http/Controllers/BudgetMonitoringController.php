<?php

namespace Workdo\BudgetPlanner\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Workdo\BudgetPlanner\Models\BudgetMonitoring;
use Workdo\BudgetPlanner\Models\Budget;
use Illuminate\Support\Facades\Auth;

class BudgetMonitoringController extends Controller
{
    public function index()
    {
        if (Auth::user()->can('manage-budget-monitoring')) {
            $baseQuery = BudgetMonitoring::query()
                ->select('budget_monitorings.*')
                ->with(['budget'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-own-budgets')) {
                        $q->whereHas('budget', fn($query) => $query->where('creator_id', Auth::id()));
                    }
                });

            $cardStats = [
                'total_monitored' => (clone $baseQuery)->count(),
                'total_allocated' => (clone $baseQuery)->sum('total_allocated'),
                'total_spent' => (clone $baseQuery)->sum('total_spent'),
                'total_remaining' => (clone $baseQuery)->sum('total_remaining'),
                'spent_percentage' => ((clone $baseQuery)->sum('total_allocated') > 0) ? round(((clone $baseQuery)->sum('total_spent') / (clone $baseQuery)->sum('total_allocated')) * 100, 1) : 0
            ];

            $budgetMonitorings = $baseQuery->when(request('search'), function ($q) {
                $search = request('search');
                $q->whereHas('budget', fn($query) => $query->where('budget_name', 'like', "%{$search}%"));
            })
                ->when(request('budget_id'), fn($q) => $q->whereHas('budget', fn($query) => $query->where('id', request('budget_id'))))
                ->when(request('date_from'), fn($q) => $q->whereDate('monitoring_date', '>=', request('date_from')))
                ->when(request('date_to'), fn($q) => $q->whereDate('monitoring_date', '<=', request('date_to')))
                ->when(request('sort'), function ($q) {
                    $sort = request('sort');
                    $direction = request('direction', 'asc');
                    if ($sort === 'budget') {
                        $q->join('budgets', 'budget_monitorings.budget_id', '=', 'budgets.id')
                            ->orderBy('budgets.budget_name', $direction);
                    } else {
                        $q->orderBy($sort, $direction);
                    }
                }, fn($q) => $q->orderBy('monitoring_date', 'desc'))
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $budgets = Budget::where('created_by', creatorId())
                ->select('id', 'budget_name')
                ->get();

            return Inertia::render('BudgetPlanner/BudgetMonitorings/Index', [
                'budgetMonitorings' => $budgetMonitorings,
                'budgets' => $budgets,
                'cardStats' => $cardStats
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
