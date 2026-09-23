import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Calculator as CalculatorIcon, Download, FileImage, LayoutGrid, TrendingDown, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Create from './Create';
import EditChartOfAccount from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { ChartOfAccount, ChartOfAccountsIndexProps, ChartOfAccountFilters, ChartOfAccountModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import RandomBadgeUI from '@/components/random-badge-ui';
import BadgeUI from '@/components/badge-ui';

export default function Index() {
    const { t } = useTranslation();
    const { chartofaccounts, auth, accounttypes, summary } = usePage<ChartOfAccountsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ChartOfAccountFilters>({
        account_code: urlParams.get('account_code') || '',
        account_name: urlParams.get('account_name') || '',
        account_type_id: urlParams.get('account_type_id') || 'all',
        normal_balance: urlParams.get('normal_balance') || 'all',
        is_active: urlParams.get('is_active') || 'all',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<ChartOfAccountModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const [showFilters, setShowFilters] = useState(false);




    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.chart-of-accounts.destroy',
        defaultMessage: t('Are you sure you want to delete this chartofaccount?')
    });

    const quickBooksPageBtn = usePageButtons('quickBooksPageBtn');
    const xeroAccountBtn = usePageButtons('xeroAccountBtn');

    const handleFilter = () => {
        router.get(route('account.chart-of-accounts.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('account.chart-of-accounts.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            account_code: '',
            account_name: '',
            account_type_id: 'all',
            normal_balance: 'all',
            is_active: 'all',
        });
        router.get(route('account.chart-of-accounts.index'), { per_page: perPage });
    };

    const handleNormalBalanceTabChange = (balance: string) => {
        const nextFilters = { ...filters, normal_balance: balance };
        setFilters(nextFilters);
        router.get(route('account.chart-of-accounts.index'), {
            ...nextFilters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection
        }, {
            preserveState: true,
            replace: true
        });
    };

    const openModal = (mode: 'add' | 'edit', data: ChartOfAccount | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'account_name',
            header: t('Account'),
            sortable: true,
            render: (value: any, account: any) => {
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col text-start">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {account.account_name} {account.account_code && ` - ${account.account_code}`}
                            </span>
                            {account.account_type?.name && <RandomBadgeUI name={account.account_type?.name} className="w-fit" />}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'parent_account.account_name',
            header: t('Parent Account'),
            sortable: false,
            render: (value: any, account: any) => {
                return (
                    account.parent_account ? <div className="flex items-center gap-3">
                        <div className="flex flex-col text-start">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {account.parent_account?.account_name} {account.parent_account?.account_code && ` - ${account.parent_account?.account_code}`}
                            </span>
                            {account.parent_account?.account_type?.name && <RandomBadgeUI name={account.parent_account?.account_type?.name} className="w-fit" />}
                        </div>
                    </div> : '-'
                );
            }
        },
        {
            key: 'normal_balance',
            header: t('Normal Balance'),
            sortable: true,
            render: (value: any) => (
                <BadgeUI className={`${value === 'debit' ? 'bg-red-100 text-red-800 ring-red-200' : 'bg-green-100 text-green-800 ring-green-200'}`}>
                    {t(value.charAt(0).toUpperCase() + value.slice(1))}
                </BadgeUI>
            )
        },
        {
            key: 'opening_balance',
            header: t('Opening Balance'),
            sortable: false,
            render: (value: number) => (
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {formatCurrency(value)}
                </span>
            )
        },
        {
            key: 'current_balance',
            header: t('Current Balance'),
            sortable: true,
            render: (value: number) => (
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {formatCurrency(value)}
                </span>
            )
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={`${value ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-red-100 text-red-800 ring-red-200'}`}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-chart-of-accounts', 'delete-chart-of-accounts'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, chartofaccount: ChartOfAccount) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-chart-of-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('account.chart-of-accounts.show', chartofaccount.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-chart-of-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', chartofaccount)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('delete-chart-of-accounts') && chartofaccount.is_system_account == 0 && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(chartofaccount.id)}
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
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Chart Of Accounts') }
            ]}
            pageTitle={t('Manage Chart Of Accounts')}
            pageDescription={t('Manage and organize your general ledger accounts, parent accounts, and normal balances.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {xeroAccountBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {quickBooksPageBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('create-chart-of-accounts') && (
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
                </div>
            }
        >
            <Head title={t('Chart Of Accounts')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.account_code}
                                onChange={(value) => setFilters({ ...filters, account_code: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Chart Of Accounts...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">

                            <PerPageSelector
                                routeName="account.chart-of-accounts.index"
                                filters={{ ...filters }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [
                                        filters.account_type_id !== 'all' ? filters.account_type_id : '',
                                        filters.normal_balance !== 'all' ? filters.normal_balance : '',
                                        filters.is_active !== 'all' ? filters.is_active : ''
                                    ].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Normal Balance Status Tabs */}
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.total || 0 },
                            { key: 'debit', label: t('Debit'), icon: TrendingDown, count: summary?.debit || 0 },
                            { key: 'credit', label: t('Credit'), icon: TrendingUp, count: summary?.credit || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleNormalBalanceTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${filters.normal_balance === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
                                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${filters.normal_balance === tab.key
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
                    <CardContent className="p-2.5 bg-blue-50/30 border-b sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Account Type')}</label>
                                <Select value={filters.account_type_id} onValueChange={(value) => setFilters({ ...filters, account_type_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Account Types')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Account Types')}</SelectItem>
                                        {accounttypes?.map((account_type: any) => (
                                            <SelectItem key={account_type.id} value={account_type.id.toString()}>
                                                {account_type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.is_active} onValueChange={(value) => setFilters({ ...filters, is_active: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Status')}</SelectItem>
                                        <SelectItem value="1">{t('Active')}</SelectItem>
                                        <SelectItem value="0">{t('Inactive')}</SelectItem>
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

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={chartofaccounts?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={CalculatorIcon}
                                        title={t('No Chart Of Accounts found')}
                                        description={t('Get started by creating your first Chart Of Account.')}
                                        hasFilters={!!(filters.account_code || filters.account_name || (filters.account_type_id !== 'all' && filters.account_type_id) || filters.normal_balance || filters.is_active)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-chart-of-accounts"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create ChartOfAccount')}
                                        className="h-auto"
                                    />
                                }
                            />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30">
                    <Pagination
                        data={chartofaccounts || { data: [], links: [], meta: {} }}
                        routeName="account.chart-of-accounts.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditChartOfAccount
                        chartofaccount={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>



            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete ChartOfAccount')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
