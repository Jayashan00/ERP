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

interface DebitNote {
    id: number;
    debit_note_number: string;
    debit_note_date: string;
    vendor: {
        name: string;
        email?: string;
        avatar?: string;
    };
    total_amount: number;
    applied_amount: number;
    balance_amount: number;
    status: string;
    reason: string;
    purchase_return?: {
        id: number;
        return_number: string;
    };
    approved_by?: {
        name: string;
    };
}

interface DebitNoteFilters {
    search: string;
    vendor_id: string;
    status: string;
    purchase_return_id: string;
}

interface DebitNoteIndexProps {
    debitNotes: {
        data: DebitNote[];
        links: any[];
        meta: any;
    };
    vendors: Array<{ id: number; name: string }>;
    purchaseReturns: Array<{ id: number; return_number: string }>;
    summary: {
        total: number;
        draft: number;
        partial: number;
        approved: number;
        applied: number;
    };
    filters: DebitNoteFilters;
    auth: any;
    [key: string]: any;
}

export default function Index() {
    const { t } = useTranslation();
    const { debitNotes, vendors, purchaseReturns, filters: initialFilters, summary, auth } = usePage<DebitNoteIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<DebitNoteFilters>({
        search: initialFilters?.search || urlParams.get('search') || '',
        vendor_id: initialFilters?.vendor_id || urlParams.get('vendor_id') || '',
        status: initialFilters?.status || urlParams.get('status') || '',
        purchase_return_id: initialFilters?.purchase_return_id || urlParams.get('purchase_return_id') || ''
    });

    const [selectedYear, setSelectedYear] = useState(
        parseInt(urlParams.get('year') || '') || new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        urlParams.get('month') !== null && urlParams.get('month') !== ''
            ? parseInt(urlParams.get('month') || '0')
            : new Date().getMonth()
    );

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [showFilters, setShowFilters] = useState(false);

    const activeTab = filters.status || 'all';

    const pageButtons = usePageButtons('debitNoteBtn', 'Debit Note data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.debit-notes.destroy',
        defaultMessage: t('Are you sure you want to delete this debit note?')
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
        router.get(route('account.debit-notes.index'), {
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
        router.get(route('account.debit-notes.index'), {
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
        setFilters({ search: '', vendor_id: '', status: '', purchase_return_id: '' });
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        router.get(route('account.debit-notes.index'), {
            per_page: perPage,
            year: currentYear,
            month: currentMonth
        });
    };

    const handleCalendarChange = (dateStr: string, year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);

        router.get(route('account.debit-notes.index'), {
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
        router.get(route('account.debit-notes.index'), {
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
            key: 'debit_note_number',
            header: t('Debit Note Number'),
            sortable: true,
            render: (value: string, debitNote: DebitNote) =>
                auth.user?.permissions?.includes('view-debit-notes') ? (
                    <BadgeUI
                        onClick={() => router.get(route('account.debit-notes.show', debitNote.id))}
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
            key: 'purchase_return',
            header: t('Purchase Return'),
            render: (value: any, debitNote: DebitNote) =>
                value?.return_number ? (
                    auth.user?.permissions?.includes('view-purchase-return-invoices') ? (
                        <BadgeUI
                            onClick={() => router.get(route('purchase-returns.show', debitNote.purchase_return?.id))}
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
            key: 'vendor',
            header: t('Vendor'),
            render: (value: any) => <UserColumn user={value} />
        },
        {
            key: 'debit_note_date',
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
        ...(auth.user?.permissions?.some((p: string) => ['view-debit-notes', 'approve-debit-notes', 'delete-debit-notes'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, debitNote: DebitNote) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {debitNote.status === 'draft' && auth.user?.permissions?.includes('approve-debit-notes') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.post(route('account.debit-notes.approve', debitNote.id))}
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

                        {auth.user?.permissions?.includes('view-debit-notes') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.get(route('account.debit-notes.show', debitNote.id))}
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

                        {debitNote.status === 'draft' && auth.user?.permissions?.includes('delete-debit-notes') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(debitNote.id)}
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

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Debit Notes') }
            ]}
            pageTitle={t('Manage Debit Notes')}
            pageDescription={t('Manage your debit notes, approve drafted notes, and track balances.')}
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
            <Head title={t('Debit Notes')} />

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
                                placeholder={t('Search by debit note number...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="account.debit-notes.index"
                                filters={{ ...filters, year: selectedYear, month: selectedMonth }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.vendor_id, filters.purchase_return_id].filter(Boolean).length;
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
                    <CardContent className="p-2.5 bg-blue-50/30 dark:bg-blue-950/10 border-b sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {auth.user?.permissions?.includes('manage-users') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Vendor')}</label>
                                    <Select value={filters.vendor_id} onValueChange={(value) => setFilters({ ...filters, vendor_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by vendor')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vendors.map((vendor) => (
                                                <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                                    {vendor.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Purchase Return')}</label>
                                <Select value={filters.purchase_return_id} onValueChange={(value) => setFilters({ ...filters, purchase_return_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by purchase return')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {purchaseReturns.map((purchaseReturn) => (
                                            <SelectItem key={purchaseReturn.id} value={purchaseReturn.id.toString()}>
                                                {purchaseReturn.return_number}
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
                                data={debitNotes.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={XCircle}
                                        title={t('No debit notes found')}
                                        description={t('Debit notes are automatically created from purchase returns.')}
                                        hasFilters={!!(filters.search || filters.vendor_id || filters.purchase_return_id)}
                                        onClearFilters={clearFilters}
                                        className="h-auto"
                                    />
                                }
                            />
                    </div>
                </CardContent>

                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30 dark:bg-zinc-900/10">
                    <Pagination
                        data={{ ...debitNotes, ...debitNotes.meta }}
                        routeName="account.debit-notes.index"
                        filters={{ ...filters, per_page: perPage, year: selectedYear, month: selectedMonth }}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Debit Note')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
