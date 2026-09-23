import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { RotateCcw, Calendar } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatDate } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import UserColumn from '@/components/user-column';

interface EmployeeReview {
    id: number;
    user: { name: string; avatar?: string; email?: string };
    reviewer: { name: string; avatar?: string; email?: string };
    status: string;
    review_date: string;
    completion_date?: string;
}

interface ReviewCycle {
    id: number;
    name: string;
    frequency: string;
    description?: string;
    status: string;
    created_at: string;
    creator: { name: string; avatar?: string; email?: string };
    created_by: { name: string; avatar?: string; email?: string };
    employee_reviews: EmployeeReview[];
}

interface ShowProps {
    reviewCycle: ReviewCycle;
}

export default function Show({ reviewCycle }: ShowProps) {
    const { t } = useTranslation();
    const { users, frequency_options } = usePage<any>().props;

    const getStatusBadgeClass = (status: string) => {
        const colors: { [key: string]: string } = {
            active: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
            inactive: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20',
            completed: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
        };
        return colors[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20';
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            active: t('Active'),
            inactive: t('Inactive'),
            pending: t('Pending'),
            completed: t('Completed')
        };
        return labels[status] || status;
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <RotateCcw className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold">{t('Review Cycle Details')}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{reviewCycle.name}</p>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Name')}</label>
                            <p className="mt-1 text-sm text-gray-900">{reviewCycle.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Frequency')}</label>
                            <div className="mt-1">
                                <RandomBadgeUI name={frequency_options?.[reviewCycle.frequency] || reviewCycle.frequency || '-'} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Created By')}</label>
                            <div className="mt-1">
                                {reviewCycle.created_by ? <UserColumn user={reviewCycle.created_by} /> : <p className="text-sm text-gray-900">-</p>}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Status')}</label>
                            <div className="mt-1">
                                <BadgeUI className={getStatusBadgeClass(reviewCycle.status)}>
                                    {getStatusLabel(reviewCycle.status)}
                                </BadgeUI>
                            </div>
                        </div>
                    </div>
                </div>

                {reviewCycle.description && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">{t('Description')}</label>
                        <p className="mt-1 text-sm text-gray-900">{reviewCycle.description}</p>
                    </div>
                )}

                {reviewCycle.employee_reviews && reviewCycle.employee_reviews.length > 0 && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">
                            {t('Employee Reviews')} ({reviewCycle.employee_reviews.length})
                        </label>
                        <div className="mt-2 space-y-2">
                            {reviewCycle.employee_reviews.map((review) => (
                                <div key={review.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="min-w-0">
                                                <UserColumn user={review.user} />
                                                {review.reviewer && (
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <span>{t('Reviewer')}:</span>
                                                        <UserColumn user={review.reviewer} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {formatDate(review.review_date)}
                                                </p>
                                                {review.completion_date && (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {t('Completed')}: {formatDate(review.completion_date)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <BadgeUI className={getStatusBadgeClass(review.status)}>
                                        {getStatusLabel(review.status)}
                                    </BadgeUI>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}