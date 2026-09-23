import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import BadgeUI from "@/components/badge-ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Printer, Calendar, DollarSign, Receipt, Undo2, CreditCard, Wallet, User, CalendarDays, BarChart3, Download } from 'lucide-react';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import NoRecordsFound from '@/components/no-records-found';
import GenerateAvatar from '@/components/generate-avatar';
import RandomBadgeUI from '@/components/random-badge-ui';


interface CustomerDetailProps {
    customerData: {
        customer: { id: number; name: string; email: string, avatar: string | null };
        date_range: { start_date: string | null; end_date: string | null };
        invoices: any[];
        returns: any[];
        credit_notes: any[];
        payments: any[];
        summary: {
            total_invoiced: number;
            total_returns: number;
            total_credit_notes: number;
            total_payments: number;
            balance: number;
        };
    };
}

export default function CustomerDetail() {
    const { t } = useTranslation();
    const { customerData, auth } = usePage<any>().props;

    const getDefaultDates = () => {
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        return {
            start: threeMonthsAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        };
    };

    const defaultDates = getDefaultDates();
    const [startDate, setStartDate] = useState(customerData.date_range.start_date || defaultDates.start);
    const [endDate, setEndDate] = useState(customerData.date_range.end_date || defaultDates.end);

    const handleFilter = () => {
        router.get(route('account.reports.customer-detail', customerData.customer.id), {
            start_date: startDate,
            end_date: endDate
        }, { preserveState: true });
    };

    // Fetch data with default dates on initial load if no dates provided
    useState(() => {
        if (!customerData.date_range.start_date && !customerData.date_range.end_date) {
            router.get(route('account.reports.customer-detail', customerData.customer.id), {
                start_date: defaultDates.start,
                end_date: defaultDates.end
            }, { preserveState: true, replace: true });
        }
    });

    const getSalesInvoicesStatusBadgeClasses = (status: string) => {
        const colors = {
            draft: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800',
            posted: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
            partial: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800',
            paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800',
            overdue: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800',
            cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800'
        };
        return `inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`;
    };

    const getSalesReturnsStatusBadgeClasses = (status: string) => {
        const colors = {
            draft: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-900/30 dark:text-gray-400 dark:ring-gray-800',
            approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800',
            completed: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800',
            cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800'
        };
        return `inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`;
    };

    const getCreditNotesStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800 ring-gray-200';
            case 'partial': return 'bg-yellow-100 text-yellow-800 ring-yellow-200';
            case 'approved': return 'bg-green-100 text-green-800 ring-green-200';
            case 'applied': return 'bg-blue-100 text-blue-800 ring-blue-200';
            default: return 'bg-gray-100 text-gray-800 ring-gray-200';
        }
    };


    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('paid') && !s.includes('partial')) {
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-900/30';
        }
        if (s.includes('partial') || s.includes('pending')) {
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 ring-amber-200 dark:ring-amber-900/30';
        }
        if (s.includes('unpaid') || s.includes('overdue') || s.includes('void') || s.includes('failed')) {
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 ring-rose-200 dark:ring-rose-900/30';
        }
        if (s.includes('draft')) {
            return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-850/30 dark:text-zinc-400 ring-zinc-200/50 dark:ring-zinc-800/50';
        }
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 ring-blue-200 dark:ring-blue-900/30';
    };

    // Table Column Definitions
    const invoiceColumns = [
        {
            key: 'invoice_number',
            header: t('Invoice Number'),
            render: (value: string, invoice: any) =>
                auth.user?.permissions?.includes('view-sales-invoices') ? (
                    <BadgeUI
                        className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700 cursor-pointer"
                        onClick={() => router.get(route('sales-invoices.show', invoice.id))}
                    >
                        {value}
                    </BadgeUI>
                ) : (
                    <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700">
                        {value}
                    </BadgeUI>
                )
        },
        {
            key: 'date',
            header: t('Invoice Date'),
            type: 'date'
        },
        {
            key: 'due_date',
            header: t('Due Date'),
            render: (value: string, invoice: any) => {
                const isOverdue = invoice.display_status === 'overdue';
                return (
                    <div>
                        <span className={isOverdue ? 'text-red-600 font-medium text-sm' : 'text-gray-600 text-sm'}>
                            {formatDate(value)}
                        </span>
                        {isOverdue && (
                            <div className="text-xs text-red-600 font-medium mt-0.5">{t('Overdue')}</div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'subtotal',
            header: t('Subtotal'),
            render: (value: number) => <span className="text-gray-700 text-sm">{formatCurrency(value)}</span>
        },
        {
            key: 'tax_amount',
            header: t('Tax'),
            render: (value: number) => <span className="text-gray-600 text-sm">{formatCurrency(value)}</span>
        },
        {
            key: 'total_amount',
            header: t('Total Amount'),
            render: (value: number) => <span className="font-semibold text-gray-900 text-sm">{formatCurrency(value)}</span>
        },
        {
            key: 'balance_amount',
            header: t('Balance'),
            render: (value: number) => (
                <span className={`font-semibold text-sm ${value > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(value)}
                </span>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: string) => (
                <BadgeUI className={getSalesInvoicesStatusBadgeClasses(value)}>
                    {t(value.charAt(0).toUpperCase() + value.slice(1))}
                </BadgeUI>
            )
        },
    ];

    const returnColumns = [
        {
            key: 'return_number',
            header: t('Return Number'),
            render: (value: string, returnItem: any) =>
                auth.user?.permissions?.includes('view-sales-return-invoices') ? (
                    <BadgeUI
                        className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700 cursor-pointer"
                        onClick={() => router.get(route('sales-returns.show', returnItem.id))}
                    >
                        {value}
                    </BadgeUI>
                ) : (
                    <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700 ">
                        {value}
                    </BadgeUI>
                )
        },
        {
            key: 'date',
            header: t('Return Date'),
            type: 'date'
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: string) => (
                <BadgeUI className={getSalesReturnsStatusBadgeClasses(value)}>
                    {t(value.charAt(0).toUpperCase() + value.slice(1))}
                </BadgeUI>
            )
        },
        {
            key: 'subtotal',
            header: t('Subtotal'),
            render: (value: any) => <span>{formatCurrency(value)}</span>
        },
        {
            key: 'tax_amount',
            header: t('Tax'),
            render: (value: any) => <span>{formatCurrency(value)}</span>
        },
        {
            key: 'total_amount',
            header: t('Total Amount'),
            render: (value: number) => <span className="font-semibold text-gray-900 text-sm">{formatCurrency(value)}</span>
        },
    ];

    const creditNoteColumns = [
        {
            key: 'credit_note_number',
            header: t('Credit Note Number'),
            render: (value: string, creditNote: any) =>
                auth.user?.permissions?.includes('view-credit-notes') ? (
                    <BadgeUI
                        className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700 cursor-pointer"
                        onClick={() => router.get(route('account.credit-notes.show', creditNote.id))}
                    >
                        {value}
                    </BadgeUI>
                ) : (
                    <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700 ">
                        {value}
                    </BadgeUI>
                )
        },
        {
            key: 'date',
            header: t('Return Date'),
            type: 'date'
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: any) => (
                <BadgeUI className={getCreditNotesStatusBadgeClasses(value) + " capitalize font-semibold shadow-sm"}>
                    {value}
                </BadgeUI>
            )
        },
        {
            key: 'total_amount',
            header: t('Total Amount'),
            render: (value: any) => <span>{formatCurrency(value)}</span>
        },
        {
            key: 'applied_amount',
            header: t('Applied'),
            render: (value: any) => <span>{formatCurrency(value)}</span>
        },
        {
            key: 'balance_amount',
            header: t('Balance'),
            render: (value: number) => <span className="font-semibold text-gray-900 text-sm">{formatCurrency(value)}</span>
        },
    ];

    const paymentColumns = [
        {
            key: 'payment_number',
            header: t('Payment Number'),
            render: (value: string, payment: any) =>
                auth.user?.permissions?.includes('view-customer-payments') ? (
                    <BadgeUI
                        className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700 cursor-pointer"
                        onClick={() => router.get(route('account.customer-payments.show', payment.id))}
                    >
                        {value}
                    </BadgeUI>
                ) : (
                    <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-700">
                        {value}
                    </BadgeUI>
                )
        },
        {
            key: 'date',
            header: t('Date'),
            type: 'date'
        },
        {
            key: 'bank_account',
            header: t('Bank Account'),
            render: (value: any, row: any) =>
                <div className="flex flex-col text-start">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {value || '-'}
                    </span>
                    {row.reference_number && <span className="text-xs text-muted-foreground">
                        <RandomBadgeUI name={row.reference_number} />
                    </span>}
                </div>
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: any) => (
                <BadgeUI className={getStatusBadge(value) + " capitalize font-semibold shadow-sm"}>
                    {value}
                </BadgeUI>
            )
        },
        {
            key: 'amount',
            header: t('Amount'),
            render: (value: number) => <span className="font-semibold text-gray-900 text-sm">{formatCurrency(value)}</span>
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Customers'), url: route('account.customers.index') },
                { label: t('Customer Detail') }
            ]}
            pageTitle={t('Customer Detail')}
            pageDescription={t('Detailed overview of transactions, sales invoices, payments, credit notes, and outstanding balances.')}
            backUrl={route('account.customers.index')}
        >
            <Head title={t('Customer Detail')} />

            <div className="space-y-6">

                {/* Customer & Financial Summary Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    <Card className="relative overflow-hidden bg-gradient-to-r from-zinc-50 to-zinc-100 border-zinc-200 dark:from-zinc-950/40 dark:to-zinc-900/20 dark:border-zinc-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('Customer Profile')}</p>
                                <h3 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]" title={customerData.customer.name}>
                                    {customerData.customer.name}
                                </h3>
                                <p className="text-xs text-zinc-600/80 dark:text-zinc-400/80 truncate max-w-[150px]" title={customerData.customer.email || '-'}>
                                    {customerData.customer.email || '-'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-card flex items-center justify-center flex-shrink-0 shadow-sm">
                                {customerData.customer.avatar ? (
                                    <img
                                        src={getImagePath(customerData.customer.avatar)}
                                        alt={customerData.customer.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <GenerateAvatar name={customerData.customer.name} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Total Invoiced')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-200">
                                    {formatCurrency(customerData.summary.total_invoiced)}
                                </h3>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">{t('All sales invoices')}</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-850/20 dark:border-amber-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('Total Returns')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-200">
                                    {formatCurrency(customerData.summary.total_returns)}
                                </h3>
                                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">{t('Total sales returns')}</p>
                            </div>
                            <Undo2 className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 dark:border-purple-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">{t('Total Credit Notes')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-purple-800 dark:text-purple-200">
                                    {formatCurrency(customerData.summary.total_credit_notes)}
                                </h3>
                                <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">{t('Total credit notes')}</p>
                            </div>
                            <Receipt className="h-8 w-8 text-purple-700 dark:text-purple-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{t('Total Payments')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-teal-800 dark:text-teal-200">
                                    {formatCurrency(customerData.summary.total_payments)}
                                </h3>
                                <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-1">{t('Total payments received')}</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-teal-700 dark:text-teal-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('Outstanding Balance')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
                                    {formatCurrency(customerData.summary.balance)}
                                </h3>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                                    {customerData.summary.balance > 0 ? t('Pending Payments') : t('Settled')}
                                </p>
                            </div>
                            <Wallet className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>
                </div>

                {/* Date Range Filter Card */}
                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                    <CardHeader className="border-b border-border/50 bg-muted/10 p-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold text-foreground">
                                    {t('Filter Report Period')}
                                </CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                            <div className="space-y-1.5 sm:col-span-5 w-full">
                                <label className="text-xs font-semibold text-muted-foreground tracking-wider">{t('Start Date')}</label>
                                <DatePicker value={startDate} onChange={setStartDate} placeholder={t('Select start date')} className="w-full" />
                            </div>
                            <div className="space-y-1.5 sm:col-span-5 w-full">
                                <label className="text-xs font-semibold text-muted-foreground tracking-wider">{t('End Date')}</label>
                                <DatePicker value={endDate} onChange={setEndDate} placeholder={t('Select end date')} className="w-full" />
                            </div>
                            <div className="sm:col-span-2 w-full flex justify-between gap-3">
                                <Button onClick={handleFilter} className="w-full">
                                    <CalendarDays className="h-4 w-4" />
                                    {t('Generate')}
                                </Button>
                                {auth.user?.permissions?.includes('print-customer-detail-report') && (
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => window.open(route('account.reports.customer-detail.print', customerData.customer.id) + `?start_date=${startDate}&end_date=${endDate}&download=pdf`, '_blank')}
                                                    className="gap-1.5"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('Download')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabbed Transactions Content */}
                <Tabs defaultValue="invoices" className="w-full">
                    <div className="flex justify-center">
                        <TabsList className="mb-2 flex-wrap h-auto w-full">
                            <TabsTrigger value="invoices" className="gap-2">
                                {t('Sales Invoices')}
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                                    {customerData.invoices.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="returns" className="gap-2">
                                {t('Sales Returns')}
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                                    {customerData.returns.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="credit_notes" className="gap-2">
                                {t('Credit Notes')}
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                                    {customerData.credit_notes.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="payments" className="gap-2">
                                {t('Customer Payments')}
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">
                                    {customerData.payments.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-xl w-full border">
                                <DataTable
                                    data={customerData.invoices}
                                    columns={invoiceColumns}
                                    showPagination={true}
                                    pageSize={10}
                                    emptyState={
                                        <NoRecordsFound icon={FileText} title={t('No Invoices')} description={t('No sales invoices found for the selected period')} className="h-auto py-12 border-none shadow-none" />
                                    }
                                />
                        </div>
                    </TabsContent>

                    {/* Returns Tab */}
                    <TabsContent value="returns">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-xl w-full border">
                                <DataTable
                                    data={customerData.returns}
                                    columns={returnColumns}
                                    showPagination={true}
                                    pageSize={10}
                                    emptyState={
                                        <NoRecordsFound icon={FileText} title={t('No Returns')} description={t('No sales returns found for the selected period')} className="h-auto py-12 border-none shadow-none" />
                                    }
                                />
                        </div>
                    </TabsContent>

                    {/* Credit Notes Tab */}
                    <TabsContent value="credit_notes">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-xl w-full border">
                                <DataTable
                                    data={customerData.credit_notes}
                                    columns={creditNoteColumns}
                                    showPagination={true}
                                    pageSize={10}
                                    emptyState={
                                        <NoRecordsFound icon={FileText} title={t('No Credit Notes')} description={t('No credit notes found for the selected period')} className="h-auto py-12 border-none shadow-none" />
                                    }
                                />
                        </div>
                    </TabsContent>

                    {/* Payments Tab */}
                    <TabsContent value="payments">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-xl w-full border">
                                <DataTable
                                    data={customerData.payments}
                                    columns={paymentColumns}
                                    showPagination={true}
                                    pageSize={10}
                                    emptyState={
                                        <NoRecordsFound icon={FileText} title={t('No Payments')} description={t('No customer payments found for the selected period')} className="h-auto py-12 border-none shadow-none" />
                                    }
                                />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}
