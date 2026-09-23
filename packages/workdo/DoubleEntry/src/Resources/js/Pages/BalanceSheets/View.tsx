import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, FileText, Printer, Plus, GitCompare, LayoutGrid, Columns, Trash2, Calendar, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BalanceSheetViewProps } from './types';
import { formatDate, formatCurrency } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import Note from './Note';
import Compare from './Compare';
import Generate from './Generate';
import YearEndClose from './YearEndClose';

export default function View() {
    const { t } = useTranslation();
    const { balanceSheet, groupedItems, allBalanceSheets, otherBalanceSheets, auth } = usePage<BalanceSheetViewProps>().props;
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showYearEndModal, setShowYearEndModal] = useState(false);
    const [viewType, setViewType] = useState<'vertical' | 'horizontal'>('horizontal');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'double-entry.balance-sheets.delete-note',
        defaultMessage: t('Are you sure you want to delete this note?')
    });

    const handleFinalize = () => {
        router.post(route('double-entry.balance-sheets.finalize', balanceSheet.id), {}, {
            preserveState: true,
        });
    };

    const handleDeleteNote = (noteId: number) => {
        openDeleteDialog([balanceSheet.id, noteId]);
    };

    const renderSection = (sectionType: string, sectionTitle: string) => {
        const sectionItems = groupedItems[sectionType];
        if (!sectionItems) return null;

        let sectionTotal = 0;
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
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-250 mb-4 tracking-wider">
                    {sectionTitle}
                </h3>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 dark:bg-zinc-900/40">
                                <TableHead className="w-[80%]">{t('Account')}</TableHead>
                                <TableHead className="w-[20%] text-right">{t('Amount')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(sectionItems).map(([subSection, items]) => {
                                const subSectionTotal = items.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
                                sectionTotal += subSectionTotal;

                                return (
                                    <React.Fragment key={subSection}>
                                        <TableRow key={`${subSection}-header`} className="bg-gray-50/20 dark:bg-zinc-900/20 border-b">
                                            <TableCell colSpan={2} className="font-semibold text-gray-700 dark:text-gray-300 capitalize text-sm">
                                                {subSection.replace('_', ' ')}
                                            </TableCell>
                                        </TableRow>
                                        {items.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-gray-50/30 dark:hover:bg-zinc-900/10 border-b last:border-b-0">
                                                <TableCell className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                    {item.account?.account_name} {item.account?.account_code ? ` - ${item.account?.account_code}` : ''}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-gray-700 dark:text-gray-300 tabular-nums text-sm">
                                                    {formatCurrency(item.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow key={`${subSection}-total`} className="border-b bg-gray-50/10 dark:bg-zinc-900/5">
                                            <TableCell className="font-medium text-sm text-gray-600 dark:text-gray-400">
                                                {t('Total')} {subSection.replace('_', ' ')}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                                                {formatCurrency(subSectionTotal)}
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                            <TableRow className={`border-t-2 ${sectionColors.border} ${sectionColors.bg}`}>
                                <TableCell className={`font-bold text-base ${sectionColors.text}`}>
                                    {t('Total')} {sectionTitle}
                                </TableCell>
                                <TableCell className={`text-right font-bold text-base tabular-nums ${sectionColors.text}`}>
                                    {formatCurrency(sectionTotal)}
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
                { label: t('Balance Sheets'), url: route('double-entry.balance-sheets.list') },
                { label: t('Balance Sheet') }
            ]}
            pageTitle={t('Balance Sheet')}
            pageDescription={t('View and analyze your organization assets, liabilities, and equity to understand the overall financial position.')}
            pageActions={
                <div className="flex flex-wrap items-center gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('print-balance-sheets') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const printUrl = route('double-entry.balance-sheets.print', balanceSheet.id) + '?download=pdf';
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
                        {auth.user?.permissions?.includes('manage-balance-sheets') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('double-entry.balance-sheets.list'))}>
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('All Balance Sheets')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('view-balance-sheet-comparisons') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('double-entry.balance-sheets.comparisons'))}>
                                        <GitCompare className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View Comparisons')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('year-end-close') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setShowYearEndModal(true)}>
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Year-End Close')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <div className="flex items-center border rounded-lg">
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={viewType === 'vertical' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewType('vertical')}
                                        className="rounded-r-none"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Vertical View')}</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={viewType === 'horizontal' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewType('horizontal')}
                                        className="rounded-l-none"
                                    >
                                        <Columns className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Horizontal View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        {auth.user?.permissions?.includes('create-balance-sheets') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => setShowGenerateModal(true)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Generate Balance Sheet')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={`${t('Balance Sheet')} - ${formatDate(balanceSheet.balance_sheet_date)}`} />

            <div className="mx-auto space-y-6">
                <Note
                    open={showNoteModal}
                    onOpenChange={setShowNoteModal}
                    balanceSheetId={balanceSheet.id}
                />

                <Compare
                    open={showCompareModal}
                    onOpenChange={setShowCompareModal}
                    balanceSheetId={balanceSheet.id}
                    otherBalanceSheets={otherBalanceSheets}
                />

                <Generate
                    open={showGenerateModal}
                    onOpenChange={setShowGenerateModal}
                />

                <YearEndClose
                    open={showYearEndModal}
                    onOpenChange={setShowYearEndModal}
                />

                {/* Operations & Details Bar */}
                <Card className="shadow border-gray-200/50 dark:border-zinc-800/50">
                    <CardContent className="p-2.5 flex flex-col md:flex-row items-center justify-between gap-4 sm:px-6 sm:py-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {allBalanceSheets && allBalanceSheets.length > 0 && (
                                <Select
                                    value={balanceSheet.id.toString()}
                                    onValueChange={(value) => router.visit(route('double-entry.balance-sheets.show', value))}
                                >
                                    <SelectTrigger className="w-[200px] h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allBalanceSheets.map((sheet) => (
                                            <SelectItem key={sheet.id} value={sheet.id.toString()}>
                                                {formatDate(sheet.balance_sheet_date)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <div className="flex items-center gap-2">
                                <BadgeUI className={balanceSheet.is_balanced
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/30'
                                    : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-900/30'
                                }>
                                    {t(balanceSheet.is_balanced ? 'Balanced' : 'Unbalanced')}
                                </BadgeUI>
                                <BadgeUI className={balanceSheet.status === 'finalized'
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/30'
                                    : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-400 dark:ring-amber-900/30'
                                }>
                                    {t(balanceSheet.status === 'finalized' ? 'Finalized' : 'Draft')}
                                </BadgeUI>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {auth.user?.permissions?.includes('create-balance-sheet-notes') && (
                                <Button variant="outline" size="sm" onClick={() => setShowNoteModal(true)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    {t('Add Note')}
                                </Button>
                            )}
                            {auth.user?.permissions?.includes('create-balance-sheet-comparisons') && (
                                <Button variant="outline" size="sm" onClick={() => setShowCompareModal(true)}>
                                    <GitCompare className="h-4 w-4 mr-1" />
                                    {t('Compare')}
                                </Button>
                            )}
                            {auth.user?.permissions?.includes('finalize-balance-sheets') &&
                                balanceSheet.status === 'draft' &&
                                balanceSheet.is_balanced && (
                                    <Button size="sm" onClick={handleFinalize}>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        {t('Finalize')}
                                    </Button>
                                )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Assets */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('Total Assets')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-emerald-800 dark:text-emerald-200">
                                    {formatCurrency(balanceSheet.total_assets)}
                                </h3>
                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">{t('Organization resources')}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-emerald-700 dark:text-emerald-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Total Liabilities */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{t('Total Liabilities')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-rose-800 dark:text-rose-200">
                                    {formatCurrency(balanceSheet.total_liabilities)}
                                </h3>
                                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">{t('Amounts owed to creditors')}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-rose-700 dark:text-rose-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Total Equity */}
                    <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 hover:shadow-md transition-all">
                        <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Total Equity')}</p>
                                <h3 className="text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-200">
                                    {formatCurrency(balanceSheet.total_equity)}
                                </h3>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">{t('Owner/Shareholder value')}</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-700 dark:text-blue-300 opacity-85 flex-shrink-0" />
                        </CardContent>
                    </Card>

                    {/* Balance Status */}
                    {balanceSheet.is_balanced ? (
                        <Card className="relative overflow-hidden bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 dark:from-teal-900/30 dark:to-teal-800/20 dark:border-teal-800/50 hover:shadow-md transition-all">
                            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{t('Balance Status')}</p>
                                    <h3 className="text-2xl font-bold tracking-tight text-teal-800 dark:text-teal-200">
                                        {t('Balanced')}
                                    </h3>
                                    <p className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-1">{t('Assets match liabilities + equity')}</p>
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
                                        {t('Unbalanced')}
                                    </h3>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">{t('Discrepancies found')}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-amber-700 dark:text-amber-300 opacity-85 flex-shrink-0" />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {!balanceSheet.is_balanced && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <p className="text-amber-800 dark:text-amber-300 font-medium text-sm">
                            {t('Warning: This balance sheet is not balanced! Assets should equal Liabilities + Equity.')}
                        </p>
                    </div>
                )}

                {/* Balance Sheet Content */}
                <Card className="shadow border-gray-200/50 dark:border-zinc-800/50">
                    <CardContent className="p-8">
                        <div className="flex sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
                                <FileText className="h-6 w-6 text-primary" />
                                {t('Statement of Financial Position')}
                            </h2>
                            <div className="text-sm font-medium text-muted-foreground">
                                {t('As of')}: <span className="font-semibold text-gray-950 dark:text-gray-50">{formatDate(balanceSheet.balance_sheet_date)}</span>
                            </div>
                        </div>

                        {viewType === 'vertical' ? (
                            <>
                                {renderSection('assets', t('Assets'))}
                                {renderSection('liabilities', t('Liabilities'))}
                                {renderSection('equity', t('Equity'))}
                            </>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Side - Liabilities & Equity */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-250 mb-4 border-b pb-2">{t('Liabilities & Equity')}</h3>
                                    {renderSection('equity', t('Equity'))}
                                    {renderSection('liabilities', t('Liabilities'))}
                                </div>

                                {/* Right Side - Assets */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-250 mb-4 border-b pb-2">{t('Assets')}</h3>
                                    {renderSection('assets', t('Assets'))}
                                </div>
                            </div>
                        )}

                        {/* Balance Totals - Always Show */}
                        <div className="mt-8 pt-6 border-t-2 border-gray-400 dark:border-zinc-700">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="flex justify-between py-3 font-bold text-lg text-rose-600 dark:text-rose-400 bg-rose-50/10 dark:bg-rose-950/5 px-4 rounded border border-dashed border-rose-200 dark:border-rose-900/30">
                                    <span>{t('Total Liabilities & Equity')}</span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            (groupedItems.liabilities ?
                                                Object.values(groupedItems.liabilities).flat().reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) : 0) +
                                            (groupedItems.equity ?
                                                Object.values(groupedItems.equity).flat().reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) : 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between py-3 font-bold text-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/5 px-4 rounded border border-dashed border-emerald-200 dark:border-emerald-900/30">
                                    <span>{t('Total Assets')}</span>
                                    <span className="tabular-nums">
                                        {formatCurrency(
                                            groupedItems.assets ?
                                                Object.values(groupedItems.assets).flat().reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0) : 0
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {balanceSheet.notes && balanceSheet.notes.length > 0 && (
                            <div className="mt-8 pt-6 border-t dark:border-zinc-800">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-150">{t('Notes to Balance Sheet')}</h3>
                                <div className="space-y-4">
                                    {balanceSheet.notes.map((note: any) => (
                                        <div key={note.id} className="p-4 border dark:border-zinc-800/50 rounded-lg shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                        {t('Note')} {note.note_number}: {note.note_title}
                                                    </h4>
                                                    <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">{note.note_content}</p>
                                                </div>
                                                {auth.user?.permissions?.includes('delete-balance-sheet-notes') && (
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('Delete Note')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Note')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />
            </div>
        </AuthenticatedLayout>
    );
}
