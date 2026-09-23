<?php

namespace Workdo\Account\Http\Controllers;

use Workdo\Account\Models\BankTransaction;
use Workdo\Account\Models\BankAccount;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankTransactionController extends Controller
{
    public function index(Request $request)
    {
        if (Auth::user()->can('manage-bank-transactions')) {
            $query = BankTransaction::with(['bankAccount'])
                ->where('created_by', creatorId());
            // Apply filters
            if ($request->bank_account_id) {
                $query->where('bank_account_id', $request->bank_account_id);
            }
            if ($request->date_from) {
                $query->whereDate('transaction_date', '>=', $request->date_from);
            }
            if ($request->date_to) {
                $query->whereDate('transaction_date', '<=', $request->date_to);
            }
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('reference_number', 'like', '%' . $request->search . '%')
                        ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            }

            $summary = [
                'all' => (clone $query)->count(),
                'debit' => (clone $query)->where('transaction_type', 'debit')->count(),
                'credit' => (clone $query)->where('transaction_type', 'credit')->count(),
            ];

            if ($request->transaction_type) {
                $query->where('transaction_type', $request->transaction_type);
            }

            $query->orderByDesc('transaction_date');

            $transactions = $query->get();
            $bankAccounts = BankAccount::where('is_active', true)->where('created_by', creatorId())->get();

            return Inertia::render('Account/BankTransactions/Index', [
                'transactions' => $transactions,
                'bankAccounts' => $bankAccounts,
                'summary' => $summary,
                'filters' => $request->only(['bank_account_id', 'transaction_type', 'search', 'date_from', 'date_to'])
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function markReconciled($id)
    {
        if (Auth::user()->can('reconcile-bank-transactions')) {
            $transaction = BankTransaction::where('id', $id)
                ->where('created_by', creatorId())
                ->first();

            if ($transaction && $transaction->reconciliation_status === 'unreconciled') {
                $transaction->reconciliation_status = 'reconciled';
                $transaction->save();

                return back()->with('success', __('Transaction marked as reconciled'));
            }

            return back()->with('error', __('Transaction not found or already reconciled'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
