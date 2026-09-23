import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { User, Calendar, FileText, Tag, CheckCircle2, XCircle, Download } from 'lucide-react';
import { Resignation } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';
import UserColumn from '@/components/user-column';
import BadgeUI from '@/components/badge-ui';

const getStatusBadge = (status: string, t: any) => {
    switch (status?.toLowerCase()) {
        case 'accepted':
            return (
                <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    {t('Accepted')}
                </BadgeUI>
            );
        case 'rejected':
            return (
                <BadgeUI className="bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
                    {t('Rejected')}
                </BadgeUI>
            );
        default:
            return (
                <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                    {t('Pending')}
                </BadgeUI>
            );
    }
};

interface ViewProps {
    resignation: Resignation;
}

export default function View({ resignation }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {t('Resignation Details')}
                            </DialogTitle>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(resignation.status || 'pending', t)}
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
                {/* Employee Info Box */}
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 flex items-center justify-between gap-4">
                    <UserColumn user={resignation.employee} />

                    {/* Rejected Stamp inside Employee Card when Rejected */}
                    {resignation.status?.toLowerCase() === 'rejected' && (
                        <div className="flex-shrink-0 relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-red-600 dark:border-red-400 p-0.5 bg-red-100/40 dark:bg-red-950/40 rotate-[-12deg] shadow-sm select-none">
                            <div className="w-full h-full rounded-full border border-dashed border-red-600 dark:border-red-400 flex flex-col items-center justify-center p-1 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px]">
                                <div className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                                    <span className="text-[6px]">★</span>
                                    <XCircle className="w-3 h-3" />
                                    <span className="text-[6px]">★</span>
                                </div>
                                <span className="font-black text-[8px] text-red-700 dark:text-red-300 uppercase tracking-widest leading-none mt-0.5">
                                    {t('REJECTED')}
                                </span>
                                <span className="text-[6px] font-bold text-red-600/80 dark:text-red-400/80 tracking-tighter uppercase leading-none mt-0.5">
                                    {t('DECLINED')}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Last Working Date */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Last Working Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <span>{resignation.last_working_date ? formatDate(resignation.last_working_date) : '-'}</span>
                        </p>
                    </div>

                    {/* Document */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Document')}
                        </label>
                        <div>
                            {resignation.document ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = getImagePath(resignation.document);
                                        link.download = resignation.document?.split('/').pop() || 'resignation-document';
                                        link.click();
                                    }}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-0.5"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>{t('Download Document')}</span>
                                </button>
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reason Card */}
                {resignation.reason && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Reason')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {resignation.reason}
                        </p>
                    </div>
                )}

                {/* Description Card */}
                {resignation.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {resignation.description}
                        </p>
                    </div>
                )}

                {/* Approved By Box with Official Stamp (Shown only when approved/accepted) */}
                {resignation.status?.toLowerCase() === 'accepted' && (
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-4 relative overflow-hidden">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-emerald-800/70 dark:text-emerald-400/70 block capitalize tracking-wider">
                                {t('Approved By')}
                            </span>
                            <UserColumn user={resignation.approved_by} />
                        </div>

                        {/* Official Approved Stamp Badge */}
                        <div className="flex-shrink-0 relative flex items-center justify-center w-16 h-16 rounded-full border-2 border-emerald-600 dark:border-emerald-400 p-0.5 bg-emerald-100/40 dark:bg-emerald-950/40 rotate-[-12deg] shadow-sm select-none">
                            <div className="w-full h-full rounded-full border border-dashed border-emerald-600 dark:border-emerald-400 flex flex-col items-center justify-center p-1 text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[1px]">
                                <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="text-[7px]">★</span>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="text-[7px]">★</span>
                                </div>
                                <span className="font-black text-[9px] text-emerald-700 dark:text-emerald-300 uppercase tracking-widest leading-none mt-0.5">
                                    {t('ACCEPTED')}
                                </span>
                                <span className="text-[7px] font-bold text-emerald-600/80 dark:text-emerald-400/80 tracking-tighter uppercase leading-none mt-0.5">
                                    {t('VERIFIED')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}