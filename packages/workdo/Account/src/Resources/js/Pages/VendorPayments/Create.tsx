import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DatePicker } from '@/components/ui/date-picker';
import { InputError } from '@/components/ui/input-error';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    CalendarDays,
    User,
    CreditCard,
    Hash,
    Calculator,
    Receipt,
    Coins,
    FileText,
    Plus,
    CheckCircle2,
    Trash2,
    DollarSign,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { CreateVendorPaymentFormData, PurchaseInvoice, DebitNote, Vendor, BankAccount } from './types';
import { formatCurrency, getCurrencySymbol } from '@/utils/helpers';
import RandomBadgeUI from '@/components/random-badge-ui';

interface CreateProps {
    vendors: Vendor[];
    bankAccounts: BankAccount[];
    [key: string]: any;
}

export default function Create() {
    const { t } = useTranslation();
    const { vendors, bankAccounts } = usePage<CreateProps>().props;

    const [outstandingInvoices, setOutstandingInvoices] = useState<PurchaseInvoice[]>([]);
    const [availableDebitNotes, setAvailableDebitNotes] = useState<DebitNote[]>([]);
    const [selectedAllocations, setSelectedAllocations] = useState<{ invoice_id: number; amount: number | string }[]>([]);
    const [selectedDebitNotes, setSelectedDebitNotes] = useState<{ debit_note_id: number; amount: number | string }[]>([]);

    const { data, setData, post, processing, errors, transform } = useForm<CreateVendorPaymentFormData>({
        payment_date: new Date().toISOString().split('T')[0],
        vendor_id: '',
        bank_account_id: '',
        reference_number: '',
        payment_amount: '',
        notes: '',
        allocations: [],
        debit_notes: []
    });

    // Update form data when selections change
    useEffect(() => {
        setData('allocations', selectedAllocations as any);
    }, [selectedAllocations]);

    useEffect(() => {
        setData('debit_notes', selectedDebitNotes as any);
    }, [selectedDebitNotes]);

    const fetchOutstandingInvoices = async (vendorId: string) => {
        if (!vendorId) {
            setOutstandingInvoices([]);
            setAvailableDebitNotes([]);
            return;
        }

        try {
            const response = await fetch(route('account.vendor-payments.vendors.outstanding', vendorId));
            const result = await response.json();
            setOutstandingInvoices(result.invoices || result || []);
            setAvailableDebitNotes(result.debitNotes || []);
        } catch (error) {
            console.error('Failed to fetch outstanding invoices:', error);
            setOutstandingInvoices([]);
            setAvailableDebitNotes([]);
        }
    };

    useEffect(() => {
        if (data.vendor_id) {
            fetchOutstandingInvoices(data.vendor_id);
        } else {
            setOutstandingInvoices([]);
            setAvailableDebitNotes([]);
        }
        // Clear selections when vendor changes
        setSelectedAllocations([]);
        setSelectedDebitNotes([]);
        setData('payment_amount', '');
    }, [data.vendor_id]);

    const addAllocation = (invoice: PurchaseInvoice) => {
        const existing = selectedAllocations.find(a => a.invoice_id === invoice.id);
        if (existing) return;

        const newAllocation = {
            invoice_id: invoice.id,
            amount: invoice.balance_amount.toString()
        };

        const newAllocations = [...selectedAllocations, newAllocation];
        setSelectedAllocations(newAllocations);
        updateTotalAmount(newAllocations, selectedDebitNotes);
    };

    const removeAllocation = (invoiceId: number) => {
        const newAllocations = selectedAllocations.filter(a => a.invoice_id !== invoiceId);
        setSelectedAllocations(newAllocations);
        updateTotalAmount(newAllocations, selectedDebitNotes);
    };

    const updateAllocationAmount = (invoiceId: number, amount: string) => {
        const newAllocations = selectedAllocations.map(a =>
            a.invoice_id === invoiceId ? { ...a, amount } : a
        );
        setSelectedAllocations(newAllocations);
        updateTotalAmount(newAllocations, selectedDebitNotes);
    };

    const updateTotalAmount = (allocations: { invoice_id: number; amount: number | string }[], debitNotes = selectedDebitNotes) => {
        const allocationsTotal = allocations.reduce((sum, allocation) => sum + Number(allocation.amount || 0), 0);
        const debitNotesTotal = debitNotes.reduce((sum, debitNote) => sum + Number(debitNote.amount || 0), 0);
        const total = allocationsTotal - debitNotesTotal; // Debit notes reduce payment amount
        setData('payment_amount', Number(Math.max(0, total)).toFixed(2));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            allocations: data.allocations.map(a => ({
                ...a,
                amount: Number(a.amount) || 0
            })),
            debit_notes: data.debit_notes.map(d => ({
                ...d,
                amount: Number(d.amount) || 0
            }))
        }));
        post(route('account.vendor-payments.store'));
    };

    const getInvoiceById = (id: number) => outstandingInvoices.find(inv => inv.id === id);

    const allocationsTotal = selectedAllocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const debitNotesTotal = selectedDebitNotes.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Vendor Payments'), url: route('account.vendor-payments.index') },
                { label: t('Create Payment') }
            ]}
            pageTitle={t('Create Vendor Payment')}
            pageDescription={t('Create a new vendor payment, select outstanding bills, apply debit notes, and allocate payment amounts.')}
            backUrl={route('account.vendor-payments.index')}
        >
            <Head title={t('Create Vendor Payment')} />

            <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-6 mx-auto w-full">
                        {/* Payment Details Card */}
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Payment Details')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('Enter the date, vendor, bank account, and payment reference information.')}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment_date" required className="text-sm font-medium text-foreground">
                                            {t('Payment Date')}
                                        </Label>
                                        <DatePicker
                                            id="payment_date"
                                            value={data.payment_date}
                                            onChange={(value) => {
                                                const formattedDate = value instanceof Date ? value.toISOString().split('T')[0] : value;
                                                setData('payment_date', formattedDate || '');
                                            }}
                                            required
                                        />
                                        <InputError message={errors.payment_date} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="vendor_id" required className="text-sm font-medium text-foreground">
                                            {t('Vendor')}
                                        </Label>
                                        <Select value={data.vendor_id} onValueChange={(value) => setData('vendor_id', value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('Select Vendor')} />
                                            </SelectTrigger>
                                            <SelectContent searchable>
                                                {vendors?.map((vendor) => (
                                                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                        {vendor.name} - {vendor.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.vendor_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bank_account_id" required className="text-sm font-medium text-foreground">
                                            {t('Bank Account')}
                                        </Label>
                                        <Select value={data.bank_account_id} onValueChange={(value) => setData('bank_account_id', value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('Select Bank Account')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bankAccounts?.map((account) => (
                                                    <SelectItem key={account.id} value={account.id.toString()}>
                                                        {account.account_name} ({account.account_number})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.bank_account_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reference_number" className="text-sm font-medium text-foreground">
                                            {t('Reference Number')}
                                        </Label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="reference_number"
                                                value={data.reference_number}
                                                onChange={(e) => setData('reference_number', e.target.value)}
                                                placeholder={t('e.g., Check number, bank ref')}
                                                className="pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.reference_number} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Outstanding Invoices & Debit Notes grid */}
                        {data.vendor_id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Outstanding Invoices Card */}
                                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card flex flex-col h-[320px]">
                                    <CardHeader className="border-b border-border/50 pb-3 bg-muted/10 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4.5 w-4.5 text-primary" />
                                            <CardTitle className="text-sm font-semibold">{t('Outstanding Bills')}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 overflow-y-auto flex-1 space-y-2">
                                        {outstandingInvoices.length > 0 ? (
                                            outstandingInvoices.map((invoice) => {
                                                const isAdded = selectedAllocations.some(a => a.invoice_id === invoice.id);
                                                return (
                                                    <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors">
                                                        <div className="flex flex-col min-w-0">
                                                            <RandomBadgeUI name={invoice.invoice_number} />
                                                            <span className="text-xs text-muted-foreground mt-0.5">
                                                                {t('Balance')}: <span className="font-medium text-foreground">{formatCurrency(invoice.balance_amount)}</span>
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={isAdded ? "outline" : "default"}
                                                            onClick={() => addAllocation(invoice)}
                                                            disabled={isAdded}
                                                        >
                                                            {isAdded ? t('Added') : t('Add')}
                                                        </Button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                                                <CheckCircle2 className="h-8 w-8 text-green-500/70 mb-2" />
                                                <p className="text-xs font-medium">{t('No outstanding bills found')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Available Debit Notes Card */}
                                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card flex flex-col h-[320px]">
                                    <CardHeader className="border-b border-border/50 pb-3 bg-muted/10 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-4.5 w-4.5 text-red-600" />
                                            <CardTitle className="text-sm font-semibold">{t('Available Debit Notes')}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 overflow-y-auto flex-1 space-y-2">
                                        {availableDebitNotes.length > 0 ? (
                                            availableDebitNotes.map((debitNote) => {
                                                const isApplied = selectedDebitNotes.some(d => d.debit_note_id === debitNote.id);
                                                return (
                                                    <div key={debitNote.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-xl bg-red-50/10 hover:bg-red-50/20 transition-colors">
                                                        <div className="flex flex-col min-w-0">
                                                            <RandomBadgeUI name={debitNote.debit_note_number} />
                                                            <span className="text-xs text-muted-foreground mt-0.5">
                                                                {t('Balance')}: <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(debitNote.balance_amount)}</span>
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={isApplied ? "outline" : "default"}
                                                            onClick={() => {
                                                                const currentDebitNotesSum = selectedDebitNotes.reduce((sum, d) => sum + Number(d.amount || 0), 0);
                                                                const remainingAmount = allocationsTotal - currentDebitNotesSum;
                                                                const maxAmount = Math.min(debitNote.balance_amount, remainingAmount);
                                                                const newDebitNote = {
                                                                    debit_note_id: debitNote.id,
                                                                    amount: maxAmount > 0 ? maxAmount.toString() : debitNote.balance_amount.toString()
                                                                };
                                                                const newDebitNotes = [...selectedDebitNotes, newDebitNote];
                                                                setSelectedDebitNotes(newDebitNotes);
                                                                updateTotalAmount(selectedAllocations, newDebitNotes);
                                                            }}
                                                            disabled={isApplied}
                                                        >
                                                            {isApplied ? t('Applied') : t('Apply')}
                                                        </Button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                                                <Coins className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                                <p className="text-xs font-medium">{t('No debit notes available')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card className="border border-dashed border-border/80 rounded-xl p-8 bg-muted/5 text-center">
                                <User className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                                <h3 className="font-semibold text-foreground mb-1">{t('Select a Vendor')}</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    {t('Please select a vendor from the details panel above to load their outstanding bills and available debit notes.')}
                                </p>
                            </Card>
                        )}

                        {/* Payment Allocation Summary Card */}
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Calculator className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Allocation Summary')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('Allocate the payment amount across outstanding bills.')}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                {selectedAllocations.length > 0 || selectedDebitNotes.length > 0 ? (
                                    <div className="space-y-3 max-h-[255px] overflow-y-auto pr-1">
                                        {/* Allocations list */}
                                        {selectedAllocations.map((allocation) => {
                                            const invoice = getInvoiceById(allocation.invoice_id);
                                            return (
                                                <div key={allocation.invoice_id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border rounded-xl bg-muted/5 relative">
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                                                        <RandomBadgeUI name={invoice?.invoice_number} />
                                                        <div className="text-muted-foreground text-xs whitespace-nowrap">
                                                            {t('Remaining Balance')}: <span className="font-semibold text-foreground">{formatCurrency(invoice?.balance_amount || 0)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-1 md:mt-0">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-muted-foreground text-xs whitespace-nowrap">{t('Allocated')}:</Label>
                                                            <Input
                                                                type="text"
                                                                value={allocation.amount}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                    const parts = val.split('.');
                                                                    const cleanVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                                                                    updateAllocationAmount(allocation.invoice_id, cleanVal);
                                                                }}
                                                                className="h-8 text-right pr-2 border-border focus:border-primary focus:ring-0 focus:outline-none"
                                                                style={{ width: `${Math.max(6, (allocation.amount || '').toString().length) + 3}ch` }}
                                                            />
                                                        </div>
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeAllocation(allocation.invoice_id)}
                                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Remove Allocation')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Debit Notes list */}
                                        {selectedDebitNotes.map((debitNote, index) => {
                                            const note = availableDebitNotes.find(d => d.id === debitNote.debit_note_id);
                                            return (
                                                <div key={`debit-${index}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border border-red-200 rounded-xl bg-red-50/10 relative">
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                                                        <RandomBadgeUI name={note?.debit_note_number} />
                                                        <div className="text-muted-foreground text-xs whitespace-nowrap">
                                                            {t('Debit Note Balance')}: <span className="font-semibold text-foreground">{formatCurrency(note?.balance_amount || 0)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-1 md:mt-0">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-muted-foreground text-xs whitespace-nowrap">{t('Applied')}:</Label>
                                                            <Input
                                                                type="text"
                                                                value={debitNote.amount}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                    const parts = val.split('.');
                                                                    const cleanVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;

                                                                    const newAmount = Number(cleanVal) || 0;
                                                                    const note = availableDebitNotes.find(d => d.id === debitNote.debit_note_id);
                                                                    const otherDebitNotesSum = selectedDebitNotes.reduce((sum, d, i) =>
                                                                        i !== index ? sum + Number(d.amount || 0) : sum, 0
                                                                    );
                                                                    const maxAllowedForThis = allocationsTotal - otherDebitNotesSum;
                                                                    const maxAmount = Math.min(note?.balance_amount || 0, maxAllowedForThis);
                                                                    const validAmount = cleanVal === '' ? '' : (newAmount > maxAmount ? maxAmount.toString() : cleanVal);

                                                                    const newDebitNotes = selectedDebitNotes.map((d, i) =>
                                                                        i === index ? { ...d, amount: validAmount } : d
                                                                    );
                                                                    setSelectedDebitNotes(newDebitNotes);
                                                                    updateTotalAmount(selectedAllocations, newDebitNotes);
                                                                }}
                                                                className="h-8 text-right pr-2 border-border focus:border-primary focus:ring-0 focus:outline-none"
                                                                style={{ width: `${Math.max(6, (debitNote.amount || '').toString().length) + 3}ch` }}
                                                            />
                                                        </div>
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const newDebitNotes = selectedDebitNotes.filter((_, i) => i !== index);
                                                                            setSelectedDebitNotes(newDebitNotes);
                                                                            updateTotalAmount(selectedAllocations, newDebitNotes);
                                                                        }}
                                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Remove Debit Note')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground">
                                        {t('No bills or debit notes added yet')}
                                    </div>
                                )}

                                <div className="w-full flex justify-end">
                                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mt-4 shadow-sm w-fit">
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10">
                                            <span className="text-sm text-muted-foreground">{t('Total Bills')}</span>
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(allocationsTotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10">
                                            <span className="text-sm text-muted-foreground">{t('Debit Applied')}</span>
                                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">-{formatCurrency(debitNotesTotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-3 bg-zinc-50/40 dark:bg-zinc-900/30 gap-3">
                                            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t('Total Payment Amount')}</span>
                                            <div className="flex flex-col items-end">
                                                <div className="relative flex items-center">
                                                    <CurrencyInput
                                                        value={data.payment_amount}
                                                        onChange={(value) => {
                                                            setData('payment_amount', value);
                                                            // Clear allocations if total is changed manually
                                                            if (parseFloat(value) !== selectedAllocations.reduce((sum, a) => sum + Number(a.amount || 0), 0)) {
                                                                setSelectedAllocations([]);
                                                                setSelectedDebitNotes([]);
                                                            }
                                                        }}
                                                        className="w-32 text-right text-base font-bold text-emerald-600 dark:text-emerald-400"
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                                {errors.payment_amount && <span className="text-[11px] text-red-500 mt-1">{errors.payment_amount}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Notes Card */}
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Payment Notes')}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-muted-foreground">{t('Additional Remarks / Instructions')}</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                        placeholder={t('Enter notes')}
                                        className="resize-none"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions and Footer */}
                    <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-6 mt-6">
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                            {selectedAllocations.length > 0 && (
                                <div className="flex items-center gap-1.5 text-primary font-semibold">
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                    <span>
                                        {selectedAllocations.length} {selectedAllocations.length === 1 ? t('bill selected') : t('bills selected')}
                                    </span>
                                </div>
                            )}
                            {selectedDebitNotes.length > 0 && (
                                <div className="flex items-center gap-1.5 text-primary font-semibold">
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                    <span>
                                        {selectedDebitNotes.length} {selectedDebitNotes.length === 1 ? t('debit note selected') : t('debit notes selected')}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(route('account.vendor-payments.index'))}
                                className="rounded-lg shadow-sm"
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || (!selectedAllocations.length && !selectedDebitNotes.length && !data.payment_amount)}
                                className="rounded-lg shadow-sm flex items-center justify-center min-w-[140px]"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-foreground mr-2"></div>
                                        <span>{t('Creating...')}</span>
                                    </>
                                ) : (
                                    <span>{t('Create Payment')}</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
