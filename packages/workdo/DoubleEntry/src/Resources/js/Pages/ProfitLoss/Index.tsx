import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, Printer, Calendar, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { DatePicker } from '@/components/ui/date-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatCurrency } from '@/utils/helpers';

interface Account {
    id: number;
    account_code: string;
    account_name: string;
    balance: number;
}

interface ProfitLossData {
    revenue: Account[];
    expenses: Account[];
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    from_date: string;
    to_date: string;
}

interface ProfitLossProps {
    profitLoss: ProfitLossData;
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Index() {
    const { t } = useTranslation();
    const { profitLoss, auth } = usePage<ProfitLossProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [fromDate, setFromDate] = useState(urlParams.get('from_date') || profitLoss.from_date);
    const [toDate, setToDate] = useState(urlParams.get('to_date') || profitLoss.to_date);

    const handleGenerate = () => {
        if (!fromDate || !toDate) return;
        router.get(route('double-entry.profit-loss.index'), {
            from_date: fromDate,
            to_date: toDate
        }, {
            preserveState: true,
            replace: true
        });
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Double Entry') },
                { label: t('Profit & Loss') }
            ]}
            pageTitle={t('Profit & Loss Statement')}
            pageDescription={t('View and analyze organization revenues, expenses, and net profit to measure overall financial performance.')}
            pageActions={
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                        <DatePicker
                            value={fromDate}
                            onChange={(value) => setFromDate(value)}
                            placeholder={t('From date')}
                            className="w-[140px]"
                        />
                    </div>
                    <span className="text-muted-foreground text-xs font-medium">{t('to')}</span>
                    <div className="flex items-center gap-2">
                        <DatePicker
                            value={toDate}
                            onChange={(value) => setToDate(value)}
                            placeholder={t('To date')}
                            className="w-[140px]"
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={!fromDate || !toDate} size="sm" className="h-9">
                        <Search className="h-4 w-4" />
                    </Button>
                    {auth.user?.permissions?.includes('print-profit-loss') && (
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const printUrl = route('double-entry.profit-loss.print') + `?from_date=${fromDate}&to_date=${toDate}&download=pdf`;
                                        window.open(printUrl, '_blank');
                                    }} className="h-9 w-9 p-0">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Download PDF')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            }
        >
            <Head title={t('Profit & Loss')} />

            <div className="mx-auto space-y-6">
                {/* Summary Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Total Revenue */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('Total Revenue')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
                                    {formatCurrency(profitLoss.total_revenue)}
                                </h3>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">{t('Earned income streams')}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Total Expenses */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('Total Expenses')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-rose-800 dark:text-rose-200">
                                    {formatCurrency(profitLoss.total_expenses)}
                                </h3>
                                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">{t('Operational and capital costs')}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Net Profit / Net Loss */}
                    {profitLoss.net_profit >= 0 ? (
                        <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 hover:shadow-md transition-all">
                            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Net Profit')}</p>
                                    <h3 className="text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-200">
                                        {formatCurrency(Math.abs(profitLoss.net_profit))}
                                    </h3>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">{t('Positive net earnings')}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-85 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-850/20 dark:border-amber-800/50 hover:shadow-md transition-all">
                            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('Net Loss')}</p>
                                    <h3 className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-200">
                                        {formatCurrency(Math.abs(profitLoss.net_profit))}
                                    </h3>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">{t('Negative net earnings')}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-85 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Profit & Loss Report Details */}
                <Card className="shadow border-gray-200/50 dark:border-zinc-800/50">
                    <CardContent className="p-4 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
                                <FileText className="h-6 w-6 text-primary" />
                                {t('Statement of Profit or Loss')}
                            </h2>
                            <div className="text-sm font-medium text-muted-foreground">
                                {t('For The Period')}: <span className="font-semibold text-gray-950 dark:text-gray-50">{formatDate(profitLoss.from_date)}</span> {t('to')} <span className="font-semibold text-gray-950 dark:text-gray-50">{formatDate(profitLoss.to_date)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12 items-stretch">
                            {/* Revenue Section */}
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b pb-2">{t('Revenue')}</h3>
                                <div className="border rounded-lg flex-1 flex flex-col justify-between bg-white dark:bg-zinc-950">
                                    <div>
                                        {/* Header */}
                                        <div className="flex w-full border-b bg-gray-50/50 dark:bg-zinc-900/40">
                                            <div className="w-[80%] px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wider">{t('Account')}</div>
                                            <div className="w-[20%] px-4 py-3 text-right text-xs font-semibold text-muted-foreground tracking-wider">{t('Amount')}</div>
                                        </div>

                                        {/* Body */}
                                        <div className="divide-y divide-gray-150 dark:divide-zinc-800">
                                            {profitLoss.revenue.length > 0 ? (
                                                profitLoss.revenue.map((account) => (
                                                    <div key={account.id} className="flex w-full hover:bg-gray-50/30 dark:hover:bg-zinc-900/10">
                                                        <div className="w-[80%] px-4 py-3 font-medium text-gray-950 dark:text-gray-50 text-sm flex items-center">
                                                            {account.account_name} {account.account_code ? ` - ${account.account_code}` : ''}
                                                        </div>
                                                        <div className="w-[20%] px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 tabular-nums text-sm flex items-center justify-end">
                                                            {formatCurrency(account.balance)}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center text-muted-foreground py-8 text-sm">
                                                    {t('No revenue accounts')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border-t-2 border-emerald-250 dark:border-emerald-900 flex w-full">
                                        <div className="w-[80%] px-4 py-4 font-bold text-base text-emerald-600 dark:text-emerald-400 flex items-center">
                                            {t('Total Revenue')}
                                        </div>
                                        <div className="w-[20%] px-4 py-4 text-right font-bold text-base tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center justify-end">
                                            {formatCurrency(profitLoss.total_revenue)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expenses Section */}
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b pb-2">{t('Expenses')}</h3>
                                <div className="border rounded-lg flex-1 flex flex-col justify-between bg-white dark:bg-zinc-950">
                                    <div>
                                        {/* Header */}
                                        <div className="flex w-full border-b bg-gray-50/50 dark:bg-zinc-900/40">
                                            <div className="w-[80%] px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wider">{t('Account')}</div>
                                            <div className="w-[20%] px-4 py-3 text-right text-xs font-semibold text-muted-foreground tracking-wider">{t('Amount')}</div>
                                        </div>

                                        {/* Body */}
                                        <div className="divide-y divide-gray-150 dark:divide-zinc-800">
                                            {profitLoss.expenses.length > 0 ? (
                                                profitLoss.expenses.map((account) => (
                                                    <div key={account.id} className="flex w-full hover:bg-gray-50/30 dark:hover:bg-zinc-900/10">
                                                        <div className="w-[80%] px-4 py-3 font-medium text-gray-950 dark:text-gray-50 text-sm flex items-center">
                                                            {account.account_name} {account.account_code ? ` - ${account.account_code}` : ''}
                                                        </div>
                                                        <div className="w-[20%] px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 tabular-nums text-sm flex items-center justify-end">
                                                            {formatCurrency(account.balance)}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center text-muted-foreground py-8 text-sm">
                                                    {t('No expense accounts')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="bg-rose-50/50 dark:bg-rose-950/10 border-t-2 border-rose-250 dark:border-rose-900 flex w-full">
                                        <div className="w-[80%] px-4 py-4 font-bold text-base text-rose-600 dark:text-rose-400 flex items-center">
                                            {t('Total Expenses')}
                                        </div>
                                        <div className="w-[20%] px-4 py-4 text-right font-bold text-base tabular-nums text-rose-600 dark:text-rose-400 flex items-center justify-end">
                                            {formatCurrency(profitLoss.total_expenses)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Total summary */}
                        <div className="mt-8 pt-6 border-t-2 border-gray-400 dark:border-zinc-700">
                            <div className={`flex justify-between items-center py-4 px-6 rounded-lg border border-dashed font-bold text-lg ${profitLoss.net_profit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-200 dark:border-emerald-900/30'
                                : 'text-rose-600 dark:text-rose-400 bg-rose-50/10 dark:bg-rose-950/5 border-rose-200 dark:border-rose-900/30'
                                }`}>
                                <h3 className="text-lg font-bold">
                                    {profitLoss.net_profit >= 0 ? t('Net Profit') : t('Net Loss')}
                                </h3>
                                <p className="text-lg font-bold tabular-nums">
                                    {formatCurrency(Math.abs(profitLoss.net_profit))}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
