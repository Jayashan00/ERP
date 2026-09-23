import { useState, useRef, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { FilterButton } from '@/components/ui/filter-button';
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NoRecordsFound from '@/components/no-records-found';
import { CreditCard as CreditCardIcon, CheckCircle, Circle, ArrowDownLeft, ArrowUpRight, Calendar, LayoutGrid } from "lucide-react";
import { formatDate, formatCurrency } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';
import RandomBadgeUI from '@/components/random-badge-ui';
import BadgeUI from '@/components/badge-ui';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface BankTransaction {
    id: number;
    bank_account_id: number;
    transaction_date: string;
    transaction_type: 'debit' | 'credit';
    reference_number: string;
    description: string;
    amount: number;
    running_balance: number;
    transaction_status: 'pending' | 'cleared' | 'cancelled';
    reconciliation_status: 'unreconciled' | 'reconciled';
    bank_account: {
        id: number;
        account_name: string;
        account_number: string;
    };
}

interface BankAccount {
    id: number;
    account_name: string;
    account_number: string;
}

interface BankTransactionsIndexProps {
    transactions: BankTransaction[];
    bankAccounts: BankAccount[];
    summary: {
        all: number;
        debit: number;
        credit: number;
    };
    filters: {
        bank_account_id?: string;
        transaction_type?: string;
        search?: string;
        date_from?: string;
        date_to?: string;
    };
    auth: any;
}

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
        return <p className="text-zinc-500 italic text-sm text-start">{t('No description provided')}</p>;
    }

    return (
        <div className="space-y-0.5 text-start">
            <p
                ref={textRef}
                className={`font-semibold text-zinc-900 dark:text-zinc-100 text-sm text-start break-words whitespace-pre-line ${isExpanded ? '' : 'line-clamp-2'
                    }`}
            >
                {text}
            </p>
            {(isClamped || isExpanded) && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-semibold text-primary focus:outline-none"
                >
                    {isExpanded ? t('Show Less') : t('Show More')}
                </button>
            )}
        </div>
    );
};

