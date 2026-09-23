import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, X } from 'lucide-react';
import { Offer } from './types';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { usePage, router } from '@inertiajs/react';
import BadgeUI from '@/components/badge-ui';


interface ViewProps {
    offer: Offer;
    onClose?: () => void;
}

export default function View({ offer, onClose }: ViewProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
    const handleApprovalAction = (action: 'approve' | 'reject') => {
        router.post(route('recruitment.offers.approval-status', offer.id), { action }, {
            onSuccess: () => {
                onClose?.();
            }
        });
    };

    const candidateName = (() => {
        const firstName = offer.candidate?.first_name || '';
        const lastName = offer.candidate?.last_name || '';
        return firstName || lastName ? `${firstName} ${lastName}`.trim() : t('Unknown Candidate');
    })();

    const getStatusColor = (status: string) => {
        switch (status) {
            case '0': return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 ring-zinc-600/20 dark:ring-zinc-700/50';
            case '1': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-900/50';
            case '2': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-900/50';
            case '3': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-900/50';
            case '4': return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 ring-red-600/20 dark:ring-red-900/50';
            case '5': return 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 ring-orange-600/20 dark:ring-orange-900/50';
            default: return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        const options: any = { "0": "Draft", "1": "Sent", "2": "Accepted", "3": "Negotiating", "4": "Declined", "5": "Expired" };
        return options[status] || status || t('Unknown');
    };

    const isExpired = offer.expiration_date && offer.expiration_date <= new Date().toISOString().split('T')[0];

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold">{t('Offer Details')}</DialogTitle>
                        </div>
                    </div>
                    <BadgeUI className={getStatusColor(offer.status)}>
                        {t(getStatusText(offer.status))}
                    </BadgeUI>
                </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('Basic Information')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Candidate Name')}</p>
                            <p className="text-gray-900">{candidateName}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Position')}</p>
                            <p className="text-gray-900">{offer.position || t('Not specified')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Email')}</p>
                            <p className="text-gray-900">{offer.candidate?.email || t('Not specified')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Phone')}</p>
                            <p className="text-gray-900">{offer.candidate?.phone || t('Not specified')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Job Title')}</p>
                            <p className="text-gray-900">{offer.job?.title || t('Not specified')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Department')}</p>
                            <p className="text-gray-900">{offer.department?.department_name || t('Not specified')}</p>
                        </div>
                    </div>
                </div>

                {/* Compensation */}
                <div className="bg-green-50 border border-green-400 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('Compensation')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Salary')}</p>
                            <p className="text-xl font-bold text-green-700">{offer.salary ? formatCurrency(offer.salary) : t('Not set')}</p>
                        </div>
                        {offer.bonus && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{t('Bonus')}</p>
                                <p className="text-xl font-bold text-green-700">{formatCurrency(offer.bonus)}</p>
                            </div>
                        )}
                        {offer.equity && (
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{t('Equity')}</p>
                                <p className="text-xl font-bold text-purple-700">{offer.equity}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-blue-50 border border-blue-400 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('Important Dates')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Offer Date')}</p>
                            <p className="text-gray-900">{formatDate(offer.offer_date) || t('Not set')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Start Date')}</p>
                            <p className="text-gray-900">{formatDate(offer.start_date) || t('Not set')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{t('Expires')}</p>
                            <p className={isExpired ? 'text-red-600 font-bold' : 'text-gray-900'}>
                                {formatDate(offer.expiration_date) || t('No limit')}
                                {isExpired && <span className="ml-2 text-xs font-bold">{t('EXPIRED')}</span>}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                {(offer.approved_by || offer.response_date) && (
                    <div className="bg-purple-50 border border-purple-400 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">{t('Additional Information')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {offer.approved_by && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{t('Approved By')}</p>
                                    <p className="text-gray-900">{typeof offer.approved_by === 'object' ? offer.approved_by?.name || t('Unknown User') : offer.approved_by}</p>
                                </div>
                            )}
                            {offer.response_date && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{t('Response Date')}</p>
                                    <p className="text-gray-900">{formatDate(offer.response_date)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Benefits */}
                {offer.benefits && (
                    <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">{t('Benefits')}</h3>
                        <p className="text-gray-700 leading-relaxed">{offer.benefits}</p>
                    </div>
                )}




            </div>

            {auth.user?.permissions?.includes('approve-offers') && (
                <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        onClick={() => handleApprovalAction('approve')}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={offer.approval_status === 'approved'}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {t('Approve')}
                    </Button>
                    <Button
                        onClick={() => handleApprovalAction('reject')}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={offer.approval_status === 'rejected'}
                    >
                        <X className="w-4 h-4 mr-2" />
                        {t('Reject')}
                    </Button>
                </DialogFooter>
            )}


        </DialogContent>
    );
}