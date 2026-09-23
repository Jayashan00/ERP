import { useState, useRef, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Play, Eye, ArrowRightLeft, Check, LoaderCircle, AlertTriangle, MoreVertical, Landmark, Calendar, LayoutGrid, X, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { DateRangePicker } from '@/components/ui/date-range-picker';

import Create from './Create';
import Edit from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { BankTransfer, BankTransfersIndexProps, BankTransferFilters, BankTransferModalState } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';

const DescriptionText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        const checkClamp = () => {
            const el = textRef.current;
            if (el) {
                setIsClamped(el.scrollHeight > el.clientHeight);
            }
        };

        const timer = setTimeout(checkClamp, 50);
        window.addEventListener('resize', checkClamp);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkClamp);
        };
    }, [text]);

    if (!text) {
        return <p className="text-zinc-500 text-sm text-start">{t('No description provided')}</p>;
    }

    return (
        <div className="space-y-0.5 text-start">
            <p
                ref={textRef}
                className={`text-xs text-start break-words whitespace-pre-line ${isExpanded ? '' : 'line-clamp-2'
                    }`}
            >
                {text}
            </p>
            {(isClamped || isExpanded) && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary focus:outline-none animate-fade-in"
                >
                    {isExpanded ? t('Show Less') : t('Show More')}
                </button>
            )}
        </div>
    );
};

