import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import WeekMonthSwitcher from '@/components/week-month-switcher';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Eye, CheckCircle, DollarSign, LayoutGrid, FileText, Play, CheckCircle2, Calendar, UserIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import RandomBadgeUI from "@/components/random-badge-ui";
import UserColumn from '@/components/user-column';

import NoRecordsFound from '@/components/no-records-found';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import Create from './Create';
import EditExpense from './Edit';
import View from './View';

interface Expense {
    id: number;
    expense_number: string;
    expense_date: string;
    category: { id: number; category_name: string };
    bank_account: { id: number; account_name: string };
    chart_of_account?: { id: number; account_code: string; account_name: string };
    amount: string;
    reference_number: string;
    status: 'draft' | 'approved' | 'posted';
    approved_by: { id: number; name: string, email: string, avatar: string } | null;
    created_at: string;
}

interface Category {
    id: number;
    category_name: string;
}

interface BankAccount {
    id: number;
    account_name: string;
}

interface ChartOfAccount {
    id: number;
    account_code: string;
    account_name: string;
}

interface ExpenseFilters {
    search: string;
    category_id: string;
    status: string;
    bank_account_id: string;
}

interface ExpenseIndexProps {
    expenses: {
        data: Expense[];
        meta?: any;
    };
    categories: Category[];
    bankAccounts: BankAccount[];
    chartOfAccounts: ChartOfAccount[];
    summary: {
        total: number;
        draft: number;
        approved: number;
        posted: number;
    };
    filters?: ExpenseFilters;
    auth: any;
}

