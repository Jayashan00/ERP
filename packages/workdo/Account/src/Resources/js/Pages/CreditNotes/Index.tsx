import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { usePageButtons } from '@/hooks/usePageButtons';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import WeekMonthSwitcher from '@/components/week-month-switcher';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Eye, XCircle, CheckCircle, Trash2, Calendar, LayoutGrid, Clock, CheckCircle2, Coins, ArrowRight, User as UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers';
import NoRecordsFound from '@/components/no-records-found';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import GenerateAvatar from '@/components/generate-avatar';
import UserColumn from '@/components/user-column';

interface CreditNote {
    id: number;
    credit_note_number: string;
    credit_note_date: string;
    customer: {
        name: string;
        email?: string;
        avatar?: string;
    };
    total_amount: number;
    applied_amount: number;
    balance_amount: number;
    status: string;
    reason: string;
    sales_return?: {
        id: number;
        return_number: string;
    };
    approved_by?: {
        name: string;
        email?: string;
        avatar?: string;
    };
}

interface CreditNoteFilters {
    search: string;
    customer_id: string;
    status: string;
    sales_return_id: string;
    year?: string;
    month?: string;
}

interface CreditNoteIndexProps {
    creditNotes: {
        data: CreditNote[];
        links: any[];
        meta: any;
    };
    customers: Array<{ id: number; name: string }>;
    salesReturns: Array<{ id: number; return_number: string }>;
    filters: CreditNoteFilters;
    summary: {
        total: number;
        draft: number;
        partial: number;
        approved: number;
        applied: number;
    };
    auth: any;
    [key: string]: any;
}

