import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Banknote, CheckCircle, Play, X, LayoutGrid, FileText, User, Tag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NoRecordsFound from '@/components/no-records-found';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import UserColumn from '@/components/user-column';
import Create from './Create';
import Edit from './Edit';

interface Budget {
    id: number;
    budget_name: string;
    budget_type: string;
    total_budget_amount: number;
    status: string;
    budget_period?: { period_name: string; };
    approved_by?: { name: string; email?: string; avatar?: string; };
}

export default function Index() {
    const { t } = useTranslation();
    const { budgets, budgetPeriods, summary, auth } = usePage<any>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        budget_name: urlParams.get('budget_name') || '',
        budget_type: urlParams.get('budget_type') || '',
        status: urlParams.get('status') || '',
        period_id: urlParams.get('period_id') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);
    const [modalState, setModalState] = useState({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'budget-planner.budgets.destroy',
        defaultMessage: t('Are you sure you want to delete this budget?')
    });

    const handleFilter = () => {
        router.get(route('budget-planner.budgets.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('budget-planner.budgets.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            budget_name: '',
            budget_type: '',
            status: '',
            period_id: '',
        });
        router.get(route('budget-planner.budgets.index'), { per_page: perPage, view: viewMode });
    };

    const handleTabChange = (type: string) => {
        const newType = type === 'all' ? '' : type;
        const newFilters = { ...filters, budget_type: newType };
        setFilters(newFilters);

        router.get(route('budget-planner.budgets.index'), {
            ...newFilters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.budget_type || 'all';

    const openModal = (mode: 'add' | 'edit', data: Budget | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };


    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'operational': return 'bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-850/20';
            case 'capital': return 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-850/20';
            case 'cash_flow': return 'bg-cyan-50 text-cyan-700 ring-cyan-600/10 dark:bg-cyan-950/30 dark:text-cyan-400 dark:ring-cyan-850/20';
            default: return 'bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-zinc-900/30 dark:text-gray-400 dark:ring-zinc-850/20';
        }
    };

    const tableColumns = [
        {
            key: 'budget_name',
            header: t('Budget'),
            sortable: true,
            render: (value: string, row: Budget) => {
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {row.budget_name}
                        </span>
                        {row.budget_type && <BadgeUI icon={Tag} className={`${getTypeStyles(row.budget_type)} capitalize`}>
                            {row.budget_type === 'cash_flow' ? t('Cash Flow') : t(row.budget_type)}
                        </BadgeUI>}
                    </div>
                );
            }
        },
        {
            key: 'budget_period',
            header: t('Period'),
            sortable: false,
            render: (value: any, row: Budget) => row.budget_period?.period_name ? (
                <RandomBadgeUI name={row.budget_period.period_name} />
            ) : '-'
        },
        {
            key: 'total_budget_amount',
            header: t('Amount'),
            sortable: false,
            render: (value: number) => formatCurrency(value)
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const getStatusStyles = (status: string) => {
                    switch (status) {
                        case 'draft': return 'bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-zinc-900/30 dark:text-gray-400 dark:ring-zinc-850/20';
                        case 'approved': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20';
                        case 'active': return 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/20';
                        case 'closed': return 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20';
                        default: return 'bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-zinc-900/30 dark:text-gray-400 dark:ring-zinc-850/20';
                    }
                };
                return (
                    <BadgeUI className={getStatusStyles(value)}>
                        {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'approved_by',
            header: t('Approved By'),
            sortable: false,
            render: (value: any, row: Budget) => row.approved_by ? <UserColumn user={row.approved_by} /> : t('-')
        },
        ...(() => {
            const hasAnyActionPermission = (budget: Budget) => {
                const permissions = auth.user?.permissions || [];
                return (
                    (budget.status === 'draft' && (permissions.includes('approve-budgets') || permissions.includes('edit-budgets') || permissions.includes('delete-budgets'))) ||
                    (budget.status === 'approved' && permissions.includes('active-budgets')) ||
                    (budget.status === 'active' && permissions.includes('close-budgets'))
                );
            };

            return budgets?.data?.some(hasAnyActionPermission) ? [{
                key: 'actions',
                header: t('Actions'),
                render: (_: any, budget: Budget) => {
                    if (!hasAnyActionPermission(budget)) return null;

                    return (
                        <div className="flex gap-1">
                            <TooltipProvider>
                                {budget.status === 'draft' && auth.user?.permissions?.includes('approve-budgets') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('budget-planner.budgets.approve', budget.id))}
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
                                {budget.status === 'approved' && auth.user?.permissions?.includes('active-budgets') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('budget-planner.budgets.active', budget.id))}
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
                                {budget.status === 'active' && auth.user?.permissions?.includes('close-budgets') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.post(route('budget-planner.budgets.close', budget.id))}
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
                                {budget.status === 'draft' && auth.user?.permissions?.includes('edit-budgets') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openModal('edit', budget)}
                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                            >
                                                <EditIcon className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Edit')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {budget.status === 'draft' && auth.user?.permissions?.includes('delete-budgets') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(budget.id)}
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
                { label: t('Budget') }
            ]}
            pageTitle={t('Manage Budget')}
            pageDescription={t('Plan, track, and manage all your organization budgets. Create new budgets, assign periods and types, and get approvals.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-budgets') && (
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
            <Head title={t('Budgets')} />

            <Card className="shadow-sm">
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.budget_name}
                                onChange={(value) => setFilters({ ...filters, budget_name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Budgets...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="budget-planner.budgets.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="budget-planner.budgets.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFiltersCount = [filters.period_id, filters.status].filter(Boolean).length;
                                    return activeFiltersCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                            {activeFiltersCount}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Type Tabs */}
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.total || 0 },
                            { key: 'operational', label: t('Operational'), icon: FileText, count: summary?.operational || 0 },
                            { key: 'capital', label: t('Capital'), icon: Banknote, count: summary?.capital || 0 },
                            { key: 'cash_flow', label: t('Cash Flow'), icon: Play, count: summary?.cash_flow || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
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
                    <CardContent className="p-2.5 bg-blue-50/30 border-b sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Budget Period')}</label>
                                <Select value={filters.period_id} onValueChange={(value) => setFilters({ ...filters, period_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Period')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {budgetPeriods?.filter((period: any) => period.status === 'active').map((period: any) => (
                                            <SelectItem key={period.id} value={period.id.toString()}>
                                                {period.period_name} ({period.financial_year})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">{t('Draft')}</SelectItem>
                                        <SelectItem value="approved">{t('Approved')}</SelectItem>
                                        <SelectItem value="active">{t('Active')}</SelectItem>
                                        <SelectItem value="closed">{t('Closed')}</SelectItem>
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
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <DataTable
                                    data={budgets?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Banknote}
                                            title={t('No Budgets found')}
                                            description={t('Get started by creating your first Budget.')}
                                            hasFilters={!!(filters.budget_name || filters.budget_type || filters.status || filters.period_id)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-budgets"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Budget')}
                                            className="h-auto"
                                        />
                                    }
                                />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-3 sm:p-4">
                            {budgets?.data && budgets.data.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {budgets.data.map((budget) => (
                                        <Card key={budget.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                            {/* Card Header — Budget Name & Period */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-zinc-100 dark:border-zinc-800/80 flex-shrink-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-primary">
                                                            <Banknote className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col text-start min-w-0 flex-1">
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate" title={budget.budget_name}>
                                                                {budget.budget_name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground truncate" title={budget.budget_period?.period_name || '-'}>
                                                                {budget.budget_period?.period_name || '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <BadgeUI className={`${budget.status === 'draft' ? 'bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-zinc-900/30 dark:text-gray-400 dark:ring-zinc-850/20' :
                                                        budget.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20' :
                                                            budget.status === 'active' ? 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/20' :
                                                                budget.status === 'closed' ? 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20' :
                                                                    'bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-zinc-900/30 dark:text-gray-400 dark:ring-zinc-850/20'
                                                        }`}>
                                                        {budget.status ? budget.status.charAt(0).toUpperCase() + budget.status.slice(1) : '-'}
                                                    </BadgeUI>
                                                </div>
                                            </div>

                                            {/* Card Content - Budget Details */}
                                            <CardContent className="p-4 flex-1 space-y-2.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">{t('Type')}</span>
                                                    {budget.budget_type && <BadgeUI className={`${getTypeStyles(budget.budget_type)} capitalize`}>
                                                        {budget.budget_type === 'cash_flow' ? t('Cash Flow') : t(budget.budget_type)}
                                                    </BadgeUI>}
                                                </div>
                                                <div className="flex justify-between items-start text-xs pt-1">
                                                    <span className="text-muted-foreground mt-1">{t('Approved By')}</span>
                                                    {budget.approved_by ? (
                                                        <div className="flex items-center gap-2 min-w-0 max-w-[70%]">
                                                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                                                                {budget.approved_by?.avatar ? (
                                                                    <img src={getImagePath(budget.approved_by.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col text-left min-w-0 flex-1">
                                                                <span className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate" title={budget.approved_by?.name}>
                                                                    {budget.approved_by?.name}
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground truncate" title={budget.approved_by?.email}>
                                                                    {budget.approved_by?.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                                <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-3 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{t('Amount')}</span>
                                                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(budget.total_budget_amount)}</span>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                                            {/* Card Footer - Action Buttons Only */}
                                            <CardFooter className="p-2 flex justify-end items-center bg-zinc-50/50 dark:bg-zinc-950/20">
                                                <div className="flex justify-end gap-1">
                                                    <TooltipProvider>
                                                        {budget.status === 'draft' && auth.user?.permissions?.includes('approve-budgets') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => router.post(route('budget-planner.budgets.approve', budget.id))}
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
                                                        {budget.status === 'approved' && auth.user?.permissions?.includes('active-budgets') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => router.post(route('budget-planner.budgets.active', budget.id))}
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
                                                        {budget.status === 'active' && auth.user?.permissions?.includes('close-budgets') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => router.post(route('budget-planner.budgets.close', budget.id))}
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
                                                        {budget.status === 'draft' && auth.user?.permissions?.includes('edit-budgets') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openModal('edit', budget)}
                                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                                                    >
                                                                        <EditIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('Edit')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {budget.status === 'draft' && auth.user?.permissions?.includes('delete-budgets') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openDeleteDialog(budget.id)}
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
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={Banknote}
                                    title={t('No Budgets found')}
                                    description={t('Get started by creating your first Budget.')}
                                    hasFilters={!!(filters.budget_name || filters.budget_type || filters.status || filters.period_id)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-budgets"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Budget')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30">
                    <Pagination
                        data={budgets || { data: [], links: [], meta: {} }}
                        routeName="budget-planner.budgets.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <Edit
                        budget={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Budget')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
