import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, User, CheckCircle, Tag } from 'lucide-react';
import { Document } from './types';
import UserColumn from '@/components/user-column';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { formatDate } from '@/utils/helpers';
import { usePage } from '@inertiajs/react';

interface ViewProps {
    document: Document;
}

export default function View({ document }: ViewProps) {
    const { t } = useTranslation();
    const { documentcategories } = usePage<any>().props;
    
    const documentCategory = documentcategories?.find((item: any) => item.id.toString() === document.document_category_id?.toString())?.document_type || (document as any).documentCategory?.document_type;
    const uploadedByUser = document.uploaded_by || (document as any).uploadedBy;
    const approvedByUser = document.approved_by || (document as any).approvedBy;

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approve':
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
            case 'pending':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
            case 'reject':
            case 'rejected':
                return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20';
            default:
                return 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700';
        }
    };

    const statusLabels: Record<string, string> = { 'pending': 'Pending', 'approve': 'Approved', 'reject': 'Rejected' };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {t('Document Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
                {/* Title Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Title')}
                    </label>
                    <p className="font-semibold text-base text-gray-900 dark:text-gray-100 leading-snug">
                        {document.title || '-'}
                    </p>
                </div>

                {/* Document Category Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Document Category')}
                    </label>
                    <div>
                        {documentCategory ? (
                            <RandomBadgeUI name={documentCategory} />
                        ) : '-'}
                    </div>
                </div>

                {/* Status & Effective Date Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Status')}
                        </label>
                        <div>
                            <BadgeUI className={getStatusBadgeClass(document.status)}>
                                {t(statusLabels[document.status?.toLowerCase()] || document.status || '-')}
                            </BadgeUI>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Effective Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <span>{document.effective_date ? formatDate(document.effective_date) : '-'}</span>
                        </p>
                    </div>
                </div>

                {/* Uploaded By & Approved By Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Uploaded By')}
                        </label>
                        {uploadedByUser?.name ? (
                            <UserColumn user={uploadedByUser} />
                        ) : (
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">-</p>
                        )}
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-900/50 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Approved By')}
                        </label>
                        {approvedByUser?.name ? (
                            <UserColumn user={approvedByUser} />
                        ) : (
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">-</p>
                        )}
                    </div>
                </div>

                {/* Description Card */}
                {document.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {document.description}
                        </p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}