export default function Index() {
    const { t } = useTranslation();
    const { creditNotes, customers, salesReturns, filters: initialFilters, summary, auth } = usePage<CreditNoteIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [selectedYear, setSelectedYear] = useState<number>(initialFilters?.year ? parseInt(initialFilters.year) : new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(initialFilters?.month ? parseInt(initialFilters.month) : new Date().getMonth());

    const [filters, setFilters] = useState<CreditNoteFilters>({
        search: initialFilters?.search || urlParams.get('search') || '',
        customer_id: initialFilters?.customer_id || urlParams.get('customer_id') || '',
        status: initialFilters?.status || urlParams.get('status') || '',
        sales_return_id: initialFilters?.sales_return_id || urlParams.get('sales_return_id') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('creditNoteBtn', 'Credit Note data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.credit-notes.destroy',
        defaultMessage: t('Are you sure you want to delete this credit note?')
    });

    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:ring-zinc-900/50';
            case 'partial': return 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:ring-yellow-900/50';
            case 'approved': return 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-900/50';
            case 'applied': return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/50';
            default: return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:ring-zinc-900/50';
        }
    };

    const handleFilter = () => {
        router.get(route('account.credit-notes.index'), {
            ...filters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            year: selectedYear,
            month: selectedMonth
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('account.credit-notes.index'), {
            ...filters,
            per_page: perPage,
            sort: field,
            direction,
            year: selectedYear,
            month: selectedMonth
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', customer_id: '', status: '', sales_return_id: '' });
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        router.get(route('account.credit-notes.index'), {
            per_page: perPage,
            year: currentYear,
            month: currentMonth
        });
    };

    const handleCalendarChange = (dateStr: string, year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);

        router.get(route('account.credit-notes.index'), {
            ...filters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            year,
            month
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleStatusTabChange = (status: string) => {
        const nextFilters = { ...filters, status: status === 'all' ? '' : status };
        setFilters(nextFilters);
        router.get(route('account.credit-notes.index'), {
            ...nextFilters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            year: selectedYear,
            month: selectedMonth
        }, {
            preserveState: true,
            replace: true
        });
    };

    const tableColumns = [
        {
            key: 'credit_note_number',
            header: t('Credit Note Number'),
            sortable: true,
            render: (value: string, creditNote: CreditNote) =>
                auth.user?.permissions?.includes('view-credit-notes') ? (
                    <BadgeUI
                        onClick={() => router.get(route('account.credit-notes.show', creditNote.id))}
                        className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800 cursor-pointer"
                    >
                        {value}
                    </BadgeUI>
                ) : (
                    <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800">
                        {value}
                    </BadgeUI>
                )
        },
        {
            key: 'sales_return',
            header: t('Sales Return'),
            render: (value: any, creditNote: CreditNote) =>
                value?.return_number ? (
                    auth.user?.permissions?.includes('view-sales-return-invoices') ? (
                        <BadgeUI
                            onClick={() => router.get(route('sales-returns.show', creditNote.sales_return?.id))}
                            className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800 cursor-pointer"
                        >
                            {value.return_number}
                        </BadgeUI>
                    ) : (
                        <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800">
                            {value.return_number}
                        </BadgeUI>
                    )
                ) : '-'
        },
        {
            key: 'customer',
            header: t('Customer'),
            render: (value: any) => <UserColumn user={value} />
        },
        {
            key: 'credit_note_date',
            header: t('Date'),
            type: 'date',
            sortable: true
        },
        {
            key: 'total_amount',
            header: t('Total Amount'),
            sortable: true,
            render: (value: number) => (
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {formatCurrency(parseFloat(value.toString()))}
                </span>
            )
        },
        {
            key: 'balance_amount',
            header: t('Balance'),
            sortable: true,
            render: (value: number) => {
                const numericVal = parseFloat(value.toString());
                return (
                    <span className={`font-semibold text-sm ${numericVal < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(numericVal)}
                    </span>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string) => (
                <BadgeUI className={getStatusBadgeClasses(value)}>
                    {t(value.charAt(0).toUpperCase() + value.slice(1))}
                </BadgeUI>
            )
        },
        {
            key: 'approved_by',
            header: t('Approved By'),
            render: (value: any) => (
                value ? <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        {value?.avatar ? (
                            <img
                                src={getImagePath(value.avatar)}
                                alt={value.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <GenerateAvatar name={value?.name || ''} />
                        )}
                    </div>
                    <div className="flex flex-col text-start">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {value?.name || '-'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {value?.email || '-'}
                        </span>
                    </div>
                </div> : '-'
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-credit-notes', 'approve-credit-notes', 'delete-credit-notes'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, creditNote: CreditNote) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {creditNote.status === 'draft' && auth.user?.permissions?.includes('approve-credit-notes') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.post(route('account.credit-notes.approve', creditNote.id))}
                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Approve')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('view-credit-notes') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.get(route('account.credit-notes.show', creditNote.id))}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {creditNote.status === 'draft' && auth.user?.permissions?.includes('delete-credit-notes') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(creditNote.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Delete')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    const activeTab = filters.status || 'all';

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Credit Notes') }
            ]}
            pageTitle={t('Manage Credit Notes')}
            pageDescription={t('Track, approve, and apply credit notes generated from sales returns.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Credit Notes')} />

            <WeekMonthSwitcher
                mode="month"
                value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
                onChange={handleCalendarChange}
            />

            <Card className="shadow-sm border-gray-200/50 dark:border-zinc-800/50">
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-zinc-900/10 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="w-full md:max-w-md">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by credit note number...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="account.credit-notes.index"
                                filters={{ ...filters, year: selectedYear, month: selectedMonth }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer_id, filters.sales_return_id].filter(Boolean).length;
                                    return activeFilters > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {activeFilters}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Status Tabs */}
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.total || 0 },
                            { key: 'draft', label: t('Draft'), icon: Clock, count: summary?.draft || 0 },
                            { key: 'partial', label: t('Partial'), icon: CheckCircle2, count: summary?.partial || 0 },
                            { key: 'approved', label: t('Approved'), icon: CheckCircle2, count: summary?.approved || 0 },
                            { key: 'applied', label: t('Applied'), icon: Coins, count: summary?.applied || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleStatusTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>

                {showFilters && (
                    <CardContent className="p-2.5 bg-muted/10 border-b border-border sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {auth.user?.permissions?.includes('manage-users') && (
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">{t('Customer')}</label>
                                    <Select value={filters.customer_id} onValueChange={(value) => setFilters({ ...filters, customer_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by customer')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">{t('Sales Return')}</label>
                                <Select value={filters.sales_return_id} onValueChange={(value) => setFilters({ ...filters, sales_return_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by sales return')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salesReturns.map((salesReturn) => (
                                            <SelectItem key={salesReturn.id} value={salesReturn.id.toString()}>
                                                {salesReturn.return_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={creditNotes.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={XCircle}
                                        title={t('No credit notes found')}
                                        description={t('Credit notes are automatically created from sales returns.')}
                                        hasFilters={!!(filters.search || filters.customer_id || filters.sales_return_id)}
                                        onClearFilters={clearFilters}
                                        className="h-auto"
                                    />
                                }
                            />
                    </div>
                </CardContent>

                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-muted/5">
                    <Pagination
                        data={{ ...creditNotes, ...creditNotes.meta }}
                        routeName="account.credit-notes.index"
                        filters={{ ...filters, year: selectedYear, month: selectedMonth }}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Credit Note')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
