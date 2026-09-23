import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Eye, Trash2, FileText, CheckCircle, GitCompare, Calendar, Download, Search, LayoutGrid, Clock, CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

import NoRecordsFound from '@/components/no-records-found';
import Generate from './Generate';
import YearEndClose from './YearEndClose';
import { BalanceSheet, BalanceSheetsIndexProps, BalanceSheetFilters } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { balanceSheets, summary, auth } = usePage<BalanceSheetsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<BalanceSheetFilters>({
        financial_year: urlParams.get('financial_year') || '',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || 'balance_sheet_date');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showYearEndModal, setShowYearEndModal] = useState(false);

    const activeTab = filters.status || 'all';

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'double-entry.balance-sheets.destroy',
        defaultMessage: t('Are you sure you want to delete this balance sheet?')
    });

    const handleFilter = () => {
        router.get(route('double-entry.balance-sheets.list'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('double-entry.balance-sheets.list'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);

        router.get(route('double-entry.balance-sheets.list'), {
            ...newFilters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            financial_year: '',
            status: '',
        });
        router.get(route('double-entry.balance-sheets.list'), {per_page: perPage, sort: sortField, direction: sortDirection});
    };

    const handleFinalize = (id: number) => {
        router.post(route('double-entry.balance-sheets.finalize', id), {}, {
            preserveState: true,
            onSuccess: () => {
                // Success message will be handled by flash messages
            }
        });
    };

    const tableColumns = [
        {
            key: 'balance_sheet_date',
            header: t('Date'),
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(value)}</span>
                </div>
            )
        },
        {
            key: 'financial_year',
            header: t('Financial Year'),
            sortable: true,
            render: (value: string) => (
                <RandomBadgeUI name={value} />
            )
        },
        {
            key: 'total_assets',
            header: t('Total Assets'),
            sortable: false,
            render: (value: number) => (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                    {formatCurrency(value)}
                </span>
            )
        },
        {
            key: 'total_liabilities',
            header: t('Total Liabilities'),
            sortable: false,
            render: (value: number) => (
                <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                    {formatCurrency(value)}
                </span>
            )
        },
        {
            key: 'total_equity',
            header: t('Total Equity'),
            sortable: false,
            render: (value: number) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm tabular-nums">
                    {formatCurrency(value)}
                </span>
            )
        },
        {
            key: 'is_balanced',
            header: t('Balanced'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={value 
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/30' 
                    : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-900/30'
                }>
                    {t(value ? 'Yes' : 'No')}
                </BadgeUI>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string) => (
                <BadgeUI className={value === 'finalized' 
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/30' 
                    : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-900/30'
                }>
                    {t(value === 'finalized' ? 'Finalized' : 'Draft')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-balance-sheets', 'print-balance-sheets', 'finalize-balance-sheets', 'delete-balance-sheets'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, balanceSheet: BalanceSheet) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                    {auth.user?.permissions?.includes('finalize-balance-sheets') && balanceSheet.status === 'draft' && balanceSheet.is_balanced && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleFinalize(balanceSheet.id)}
                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Finalize')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('print-balance-sheets') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const printUrl = route('double-entry.balance-sheets.print', balanceSheet.id) + '?download=pdf';
                                            window.open(printUrl, '_blank');
                                        }}
                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Download PDF')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-balance-sheets') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.get(route('double-entry.balance-sheets.show', balanceSheet.id))}
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
                        {auth.user?.permissions?.includes('delete-balance-sheets') && balanceSheet.status === 'draft' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(balanceSheet.id)}
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
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Double Entry')},
                {label: t('Balance Sheets')}
            ]}
            pageTitle={t('Balance Sheets')}
            pageDescription={t('Track and view organization assets, liabilities, and equity balances over time.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-balance-sheet-comparisons') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('double-entry.balance-sheets.comparisons'))}>
                                        <GitCompare className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View Comparisons')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('year-end-close') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setShowYearEndModal(true)}>
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Year-End Close')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-balance-sheets') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => setShowGenerateModal(true)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Generate Balance Sheet')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Balance Sheets')} />

            <Card className="shadow-sm border-gray-200/50 dark:border-zinc-800/50">
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-zinc-900/10 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.financial_year || ''}
                                onChange={(value) => setFilters({...filters, financial_year: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by financial year...')}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="double-entry.balance-sheets.list"
                                filters={filters}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Status Tabs */}
                <CardContent className="px-2.5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0 sm:px-5">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.total || 0 },
                            { key: 'draft', label: t('Draft'), icon: Clock, count: summary?.draft || 0 },
                            { key: 'finalized', label: t('Finalized'), icon: CheckCircle2, count: summary?.finalized || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
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

                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <DataTable
                            data={balanceSheets?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none border-0 shadow-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={FileText}
                                    title={t('No Balance Sheets found')}
                                    description={t('Get started by generating your first balance sheet.')}
                                    hasFilters={!!(filters.financial_year || filters.status)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-balance-sheets"
                                    onCreateClick={() => setShowGenerateModal(true)}
                                    createButtonText={t('Generate Balance Sheet')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                <CardContent className="p-2.5 border-t bg-gray-50/30 dark:bg-zinc-900/10 sm:px-4 sm:py-3">
                    <Pagination
                        data={balanceSheets || { data: [], links: [], meta: {} }}
                        routeName="double-entry.balance-sheets.list"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Balance Sheet')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />

            <Generate
                open={showGenerateModal}
                onOpenChange={setShowGenerateModal}
            />

            <YearEndClose
                open={showYearEndModal}
                onOpenChange={setShowYearEndModal}
            />
        </AuthenticatedLayout>
    );
}
