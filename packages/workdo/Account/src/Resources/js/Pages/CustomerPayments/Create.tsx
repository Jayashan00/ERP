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
import { CreateCustomerPaymentFormData, SalesInvoice, CreditNote, Customer, BankAccount } from './types';
import { formatCurrency, getCurrencySymbol } from '@/utils/helpers';
import RandomBadgeUI from '@/components/random-badge-ui';

interface CreateProps {
    customers: Customer[];
    bankAccounts: BankAccount[];
    [key: string]: any;
}

export default function Create() {
    const { t } = useTranslation();
    const { customers, bankAccounts } = usePage<CreateProps>().props;

    const [outstandingInvoices, setOutstandingInvoices] = useState<SalesInvoice[]>([]);
    const [availableCreditNotes, setAvailableCreditNotes] = useState<CreditNote[]>([]);
    const [selectedAllocations, setSelectedAllocations] = useState<{ invoice_id: number; amount: number | string }[]>([]);
    const [selectedCreditNotes, setSelectedCreditNotes] = useState<{ credit_note_id: number; amount: number | string }[]>([]);

    const { data, setData, post, processing, errors, transform } = useForm<CreateCustomerPaymentFormData>({
        payment_date: new Date().toISOString().split('T')[0],
        customer_id: '',
        bank_account_id: '',
        reference_number: '',
        payment_amount: '',
        notes: '',
        allocations: [],
        credit_notes: []
    });

    // Update form data when selections change
    useEffect(() => {
        setData('allocations', selectedAllocations as any);
    }, [selectedAllocations]);

    useEffect(() => {
        setData('credit_notes', selectedCreditNotes as any);
    }, [selectedCreditNotes]);

    const fetchOutstandingInvoices = async (customerId: string) => {
        if (!customerId) {
            setOutstandingInvoices([]);
            setAvailableCreditNotes([]);
            return;
        }

        try {
            const response = await fetch(route('account.customer-payments.outstanding-invoices', customerId));
            const result = await response.json();
            setOutstandingInvoices(result.invoices || result || []);
            setAvailableCreditNotes(result.creditNotes || []);
        } catch (error) {
            console.error('Failed to fetch outstanding invoices:', error);
            setOutstandingInvoices([]);
            setAvailableCreditNotes([]);
        }
    };

    useEffect(() => {
        if (data.customer_id) {
            fetchOutstandingInvoices(data.customer_id);
        } else {
            setOutstandingInvoices([]);
            setAvailableCreditNotes([]);
        }
        // Clear selections when customer changes
        setSelectedAllocations([]);
        setSelectedCreditNotes([]);
        setData('payment_amount', '');
    }, [data.customer_id]);

    const addAllocation = (invoice: SalesInvoice) => {
        const existing = selectedAllocations.find(a => a.invoice_id === invoice.id);
        if (existing) return;

        const newAllocation = {
            invoice_id: invoice.id,
            amount: invoice.balance_amount.toString()
        };

        const newAllocations = [...selectedAllocations, newAllocation];
        setSelectedAllocations(newAllocations);
        updateTotalAmount(newAllocations, selectedCreditNotes);
    };

    const removeAllocation = (invoiceId: number) => {
        const newAllocations = selectedAllocations.filter(a => a.invoice_id !== invoiceId);
        setSelectedAllocations(newAllocations);
        updateTotalAmount(newAllocations, selectedCreditNotes);
    };

    const updateAllocationAmount = (invoiceId: number, amount: string) => {
        const newAllocations = selectedAllocations.map(a =>
            a.invoice_id === invoiceId ? { ...a, amount } : a
        );
        setSelectedAllocations(newAllocations);
        updateTotalAmount(newAllocations, selectedCreditNotes);
    };

    const updateTotalAmount = (allocations: { invoice_id: number; amount: number | string }[], creditNotes = selectedCreditNotes) => {
        const allocationsTotal = allocations.reduce((sum, allocation) => sum + Number(allocation.amount || 0), 0);
        const creditNotesTotal = creditNotes.reduce((sum, creditNote) => sum + Number(creditNote.amount || 0), 0);
        const total = allocationsTotal - creditNotesTotal; // Credit notes reduce payment amount
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
            credit_notes: data.credit_notes.map(c => ({
                ...c,
                amount: Number(c.amount) || 0
            }))
        }));
        post(route('account.customer-payments.store'));
    };

    const getInvoiceById = (id: number) => outstandingInvoices.find(inv => inv.id === id);

    const allocationsTotal = selectedAllocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const creditNotesTotal = selectedCreditNotes.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Customer Payments'), url: route('account.customer-payments.index') },
                { label: t('Create Payment') }
            ]}
            pageTitle={t('Create Customer Payment')}
            pageDescription={t('Create a new customer payment, select outstanding invoices, apply credit notes, and allocate payment amounts.')}
            backUrl={route('account.customer-payments.index')}
        >
            <Head title={t('Create Customer Payment')} />

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
                                            {t('Enter the date, customer, bank account, and payment reference information.')}
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
                                        <Label htmlFor="customer_id" required className="text-sm font-medium text-foreground">
                                            {t('Customer')}
                                        </Label>
                                        <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t('Select Customer')} />
                                            </SelectTrigger>
                                            <SelectContent searchable>
                                                {customers?.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {customer.name} - {customer.email}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.customer_id} />
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

                        {/* Outstanding Invoices & Credit Notes grid */}
                        {data.customer_id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Outstanding Invoices Card */}
                                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card flex flex-col h-[320px]">
                                    <CardHeader className="border-b border-border/50 pb-3 bg-muted/10 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4.5 w-4.5 text-primary" />
                                            <CardTitle className="text-sm font-semibold">{t('Outstanding Invoices')}</CardTitle>
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
                                                <p className="text-xs font-medium">{t('No outstanding invoices found')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Available Credit Notes Card */}
                                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card flex flex-col h-[320px]">
                                    <CardHeader className="border-b border-border/50 pb-3 bg-muted/10 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-4.5 w-4.5 text-red-600" />
                                            <CardTitle className="text-sm font-semibold">{t('Available Credit Notes')}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 overflow-y-auto flex-1 space-y-2">
                                        {availableCreditNotes.length > 0 ? (
                                            availableCreditNotes.map((creditNote) => {
                                                const isApplied = selectedCreditNotes.some(c => c.credit_note_id === creditNote.id);
                                                return (
                                                    <div key={creditNote.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-xl bg-red-50/10 hover:bg-red-50/20 transition-colors">
                                                        <div className="flex flex-col min-w-0">
                                                            <RandomBadgeUI name={creditNote.credit_note_number} />
                                                            <span className="text-xs text-muted-foreground mt-0.5">
                                                                {t('Balance')}: <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(creditNote.balance_amount)}</span>
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={isApplied ? "outline" : "default"}
                                                            onClick={() => {
                                                                const currentCreditNotesSum = selectedCreditNotes.reduce((sum, c) => sum + Number(c.amount || 0), 0);
                                                                const remainingAmount = allocationsTotal - currentCreditNotesSum;
                                                                const maxAmount = Math.min(creditNote.balance_amount, remainingAmount);
                                                                const newCreditNote = {
                                                                    credit_note_id: creditNote.id,
                                                                    amount: maxAmount > 0 ? maxAmount.toString() : creditNote.balance_amount.toString()
                                                                };
                                                                const newCreditNotes = [...selectedCreditNotes, newCreditNote];
                                                                setSelectedCreditNotes(newCreditNotes);
                                                                updateTotalAmount(selectedAllocations, newCreditNotes);
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
                                                <p className="text-xs font-medium">{t('No credit notes available')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card className="border border-dashed border-border/80 rounded-xl p-8 bg-muted/5 text-center">
                                <User className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                                <h3 className="font-semibold text-foreground mb-1">{t('Select a Customer')}</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    {t('Please select a customer from the details panel above to load their outstanding invoices and available credit notes.')}
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
                                            {t('Allocate the received amount across outstanding invoices.')}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                {selectedAllocations.length > 0 || selectedCreditNotes.length > 0 ? (
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

                                        {/* Credit Notes list */}
                                        {selectedCreditNotes.map((creditNote, index) => {
                                            const note = availableCreditNotes.find(c => c.id === creditNote.credit_note_id);
                                            return (
                                                <div key={`credit-${index}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border border-red-200 rounded-xl bg-red-50/10 relative">
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                                                        <RandomBadgeUI name={note?.credit_note_number} />
                                                        <div className="text-muted-foreground text-xs whitespace-nowrap">
                                                            {t('Credit Note Balance')}: <span className="font-semibold text-foreground">{formatCurrency(note?.balance_amount || 0)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-1 md:mt-0">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-muted-foreground text-xs whitespace-nowrap">{t('Applied')}:</Label>
                                                            <Input
                                                                type="text"
                                                                value={creditNote.amount}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                    const parts = val.split('.');
                                                                    const cleanVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;

                                                                    const newAmount = Number(cleanVal) || 0;
                                                                    const note = availableCreditNotes.find(c => c.id === creditNote.credit_note_id);
                                                                    const otherCreditNotesSum = selectedCreditNotes.reduce((sum, c, i) =>
                                                                        i !== index ? sum + Number(c.amount || 0) : sum, 0
                                                                    );
                                                                    const maxAllowedForThis = allocationsTotal - otherCreditNotesSum;
                                                                    const maxAmount = Math.min(note?.balance_amount || 0, maxAllowedForThis);
                                                                    const validAmount = cleanVal === '' ? '' : (newAmount > maxAmount ? maxAmount.toString() : cleanVal);

                                                                    const newCreditNotes = selectedCreditNotes.map((c, i) =>
                                                                        i === index ? { ...c, amount: validAmount } : c
                                                                    );
                                                                    setSelectedCreditNotes(newCreditNotes);
                                                                    updateTotalAmount(selectedAllocations, newCreditNotes);
                                                                }}
                                                                className="h-8 text-right pr-2 border-border focus:border-primary focus:ring-0 focus:outline-none"
                                                                style={{ width: `${Math.max(6, (creditNote.amount || '').toString().length) + 3}ch` }}
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
                                                                            const newCreditNotes = selectedCreditNotes.filter((_, i) => i !== index);
                                                                            setSelectedCreditNotes(newCreditNotes);
                                                                            updateTotalAmount(selectedAllocations, newCreditNotes);
                                                                        }}
                                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Remove Credit Note')}</p>
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
                                        {t('No invoices or credit notes added yet')}
                                    </div>
                                )}

                                <div className="w-full flex justify-end">
                                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mt-4 shadow-sm w-fit">
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10">
                                            <span className="text-sm text-muted-foreground">{t('Total Invoices')}</span>
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(allocationsTotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10">
                                            <span className="text-sm text-muted-foreground">{t('Credit Applied')}</span>
                                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">-{formatCurrency(creditNotesTotal)}</span>
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
                                                                setSelectedCreditNotes([]);
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
                                        {selectedAllocations.length} {selectedAllocations.length === 1 ? t('invoice selected') : t('invoices selected')}
                                    </span>
                                </div>
                            )}
                            {selectedCreditNotes.length > 0 && (
                                <div className="flex items-center gap-1.5 text-primary font-semibold">
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                    <span>
                                        {selectedCreditNotes.length} {selectedCreditNotes.length === 1 ? t('credit note selected') : t('credit notes selected')}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(route('account.customer-payments.index'))}
                                className="rounded-lg shadow-sm"
                            >
                                {t('Cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || (!selectedAllocations.length && !selectedCreditNotes.length && !data.payment_amount)}
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