import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Calendar } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComparisonProps {
    comparison: {
        id: number;
        currentPeriod: {
            id: number;
            balance_sheet_date: string;
            financial_year: string;
            total_assets: number;
            total_liabilities: number;
            total_equity: number;
            items: Array<{
                id: number;
                section_type: string;
                sub_section: string;
                amount: number;
                account: {
                    account_code: string;
                    account_name: string;
                };
            }>;
        };
        previousPeriod: {
            id: number;
            balance_sheet_date: string;
            financial_year: string;
            total_assets: number;
            total_liabilities: number;
            total_equity: number;
            items: Array<{
                id: number;
                section_type: string;
                sub_section: string;
                amount: number;
                account: {
                    account_code: string;
                    account_name: string;
                };
            }>;
        };
        current_period?: {
            id: number;
            balance_sheet_date: string;
            financial_year: string;
            total_assets: number;
            total_liabilities: number;
            total_equity: number;
            items: Array<{
                id: number;
                section_type: string;
                sub_section: string;
                amount: number;
                account: {
                    account_code: string;
                    account_name: string;
                };
            }>;
        };
        previous_period?: {
            id: number;
            balance_sheet_date: string;
            financial_year: string;
            total_assets: number;
            total_liabilities: number;
            total_equity: number;
            items: Array<{
                id: number;
                section_type: string;
                sub_section: string;
                amount: number;
                account: {
                    account_code: string;
                    account_name: string;
                };
            }>;
        };
    };
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Comparison() {
    const { t } = useTranslation();
    const { comparison, auth } = usePage<ComparisonProps>().props;

    if (!comparison) {
        return (
            <AuthenticatedLayout
                breadcrumbs={[
                    { label: t('Double Entry') },
                    { label: t('Balance Sheets'), url: route('double-entry.balance-sheets.index') },
                    { label: t('Comparison') }
                ]}
                pageTitle={t('Balance Sheet Comparison')}
            >
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-500">{t('Loading comparison data...')}</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const currentPeriod = comparison.current_period || comparison.currentPeriod;
    const previousPeriod = comparison.previous_period || comparison.previousPeriod;

    // Group items by account for comparison
    const currentItems = (currentPeriod?.items || []).reduce((acc, item) => {
        if (item?.account?.account_code) {
            acc[item.account.account_code] = item;
        }
        return acc;
    }, {} as Record<string, any>);

    const previousItems = (previousPeriod?.items || []).reduce((acc, item) => {
        if (item?.account?.account_code) {
            acc[item.account.account_code] = item;
        }
        return acc;
    }, {} as Record<string, any>);

    // Get all unique account codes
    const allAccountCodes = Array.from(new Set([
        ...Object.keys(currentItems),
        ...Object.keys(previousItems)
    ])).sort();

    // Calculate totals for each section
    const calculateSectionTotal = (items: any[], sectionType: string) => {
        return (items || []).filter(item => item.section_type === sectionType)
            .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    };

    const renderComparisonSection = (sectionType: string, sectionTitle: string) => {
        const sectionAccounts = allAccountCodes.filter(code => {
            const item = currentItems[code] || previousItems[code];
            return item?.section_type === sectionType;
        });

        if (sectionAccounts.length === 0) return null;

        let currentTotal = 0;
        let previousTotal = 0;

        const sectionColors = {
            assets: {
                text: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
                border: 'border-emerald-200 dark:border-emerald-900/30'
            },
            liabilities: {
                text: 'text-rose-600 dark:text-rose-400',
                bg: 'bg-rose-50/50 dark:bg-rose-950/10',
                border: 'border-rose-200 dark:border-rose-900/30'
            },
            equity: {
                text: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-50/50 dark:bg-blue-950/10',
                border: 'border-blue-200 dark:border-blue-900/30'
            }
        }[sectionType as 'assets' | 'liabilities' | 'equity'] || {
            text: 'text-gray-900 dark:text-gray-100',
            bg: 'bg-gray-50 dark:bg-zinc-850/50',
            border: 'border-gray-200 dark:border-zinc-800'
        };

        return (
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-wider">
                    {sectionTitle}
                </h3>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 dark:bg-zinc-900/40">
                                <TableHead className="w-[40%]">{t('Account')}</TableHead>
                                <TableHead className="w-[20%] text-right">{formatDate(currentPeriod?.balance_sheet_date)}</TableHead>
                                <TableHead className="w-[20%] text-right">{formatDate(previousPeriod?.balance_sheet_date)}</TableHead>
                                <TableHead className="w-[20%] text-right">{t('Change')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sectionAccounts.map(accountCode => {
                                const currentItem = currentItems[accountCode];
                                const previousItem = previousItems[accountCode];

                                const currentAmount = parseFloat(currentItem?.amount) || 0;
                                const previousAmount = parseFloat(previousItem?.amount) || 0;
                                const change = currentAmount - previousAmount;

                                currentTotal += currentAmount;
                                previousTotal += previousAmount;

                                return (
                                    <TableRow key={accountCode} className="hover:bg-gray-50/30 dark:hover:bg-zinc-900/10 border-b last:border-b-0">
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                            {currentItem?.account.account_name || previousItem?.account.account_name} {accountCode ? `- ${accountCode}` : ''}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-gray-700 dark:text-gray-300 tabular-nums text-sm">
                                            {formatCurrency(currentAmount)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-gray-700 dark:text-gray-300 tabular-nums text-sm">
                                            {formatCurrency(previousAmount)}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold tabular-nums text-sm ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {change >= 0 ? '+' : ''}{formatCurrency(change)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            <TableRow className={`border-t-2 ${sectionColors.border} ${sectionColors.bg}`}>
                                <TableCell className={`font-bold text-base ${sectionColors.text}`}>
                                    {t('Total')} {sectionTitle}
                                </TableCell>
                                <TableCell className={`text-right font-bold text-base tabular-nums ${sectionColors.text}`}>
                                    {formatCurrency(currentTotal)}
                                </TableCell>
                                <TableCell className={`text-right font-bold text-base tabular-nums ${sectionColors.text}`}>
                                    {formatCurrency(previousTotal)}
                                </TableCell>
                                <TableCell className={`text-right font-bold text-base tabular-nums ${sectionColors.text}`}>
                                    {(currentTotal - previousTotal) >= 0 ? '+' : ''}{formatCurrency(currentTotal - previousTotal)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Double Entry') },
                { label: t('Balance Sheets'), url: route('double-entry.balance-sheets.index') },
                { label: t('Comparisons'), url: route('double-entry.balance-sheets.comparisons') },
                { label: t('Comparison') }
            ]}
            pageTitle={t('Balance Sheet Comparison')}
            pageDescription={`${formatDate(currentPeriod?.balance_sheet_date)} vs ${formatDate(previousPeriod?.balance_sheet_date)}`}
            pageActions={
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        {auth?.user?.permissions?.includes('print-balance-sheets') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const currentId = comparison.current_period?.id || comparison.currentPeriod?.id;
                                        const previousId = comparison.previous_period?.id || comparison.previousPeriod?.id;
                                        const printUrl = route('double-entry.balance-sheets.comparison.print') + `?current_id=${currentId}&previous_id=${previousId}&download=pdf`;
                                        window.open(printUrl, '_blank');
                                    }}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Download PDF')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Balance Sheet Comparison')} />

            <div className="mx-auto space-y-6">
                <Card className="shadow border-gray-200/50 dark:border-zinc-800/50">
                    <CardContent className="p-4 sm:p-8">
                        <div className="flex items-center justify-between mb-8 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
                                <Calendar className="h-6 w-6 text-primary" />
                                {t('Comparative Balance Sheet')}
                            </h2>
                        </div>

                        {/* Assets */}
                        {renderComparisonSection('assets', t('Assets'))}

                        {/* Liabilities */}
                        {renderComparisonSection('liabilities', t('Liabilities'))}

                        {/* Equity */}
                        {renderComparisonSection('equity', t('Equity'))}

                        {/* Summary */}
                        <div className="mt-8 pt-6 border-t-2 border-gray-300 dark:border-zinc-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50/10 dark:bg-emerald-950/5 border border-emerald-250/50 rounded-lg space-y-2">
                                    <h4 className="font-bold text-emerald-800 dark:text-emerald-400 border-b pb-1 text-sm tracking-wider">{t('Total Assets')}</h4>
                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>{formatDate(currentPeriod?.balance_sheet_date)}</span>
                                        <span className="font-semibold tabular-nums">{formatCurrency(calculateSectionTotal(currentPeriod?.items, 'assets'))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>{formatDate(previousPeriod?.balance_sheet_date)}</span>
                                        <span className="font-semibold tabular-nums">{formatCurrency(calculateSectionTotal(previousPeriod?.items, 'assets'))}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold border-t pt-1 text-emerald-600 dark:text-emerald-400">
                                        <span>{t('Change')}</span>
                                        <span className="tabular-nums">
                                            {formatCurrency(calculateSectionTotal(currentPeriod?.items, 'assets') - calculateSectionTotal(previousPeriod?.items, 'assets'))}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-rose-50/10 dark:bg-rose-950/5 border border-rose-250/50 rounded-lg space-y-2">
                                    <h4 className="font-bold text-rose-800 dark:text-rose-400 border-b pb-1 text-sm tracking-wider">{t('Total Liabilities & Equity')}</h4>
                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>{formatDate(currentPeriod?.balance_sheet_date)}</span>
                                        <span className="font-semibold tabular-nums">
                                            {formatCurrency(
                                                calculateSectionTotal(currentPeriod?.items, 'liabilities') + calculateSectionTotal(currentPeriod?.items, 'equity')
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                        <span>{formatDate(previousPeriod?.balance_sheet_date)}</span>
                                        <span className="font-semibold tabular-nums">
                                            {formatCurrency(
                                                calculateSectionTotal(previousPeriod?.items, 'liabilities') + calculateSectionTotal(previousPeriod?.items, 'equity')
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold border-t pt-1 text-rose-600 dark:text-rose-400">
                                        <span>{t('Change')}</span>
                                        <span className="tabular-nums">
                                            {formatCurrency(
                                                (calculateSectionTotal(currentPeriod?.items, 'liabilities') + calculateSectionTotal(currentPeriod?.items, 'equity')) -
                                                (calculateSectionTotal(previousPeriod?.items, 'liabilities') + calculateSectionTotal(previousPeriod?.items, 'equity'))
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
