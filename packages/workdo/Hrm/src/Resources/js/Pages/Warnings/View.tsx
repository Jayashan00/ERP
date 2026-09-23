import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { User, Calendar, FileText, AlertOctagon, CheckCircle2, XCircle, ShieldAlert, MessageSquare, Download } from 'lucide-react';
import { formatDate, getImagePath } from '@/utils/helpers';
import { Warning } from './types';
import UserColumn from '@/components/user-column';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

const getStatusBadge = (status: string, t: any) => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return (
                <BadgeUI className="bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    {t('Approved')}
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

const getSeverityBadge = (severity: string, t: any) => {
    switch (severity) {
        case 'Major':
            return (
                <BadgeUI className="bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
                    {t('Major')}
                </BadgeUI>
            );
        case 'Moderate':
            return (
                <BadgeUI className="bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                    {t('Moderate')}
                </BadgeUI>
            );
        default:
            return (
                <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                    {t('Minor')}
                </BadgeUI>
            );
    }
};

interface WarningViewProps {
    warning: Warning;
    onClose?: () => void;
}

export default function WarningView({ warning }: WarningViewProps) {
    const { t } = useTranslation();

    const warningByObj = typeof warning.warning_by === 'object' && warning.warning_by !== null ? warning.warning_by : warning.warningBy;
    const warningTypeObj = typeof warning.warning_type === 'object' && warning.warning_type !== null ? warning.warning_type : warning.warningType;

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <AlertOctagon className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {t('Warning Details')}
                            </DialogTitle>
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(warning.status || 'pending', t)}
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
                {/* Employee Info Box */}
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 flex items-center justify-between gap-4">
                    <UserColumn user={warning.employee} />

                    {/* Rejected Stamp inside Employee Card when Rejected */}
                    {warning.status?.toLowerCase() === 'rejected' && (
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

                {/* Warning Details Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Warning By Card */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Warning By')}
                        </label>
                        <UserColumn user={warningByObj} />
                    </div>

                    {/* Warning Type Card */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Warning Type')}
                        </label>
                        <div>
                            {(warningTypeObj?.warning_type_name || warningTypeObj?.name) ? (
                                <RandomBadgeUI name={warningTypeObj?.warning_type_name || warningTypeObj?.name} />
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                        </div>
                    </div>

                    {/* Warning Date Card */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Warning Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <span>{warning.warning_date ? formatDate(warning.warning_date) : '-'}</span>
                        </p>
                    </div>

                    {/* Severity Card */}
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Severity')}
                        </label>
                        <div>
                            {getSeverityBadge(warning.severity, t)}
                        </div>
                    </div>
                </div>

                {/* Subject Card */}
                {warning.subject && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Subject')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {warning.subject}
                        </p>
                    </div>
                )}

                {/* Description Card */}
                {warning.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {warning.description}
                        </p>
                    </div>
                )}

                {/* Document Card */}
                {warning.document && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Document')}
                        </label>
                        <div>
                            <button
                                type="button"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = getImagePath(warning.document);
                                    link.download = warning.document?.split('/').pop() || 'warning-document';
                                    link.click();
                                }}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-0.5"
                                >
                                <Download className="h-4 w-4" />
                                <span>{t('Download Document')}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Employee Response Card */}
                {warning.employee_response && (
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-1.5">
                        <label className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            {t('Employee Response')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {warning.employee_response}
                        </p>
                    </div>
                )}

                {/* Approved By Box with Official Stamp (Shown only when approved) */}
                {warning.status?.toLowerCase() === 'approved' && (
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-4 relative overflow-hidden">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-emerald-800/70 dark:text-emerald-400/70 block capitalize tracking-wider">
                                {t('Issued By')}
                            </span>
                            <UserColumn user={warningByObj} />
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
                                    {t('APPROVED')}
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