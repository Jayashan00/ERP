<?php

namespace Workdo\Account\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoiceReturn;
use App\Models\User;
use Workdo\Account\Models\CreditNote;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Workdo\Account\Events\ApproveCreditNote;
use Workdo\Account\Events\DestroyCreditNote;
use Workdo\Account\Services\JournalService;

class CreditNoteController extends Controller
{
    protected $journalService;

    public function __construct(JournalService $journalService)
    {
        $this->journalService = $journalService;
    }

    private function checkCreditNoteAccess(CreditNote $creditNote)
    {
        if(Auth::user()->can('manage-any-credit-notes')) {
            return true;
        } elseif(Auth::user()->can('manage-own-credit-notes')) {
            if($creditNote->creator_id != Auth::id() && $creditNote->customer_id != Auth::id()) {
                return false;
            }
            if($creditNote->creator_id != Auth::id() && Auth::user()->type == 'client' && $creditNote->status == 'draft') {
                return false;
            }
            return true;
        }
        return false;
    }

    public function index(Request $request)
    {
        if(Auth::user()->can('manage-credit-notes')){
            $baseQuery = CreditNote::with(['customer', 'salesReturn', 'approvedBy'])
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-credit-notes')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-credit-notes')) {
                        $q->where('creator_id', Auth::id())->orWhere('customer_id', Auth::id());
                        if(Auth::user()->type == 'client') {
                            $q->where('status','!=', 'draft');
                        }
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            if ($request->customer_id) {
                $baseQuery->where('customer_id', $request->customer_id);
            }

            if ($request->search) {
                $baseQuery->where('credit_note_number', 'like', '%' . $request->search . '%');
            }

            if ($request->sales_return_id) {
                $baseQuery->where('return_id', $request->sales_return_id);
            }

            $year = $request->input('year', date('Y'));
            $month = $request->input('month', date('n') - 1);
            $baseQuery->when(!checkDemo(), function ($q) use ($year, $month) {
                $q->where(function ($q) use ($year, $month) {
                    $dbMonth = intval($month) + 1;
                    $q->whereYear('credit_note_date', $year)
                        ->whereMonth('credit_note_date', $dbMonth);
                });
            });

            $summary = [
                'total'     => (clone $baseQuery)->count(),
                'draft'     => (clone $baseQuery)->where('status', 'draft')->count(),
                'partial'   => (clone $baseQuery)->where('status', 'partial')->count(),
                'approved'  => (clone $baseQuery)->where('status', 'approved')->count(),
                'applied'   => (clone $baseQuery)->where('status', 'applied')->count(),
            ];

            if ($request->status && $request->status !== 'all') {
                $baseQuery->where('status', $request->status);
            }

            if ($request->sort) {
                $baseQuery->orderBy($request->sort, $request->direction ?? 'asc');
            } else {
                $baseQuery->orderBy('credit_note_date', 'desc');
            }

            $creditNotes = $baseQuery->paginate($request->per_page ?? 10)->withQueryString();

            $customers = User::where('type', 'client')->where('created_by', creatorId())->get(['id', 'name']);
            $salesReturns = SalesInvoiceReturn::where('created_by', creatorId())->get(['id', 'return_number']);

            return Inertia::render('Account/CreditNotes/Index', [
                'creditNotes' => $creditNotes,
                'customers' => $customers,
                'salesReturns' => $salesReturns,
                'summary' => $summary,
                'filters' => $request->only(['customer_id', 'status', 'sales_return_id', 'year', 'month'])
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function show(CreditNote $creditNote)
    {
        if(Auth::user()->can('view-credit-notes') &&
           (Auth::user()->type == 'client' ? $creditNote->customer_id == Auth::id() : $creditNote->created_by == creatorId())){
            if(!$this->checkCreditNoteAccess($creditNote)) {
                return redirect()->route('account.credit-notes.index')->with('error', __('Permission denied'));
            }

            $creditNote->load(['customer', 'items.product', 'items.taxes', 'salesReturn', 'applications.payment']);

            return Inertia::render('Account/CreditNotes/View', [
                'creditNote' => $creditNote
            ]);
        }
        else{
            return redirect()->route('account.credit-notes.index')->with('error', __('Permission denied'));
        }
    }

    public function approve(CreditNote $creditNote)
    {
        if(Auth::user()->can('approve-credit-notes')){
            if ($creditNote->status !== 'draft') {
                return back()->with('error', __('Only draft credit notes can be approved.'));
            }
            try {
                // Create journal entries
                $this->journalService->createCreditNoteJournal($creditNote);
                $this->journalService->createCreditNoteCOGSJournal($creditNote);

                $creditNote->update([
                    'status' => 'approved',
                    'approved_by' => Auth::id()
                ]);
                ApproveCreditNote::dispatch($creditNote);

                return back()->with('success', __('Credit note approved successfully.'));
            } catch (\Exception $e) {
                return back()->with('error', $e->getMessage());
            }
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function destroy(CreditNote $creditNote)
    {
        if(Auth::user()->can('delete-credit-notes')){
            if ($creditNote->status !== 'draft') {
                return back()->with('error', __('Only draft credit notes can be deleted.'));
            }

            DestroyCreditNote::dispatch($creditNote);

            $creditNote->delete();
            return back()->with('success', __('Credit note deleted successfully.'));
        }
        else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
