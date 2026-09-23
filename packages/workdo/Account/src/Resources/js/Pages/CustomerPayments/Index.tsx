import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import WeekMonthSwitcher from '@/components/week-month-switcher';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog } from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Eye, Trash2, CheckCircle, Plus, CreditCard, X, User as UserIcon, Calendar, LayoutGrid, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

import { formatCurrency, formatDate, getImagePath } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import NoRecordsFound from '@/components/no-records-found';
import { CustomerPaymentsIndexProps, CustomerPayment } from './types';
import GenerateAvatar from '@/components/generate-avatar';
import RandomBadgeUI from '@/components/random-badge-ui';
import UserColumn from '@/components/user-column';

interface CustomerPaymentFilters {
    search: string;
    customer_id: string;
    status: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { payments, customers, bankAccounts, filters: initialFilters, summary, auth } = usePage<CustomerPaymentsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CustomerPaymentFilters>({
        search: initialFilters?.search || '',
        customer_id: initialFilters?.customer_id || '',
        status: initialFilters?.status || '',
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

    const activeTab = filters.status || 'all';

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.customer-payments.destroy',
        defaultMessage: t('Are you sure you want to delete this payment?')
    });

    const getStatusBadgeClasses = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50';
            case 'cleared': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50';
            default: return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
        }
    };

    const handleFilter = () => {
        router.get(route('account.customer-payments.index'), {
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
        router.get(route('account.customer-payments.index'), {
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
        setFilters({ search: '', customer_id: '', status: '' });
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        router.get(route('account.customer-payments.index'), {
            per_page: perPage,
            year: currentYear,
            month: currentMonth
        });
    };

    const handleCalendarChange = (dateStr: string, year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);

        router.get(route('account.customer-payments.index'), {
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

    const handleStatusUpdate = (paymentId: number, status: string) => {
        router.patch(route('account.customer-payments.update-status', paymentId), { status });
    };

    const handleStatusTabChange = (status: string) => {
        const nextFilters = { ...filters, status: status === 'all' ? '' : status };
        setFilters(nextFilters);
        router.get(route('account.customer-payments.index'), {
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
            key: 'payment_number',
            header: t('Payment Number'),
            sortable: true,
            render: (value: string) =>
                <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800">
                    {value}
                </BadgeUI>
        },
        {
            key: 'customer',
            header: t('Customer'),
            render: (value: any) => <UserColumn user={value} />
        },
        {
            key: 'payment_date',
            header: t('Payment Date'),
            sortable: true,
            type: 'date'
        },
        {
            key: 'payment_amount',
            header: t('Amount'),
            sortable: true,
            render: (value: number) => <span className="font-semibold text-gray-900 text-sm">{formatCurrency(parseFloat(value.toString()))}</span>
        },
        {
            key: 'bank_account',
            header: t('Bank Account'),
            render: (value: any) => <RandomBadgeUI name={value?.account_name || '-'} />
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
        ...(auth.user?.permissions?.some((p: string) => ['view-customer-payments', 'cleared-customer-payments', 'delete-customer-payments'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, payment: CustomerPayment) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {payment.status === 'pending' && auth.user?.permissions?.includes('cleared-customer-payments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStatusUpdate(payment.id, 'cleared')}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Mark as Cleared')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {payment.status === 'pending' && auth.user?.permissions?.includes('cleared-customer-payments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleStatusUpdate(payment.id, 'cancelled')}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Cancel Payment')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-customer-payments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('account.customer-payments.show', payment.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {payment.status === 'pending' && auth.user?.permissions?.includes('delete-customer-payments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(payment.id)}
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
                { label: t('Customer Payments') }
            ]}
            pageTitle={t('Manage Customer Payments')}
            pageDescription={t('Manage and keep track of all customer payments, invoice allocations, and outstanding balances.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-customer-payments') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button size="sm" onClick={() => router.visit(route('account.customer-payments.create'))}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('Create Payment')}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            }
        >
            <Head title={t('Customer Payments')} />

            <WeekMonthSwitcher
                mode="month"
                value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
                onChange={handleCalendarChange}
            />

            <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-900/40 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.search || ''}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by payment number...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <PerPageSelector
                                routeName="account.customer-payments.index"
                                filters={{ ...filters, year: selectedYear, month: selectedMonth }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer_id, filters.status].filter(Boolean).length;
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
                            { key: 'pending', label: t('Pending'), icon: Clock, count: summary?.pending || 0 },
                            { key: 'cleared', label: t('Cleared'), icon: CheckCircle2, count: summary?.cleared || 0 },
                            { key: 'cancelled', label: t('Cancelled'), icon: XCircle, count: summary?.cancelled || 0 },
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
                    <CardContent className="p-2.5 bg-blue-50/30 border-b sm:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Customer')}</label>
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
                                data={payments.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={CreditCard}
                                        title={t('No payments found')}
                                        description={t('Get started by creating your first customer payment.')}
                                        hasFilters={!!(filters.search || filters.customer_id || filters.status)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-customer-payments"
                                        onCreateClick={() => router.visit(route('account.customer-payments.create'))}
                                        createButtonText={t('Create Payment')}
                                        className="h-auto"
                                    />
                                }
                            />
                    </div>
                </CardContent>

                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30">
                    <Pagination
                        data={{ ...payments, ...payments.meta }}
                        routeName="account.customer-payments.index"
                        filters={{ ...filters, per_page: perPage, year: selectedYear, month: selectedMonth }}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Payment')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