export default function Index() {
    const { t } = useTranslation();
    const { banktransfers = [], auth, bankaccounts = [], summary } = usePage<BankTransfersIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<BankTransferFilters>({
        transfer_number: urlParams.get('transfer_number') || '',
        status: urlParams.get('status') || '',
        from_account_id: urlParams.get('from_account_id') || '',
        to_account_id: urlParams.get('to_account_id') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })()
    });

    const [activeTab, setActiveTab] = useState(filters.status || 'all');

    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [modalState, setModalState] = useState<BankTransferModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const [showFilters, setShowFilters] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [viewingTransfer, setViewingTransfer] = useState<BankTransfer | null>(null);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.bank-transfers.destroy',
        defaultMessage: t('Are you sure you want to delete this bank transfer?')
    });

    const handleFilter = () => {
        const filterParams: any = { ...filters };
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        } else {
            filterParams.date_from = '';
            filterParams.date_to = '';
        }
        delete filterParams.date_range;

        router.get(route('account.bank-transfers.index'), { ...filterParams, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        const filterParams: any = { ...filters };
        if (filters.date_range) {
            const [fromDate, toDate] = filters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        } else {
            filterParams.date_from = '';
            filterParams.date_to = '';
        }
        delete filterParams.date_range;

        router.get(route('account.bank-transfers.index'), { ...filterParams, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (tabKey: string) => {
        setActiveTab(tabKey);
        const nextStatus = tabKey === 'all' ? '' : tabKey;
        const nextFilters = { ...filters, status: nextStatus };
        setFilters(nextFilters);

        const filterParams: any = { ...nextFilters };
        if (nextFilters.date_range) {
            const [fromDate, toDate] = nextFilters.date_range.split(' - ');
            filterParams.date_from = fromDate;
            filterParams.date_to = toDate;
        } else {
            filterParams.date_from = '';
            filterParams.date_to = '';
        }
        delete filterParams.date_range;

        router.get(route('account.bank-transfers.index'), {
            ...filterParams,
            sort: sortField,
            direction: sortDirection
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            transfer_number: '',
            status: '',
            from_account_id: '',
            to_account_id: '',
            date_range: '',
        });
        setActiveTab('all');
        router.get(route('account.bank-transfers.index'), {
            sort: sortField,
            direction: sortDirection,
            transfer_number: '',
            status: '',
            from_account_id: '',
            to_account_id: '',
            date_from: '',
            date_to: '',
        });
    };

    const openModal = (mode: 'add' | 'edit', data: BankTransfer | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const handleProcess = (transfer: BankTransfer) => {
        setProcessingId(transfer.id);
        router.post(route('account.bank-transfers.process', transfer.id), {}, {
            onFinish: () => setProcessingId(null)
        });
    };

    const groupedTransfers = (banktransfers || []).reduce((groups: { [key: string]: BankTransfer[] }, transfer) => {
        const dateKey = formatDate(transfer.transfer_date);
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(transfer);
        return groups;
    }, {});

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Banking') },
                { label: t('Bank Transfers') }
            ]}
            pageTitle={t('Manage Bank Transfers')}
            pageDescription={t('Track and manage transfers between different bank accounts.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-bank-transfers') && (
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
            <Head title={t('Bank Transfers')} />

            <Card className="shadow-sm">
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.transfer_number}
                                onChange={(value) => setFilters({ ...filters, transfer_number: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by transfer number or reference...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.from_account_id, filters.to_account_id, filters.date_range].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            { key: 'all', label: t('All Transfers'), icon: LayoutGrid, count: summary?.all || 0 },
                            { key: 'pending', label: t('Pending'), icon: LoaderCircle, count: summary?.pending || 0 },
                            { key: 'completed', label: t('Completed'), icon: Check, count: summary?.completed || 0 },
                            { key: 'failed', label: t('Failed'), icon: AlertTriangle, count: summary?.failed || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <tab.icon className={`h-4 w-4 flex-shrink-0`} />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('From Account')}</label>
                                <Select value={filters.from_account_id} onValueChange={(value) => setFilters({ ...filters, from_account_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by From Account')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankaccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.account_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('To Account')}</label>
                                <Select value={filters.to_account_id} onValueChange={(value) => setFilters({ ...filters, to_account_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by To Account')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankaccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.account_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Date Range')}</label>
                                <div className="w-full">
                                    <DateRangePicker
                                        value={filters.date_range}
                                        onChange={(value) => setFilters({ ...filters, date_range: value })}
                                        placeholder={t('Select date range')}
                                    />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm" className="w-full sm:w-auto">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm" className="w-full sm:w-auto">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-3 sm:p-6 overflow-y-auto max-h-[75vh] pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                    {Object.keys(groupedTransfers).length > 0 ? (
                        <div className="space-y-6">
                            {Object.keys(groupedTransfers).map((dateKey) => (
                                <div key={dateKey} className="space-y-4">
                                    {/* Date Header Indicator */}
                                    <div className="flex items-center gap-4">
                                        <BadgeUI className="flex items-center gap-2" icon={Calendar}>
                                            {dateKey}
                                        </BadgeUI>
                                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                                    </div>

                                    {/* Timeline block for this date */}
                                    <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-2 pl-4 sm:ml-4 sm:pl-6 space-y-4 py-2">
                                        {groupedTransfers[dateKey].map((transfer) => {
                                            return (
                                                <div key={transfer.id} className="relative group">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[27px] sm:-left-[35px] top-3.5 w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${transfer.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                        : transfer.status === 'failed'
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                                        }`}>
                                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                                    </div>

                                                    {/* Timeline Card */}
                                                    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl p-0 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-0">
                                                        {/* Card Header: Transaction IDs & Actions */}
                                                        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 sm:px-5">
                                                            <div className="flex items-center gap-3 flex-wrap text-xs">
                                                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                    <span className="font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{t('Transfer No')}:</span>
                                                                    <RandomBadgeUI name={transfer.transfer_number} />
                                                                </div>
                                                                {transfer.reference_number && (
                                                                    <>
                                                                        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
                                                                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                                            <span className="font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{t('Reference No')}:</span>
                                                                            <RandomBadgeUI name={transfer.reference_number} />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Action Buttons */}
                                                            {transfer.status === 'pending' && (
                                                                <div className="flex items-center gap-1">
                                                                    {auth.user?.permissions?.includes('process-bank-transfers') && (
                                                                        <TooltipProvider>
                                                                            <Tooltip delayDuration={0}>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                                                        onClick={() => handleProcess(transfer)}
                                                                                        disabled={processingId === transfer.id}
                                                                                    >
                                                                                        <Play className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>{t('Process')}</TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                    {auth.user?.permissions?.includes('edit-bank-transfers') && (
                                                                        <TooltipProvider>
                                                                            <Tooltip delayDuration={0}>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                                                        onClick={() => openModal('edit', transfer)}
                                                                                    >
                                                                                        <EditIcon className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>{t('Edit')}</TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                    {auth.user?.permissions?.includes('delete-bank-transfers') && (
                                                                        <TooltipProvider>
                                                                            <Tooltip delayDuration={0}>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                                                                        onClick={() => openDeleteDialog(transfer.id)}
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>{t('Delete')}</TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Row 1: Flow and Details */}
                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-5">
                                                            {/* Left side: From -> Progress Bridge -> To Accounts */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-2 sm:gap-4 flex-grow">
                                                                {/* From Account */}
                                                                <div className="flex items-center gap-3 min-w-0 sm:flex-shrink-0">
                                                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                                                        <Landmark className="w-6 h-6" />
                                                                    </div>
                                                                    <div className="flex flex-col text-start min-w-0 sm:min-w-[170px] max-w-full sm:max-w-[350px]">
                                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                                                                            {transfer.from_account.account_name}
                                                                        </span>
                                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                                            {transfer.from_account.account_number ? transfer.from_account.account_number : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Progress Connection Bridge - Horizontal (sm and up) */}
                                                                <div className="hidden sm:flex flex-col items-center justify-center flex-grow min-w-[120px] lg:min-w-[160px] px-4 relative">
                                                                    {/* Status text label above the line */}
                                                                    <span className={`text-[9px] sm:text-[10px] font-bold capitalize tracking-wider mb-1 ${transfer.status === 'completed'
                                                                        ? 'text-emerald-600 dark:text-emerald-400 text-end w-full'
                                                                        : transfer.status === 'failed'
                                                                            ? 'text-rose-600 dark:text-rose-400'
                                                                            : processingId === transfer.id
                                                                                ? 'text-primary animate-pulse'
                                                                                : 'text-amber-600 dark:text-amber-400'
                                                                        }`}>
                                                                        {processingId === transfer.id ? t('Processing') : t(transfer.status)}
                                                                    </span>

                                                                    <div className={`relative w-full flex items-center ${transfer.status === 'completed' ? 'justify-end' : 'justify-center'}`}>
                                                                        {/* Connecting Line */}
                                                                        <div className="absolute inset-x-0 h-0.5 bg-zinc-100 dark:bg-zinc-850 -z-0">
                                                                            <div className={`h-full transition-all duration-500 rounded-full ${transfer.status === 'completed'
                                                                                ? 'w-full bg-emerald-500 dark:bg-emerald-600'
                                                                                : transfer.status === 'failed'
                                                                                    ? 'w-1/2 bg-rose-500'
                                                                                    : processingId === transfer.id
                                                                                        ? 'w-1/2 bg-primary'
                                                                                        : 'w-1/2 bg-amber-400'
                                                                                }`} />
                                                                        </div>

                                                                        {/* Status Circle Node */}
                                                                        <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${transfer.status === 'completed'
                                                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                            : transfer.status === 'failed'
                                                                                ? 'bg-rose-500 border-rose-500 text-white'
                                                                                : processingId === transfer.id
                                                                                    ? 'bg-white dark:bg-zinc-900 border-primary text-primary'
                                                                                    : 'bg-white dark:bg-zinc-900 border-amber-400 text-amber-500'
                                                                            }`}>
                                                                            {transfer.status === 'completed' && <Check className="w-3 h-3 stroke-[3]" />}
                                                                            {transfer.status === 'failed' && <X className="w-3 h-3 stroke-[3]" />}
                                                                            {transfer.status === 'pending' && processingId !== transfer.id && <Clock className="w-3.5 h-3.5" />}
                                                                            {processingId === transfer.id && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Progress Connection Bridge - Vertical (below sm) */}
                                                                <div className="flex sm:hidden flex-row items-center gap-3 py-1 relative">
                                                                    {/* Vertical Line */}
                                                                    <div className="absolute left-[23px] top-[-12px] bottom-[-12px] w-0.5 bg-zinc-100 dark:bg-zinc-850 -z-0">
                                                                        <div className={`w-full transition-all duration-500 rounded-full ${transfer.status === 'completed'
                                                                            ? 'h-full bg-emerald-500 dark:bg-emerald-600'
                                                                            : transfer.status === 'failed'
                                                                                ? 'h-1/2 bg-rose-500'
                                                                                : processingId === transfer.id
                                                                                    ? 'h-1/2 bg-primary'
                                                                                    : 'h-1/2 bg-amber-400'
                                                                            }`} />
                                                                    </div>

                                                                    {/* Status Circle Node */}
                                                                    <div className={`relative z-10 w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm flex-shrink-0 ${transfer.status === 'completed'
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                        : transfer.status === 'failed'
                                                                            ? 'bg-rose-500 border-rose-500 text-white'
                                                                            : processingId === transfer.id
                                                                                ? 'bg-white dark:bg-zinc-900 border-primary text-primary'
                                                                                : 'bg-white dark:bg-zinc-900 border-amber-400 text-amber-500'
                                                                        }`}>
                                                                        {transfer.status === 'completed' && <Check className="w-5 h-5 stroke-[3]" />}
                                                                        {transfer.status === 'failed' && <X className="w-5 h-5 stroke-[3]" />}
                                                                        {transfer.status === 'pending' && processingId !== transfer.id && <Clock className="w-5 h-5" />}
                                                                        {processingId === transfer.id && <LoaderCircle className="w-5 h-5 animate-spin" />}
                                                                    </div>

                                                                    {/* Status text label */}
                                                                    <span className={`text-[11px] font-bold capitalize tracking-wider ${transfer.status === 'completed'
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : transfer.status === 'failed'
                                                                            ? 'text-rose-600 dark:text-rose-400'
                                                                            : processingId === transfer.id
                                                                                ? 'text-primary animate-pulse'
                                                                                : 'text-amber-600 dark:text-amber-400'
                                                                        }`}>
                                                                        {processingId === transfer.id ? t('Processing') : t(transfer.status)}
                                                                    </span>
                                                                </div>

                                                                {/* To Account */}
                                                                <div className="flex items-center gap-3 min-w-0 sm:flex-shrink-0">
                                                                    <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                                                                        <Landmark className="w-6 h-6" />
                                                                    </div>
                                                                    <div className="flex flex-col text-start min-w-0 sm:min-w-[170px] max-w-full sm:max-w-[350px]">
                                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                                                                            {transfer.to_account.account_name}
                                                                        </span>
                                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                                            {transfer.to_account.account_number ? transfer.to_account.account_number : ''}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Right side: Amount, Status, Actions */}
                                                            <div className="flex items-center justify-between lg:justify-end gap-5 border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto border-zinc-200 dark:border-zinc-800">
                                                                {/* Mobile-only Key-Value List */}
                                                                <div className="flex flex-col w-full lg:hidden gap-1.5 text-xs">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <span className="text-zinc-500 dark:text-zinc-400">{t('Amount')}</span>
                                                                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatCurrency(transfer.transfer_amount)}</span>
                                                                    </div>
                                                                    {Number(transfer.transfer_charges) != 0 && (
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-zinc-500 dark:text-zinc-400">{t('Charges')}</span>
                                                                            <span className="text-zinc-600 dark:text-zinc-400">+{formatCurrency(transfer.transfer_charges)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center justify-between gap-4 border-t border-zinc-150 dark:border-zinc-800 pt-1.5 mt-0.5">
                                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-350">{t('Total Transfer')}</span>
                                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                                                            {formatCurrency(Number(transfer.transfer_amount) + Number(transfer.transfer_charges))}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Desktop-only Stacked Invoice Style */}
                                                                <div className="hidden lg:flex flex-col items-end text-right lg:w-auto">
                                                                    {Number(transfer.transfer_charges) != 0 &&
                                                                        <>
                                                                            <div className="text-[13px] font-medium text-zinc-650 dark:text-zinc-350">
                                                                                {formatCurrency(transfer.transfer_amount)}
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-0.5 mb-0.5">
                                                                                + {t('Charges')}: {formatCurrency(transfer.transfer_charges)}
                                                                            </div>
                                                                        </>
                                                                    }
                                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                                                                        {formatCurrency(Number(transfer.transfer_amount) + Number(transfer.transfer_charges))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Description */}
                                                        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 sm:px-5 bg-zinc-50/50 dark:bg-zinc-850/10">
                                                            <DescriptionText text={transfer.description} />
                                                        </div>
                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <NoRecordsFound
                            icon={ArrowRightLeft}
                            title={t('No Bank Transfers found')}
                            description={t('Get started by creating your first Bank Transfer.')}
                            hasFilters={!!(filters.transfer_number || filters.status || filters.from_account_id || filters.to_account_id || filters.date_range)}
                            onClearFilters={clearFilters}
                            createPermission="create-bank-transfers"
                            onCreateClick={() => openModal('add')}
                            createButtonText={t('Create Bank Transfer')}
                        />
                    )}
                </CardContent>

            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <Edit
                        banktransfer={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingTransfer} onOpenChange={() => setViewingTransfer(null)}>
                {viewingTransfer && <View banktransfer={viewingTransfer} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Bank Transfer')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
