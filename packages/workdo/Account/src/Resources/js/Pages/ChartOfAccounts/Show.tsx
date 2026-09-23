import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calculator,
    ArrowLeft,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Calendar,
    FileText,
    Hash,
    Building2,
    Activity,
    Coins,
    DollarSign,
    Wallet,
    ShieldAlert
} from "lucide-react";
import { formatCurrency, formatDate } from '@/utils/helpers';
import { DataTable } from "@/components/ui/data-table";
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { Pagination } from "@/components/ui/pagination";
import NoRecordsFound from '@/components/no-records-found';
import WeekMonthSwitcher from '@/components/week-month-switcher';

interface ChartOfAccount {
    id: number;
    account_code: string;
    account_name: string;
    level: number;
    normal_balance: string;
    opening_balance: number;
    current_balance: number;
    is_active: boolean;
    description?: string;
    account_type?: { name: string };
    parent_account?: { account_name: string };
    is_system_account?: number;
}

interface JournalEntry {
    id: number;
    journal_number: string;
    journal_date: string;
    description: string;
    entry_type: string;
}

interface JournalEntryItem {
    id: number;
    description: string;
    debit_amount: number;
    credit_amount: number;
    created_at: string;
    journal_entry: JournalEntry;
}

interface PaginatedHistory {
    data: JournalEntryItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface ShowProps {
    chartofaccount: ChartOfAccount;
    history: PaginatedHistory;
    calculatedBalance: number;
    totalDebits: number;
    totalCredits: number;
}

export default function Show() {
    const { t } = useTranslation();
    const { chartofaccount, history, calculatedBalance, totalDebits, totalCredits } = usePage<ShowProps>().props;
    const urlParams = new URLSearchParams(window.location.search);
    const todayStr = new Date().toISOString().split('T')[0];

    const [selectedDate, setSelectedDate] = useState<string>(urlParams.get('selected_date') || todayStr);

    const handleCalendarChange = (dateStr: string) => {
        setSelectedDate(dateStr);
        router.get(route('account.chart-of-accounts.show', chartofaccount.id), {
            selected_date: dateStr,
            page: 1
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const handlePageChange = (page: number) => {
        router.get(route('account.chart-of-accounts.show', chartofaccount.id), {
            ...(selectedDate ? { selected_date: selectedDate } : {}),
            page
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const tableColumns = [
        {
            key: 'journal_number',
            header: t('Journal Number'),
            sortable: false,
            render: (_: any, item: JournalEntryItem) => (
                <RandomBadgeUI name={item.journal_entry?.journal_number || '-'} />
            )
        },
        {
            key: 'journal_date',
            header: t('Date'),
            sortable: false,
            render: (_: any, item: JournalEntryItem) => (
                <span className="text-gray-600 dark:text-gray-400 text-sm">{formatDate(item.journal_entry?.journal_date)}</span>
            )
        },
        {
            key: 'description',
            header: t('Description'),
            sortable: false,
            render: (_: any, item: JournalEntryItem) => (
                <span className="max-w-xs text-gray-700 dark:text-gray-300">{item.description}</span>
            )
        },
        {
            key: 'debit_amount',
            header: t('Debit'),
            sortable: false,
            className: 'text-right',
            render: (_: any, item: JournalEntryItem) => (
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {item.debit_amount > 0 ? formatCurrency(item.debit_amount) : '-'}
                </span>
            )
        },
        {
            key: 'credit_amount',
            header: t('Credit'),
            sortable: false,
            className: 'text-right',
            render: (_: any, item: JournalEntryItem) => (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.credit_amount > 0 ? formatCurrency(item.credit_amount) : '-'}
                </span>
            )
        }
    ];

    const isDebit = chartofaccount.normal_balance === 'debit';
    const isActive = chartofaccount.is_active;
    const isCalcPositive = calculatedBalance >= 0;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Chart Of Accounts'), url: route('account.chart-of-accounts.index') },
                { label: t('View Chart Of Account') }
            ]}
            pageTitle={t('View Chart Of Account')}
            pageDescription={t('Detailed overview of transactions, debit/credit journal entries, and balance history.')}
            backUrl={route('account.chart-of-accounts.index')}
        >
            <Head title={t('View Chart Of Account')} />

            <div className="space-y-6">
                {/* 6-Column Summary Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Card 1: Profile */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-zinc-50 to-zinc-100 border-zinc-200 dark:from-zinc-950/40 dark:to-zinc-900/20 dark:border-zinc-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wider">{t('Account Profile')}</p>
                                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 max-w-full" title={chartofaccount.account_name}>
                                    {chartofaccount.account_name}
                                </h3>
                                <div className="mt-1">
                                    <BadgeUI className={isActive ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-red-100 text-red-800 ring-red-200'}>
                                        {isActive ? t('Active') : t('Inactive')}
                                    </BadgeUI>
                                </div>
                            </div>
                            <Calculator className="h-8 w-8 text-zinc-600 dark:text-zinc-400 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Card 2: Normal Balance */}
                    <Card className={`relative overflow-hidden border hover:shadow-md transition-all ${isDebit
                        ? 'bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-950/30 dark:to-rose-900/20 dark:border-rose-800/50'
                        : 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-800/20 dark:border-emerald-800/50'
                        }`}>
                        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className={`text-xs font-semibold tracking-wider ${isDebit ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                                    {t('Normal Balance')}
                                </p>
                                <h3 className={`text-lg font-bold tracking-tight ${isDebit ? 'text-rose-800 dark:text-rose-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                                    {isDebit ? t('Debit') : t('Credit')}
                                </h3>
                                <p className={`text-xs mt-1 font-medium ${isDebit ? 'text-rose-600/80' : 'text-emerald-600/80'}`}>
                                    {isDebit ? t('Debit Balance') : t('Credit Balance')}
                                </p>
                            </div>
                            <Activity className={`h-8 w-8 opacity-85 flex-shrink-0 ${isDebit ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`} />
                        </CardContent>
                    </Card>

                    {/* Card 3: Account Type & Level */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 dark:border-purple-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 tracking-wider">{t('Account Type')}</p>

                                <h3 className="text-lg font-bold tracking-tight text-purple-800 dark:text-purple-200">
                                    {chartofaccount.account_type?.name}
                                </h3>
                                <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
                                    {t('Level')} {chartofaccount.level}
                                </p>
                            </div>
                            <Building2 className="h-8 w-8 text-purple-700 dark:text-purple-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Card 4: Opening Balance */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 tracking-wider">{t('Opening Balance')}</p>
                                <h3 className="text-lg font-bold tracking-tight text-blue-800 dark:text-blue-200">
                                    {formatCurrency(chartofaccount.opening_balance ?? 0)}
                                </h3>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">{t('Initial balance')}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Card 5: Current Balance */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 tracking-wider">{t('Current Balance')}</p>
                                <h3 className="text-lg font-bold tracking-tight text-teal-800 dark:text-teal-200">
                                    {formatCurrency(chartofaccount.current_balance ?? 0)}
                                </h3>
                                <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-1">{t('Stored ledger balance')}</p>
                            </div>
                            <Wallet className="h-8 w-8 text-teal-700 dark:text-teal-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Card 6: Calculated Balance */}
                    <Card className={`relative overflow-hidden border hover:shadow-md transition-all ${isCalcPositive
                        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-800/20 dark:border-emerald-800/50'
                        : 'bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-950/30 dark:to-rose-900/20 dark:border-rose-800/50'
                        }`}>
                        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className={`text-xs font-semibold tracking-wider ${isCalcPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                    {t('Calculated')}
                                </p>
                                <h3 className={`text-lg font-bold tracking-tight ${isCalcPositive ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                                    {formatCurrency(calculatedBalance ?? 0)}
                                </h3>
                                <p className={`text-[10px] mt-1 font-semibold truncate ${isCalcPositive ? 'text-emerald-600/80' : 'text-rose-600/80'}`} title={`DR: ${formatCurrency(totalDebits)} | CR: ${formatCurrency(totalCredits)}`}>
                                    DR: {formatCurrency(totalDebits)} | CR: {formatCurrency(totalCredits)}
                                </p>
                            </div>
                            <Coins className={`h-8 w-8 opacity-85 flex-shrink-0 ${isCalcPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`} />
                        </CardContent>
                    </Card>
                </div>

                {/* Parent Account & Description row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Parent Account Details Card */}
                    <div className="md:col-span-4">
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card h-full">
                            <CardHeader className="border-b border-border/50 bg-muted/10 p-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Hierarchy & Parent')}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground tracking-wider">{t('Parent Account')}</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                        {chartofaccount.parent_account?.account_name || t('None')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground tracking-wider">{t('Account Level')}</p>
                                    <p>
                                        <RandomBadgeUI name={t('Level') + chartofaccount.level} />
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Description Card */}
                    <div className="md:col-span-8">
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card h-full">
                            <CardHeader className="border-b border-border/50 bg-muted/10 p-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Description')}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[80px] pr-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                                    {chartofaccount.description || t('No description available.')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Weekly Date Chart / Switcher */}
                <WeekMonthSwitcher
                    mode="week"
                    value={selectedDate}
                    onChange={handleCalendarChange}
                />

                {/* Transaction History Card */}
                <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                    <CardHeader className="border-b border-border/50 bg-muted/10 p-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-base font-semibold text-foreground">
                                {t('Transaction History')}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={history?.data || []}
                                columns={tableColumns}
                                className="rounded-none shadow-none border-0"
                                emptyState={
                                    <NoRecordsFound
                                        icon={Calendar}
                                        title={t('No Transaction History')}
                                        description={t('Transactions will appear here once journal entries are posted to this account.')}
                                        className="h-auto py-12 border-none shadow-none"
                                    />
                                }
                            />
                        </div>
                        {history?.data?.length > 0 && (
                            <div className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30 dark:bg-zinc-900/10">
                                <Pagination
                                    data={history}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