export default function Index() {
    const { t } = useTranslation();
    const { transactions = [], bankAccounts = [], summary, auth } = usePage<BankTransactionsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        bank_account_id: urlParams.get('bank_account_id') || '',
        transaction_type: urlParams.get('transaction_type') || '',
        search: urlParams.get('search') || '',
        date_range: (() => {
            const fromDate = urlParams.get('date_from');
            const toDate = urlParams.get('date_to');
            return (fromDate && toDate) ? `${fromDate} - ${toDate}` : '';
        })()
    });

    const [sortField] = useState(urlParams.get('sort') || 'transaction_date');
    const [sortDirection] = useState(urlParams.get('direction') || 'desc');
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState(filters.transaction_type || 'all');

    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Transaction', settingKey: 'GoogleDrive Transaction' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Transaction', settingKey: 'OneDrive Transaction' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Account Transaction', settingKey: 'Dropbox Account Transaction' });

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

        router.get(route('account.bank-transactions.index'), { ...filterParams, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleTabChange = (tabKey: string) => {
        setActiveTab(tabKey);
        const nextType = tabKey === 'all' ? '' : tabKey;
        const nextFilters = { ...filters, transaction_type: nextType };
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

        router.get(route('account.bank-transactions.index'), {
            ...filterParams,
            sort: sortField,
            direction: sortDirection
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        const nextFilters = {
            bank_account_id: '',
            transaction_type: '',
            search: '',
            date_range: '',
        };
        setFilters(nextFilters);
        setActiveTab('all');
        router.get(route('account.bank-transactions.index'), {
            bank_account_id: '',
            transaction_type: '',
            search: '',
            date_from: '',
            date_to: '',
        });
    };

    const markReconciled = (id: number) => {
        router.post(route('account.bank-transactions.mark-reconciled', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Page will refresh automatically
            }
        });
    };

    // Group transactions by transaction date
    const groupedTransactions = transactions.reduce((groups: { [key: string]: BankTransaction[] }, transaction) => {
        const dateKey = formatDate(transaction.transaction_date);
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(transaction);
        return groups;
    }, {});

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Bank Transactions') }
            ]}
            pageTitle={t('Manage Bank Transactions')}
            pageDescription={t('Track and manage all bank transactions, view balances, and reconcile bank accounts.')}
            pageActions={
                <div className="flex flex-wrap items-center gap-2">
                    <TooltipProvider>
                        {googleDriveButtons.map((button) => (
                            <span key={button.id}>{button.component}</span>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <span key={button.id}>{button.component}</span>
                        ))}
                        {dropboxBtn.map((button) => (
                            <span key={button.id}>{button.component}</span>
                        ))}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Bank Transactions')} />
            <Card className="shadow-sm">
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({ ...filters, search: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search transactions...')}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.bank_account_id, filters.date_range].filter(Boolean).length;
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
                            { key: 'all', label: t('All Transactions'), icon: LayoutGrid, count: summary?.all || 0 },
                            { key: 'credit', label: t('Credit'), icon: ArrowDownLeft, count: summary?.credit || 0 },
                            { key: 'debit', label: t('Debit'), icon: ArrowUpRight, count: summary?.debit || 0 },
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Bank Account')}</label>
                                <Select value={filters.bank_account_id} onValueChange={(value) => setFilters({ ...filters, bank_account_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Bank Account')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankAccounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.account_name} ({account.account_number})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Date Range')}</label>
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

                <CardContent className="p-3 sm:p-6 overflow-y-auto max-h-[75vh] pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                    {Object.keys(groupedTransactions).length > 0 ? (
                        <div className="space-y-6">
                            {Object.keys(groupedTransactions).map((dateKey) => (
                                <div key={dateKey} className="space-y-4">
                                    {/* Date Header Indicator */}
                                    <div className="flex items-center gap-4">
                                        <BadgeUI className="flex items-center gap-2" icon={Calendar}>
                                            {dateKey}
                                        </BadgeUI>
                                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                                    </div>

                                    {/* Timeline block for this date */}
                                    <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-4 py-2">
                                        {groupedTransactions[dateKey].map((transaction) => {
                                            const isCredit = transaction.transaction_type === 'credit';
                                            return (
                                                <div key={transaction.id} className="relative group">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[35px] top-3.5 w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${isCredit
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                                        }`}>
                                                        {isCredit ? (
                                                            <ArrowDownLeft className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>

                                                    {/* Timeline Card */}
                                                    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <RandomBadgeUI name={transaction.reference_number} className="text-xs" />
                                                                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                                                <span className="text-xs text-muted-foreground" title={transaction.bank_account?.account_name}>
                                                                    {transaction.bank_account?.account_name} ({transaction.bank_account?.account_number})
                                                                </span>
                                                            </div>

                                                            <div>
                                                                <DescriptionText text={transaction.description} />
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                                {/* Transaction Status */}
                                                                <BadgeUI className={`capitalize ${transaction.transaction_status === 'cleared' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20' :
                                                                    transaction.transaction_status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/20' :
                                                                        'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20'
                                                                    }`}>
                                                                    {t(transaction.transaction_status)}
                                                                </BadgeUI>
                                                            </div>
                                                        </div>

                                                        {/* Right side: Amount and Action */}
                                                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                                                            <div className="text-right flex flex-col items-start md:items-end">
                                                                <span className={`text-base font-bold ${isCredit
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-rose-600 dark:text-rose-400'
                                                                    }`}>
                                                                    {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                                                                </span>
                                                                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                                                    {t('Balance')}: {formatCurrency(transaction.running_balance)}
                                                                </span>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex gap-1">
                                                                <TooltipProvider>
                                                                    {transaction.reconciliation_status === 'unreconciled' ? (
                                                                        auth.user?.permissions?.includes('reconcile-bank-transactions') ? (
                                                                            <Tooltip delayDuration={0}>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => markReconciled(transaction.id)}
                                                                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                                                    >
                                                                                        <Circle className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>{t('Mark as Reconciled')}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        ) : (
                                                                            <Circle className="h-4 w-4 text-gray-400" />
                                                                        )
                                                                    ) : (
                                                                        <Tooltip delayDuration={0}>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="w-8 h-8 flex items-center justify-center">
                                                                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>{t('Reconciled')}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </TooltipProvider>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <NoRecordsFound
                            icon={CreditCardIcon}
                            title={t('No transactions found')}
                            description={t('Bank transactions will appear here once created.')}
                            hasFilters={!!(filters.search || filters.bank_account_id || filters.transaction_type || filters.date_range)}
                            onClearFilters={clearFilters}
                        />
                    )}
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
