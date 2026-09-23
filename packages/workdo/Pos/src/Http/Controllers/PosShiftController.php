<?php

namespace Workdo\Pos\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Workdo\Pos\Http\Requests\ClosePosShiftRequest;
use Workdo\Pos\Http\Requests\OpenPosShiftRequest;
use Workdo\Pos\Http\Requests\PosShiftCashMovementRequest;
use Workdo\Pos\Models\PosShift;
use Workdo\Pos\Models\PosShiftCashMovement;

class PosShiftController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::user()->can('manage-pos-shifts')) {
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }

        $query = PosShift::with(['cashier:id,name,avatar', 'warehouse:id,name'])
            ->where('created_by', creatorId());

        if ($request->filled('cashier')) {
            $query->whereHas('cashier', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->get('cashier') . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('opened_at', '>=', $request->get('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('opened_at', '<=', $request->get('date_to'));
        }

        $shifts = $query->latest('opened_at')->paginate($request->get('per_page', 15))->withQueryString();

        return Inertia::render('Pos/Shifts/Index', [
            'shifts' => $shifts,
            'filters' => $request->only(['cashier', 'status', 'date_from', 'date_to']),
        ]);
    }

    public function current(Request $request)
    {
        $shift = PosShift::with('cashMovements')
            ->where('cashier_id', Auth::id())
            ->where('status', 'open')
            ->where('created_by', creatorId())
            ->latest('opened_at')
            ->first();

        return response()->json([
            'shift' => $shift,
        ]);
    }

    public function open(OpenPosShiftRequest $request)
    {
        if (!Auth::user()->can('open-pos-shift')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        $existing = PosShift::findOpenFor(Auth::id());
        if ($existing) {
            return response()->json([
                'message' => __('You already have an open shift. Close it before starting a new one.'),
                'shift' => $existing,
            ], 422);
        }

        $shift = PosShift::create([
            'shift_number' => PosShift::generateShiftNumber(),
            'warehouse_id' => $request->input('warehouse_id'),
            'cashier_id' => Auth::id(),
            'opened_by' => Auth::id(),
            'opened_at' => now(),
            'opening_cash' => $request->input('opening_cash'),
            'expected_cash' => $request->input('opening_cash'),
            'opening_notes' => $request->input('opening_notes'),
            'status' => 'open',
            'creator_id' => Auth::id(),
            'created_by' => creatorId(),
        ]);

        return response()->json([
            'message' => __('Shift opened successfully'),
            'shift' => $shift,
        ]);
    }

    public function addCashMovement(PosShiftCashMovementRequest $request, PosShift $shift)
    {
        if (!Auth::user()->can('manage-pos-cash-drawer')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        if ($shift->status !== 'open') {
            return response()->json(['message' => __('This shift is already closed')], 422);
        }

        if ($shift->cashier_id !== Auth::id() && !Auth::user()->can('manage-pos-shifts')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        DB::transaction(function () use ($request, $shift) {
            PosShiftCashMovement::create([
                'pos_shift_id' => $shift->id,
                'type' => $request->input('type'),
                'amount' => $request->input('amount'),
                'reason' => $request->input('reason'),
                'creator_id' => Auth::id(),
                'created_by' => creatorId(),
            ]);

            $shift->recalculateTotals();
        });

        return response()->json([
            'message' => __('Cash drawer updated'),
            'shift' => $shift->fresh('cashMovements'),
        ]);
    }

    public function close(ClosePosShiftRequest $request, PosShift $shift)
    {
        if (!Auth::user()->can('close-pos-shift')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        if ($shift->status !== 'open') {
            return response()->json(['message' => __('This shift is already closed')], 422);
        }

        if ($shift->cashier_id !== Auth::id() && !Auth::user()->can('manage-pos-shifts')) {
            return response()->json(['message' => __('Permission denied')], 403);
        }

        DB::transaction(function () use ($request, $shift) {
            $shift->recalculateTotals();

            $closingCash = (float) $request->input('closing_cash');

            $shift->closing_cash = $closingCash;
            $shift->cash_difference = round($closingCash - (float) $shift->expected_cash, 2);
            $shift->closing_notes = $request->input('closing_notes');
            $shift->closed_by = Auth::id();
            $shift->closed_at = now();
            $shift->status = 'closed';
            $shift->save();
        });

        return response()->json([
            'message' => __('Shift closed successfully'),
            'shift' => $shift->fresh(),
        ]);
    }

    public function zReport(PosShift $shift)
    {
        if (!Auth::user()->can('view-pos-reports') && $shift->cashier_id !== Auth::id()) {
            return redirect()->route('pos.index')->with('error', __('Permission denied'));
        }

        $shift->load(['cashier:id,name,email', 'warehouse:id,name', 'cashMovements', 'sales.payment', 'sales.items']);

        $cashIn = $shift->cashMovements->where('type', 'cash_in')->sum('amount');
        $cashOut = $shift->cashMovements->where('type', 'cash_out')->sum('amount');

        return Inertia::render('Pos/Shifts/ZReport', [
            'shift' => $shift,
            'summary' => [
                'opening_cash' => (float) $shift->opening_cash,
                'cash_sales' => (float) $shift->total_cash_sales,
                'card_sales' => (float) $shift->total_card_sales,
                'other_sales' => (float) $shift->total_other_sales,
                'total_sales' => (float) $shift->total_sales,
                'total_orders' => $shift->total_orders,
                'cash_in' => (float) $cashIn,
                'cash_out' => (float) $cashOut,
                'expected_cash' => (float) $shift->expected_cash,
                'closing_cash' => $shift->closing_cash !== null ? (float) $shift->closing_cash : null,
                'cash_difference' => $shift->cash_difference !== null ? (float) $shift->cash_difference : null,
            ],
        ]);
    }
}
