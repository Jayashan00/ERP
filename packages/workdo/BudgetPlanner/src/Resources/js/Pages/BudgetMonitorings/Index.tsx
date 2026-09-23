import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { BarChart3, LayoutGrid, Calendar, FileText } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { FilterButton } from '@/components/ui/filter-button';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import NoRecordsFound from '@/components/no-records-found';
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { formatCurrency, formatDate } from '@/utils/helpers';

interface BudgetMonitoring {
    id: number;
    budget?: { budget_name: string; };
    monitoring_date: string;
    total_allocated: number;
    total_spent: number;
    total_remaining: number;
    variance_amount: number;
    variance_percentage: number;
}

export default function Index() {
    const { t } = useTranslation();
    const { budgetMonitorings, budgets, cardStats } = usePage<any>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        search: urlParams.get('search') || '',
        budget_id: urlParams.get('budget_id') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })(),
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const totalMonitored = cardStats?.total_monitored || 0;
    const totalAllocated = cardStats?.total_allocated || 0;
    const totalSpent = cardStats?.total_spent || 0;
    const totalRemaining = cardStats?.total_remaining || 0;
    const spentPercentage = cardStats?.spent_percentage || 0;

    const handleFilter = () => {
        const filterParams: any = {
            search: filters.search,
            budget_id: filters.budget_id,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        };

        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        }

        router.get(route('budget-planner.budget-monitorings.index'), filterParams, {
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

        router.get(route('budget-planner.budget-monitorings.index'), { ...filterParams, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', budget_id: '', date_range: '' });
        router.get(route('budget-planner.budget-monitorings.index'), { view: viewMode });
    };

    const tableColumns = [
        {
            key: 'budget',
            header: t('Budget'),
            sortable: true,
            render: (value: any, row: BudgetMonitoring) => row.budget?.budget_name || '-'
        },
        {
            key: 'monitoring_date',
            header: t('Date'),
            type: 'date',
            sortable: true
        },
        {
            key: 'utilization',
            header: t('Utilization'),
            sortable: false,
            render: (value: any, row: BudgetMonitoring) => {
                const allocated = parseFloat(row.total_allocated || 0);
                const spent = parseFloat(row.total_spent || 0);
                const remaining = parseFloat(row.total_remaining || 0);
                const spentPercentage = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 100) : 0;

                return (
                    <div className="flex flex-col py-1.5 gap-1.5 min-w-[240px]">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {t('Total')}: {formatCurrency(allocated)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 font-medium">({spentPercentage}%)</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center gap-1 font-medium">
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
            key: 'variance_amount',
            header: t('Variance'),
            sortable: true,
            render: (value: string) => value ? formatCurrency(value) : '-'
        },
        {
            key: 'variance_percentage',
            header: t('Variance Percentage'),
            sortable: true,
            render: (value: string) => value ? `${value}%` : '-'
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Budget Planner') },
                { label: t('Budget Monitoring') }
            ]}
            pageTitle={t('Budget Monitoring')}
            pageDescription={t('Monitor budget allocations, real-time spending, and variance percentages across all active budgets.')}
        >
            <Head title={t('Budget Monitoring')} />

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {/* Monitored Budgets */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50">
                    <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Monitored Budgets')}</p>
                            <h3 className="text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-200">
                                {totalMonitored}
                            </h3>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">{t('Budgets with activity logs')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-300 flex-shrink-0">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Total Allocated */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50">
                    <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('Total Allocated')}</p>
                            <h3 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
                                {formatCurrency(totalAllocated)}
                            </h3>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-405/85 mt-1">{t('Total amount planned')}</p>
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

            <Card className="shadow-sm">
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-900/30 dark:border-gray-800 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Budget Monitoring...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="budget-planner.budget-monitorings.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="budget-planner.budget-monitorings.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.budget_id, filters.date_range].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={budgetMonitorings?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={BarChart3}
                                        title={t('No Budget Monitoring found')}
                                        description={t('Budget monitoring data will appear here.')}
                                        hasFilters={!!(filters.search || filters.budget_id || filters.date_range)}
                                        onClearFilters={clearFilters}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-3 sm:p-4">
                            {budgetMonitorings?.data && budgetMonitorings.data.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {budgetMonitorings.data.map((monitoring: any) => {
                                        const allocated = parseFloat(monitoring.total_allocated || 0);
                                        const spent = parseFloat(monitoring.total_spent || 0);
                                        const remaining = parseFloat(monitoring.total_remaining || 0);
                                        const spentPercentage = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 100) : 0;

                                        return (
                                            <Card
                                                key={monitoring.id}
                                                className="p-0 flex flex-col border border-gray-300 dark:border-gray-600 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl overflow-hidden bg-white dark:bg-zinc-900"
                                            >
                                                <CardContent className="p-4 flex flex-col gap-3 flex-1">
                                                    {/* Header — Budget Name & Date */}
                                                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-300 dark:border-gray-600">
                                                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-snug">
                                                            {monitoring.budget?.budget_name || '-'}
                                                        </h3>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                                                            <Calendar className="h-3 w-3" />
                                                            {monitoring.monitoring_date ? formatDate(monitoring.monitoring_date) : '-'}
                                                        </span>
                                                    </div>

                                                    {/* Total Budget / Allocated */}
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground">{t('Total Budget')}</span>
                                                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(allocated)}
                                                        </h4>
                                                    </div>

                                                    {/* Spent & Remaining boxes */}
                                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                                        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-2.5 flex flex-col gap-0.5">
                                                            <span className="text-[10px] text-red-600/80 dark:text-red-400/80 font-medium">{t('Spent')}</span>
                                                            <span className="text-sm font-bold text-red-600 dark:text-red-400 truncate">
                                                                {formatCurrency(spent)}
                                                            </span>
                                                        </div>
                                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-2.5 flex flex-col gap-0.5">
                                                            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">{t('Remaining')}</span>
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
                                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-0.5">
                                                            <span className="truncate">{t('Variance')}: {formatCurrency(monitoring.variance_amount)}</span>
                                                            <span className="font-medium">{Number(monitoring.variance_percentage || 0).toFixed(2)}% {t('Var')}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={BarChart3}
                                    title={t('No Budget Monitoring found')}
                                    description={t('Budget monitoring data will appear here.')}
                                    hasFilters={!!(filters.search || filters.budget_id || filters.date_range)}
                                    onClearFilters={clearFilters}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="p-2.5 border-t bg-gray-50/30 dark:bg-gray-900/30 dark:border-gray-800 sm:px-4 sm:py-3">
                    <Pagination
                        data={budgetMonitorings || { data: [], links: [], meta: {} }}
                        routeName="budget-planner.budget-monitorings.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
