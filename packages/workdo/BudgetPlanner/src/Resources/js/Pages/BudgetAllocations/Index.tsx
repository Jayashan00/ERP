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
import { Plus, Edit as EditIcon, Trash2, DollarSign, LayoutGrid, BarChart3, Calendar, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NoRecordsFound from '@/components/no-records-found';
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { formatCurrency, formatDate } from '@/utils/helpers';
import Create from './Create';
import Edit from './Edit';
import RandomBadgeUI from '@/components/random-badge-ui'

interface BudgetAllocation {
    id: number;
    budget?: { budget_name: string; };
    account?: { account_name: string; };
    allocated_amount: number;
    spent_amount: number;
    remaining_amount: number;
}

export default function Index() {
    const { t } = useTranslation();
    const { budgetAllocations, budgets, accounts, auth, cardStats } = usePage<any>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        search: urlParams.get('search') || '',
        budget_id: urlParams.get('budget_id') || '',
        account_id: urlParams.get('account_id') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const totalAllocations = cardStats?.total_allocations || 0;
    const totalAllocated = cardStats?.total_allocated || 0;
    const totalSpent = cardStats?.total_spent || 0;
    const totalRemaining = cardStats?.total_remaining || 0;
    const spentPercentage = cardStats?.spent_percentage || 0;
    const [modalState, setModalState] = useState({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'budget-planner.budget-allocations.destroy',
        defaultMessage: t('Are you sure you want to delete this budget allocation?')
    });

    const handleFilter = () => {
        router.get(route('budget-planner.budget-allocations.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('budget-planner.budget-allocations.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            budget_id: '',
            account_id: '',
        });
        router.get(route('budget-planner.budget-allocations.index'), { per_page: perPage, view: viewMode });
    };

    const openModal = (mode: 'add' | 'edit', data: BudgetAllocation | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'budget',
            header: t('Budget'),
            sortable: false,
            render: (value: any, row: BudgetAllocation) => row.budget?.budget_name || '-'
        },
        {
            key: 'account',
            header: t('Account'),
            sortable: false,
            render: (value: any, row: BudgetAllocation) => row.account?.account_name ? <RandomBadgeUI name={row.account?.account_name} /> : '-'
        },
        {
            key: 'utilization',
            header: t('Utilization'),
            sortable: false,
            render: (value: any, row: BudgetAllocation) => {
                const allocated = parseFloat(row.allocated_amount || 0);
                const spent = parseFloat(row.spent_amount || 0);
                const remaining = parseFloat(row.remaining_amount || 0);
                const spentPercentage = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 100) : 0;

                return (
                    <div className="flex flex-col py-1.5 gap-1.5 min-w-[240px]">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {t('Total')}: {formatCurrency(allocated)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">({spentPercentage}%)</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-405 flex justify-between items-center gap-1 font-medium">
                            <span className="text-red-500 dark:text-red-450">
                                {t('Spent')}: {formatCurrency(spent)}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                                {t('Left')}: {formatCurrency(remaining)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${spentPercentage >= 90 ? 'bg-red-500' : spentPercentage >= 75 ? 'bg-orange-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${spentPercentage}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, budgetAllocation: BudgetAllocation) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-budget-allocations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal('edit', budgetAllocation)}
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
                        {auth.user?.permissions?.includes('delete-budget-allocations') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(budgetAllocation.id)}
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
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Budget Planner') },
                { label: t('Budget Allocations') }
            ]}
            pageTitle={t('Budget Allocations')}
            pageDescription={t('Allocate and track budget distributions across different accounts and monitor real-time consumption.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-budget-allocations') && (
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
            <Head title={t('Budget Allocations')} />

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {/* Total Allocations */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
                    <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Total Allocations')}</p>
                            <h3 className="text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-200">
                                {totalAllocations}
                            </h3>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">{t('Active account allocations')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-300 flex-shrink-0">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Total Allocated Amount */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
                    <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('Total Allocated')}</p>
                            <h3 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
                                {formatCurrency(totalAllocated)}
                            </h3>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-405/85 mt-1">{t('Allocated to accounts')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-300 flex-shrink-0">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Spending Progress */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50">
                    <CardContent className="p-4 sm:p-6 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('Spending Status')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-200">
                                    {formatCurrency(totalSpent)}
                                </h3>
                            </div>
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                {spentPercentage}%
                            </span>
                        </div>
                        <div className="w-full bg-amber-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-600 dark:bg-amber-405 rounded-full transition-all duration-500"
                                style={{ width: `${spentPercentage}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-amber-700/80 dark:text-amber-400/80">
                            <span>{t('Spent')}: {formatCurrency(totalSpent)}</span>
                            <span>{t('Remaining')}: {formatCurrency(totalRemaining)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-900/30 dark:border-gray-800 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Budget Allocations...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="budget-planner.budget-allocations.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="budget-planner.budget-allocations.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.budget_id, filters.account_id].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-2.5 bg-blue-50/30 border-b dark:bg-blue-950/10 dark:border-gray-800 sm:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Budget')}</label>
                                <Select value={filters.budget_id} onValueChange={(value) => setFilters({ ...filters, budget_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Budget')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {budgets?.map((budget: any) => (
                                            <SelectItem key={budget.id} value={budget.id.toString()}>
                                                {budget.budget_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Account')}</label>
                                <Select value={filters.account_id} onValueChange={(value) => setFilters({ ...filters, account_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Account')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts?.map((account: any) => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.account_name}
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

                {/* Content Area */}
                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={budgetAllocations?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={DollarSign}
                                        title={t('No Budget Allocations found')}
                                        description={t('Get started by creating your first Budget Allocation.')}
                                        hasFilters={!!(filters.search || filters.budget_id || filters.account_id)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-budget-allocations"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Budget Allocation')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-3 sm:p-4">
                            {budgetAllocations?.data && budgetAllocations.data.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {budgetAllocations.data.map((allocation: any) => {
                                        const allocated = parseFloat(allocation.allocated_amount || 0);
                                        const spent = parseFloat(allocation.spent_amount || 0);
                                        const remaining = parseFloat(allocation.remaining_amount || 0);
                                        const spentPercentage = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 100) : 0;

                                        return (
                                            <Card
                                                key={allocation.id}
                                                className="p-0 flex flex-col border border-gray-300 dark:border-gray-600 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl overflow-hidden bg-white dark:bg-zinc-900"
                                            >
                                                <CardContent className="p-4 flex flex-col gap-3 flex-1">
                                                    {/* Header — Budget Name & Account */}
                                                    <div className="flex flex-col gap-1 pb-3 border-b border-gray-300 dark:border-gray-600">
                                                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-snug">
                                                            {allocation.budget?.budget_name || '-'}
                                                        </h3>
                                                        <RandomBadgeUI name={allocation.account?.account_name || '-'} className="w-fit" />
                                                    </div>

                                                    {/* Total Allocated */}
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground">{t('Allocated Amount')}</span>
                                                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(allocated)}
                                                        </h4>
                                                    </div>

                                                    {/* Spent & Remaining boxes */}
                                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                                        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-2.5 flex flex-col gap-0.5">
                                                            <span className="text-[10px] text-red-650/80 dark:text-red-405/85 font-medium">{t('Spent')}</span>
                                                            <span className="text-sm font-bold text-red-600 dark:text-red-400 truncate">
                                                                {formatCurrency(spent)}
                                                            </span>
                                                        </div>
                                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-2.5 flex flex-col gap-0.5">
                                                            <span className="text-[10px] text-emerald-650/80 dark:text-emerald-405/85 font-medium">{t('Left')}</span>
                                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                                                                {formatCurrency(remaining)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Utilization progress bar */}
                                                    <div className="mt-1 space-y-1.5">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground">{t('Utilization')}</span>
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{spentPercentage}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-300 ${spentPercentage >= 90 ? 'bg-red-500' : spentPercentage >= 75 ? 'bg-orange-500' : 'bg-emerald-500'
                                                                    }`}
                                                                style={{ width: `${spentPercentage}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Actions Footer */}
                                                    <div className="flex justify-end gap-1 pt-2 mt-auto border-t border-gray-100 dark:border-gray-800">
                                                        <TooltipProvider>
                                                            {auth.user?.permissions?.includes('edit-budget-allocations') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openModal('edit', allocation)}
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
                                                            {auth.user?.permissions?.includes('delete-budget-allocations') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openDeleteDialog(allocation.id)}
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
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={DollarSign}
                                    title={t('No Budget Allocations found')}
                                    description={t('Get started by creating your first Budget Allocation.')}
                                    hasFilters={!!(filters.search || filters.budget_id || filters.account_id)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-budget-allocations"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Budget Allocation')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 dark:bg-gray-900/30 dark:border-gray-800 sm:px-4 sm:py-3">
                    <Pagination
                        data={budgetAllocations || { data: [], links: [], meta: {} }}
                        routeName="budget-planner.budget-allocations.index"
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
                        budgetAllocation={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Budget Allocation')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
