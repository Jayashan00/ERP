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
import { Plus, Edit as EditIcon, Trash2, Eye, Calculator as CalculatorIcon, Download, FileImage, Play, LayoutGrid, FileText, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import WeekMonthSwitcher from '@/components/week-month-switcher';
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BadgeUI from '@/components/badge-ui';
import Create from './Create';
import EditPayroll from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { Payroll, PayrollsIndexProps, PayrollFilters, PayrollModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { payrolls, auth, summary } = usePage<PayrollsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<PayrollFilters>({
        title: urlParams.get('title') || '',
        payroll_frequency: urlParams.get('payroll_frequency') || '',
        status: urlParams.get('status') || '',
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
    const viewMode = 'list';
    const [modalState, setModalState] = useState<PayrollModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Payroll | null>(null);

    const [showFilters, setShowFilters] = useState(false);



    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.payrolls.destroy',
        defaultMessage: t('Are you sure you want to delete this payroll?')
    });

    const handleFilter = () => {
        router.get(route('hrm.payrolls.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, year: selectedYear, month: selectedMonth }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('hrm.payrolls.index'), { ...filters, per_page: perPage, sort: field, direction, year: selectedYear, month: selectedMonth }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            title: '',
            payroll_frequency: '',
            status: '',
        });
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        router.get(route('hrm.payrolls.index'), { per_page: perPage, year: currentYear, month: currentMonth });
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);
        router.get(route('hrm.payrolls.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection, year: selectedYear, month: selectedMonth }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.status || 'all';

    const handleCalendarChange = (dateStr: string, year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);
        router.get(route('hrm.payrolls.index'), {
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

    const openModal = (mode: 'add' | 'edit', data: Payroll | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const runPayroll = (payrollId: number) => {
        router.post(route('hrm.payrolls.run', payrollId));
    };

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            sortable: true,
            render: (value: string, row: Payroll) => {
                const truncatedNotes = row.notes && row.notes.length > 50
                    ? row.notes.substring(0, 50) + '...'
                    : row.notes;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{value}</span>
                        {row.notes && (
                            <span className="text-xs text-muted-foreground mt-0.5" title={row.notes}>
                                {truncatedNotes}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'payroll_frequency',
            header: t('Payroll Frequency'),
            sortable: false,
            render: (value: string) => {
                const frequencyLabels = {
                    weekly: 'Weekly',
                    biweekly: 'Bi-Weekly',
                    monthly: 'Monthly'
                };
                const frequencyColors = {
                    weekly: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
                    biweekly: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20',
                    monthly: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20'
                };
                const label = frequencyLabels[value as keyof typeof frequencyLabels] || value?.charAt(0).toUpperCase() + value?.slice(1) || '-';
                const badgeColor = frequencyColors[value as keyof typeof frequencyColors] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/50';
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeColor}`}>
                        {t(label)}
                    </span>
                );
            }
        },
        {
            key: 'pay_period',
            header: t('Pay Period'),
            sortable: false,
            render: (_: any, payroll: Payroll) => {
                if (payroll.pay_period_start && payroll.pay_period_end) {
                    return (
                        <div className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                            <span>
                                {formatDate(payroll.pay_period_start)} <span className="text-gray-400 mx-1">—</span> {formatDate(payroll.pay_period_end)}
                            </span>
                        </div>
                    );
                }
                return '-';
            }
        },
        {
            key: 'pay_date',
            header: t('Pay Date'),
            type: 'date',
            sortable: false,
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const statusColors = {
                    draft: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20',
                    processing: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
                    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
                    cancelled: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                };
                const label = value?.charAt(0).toUpperCase() + value?.slice(1) || 'Draft';
                return (
                    <BadgeUI className={statusColors[value as keyof typeof statusColors] || 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'}>
                        {t(label)}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'total_net_pay',
            header: t('Total Net Pay'),
            sortable: false,
            render: (value: number) => value ? formatCurrency(value) : '-'
        },
        {
            key: 'employee_count',
            header: t('Employee Count'),
            sortable: false,
            render: (value: number) => value || '-'
        },
        {
            key: 'is_payroll_paid',
            header: t('Payment Status'),
            sortable: false,
            render: (value: string) => {
                const isPaid = value === 'paid';
                return (
                    <BadgeUI className={isPaid
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                        }>
                        {t(isPaid ? 'Paid' : 'Unpaid')}
                    </BadgeUI>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['run-payrolls', 'view-payrolls', 'edit-payrolls', 'delete-payrolls'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-center [&>div]:justify-center',
            render: (_: any, payroll: Payroll) => (
                <div className="flex gap-1 items-center justify-center">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('run-payrolls') && payroll.is_payroll_paid !== 'paid' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => runPayroll(payroll.id)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <Play className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Run Payroll')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-payrolls') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('hrm.payrolls.show', payroll.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-payrolls') && payroll.is_payroll_paid !== 'paid' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', payroll)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-payrolls') && payroll.is_payroll_paid !== 'paid' && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(payroll.id)}
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
                { label: t('HRM'), url: route('hrm.index') },
                { label: t('Payrolls') }
            ]}
            pageTitle={t('Manage Payrolls')}
            pageDescription={t('Manage and process employee payrolls, calculate salaries, and generate payslips.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-payrolls') && (
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
            <Head title={t('Payrolls')} />

            <WeekMonthSwitcher
                mode="month"
                value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
                onChange={handleCalendarChange}
            />

            {/* Main Content Card */}
            <Card className="shadow-sm border border-gray-300 dark:border-zinc-700">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-900/40 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.title}
                                onChange={(value) => setFilters({ ...filters, title: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Payrolls...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="hrm.payrolls.index"
                                filters={{ ...filters, year: selectedYear, month: selectedMonth }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.payroll_frequency].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                <CardContent className="px-2.5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0 sm:px-5">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.total || 0 },
                            { key: 'draft', label: t('Draft'), icon: FileText, count: summary?.draft || 0 },
                            { key: 'processing', label: t('Processing'), icon: Play, count: summary?.processing || 0 },
                            { key: 'completed', label: t('Completed'), icon: CheckCircle2, count: summary?.completed || 0 },
                            { key: 'cancelled', label: t('Cancelled'), icon: XCircle, count: summary?.cancelled || 0 },
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

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-2.5 bg-blue-50/10 dark:bg-zinc-900/10 border-b sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{t('Payroll Frequency')}</label>
                                <Select value={filters.payroll_frequency} onValueChange={(value) => setFilters({ ...filters, payroll_frequency: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Payroll Frequency')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">{t('Weekly')}</SelectItem>
                                        <SelectItem value="biweekly">{t('Bi-Weekly')}</SelectItem>
                                        <SelectItem value="monthly">{t('Monthly')}</SelectItem>
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
                            data={payrolls?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none shadow-none border-0"
                            emptyState={
                                <NoRecordsFound
                                    icon={CalculatorIcon}
                                    title={t('No Payrolls found')}
                                    description={t('Get started by creating your first Payroll.')}
                                    hasFilters={!!(filters.title || filters.payroll_frequency || filters.status)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-payrolls"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Payroll')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 dark:bg-gray-900/20 sm:px-4 sm:py-3">
                    <Pagination
                        data={payrolls || { data: [], links: [], meta: {} }}
                        routeName="hrm.payrolls.index"
                        filters={{ ...filters, per_page: perPage, year: selectedYear, month: selectedMonth }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditPayroll
                        payroll={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View payroll={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Payroll')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
