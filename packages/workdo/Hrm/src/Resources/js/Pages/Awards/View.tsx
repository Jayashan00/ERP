import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Award as AwardIcon, User, Calendar, FileText, ExternalLink } from 'lucide-react';
import { Award } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';
import UserColumn from '@/components/user-column';
import RandomBadgeUI from '@/components/random-badge-ui';

interface ViewAwardProps {
    award: Award;
}

export default function View({ award }: ViewAwardProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <AwardIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {t('Award Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
                {/* Employee Name Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5">
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Employee Name')}
                    </label>
                    <UserColumn user={award.employee} />
                </div>

                {/* Award Type Card */}
                <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <AwardIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {t('Award Type')}
                    </label>
                    <div>
                        {award.award_type?.name ? (
                            <RandomBadgeUI name={award.award_type.name} />
                        ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                        )}
                    </div>
                </div>

                {/* Award Date & Certificate Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Award Date')}
                        </label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            {award.award_date ? (
                                <span>{formatDate(award.award_date)}</span>
                            ) : '-'}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Certificate')}
                        </label>
                        <div>
                            {award.certificate ? (
                                <a
                                    href={getImagePath(award.certificate)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline pt-0.5"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>{t('View Certificate')}</span>
                                </a>
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description Card */}
                {award.description && (
                    <div className="p-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-1.5">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {t('Description')}
                        </label>
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {award.description}
                        </p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}