export default function Index() {
    const { t } = useTranslation();
    const { expenses, categories, bankAccounts, chartOfAccounts, filters: initialFilters, summary, auth } = usePage<ExpenseIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ExpenseFilters>({
        search: initialFilters?.search || '',
        category_id: initialFilters?.category_id || '',
        status: initialFilters?.status || '',
        bank_account_id: initialFilters?.bank_account_id || ''
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
    const [sortField, setSortField] = useState(urlParams.get('sort') || 'created_at');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [showFilters, setShowFilters] = useState(false);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: string;
        data: Expense | null;
    }>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [editingItem, setEditingItem] = useState<Expense | null>(null);
    const [viewingItem, setViewingItem] = useState<Expense | null>(null);

    const openModal = (mode: string, data: Expense | null = null) => {
        setModalState({
            isOpen: true,
            mode,
            data
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    };

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.expenses.destroy',
        defaultMessage: t('Are you sure you want to delete this expense?')
    });

    const handleFilter = () => {
        router.get(route('account.expenses.index'), {
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

        router.get(route('account.expenses.index'), {
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
        setFilters({ search: '', category_id: '', status: '', bank_account_id: '' });
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        router.get(route('account.expenses.index'), {
            per_page: perPage,
            year: currentYear,
            month: currentMonth
        });
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);

        router.get(route('account.expenses.index'), {
            ...newFilters,
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

    const handleCalendarChange = (dateStr: string, year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);

        router.get(route('account.expenses.index'), {
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

    const activeTab = filters.status || 'all';

    const tableColumns = [
        {
            key: 'expense_number',
            header: t('Expense'),
            sortable: true,
            render: (value: string, expense: Expense) =>
                auth.user?.permissions?.includes('view-expenses') ? (
                    <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900 whitespace-nowrap"
                        onClick={() => setViewingItem(expense)}
                    >
                        {value}
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 whitespace-nowrap">
                        {value}
                    </span>
                )
        },
        {
            key: 'expense_date',
            header: t('Date'),
            type: 'date',
            sortable: true
        },
        {
            key: 'category.category_name',
            header: t('Category'),
            render: (value: any, row: Expense) => row.category?.category_name ? <RandomBadgeUI name={row.category?.category_name} /> : '-'
        },
        {
            key: 'bank_account.account_name',
            header: t('Chart of Account / Bank'),
            render: (value: any, row: Expense) => (
                <div className="flex flex-col gap-1 items-start">
                    {row.chart_of_account && (
                        <span className="">
                            {row.chart_of_account.account_code} - {row.chart_of_account.account_name}
                        </span>
                    )}
                    {row.bank_account?.account_name ? (
                        <RandomBadgeUI name={row.bank_account.account_name} />
                    ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                    )}
                </div>
            )
        },
        {
            key: 'amount',
            header: t('Amount'),
            sortable: true,
            render: (value: string) => formatCurrency(value)
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: string) => {
                const statusColors = {
                    draft: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20',
                    approved: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
                    posted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                };
                const label = value?.charAt(0).toUpperCase() + value?.slice(1) || 'Draft';
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[value as keyof typeof statusColors] || 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}`}>
                        {t(label)}
                    </span>
                );
            }
        },
        {
            key: 'approved_by.name',
            header: t('Approved By'),
            render: (value: any, row: any) => row.approved_by ? <UserColumn user={row.approved_by} /> : t('-')
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, expense: Expense) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {expense.status === 'draft' && auth.user.permissions.includes('approve-expenses') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('account.expenses.approve', expense.id))} className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Approve')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {expense.status === 'approved' && auth.user.permissions.includes('post-expenses') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.post(route('account.expenses.post', expense.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Post')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user.permissions.includes('view-expenses') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(expense)} className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {expense.status === 'draft' && (
                            <>
                                {auth.user.permissions.includes('edit-expenses') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(expense)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Edit')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {auth.user.permissions.includes('delete-expenses') && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(expense.id)} className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('Delete')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </>
                        )}
                    </TooltipProvider>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Expenses') }
            ]}
            pageTitle={t('Manage Expenses')}
            pageDescription={t('Track and manage all business expenses, approve draft transactions, and post them to journal entries.')}
            pageActions={
                auth.user.permissions.includes('create-expenses') && (
                    <TooltipProvider>
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
                    </TooltipProvider>
                )
            }
        >
            <Head title={t('Expenses')} />

            <WeekMonthSwitcher
                mode="month"
                value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
                onChange={handleCalendarChange}
            />

            <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-900/40 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search expenses...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="account.expenses.index"
                                filters={{ ...filters, year: selectedYear, month: selectedMonth }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.category_id, filters.bank_account_id].filter(Boolean).length;
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
                            { key: 'draft', label: t('Draft'), icon: FileText, count: summary?.draft || 0 },
                            { key: 'approved', label: t('Approved'), icon: Play, count: summary?.approved || 0 },
                            { key: 'posted', label: t('Posted'), icon: CheckCircle2, count: summary?.posted || 0 },
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Category')}</label>
                                <Select value={filters.category_id} onValueChange={(value) => setFilters({ ...filters, category_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by category')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {auth.user?.permissions?.includes('manage-bank-accounts') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Bank Account')}</label>
                                    <Select value={filters.bank_account_id} onValueChange={(value) => setFilters({ ...filters, bank_account_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('Filter by bank account')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id.toString()}>
                                                    {account.account_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
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
                                data={expenses.data || expenses}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={DollarSign}
                                        title={t('No expenses found')}
                                        description={t('Get started by creating your first expense.')}
                                        hasFilters={!!(filters.search || filters.category_id || filters.status || filters.bank_account_id)}
                                        onClearFilters={clearFilters}
                                        onCreateClick={auth.user.permissions.includes('create-expenses') ? () => openModal('add') : undefined}
                                        createButtonText={t('Create Expense')}
                                        className="h-auto"
                                    />
                                }
                            />
                    </div>
                </CardContent>

                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30 dark:bg-gray-900/20">
                    <Pagination
                        data={expenses}
                        routeName="account.expenses.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create
                        categories={categories}
                        bankAccounts={bankAccounts}
                        chartOfAccounts={chartOfAccounts}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
                {editingItem && (
                    <EditExpense
                        expense={editingItem}
                        categories={categories}
                        bankAccounts={bankAccounts}
                        chartOfAccounts={chartOfAccounts}
                        onSuccess={() => setEditingItem(null)}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View expense={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Expense')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
