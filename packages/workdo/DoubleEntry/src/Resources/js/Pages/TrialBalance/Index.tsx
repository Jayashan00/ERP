import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, Printer, Calendar, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { DatePicker } from '@/components/ui/date-picker';
import { formatDate, formatCurrency } from '@/utils/helpers';
import NoRecordsFound from '@/components/no-records-found';
import { DataTable } from "@/components/ui/data-table";
import RandomBadgeUI from "@/components/random-badge-ui";

interface TrialBalanceAccount {
    id: number;
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
}

interface TrialBalanceData {
    accounts: TrialBalanceAccount[];
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
    from_date: string;
    to_date: string;
}

interface TrialBalanceProps {
    trialBalance: TrialBalanceData;
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Index() {
    const { t } = useTranslation();
    const { trialBalance, auth } = usePage<TrialBalanceProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [fromDate, setFromDate] = useState(urlParams.get('from_date') || trialBalance.from_date);
    const [toDate, setToDate] = useState(urlParams.get('to_date') || trialBalance.to_date);

    const handleGenerate = () => {
        if (!fromDate || !toDate) return;
        router.get(route('double-entry.trial-balance.index'), {
            from_date: fromDate,
            to_date: toDate
        }, {
            preserveState: true,
            replace: true
        });
    };

    const tableColumns = [
        {
            key: 'account_code',
            header: t('Account Code'),
            sortable: false,
            render: (value: string, row: any) => row.isTotalRow ? null : (
                <RandomBadgeUI name={value} />
            )
        },
        {
            key: 'account_name',
            header: t('Account Name'),
            sortable: false,
            render: (value: string, row: any) => (
                <span className={row.isTotalRow ? "font-bold text-gray-900 dark:text-gray-100 text-sm" : "font-semibold text-gray-900 dark:text-gray-100 text-sm"}>
                    {value}
                </span>
            )
        },
        {
            key: 'debit',
            header: t('Debit'),
            sortable: false,
            render: (value: number, row: any) => {
                if (row.isTotalRow) {
                    return (
                        <span className="font-bold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                            {formatCurrency(value)}
                        </span>
                    );
                }
                return value > 0 ? (
                    <span className="font-semibold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                        {formatCurrency(value)}
                    </span>
                ) : '-';
            }
        },
        {
            key: 'credit',
            header: t('Credit'),
            sortable: false,
            render: (value: number, row: any) => {
                if (row.isTotalRow) {
                    return (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                            {formatCurrency(value)}
                        </span>
                    );
                }
                return value > 0 ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                        {formatCurrency(value)}
                    </span>
                ) : '-';
            }
        }
    ];

    const tableData = trialBalance.accounts && trialBalance.accounts.length > 0 ? [
        ...trialBalance.accounts,
        {
            id: 'total',
            account_code: '',
            account_name: t('Total'),
            debit: trialBalance.total_debit,
            credit: trialBalance.total_credit,
            isTotalRow: true
        }
    ] : [];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Double Entry') },
                { label: t('Trial Balance') }
            ]}
            pageTitle={t('Trial Balance')}
            pageDescription={t('Verify the mathematical accuracy of your double-entry accounting records for the selected period.')}
            pageActions={
                auth.user?.permissions?.includes('print-trial-balance') && (
                    <Button variant="outline" size="sm" onClick={() => {
                        const printUrl = route('double-entry.trial-balance.print') + `?from_date=${fromDate}&to_date=${toDate}&download=pdf`;
                        window.open(printUrl, '_blank');
                    }}>
                        <Printer className="h-4 w-4 mr-2" />
                        {t('Download PDF')}
                    </Button>
                )
            }
        >
            <Head title={t('Trial Balance')} />

            <div className="mx-auto space-y-6">
                {/* Filters card */}
                <Card className="shadow-sm border-gray-200/50 dark:border-zinc-800/50 shadow">
                    <CardContent className="p-2.5 sm:px-6 sm:py-4">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('From Date')}</label>
                                    <DatePicker
                                        value={fromDate}
                                        onChange={(value) => setFromDate(value)}
                                        placeholder={t('Select from date')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('To Date')}</label>
                                    <DatePicker
                                        value={toDate}
                                        onChange={(value) => setToDate(value)}
                                        placeholder={t('Select to date')}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleGenerate} disabled={!fromDate || !toDate} size="sm">
                                    <Search className="h-4 w-4 mr-1" />
                                    {t('Generate')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Debit Card */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('Total Debit')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-rose-800 dark:text-rose-200">
                                    {formatCurrency(trialBalance.total_debit)}
                                </h3>
                                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">{t('Total debited amount')}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Total Credit Card */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('Total Credit')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
                                    {formatCurrency(trialBalance.total_credit)}
                                </h3>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">{t('Total credited amount')}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Balance Status Card */}
                    {trialBalance.is_balanced ? (
                        <Card className="relative overflow-hidden bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-800/50 hover:shadow-md transition-all">
                            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{t('Balance Status')}</p>
                                    <h3 className="text-2xl font-bold tracking-tight text-teal-800 dark:text-teal-200">
                                        {t('Balanced')}
                                    </h3>
                                    <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-1">{t('All accounts are balanced')}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-teal-700 dark:text-teal-300 opacity-85 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-850/20 dark:border-amber-800/50 hover:shadow-md transition-all">
                            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('Balance Status')}</p>
                                    <h3 className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-200">
                                        {t('Out of Balance')}
                                    </h3>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">{t('Adjustments required')}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-85 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {!trialBalance.is_balanced && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <p className="text-amber-800 dark:text-amber-300 font-medium">
                            {t('Warning: Trial balance is not balanced! The total debit amount does not match the total credit amount.')}
                        </p>
                    </div>
                )}

                <Card className="shadow-sm border-gray-200/50 dark:border-zinc-800/50">
                    <CardContent className="p-0">
                        {trialBalance.accounts && trialBalance.accounts.length > 0 ? (
                            <DataTable
                                data={tableData}
                                columns={tableColumns}
                                className="border-0 shadow-none"
                                rowProps={(row) => ({
                                    className: row.isTotalRow ? 'font-bold bg-gray-100/50 dark:bg-zinc-800/50 border-t-2 border-gray-300 dark:border-zinc-700' : ''
                                })}
                            />
                        ) : (
                            <NoRecordsFound
                                icon={FileText}
                                title={t('No accounts found')}
                                description={t('No account transactions found for the selected date range.')}
                                className="h-auto py-12"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
