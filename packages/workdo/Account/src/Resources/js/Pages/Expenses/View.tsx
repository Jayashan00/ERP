import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import { Calendar, UserIcon, FileText, Wallet, Receipt, Banknote } from 'lucide-react';
import RandomBadgeUI from '@/components/random-badge-ui';

interface Expense {
    id: number;
    expense_number: string;
    expense_date: string;
    category: { id: number; category_name: string };
    bank_account: { id: number; account_name: string };
    chart_of_account?: { id: number; account_code: string; account_name: string };
    amount: string;
    description: string;
    reference_number: string;
    status: 'draft' | 'approved' | 'posted';
    approved_by: { id: number; name: string; email: string; avatar: string } | null;
    creator: { id: number; name: string };
    created_at: string;
}

interface ShowExpenseProps {
    expense: Expense;
}

export default function Show({ expense }: ShowExpenseProps) {
    const { t } = useTranslation();

    const getStatusBadge = (status: string) => {
        const colors = {
            draft: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
            approved: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
            posted: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
        };
        const label = status === 'posted' ? t('Posted') : status === 'approved' ? t('Approved') : t('Draft');
        return (
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border ${colors[status as keyof typeof colors] || 'bg-yellow-50 text-yellow-800'}`}>
                {label}
            </span>
        );
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between pr-6">
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {t('Expense Details')}
                    </DialogTitle>
                    <RandomBadgeUI name={expense.expense_number} />
                </div>
            </DialogHeader>

            <div className="space-y-6 my-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Amount Banner */}
                    <div className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-955/20 dark:to-rose-900/10 border border-rose-200 dark:border-rose-800/50 rounded-xl p-5 flex items-center justify-between col-span-1 md:col-span-2 shadow-sm">
                        <div>
                            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 tracking-wider">{t('Amount')}</span>
                            <div className="text-2xl font-extrabold text-rose-800 dark:text-rose-100 mt-0.5">
                                {formatCurrency(expense.amount)}
                            </div>
                        </div>
                        <div className="bg-rose-500/15 p-2.5 rounded-lg text-rose-600 dark:text-rose-400">
                            <Banknote className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Left Column Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Expense Date')}
                            </span>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{formatDate(expense.expense_date)}</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Category')}
                            </span>
                            {expense.category?.category_name ? <RandomBadgeUI name={expense.category?.category_name} /> : '-'}
                        </div>

                        {expense.reference_number && (
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">{t('Reference Number')}</span>
                                {expense.reference_number ? <RandomBadgeUI name={expense.reference_number} /> : '-'}
                            </div>
                        )}
                    </div>

                    {/* Right Column Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Bank Account')}
                            </span>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{expense.bank_account?.account_name || '-'}</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('Status')}</span>
                            <div className="mt-0.5">{getStatusBadge(expense.status)}</div>
                        </div>

                        {/* Chart of Account Span */}
                        {expense.chart_of_account && (
                            <div className="space-y-1 col-span-1 md:col-span-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                                    {t('Chart of Account')}
                                </span>
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    {expense.chart_of_account.account_code} - {expense.chart_of_account.account_name}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Approved By User Card */}
                    {expense.approved_by && (
                        <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider block mb-2">{t('Approved By')}</span>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                                    {expense.approved_by.avatar ? (
                                        <img src={getImagePath(expense.approved_by.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{expense.approved_by.name}</span>
                                    <span className="text-xs text-muted-foreground">{expense.approved_by.email || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description Area */}
                    {expense.description && (
                        <div className="col-span-1 md:col-span-2 border-t pt-4">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider block mb-2">{t('Description')}</span>
                            <div className="p-3.5 bg-gray-50 dark:bg-zinc-900 border rounded-lg text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {expense.description}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DialogContent>
    );
}
