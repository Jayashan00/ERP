import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import { Calendar, Banknote, UserIcon, FileText, Wallet, Receipt } from 'lucide-react';
import RandomBadgeUI from '@/components/random-badge-ui';

interface Revenue {
    id: number;
    revenue_number: string;
    revenue_date: string;
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

interface ShowRevenueProps {
    revenue: Revenue;
}

export default function Show({ revenue }: ShowRevenueProps) {
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
                        {t('Revenue Details')}
                    </DialogTitle>
                    <RandomBadgeUI name={revenue.revenue_number} />
                </div>
            </DialogHeader>

            <div className="space-y-6 my-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Amount Banner */}
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-5 flex items-center justify-between col-span-1 md:col-span-2 shadow-sm">
                        <div>
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 tracking-wider">{t('Amount')}</span>
                            <div className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-100 mt-0.5">
                                {formatCurrency(revenue.amount)}
                            </div>
                        </div>
                        <div className="bg-emerald-500/15 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Banknote className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Left Column Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Revenue Date')}
                            </span>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{formatDate(revenue.revenue_date)}</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Category')}
                            </span>
                            {revenue.category?.category_name ? <RandomBadgeUI name={revenue.category?.category_name} /> : '-'}
                        </div>

                        {revenue.reference_number && (
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">{t('Reference Number')}</span>
                                {revenue.reference_number ? <RandomBadgeUI name={revenue.reference_number} /> : '-'}
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
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{revenue.bank_account?.account_name || '-'}</p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('Status')}</span>
                            <div className="mt-0.5">{getStatusBadge(revenue.status)}</div>
                        </div>

                        {/* Chart of Account Span */}
                        {revenue.chart_of_account && (
                            <div className="space-y-1 col-span-1 md:col-span-2">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                                    {t('Chart of Account')}
                                </span>
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    {revenue.chart_of_account.account_code} - {revenue.chart_of_account.account_name}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Approved By User Card */}
                    {revenue.approved_by && (
                        <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider block mb-2">{t('Approved By')}</span>
                            <div className="flex items-center gap-3 ">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                                    {revenue.approved_by.avatar ? (
                                        <img src={getImagePath(revenue.approved_by.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{revenue.approved_by.name}</span>
                                    <span className="text-xs text-muted-foreground">{revenue.approved_by.email || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description Area */}
                    {revenue.description && (
                        <div className="col-span-1 md:col-span-2 border-t pt-4">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider block mb-2">{t('Description')}</span>
                            <div className="p-3.5 bg-gray-50 dark:bg-zinc-900 border rounded-lg text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {revenue.description}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DialogContent>
    );
}
