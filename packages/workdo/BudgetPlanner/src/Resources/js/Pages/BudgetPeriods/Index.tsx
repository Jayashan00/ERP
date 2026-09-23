import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Calendar as CalendarIcon, CheckCircle, Play, X, User, LayoutGrid, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Create from './Create';
import Edit from './Edit';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import UserColumn from '@/components/user-column';

import NoRecordsFound from '@/components/no-records-found';
import { BudgetPeriod, BudgetPeriodsIndexProps, BudgetPeriodFilters, BudgetPeriodModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { budgetperiods, summary, auth } = usePage<BudgetPeriodsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<BudgetPeriodFilters>({
        period_name: urlParams.get('period_name') || '',
        financial_year: urlParams.get('financial_year') || '',
        status: urlParams.get('status') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })(),
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<BudgetPeriodModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const [showFilters, setShowFilters] = useState(false);

    const totalPeriods = summary?.all || 0;
    const activePeriods = summary?.active || 0;
    const draftPeriods = summary?.draft || 0;

    const handleStatusChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);

        router.get(route('budget-planner.budget-periods.index'), {
            ...newFilters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection
        }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.status || 'all';




    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'budget-planner.budget-periods.destroy',
        defaultMessage: t('Are you sure you want to delete this budget period?')
    });

    const handleFilter = () => {
        const filterParams: any = {
            period_name: filters.period_name,
            financial_year: filters.financial_year,
            status: filters.status,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection
        };

        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }

        router.get(route('budget-planner.budget-periods.index'), filterParams, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        const filterParams = { ...filters };
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }
        delete filterParams.date_range;

        router.get(route('budget-planner.budget-periods.index'), { ...filterParams, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            period_name: '',
            financial_year: '',
            status: '',
            date_range: '',
        });
        router.get(route('budget-planner.budget-periods.index'), { per_page: perPage });
    };

    const openModal = (mode: 'add' | 'edit', data: BudgetPeriod | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'period_name',
            header: t('Period Name'),
            sortable: true
        },
        {
            key: 'financial_year',
            header: t('Financial Year'),
            sortable: true,
            render: (value: string) => value ? (
                <RandomBadgeUI name={value} />
            ) : '-'
        },
        {
            key: 'start_date',
            header: t('Start Date'),
            type: 'date',
            sortable: false
        },
        {
            key: 'end_date',
            header: t('End Date'),
            type: 'date',
            sortable: false
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const getStatusColor = (status: string) => {
                    switch (status) {
                        case 'draft': return 'bg-gray-100 text-gray-800 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700';
                        case 'approved': return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/30';
                        case 'active': return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:ring-blue-900/30';
                        case 'closed': return 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/20 dark:text-red-400 dark:ring-red-900/30';
                        default: return 'bg-gray-100 text-gray-800 ring-gray-200 dark:bg-gray-850 dark:text-gray-300 dark:ring-gray-850';
                    }
                };
                return (
                    <BadgeUI className={`capitalize ${getStatusColor(value)}`}>
                        {value}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'approved_by',
            header: t('Approved By'),
            sortable: false,
            render: (value: any, row: BudgetPeriod) => row.approved_by ? <UserColumn user={row.approved_by} /> : t('-')
        },

        ...(() => {
            const hasAnyActionPermission = (budgetperiod: BudgetPeriod) => {
                const permissions = auth.user?.permissions || [];
                return (
                    (budgetperiod.status === 'draft' && (permissions.includes('approve-budget-periods') || permissions.includes('edit-budget-periods') || permissions.includes('delete-budget-periods'))) ||
                    (budgetperiod.status === 'approved' && permissions.includes('active-budget-periods')) ||
                    (budgetperiod.status === 'active' && permissions.includes('close-budget-periods'))
                );
            };

            return budgetperiods?.data?.some(hasAnyActionPermission) ? [{
                key: 'actions',
                header: t('Actions'),
                render: (_: any, budgetperiod: BudgetPeriod) => {
                    if (!hasAnyActionPermission(budgetperiod)) return null;

                    return (
                        <div className="flex gap-1">
                            <TooltipProvider>
                                {budgetperiod.status === 'draft' && auth.user?.permissions?.includes('approve-budget-periods') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('budget-planner.budget-periods.approve', budgetperiod.id))}
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Approve')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {budgetperiod.status === 'approved' && auth.user?.permissions?.includes('active-budget-periods') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('budget-planner.budget-periods.active', budgetperiod.id))}
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Active')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {budgetperiod.status === 'active' && auth.user?.permissions?.includes('close-budget-periods') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('budget-planner.budget-periods.close', budgetperiod.id))}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Close')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {budgetperiod.status === 'draft' && auth.user?.permissions?.includes('edit-budget-periods') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => openModal('edit', budgetperiod)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                <EditIcon className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Edit')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {budgetperiod.status === 'draft' && auth.user?.permissions?.includes('delete-budget-periods') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(budgetperiod.id)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                    );
                }
            }] : [];
        })()
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Budget Planner') },
                { label: t('Budget Periods') }
            ]}
            pageTitle={t('Budget Periods')}
            pageDescription={t('Manage and configure budget periods, financial years, and approval workflows.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-budget-periods') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => openModal('add')}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Create')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            }
        >
            <Head title={t('Budget Periods')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-900/30 dark:border-gray-800 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.period_name}
                                onChange={(value) => setFilters({ ...filters, period_name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Budget Periods...')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <PerPageSelector
                                routeName="budget-planner.budget-periods.index"
                                filters={{ ...filters }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.financial_year, filters.date_range].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.all || 0 },
                            { key: 'draft', label: t('Draft'), icon: FileText, count: summary?.draft || 0 },
                            { key: 'approved', label: t('Approved'), icon: CheckCircle, count: summary?.approved || 0 },
                            { key: 'active', label: t('Active'), icon: Play, count: summary?.active || 0 },
                            { key: 'closed', label: t('Closed'), icon: X, count: summary?.closed || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleStatusChange(tab.key)}
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

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-2.5 bg-blue-50/30 border-b dark:bg-blue-950/10 dark:border-gray-800 sm:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Financial Year')}</label>
                                <Input
                                    value={filters.financial_year}
                                    onChange={(e) => setFilters({ ...filters, financial_year: e.target.value })}
                                    placeholder={t('Enter Financial Year')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Date Range')}</label>
                                <DateRangePicker
                                    value={filters.date_range}
                                    onChange={(value) => setFilters({ ...filters, date_range: value })}
                                    placeholder={t('Select date range')}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={budgetperiods?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={CalendarIcon}
                                        title={t('No Budget Periods found')}
                                        description={t('Get started by creating your first Budget Period.')}
                                        hasFilters={!!(filters.period_name || filters.financial_year || filters.status || filters.date_range)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-budget-periods"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Budget Period')}
                                        className="h-auto"
                                    />
                                }
                            />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30 dark:bg-gray-900/30 dark:border-gray-800">
                    <Pagination
                        data={budgetperiods || { data: [], links: [], meta: {} }}
                        routeName="budget-planner.budget-periods.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <Edit
                        budgetperiod={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Budget Period')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
