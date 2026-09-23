<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Requests\UpdateCouponRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\UserCoupon;

class CouponController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-coupons')){
            $baseQuery = Coupon::where('created_by', creatorId())
                ->when(request('name'), fn($q) => $q->where('name', 'like', '%' . request('name') . '%'))
                ->when(request('code'), fn($q) => $q->where('code', 'like', '%' . request('code') . '%'))
                ->when(request('status') !== null && request('status') !== '', fn($q) => $q->where('status', request('status')));

            $summary = [
                'total' => (clone $baseQuery)->count(),
                'percentage' => (clone $baseQuery)->where('type', 'percentage')->count(),
                'flat' => (clone $baseQuery)->where('type', 'flat')->count(),
                'fixed' => (clone $baseQuery)->where('type', 'fixed')->count(),
            ];

            $coupons = (clone $baseQuery)
                ->select('id', 'name', 'description', 'code', 'discount', 'type', 'limit', 'minimum_spend', 'maximum_spend', 'limit_per_user', 'expiry_date', 'included_module', 'excluded_module', 'status', 'created_at')
                ->when(request('type') && request('type') !== '', fn($q) => $q->where('type', request('type')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('coupons/index', [
                'coupons' => $coupons,
                'summary' => $summary,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreCouponRequest $request)
    {
        if(Auth::user()->can('create-coupons')){
            $validated = $request->validated();

            $coupon = new Coupon();
            $coupon->name = $validated['name'] ?? '';
            $coupon->description = $validated['description'] ?? null;
            $coupon->code = $validated['code'] ?? '';
            $coupon->discount = $validated['discount'] ?? 0;
            $coupon->limit = $validated['limit'] ?? null;
            $coupon->type = $validated['type'] ?? '';
            $coupon->minimum_spend = $validated['minimum_spend'] ?? null;
            $coupon->maximum_spend = $validated['maximum_spend'] ?? null;
            $coupon->limit_per_user = $validated['limit_per_user'] ?? null;
            $coupon->expiry_date = $validated['expiry_date'] ?? null;
            $coupon->included_module = $validated['included_module'] ?? null;
            $coupon->excluded_module = $validated['excluded_module'] ?? null;
            $coupon->status = $request->boolean('status', true);
            $coupon->created_by = creatorId();
            $coupon->save();

            return redirect()->route('coupons.index')->with('success', __('The coupon has been created successfully.'));
        }
        else{
            return redirect()->route('coupons.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateCouponRequest $request, Coupon $coupon)
    {
        if(Auth::user()->can('edit-coupons')){
            $validated = $request->validated();

            $coupon->name = $validated['name'] ?? '';
            $coupon->description = $validated['description'] ?? null;
            $coupon->code = $validated['code'] ?? '';
            $coupon->discount = $validated['discount'] ?? 0;
            $coupon->limit = $validated['limit'] ?? null;
            $coupon->type = $validated['type'] ?? '';
            $coupon->minimum_spend = $validated['minimum_spend'] ?? null;
            $coupon->maximum_spend = $validated['maximum_spend'] ?? null;
            $coupon->limit_per_user = $validated['limit_per_user'] ?? null;
            $coupon->expiry_date = $validated['expiry_date'] ?? null;
            $coupon->included_module = $validated['included_module'] ?? null;
            $coupon->excluded_module = $validated['excluded_module'] ?? null;
            $coupon->status = $request->boolean('status', true);
            $coupon->save();

            return back()->with('success', __('The coupon details are updated successfully.'));
        }
        else{
            return redirect()->route('coupons.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(Coupon $coupon)
    {
        if(Auth::user()->can('delete-coupons')){
            $coupon->delete();

            return redirect()->route('coupons.index')->with('success', __('The coupon has been deleted.'));
        }
        else{
            return redirect()->route('coupons.index')->with('error', __('Permission denied'));
        }
    }

    public function show(Coupon $coupon)
    {
        if(Auth::user()->can('view-coupons')){
            $usageRecords = UserCoupon::with(['user:id,name,email', 'coupon:id,name,code'])
                ->where('coupon_id', $coupon->id)
                ->select('user_coupons.id', 'user_coupons.coupon_id', 'user_coupons.user_id', 'user_coupons.order_id', 'user_coupons.created_at')
                ->when(request('user_name'), fn($q) => $q->whereHas('user', fn($query) => $query->where('name', 'like', '%' . request('user_name') . '%')))
                ->when(request('order_id'), fn($q) => $q->where('order_id', 'like', '%' . request('order_id') . '%'))
                ->when(request('sort'), function($q) {
                    $sort = request('sort');
                    $direction = request('direction', 'asc');
                    if ($sort === 'user_name') {
                        return $q->join('users', 'users.id', '=', 'user_coupons.user_id')
                            ->orderBy('users.name', $direction);
                    }
                    return $q->orderBy('user_coupons.' . $sort, $direction);
                }, fn($q) => $q->latest('user_coupons.created_at'))
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('coupons/details', [
                'coupon' => $coupon,
                'usageRecords' => $usageRecords,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }
}