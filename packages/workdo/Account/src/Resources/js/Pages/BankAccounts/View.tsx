import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { CreditCard, Landmark } from 'lucide-react';
import { BankAccount } from './types';
import { formatCurrency } from '@/utils/helpers';
import RandomBadgeUI from "@/components/random-badge-ui";
import BadgeUI from "@/components/badge-ui";

interface ViewProps {
    bankaccount: BankAccount;
}

export default function View({ bankaccount }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                            {t('Bank Account Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="p-4 sm:p-6 space-y-6">
                {/* General Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Account Number')}
                            </label>
                            <div className="flex mt-1">
                                <RandomBadgeUI name={bankaccount.account_number} />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Account Name')}
                            </label>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                                {bankaccount.account_name || '-'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Account Type')}
                            </label>
                            <div className="flex mt-1">
                                {(() => {
                                    const options: any = { "0": "checking", "1": "savings", "2": "credit", "3": "loan" };
                                    const label = options[bankaccount.account_type] || bankaccount.account_type;
                                    return <RandomBadgeUI className='capitalize' name={t(label)} />;
                                })()}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('GL Account')}
                            </label>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                                {bankaccount.gl_account ? `${bankaccount.gl_account.account_code || ''} - ${bankaccount.gl_account.account_name}` : '-'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Opening Balance')}
                            </label>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                                {formatCurrency(bankaccount.opening_balance || 0)}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Current Balance')}
                            </label>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                {formatCurrency(bankaccount.current_balance || 0)}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Status')}
                            </label>
                            <div className="flex mt-1.5">
                                <BadgeUI className={`${!bankaccount.is_active
                                    ? 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20'
                                    : 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20'
                                    }`}>
                                    {bankaccount.is_active ? t('Active') : t('Inactive')}
                                </BadgeUI>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Details section */}
                <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" />
                        {t('Bank Details')}
                    </h4>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/60 p-5 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{t('Bank Name')}</label>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{bankaccount.bank_name || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{t('Branch Name')}</label>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{bankaccount.branch_name || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{t('IBAN')}</label>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{bankaccount.iban || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{t('SWIFT Code')}</label>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{bankaccount.swift_code || '-'}</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{t('Routing Number')}</label>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{bankaccount.routing_number || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}
