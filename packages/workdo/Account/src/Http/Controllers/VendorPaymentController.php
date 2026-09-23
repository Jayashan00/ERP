<?php

namespace Workdo\Account\Http\Controllers;

use Workdo\Account\Models\VendorPayment;
use Workdo\Account\Models\VendorPaymentAllocation;
use Workdo\Account\Models\BankAccount;
use Workdo\Account\Models\DebitNote;
use Workdo\Account\Models\DebitNoteApplication;
use Workdo\Account\Http\Requests\StoreVendorPaymentRequest;
use Workdo\Account\Services\JournalService;
use Workdo\Account\Services\BankTransactionsService;
use App\Models\User;
use App\Models\PurchaseInvoice;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Workdo\Account\Events\CreateVendorPayment;
use Workdo\Account\Events\UpdateVendorPaymentStatus;
use Workdo\Account\Events\DestroyVendorPayment;

class VendorPaymentController extends Controller
{
    protected $journalService;
    protected $bankTransactionsService;

    public function __construct(JournalService $journalService, BankTransactionsService $bankTransactionsService)
    {
        $this->journalService = $journalService;
        $this->bankTransactionsService = $bankTransactionsService;
    }

    public function index(Request $request)
    {
        if (Auth::user()->can('manage-vendor-payments')) {
            $baseQuery = VendorPayment::with(['vendor', 'bankAccount', 'allocations.invoice', 'debitNoteApplications.debitNote'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-vendor-payments')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-vendor-payments')) {
                        $q->where('creator_id', Auth::id())->orWhere('vendor_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                });

            // Apply filters
            if ($request->vendor_id) {
                $baseQuery->where('vendor_id', $request->vendor_id);
            }
            if ($request->search) {
                $baseQuery->where('payment_number', 'like', '%' . $request->search . '%');
            }
            $year = $request->input('year', date('Y'));
            $month = $request->input('month', date('n') - 1);
            $baseQuery->when(!checkDemo(), function ($q) use ($year, $month) {
                $q->where(function ($q) use ($year, $month) {
                    $dbMonth = intval($month) + 1;
                    $q->whereYear('payment_date', $year)
                        ->whereMonth('payment_date', $dbMonth);
                });
            });
            if ($request->bank_account_id) {
                $baseQuery->where('bank_account_id', $request->bank_account_id);
            }

            $summary = [
                'total'     => (clone $baseQuery)->count(),
                'pending'   => (clone $baseQuery)->where('status', 'pending')->count(),
                'cleared'   => (clone $baseQuery)->where('status', 'cleared')->count(),
                'cancelled' => (clone $baseQuery)->where('status', 'cancelled')->count(),
            ];

            // Apply status filter for paginated list results
            if ($request->status && $request->status !== 'all') {
                $baseQuery->where('status', $request->status);
            }

            $sortField = $request->get('sort', 'created_at');
            $sortDirection = $request->get('direction', 'desc');
            $baseQuery->orderBy($sortField, $sortDirection);

            $payments = $baseQuery->paginate($request->get('per_page', 10))->withQueryString();
            $vendors = User::where('type', 'vendor')->where('created_by', creatorId())->get();

            $bankAccounts = BankAccount::where('is_active', true)->where('created_by', creatorId())->get();

            return Inertia::render('Account/VendorPayments/Index', [
                'payments' => $payments,
                'vendors' => $vendors,
                'bankAccounts' => $bankAccounts,
                'summary' => $summary,
                'filters' => $request->only(['vendor_id', 'status', 'search', 'bank_account_id', 'year', 'month'])
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function create()
    {
        if (Auth::user()->can('create-vendor-payments')) {
            $vendors = User::where('type', 'vendor')->where('created_by', creatorId())->get();
            $bankAccounts = BankAccount::where('is_active', true)->where('created_by', creatorId())->get();

            return Inertia::render('Account/VendorPayments/Create', [
                'vendors' => $vendors,
                'bankAccounts' => $bankAccounts,
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreVendorPaymentRequest $request)
    {
        if (Auth::user()->can('create-vendor-payments')) {
            // Validate that at least one invoice allocation exists
            if (!$request->allocations || count($request->allocations) === 0) {
                return back()->with('error', __('At least one invoice allocation is required to create a payment.'));
            }

            // Validate debit note amount doesn't exceed invoice allocation amount
            if ($request->debit_notes) {
                $totalInvoiceAmount = collect($request->allocations)->sum('amount');
                $totalDebitNoteAmount = collect($request->debit_notes)->sum('amount');

                if ($totalDebitNoteAmount > $totalInvoiceAmount) {
                    return back()->with('error', __('Debit note amount cannot exceed the total invoice allocation amount.'));
                }
            }

            // Create payment
            $payment = new VendorPayment();
            $payment->payment_date = $request->payment_date;
            $payment->vendor_id = $request->vendor_id;
            $payment->bank_account_id = $request->bank_account_id;
            $payment->reference_number = $request->reference_number;
            $payment->payment_amount = $request->payment_amount;
            $payment->notes = $request->notes;
            $payment->creator_id = Auth::id();
            $payment->created_by = creatorId();
            $payment->save();

            // Create allocations if provided
            if ($request->allocations) {
                foreach ($request->allocations as $allocation) {
                    $paymentAllocation = new VendorPaymentAllocation();
                    $paymentAllocation->payment_id = $payment->id;
                    $paymentAllocation->invoice_id = $allocation['invoice_id'];
                    $paymentAllocation->allocated_amount = $allocation['amount'];
                    $paymentAllocation->save();
                }
            }

            // Handle debit notes if provided
            if ($request->debit_notes) {
                foreach ($request->debit_notes as $debitNote) {
                    $debitNoteModel = DebitNote::find($debitNote['debit_note_id']);
                    if (!$debitNoteModel) continue;

                    // Create debit note application entry
                    DebitNoteApplication::create([
                        'debit_note_id' => $debitNote['debit_note_id'],
                        'payment_id' => $payment->id,
                        'applied_amount' => $debitNote['amount'],
                        'application_date' => $request->payment_date,
                        'creator_id' => Auth::id(),
                        'created_by' => creatorId()
                    ]);
                }
            }

            // Dispatch event
            CreateVendorPayment::dispatch($request, $payment);

            return redirect()->route('account.vendor-payments.index')->with('success', __('The vendor payment has been created successfully.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function getOutstandingInvoices($vendorId)
    {
        $invoices = PurchaseInvoice::where('vendor_id', $vendorId)
            ->where('balance_amount', '>', 0)
            ->whereIn('status', ['posted', 'partial'])
            ->where('created_by', creatorId())
            ->get();

        $debitNotes = \Workdo\Account\Models\DebitNote::where('vendor_id', $vendorId)
            ->where('balance_amount', '>', 0)
            ->whereIn('status', ['approved', 'partial'])
            ->where('created_by', creatorId())
            ->get(['id', 'debit_note_number', 'balance_amount', 'total_amount', 'status']);

        return response()->json([
            'invoices' => $invoices,
            'debitNotes' => $debitNotes
        ]);
    }

    public function updateStatus(Request $request, VendorPayment $vendorPayment)
    {
        if (Auth::user()->can('cleared-vendor-payments') && $vendorPayment->created_by == creatorId()) {
            try {
                // Create journal entry and update invoices when payment is cleared
                if ($request->status === 'cleared') {
                    if ($vendorPayment->payment_amount > 0) {
                        $this->journalService->createVendorPaymentJournal($vendorPayment);
                        $this->bankTransactionsService->createVendorPayment($vendorPayment);
                    }
                    // Update invoice balances
                    foreach ($vendorPayment->allocations as $allocation) {
                        $invoice = $allocation->invoice;
                        $invoice->paid_amount += $allocation->allocated_amount;
                        $invoice->balance_amount = $invoice->total_amount - $invoice->paid_amount;

                        if ($invoice->balance_amount == 0) {
                            $invoice->status = 'paid';
                        } elseif ($invoice->paid_amount > 0) {
                            $invoice->status = 'partial';
                        }
                        $invoice->save();
                    }
                }

                $debitNoteApplication = DebitNoteApplication::where('payment_id', $vendorPayment->id)->get();

                foreach ($debitNoteApplication as $debitNote) {
                    $debitNoteModel = DebitNote::find($debitNote['debit_note_id']);
                    $debitNoteModel->applied_amount += $debitNote['applied_amount'];
                    $debitNoteModel->balance_amount = $debitNoteModel->total_amount - $debitNoteModel->applied_amount;
                    $debitNoteModel->status = $debitNoteModel->balance_amount <= 0 ? 'applied' : 'partial';
                    $debitNoteModel->save();
                }

                $vendorPayment->update(['status' => $request->status]);

                // Dispatch event
                UpdateVendorPaymentStatus::dispatch($request, $vendorPayment);

                return back()->with('success', __('The payment status are updated successfully.'));
            } catch (\Exception $e) {
                return back()->with('error', $e->getMessage());
            }
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function show(VendorPayment $vendorPayment)
    {
        if (Auth::user()->can('view-vendor-payments') && $vendorPayment->created_by == creatorId()) {
            $vendorPayment->load(['vendor', 'bankAccount', 'allocations.invoice', 'debitNoteApplications.debitNote']);
            return Inertia::render('Account/VendorPayments/View', [
                'payment' => $vendorPayment,
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function destroy(VendorPayment $vendorPayment)
    {
        if (Auth::user()->can('delete-vendor-payments') && $vendorPayment->created_by == creatorId() && $vendorPayment->status === 'pending') {

            // Dispatch event before deletion
            DestroyVendorPayment::dispatch($vendorPayment);

            $vendorPayment->delete();
            return back()->with('success', __('The vendor payment has been deleted.'));
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }
}
