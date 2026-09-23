import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Star, FileText, Calendar } from "lucide-react";
import { usePage } from '@inertiajs/react';
import { formatDate } from '@/utils/helpers';
import UserColumn from '@/components/user-column';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

interface PerformanceIndicator {
    id: number;
    name: string;
    user_rating: number;
    category: {
        name: string;
    };
}

interface EmployeeReview {
    id: number;
    user: { id?: number; name: string; email?: string; avatar?: string | null };
    reviewer: { id?: number; name: string; email?: string; avatar?: string | null };
    review_cycle: { id?: number; name: string };
    review_date: string;
    status: string;
    pros?: string;
    cons?: string;
    completion_date?: string;
}

interface ShowProps {
    employeeReview: EmployeeReview;
    performanceIndicators: { [categoryName: string]: PerformanceIndicator[] };
    averageRating: number | null;
}

export default function Show({ employeeReview, performanceIndicators, averageRating }: ShowProps) {
    const { t } = useTranslation();
    const { users, review_cycles } = usePage<any>().props;

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:ring-yellow-500/20',
            in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
            completed: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
            cancelled: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
        };
        return colors[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20';
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            pending: t('Pending'),
            in_progress: t('In Progress'),
            completed: t('Completed'),
            cancelled: t('Cancelled')
        };
        return labels[status] || status;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${
                            star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    const userObj = users?.find((user: any) => user.id.toString() === employeeReview.user?.id?.toString()) || employeeReview.user;
    const reviewerObj = users?.find((user: any) => user.id.toString() === employeeReview.reviewer?.id?.toString()) || employeeReview.reviewer;
    const cycleName = review_cycles?.find((cycle: any) => cycle.id.toString() === employeeReview.review_cycle?.id?.toString())?.name || employeeReview.review_cycle?.name;

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold">{t('Employee Review Details')}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{employeeReview.user?.name}</p>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Employee')}</label>
                            <UserColumn user={userObj || null} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Reviewer')}</label>
                            <UserColumn user={reviewerObj || null} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Review Cycle')}</label>
                            <div>
                                {cycleName ? <RandomBadgeUI name={cycleName} /> : <span className="text-sm text-gray-900">-</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Status')}</label>
                            <div>
                                <BadgeUI className={getStatusColor(employeeReview.status)}>
                                    {getStatusLabel(employeeReview.status)}
                                </BadgeUI>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Review Date')}
                            </label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(employeeReview.review_date)}</p>
                        </div>
                        {employeeReview.completion_date && (
                            <div>
                                <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {t('Completion Date')}
                                </label>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(employeeReview.completion_date)}</p>
                            </div>
                        )}
                    </div>
                    
                    {averageRating && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Average Rating')}</label>
                            <div className="mt-1 flex items-center gap-2">
                                {renderStars(Math.round(averageRating))}
                                <span className="text-sm text-gray-900">{averageRating.toFixed(1)}/5</span>
                            </div>
                        </div>
                    )}
                </div>

                {Object.keys(performanceIndicators).length > 0 && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">{t('Performance Ratings')}</label>
                        <div className="mt-2 space-y-3">
                            {Object.entries(performanceIndicators).map(([categoryName, indicators]) => (
                                <div key={categoryName}>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                                        {categoryName || t('Uncategorized')}
                                    </h3>
                                    <div className="space-y-2">
                                        {indicators.map((indicator) => (
                                            <div key={indicator.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm text-gray-900">{indicator.name}</span>
                                                <div className="flex items-center gap-1">
                                                    {renderStars(indicator.user_rating)}
                                                    <span className="text-xs text-gray-600 ml-1">{indicator.user_rating}/5</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {employeeReview.pros && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">{t('Pros')}</label>
                        <div className="mt-1 p-3 bg-green-50 rounded border-l-2 border-green-400">
                            <div className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: employeeReview.pros }} />
                        </div>
                    </div>
                )}

                {employeeReview.cons && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">{t('Cons')}</label>
                        <div className="mt-1 p-3 bg-red-50 rounded border-l-2 border-red-400">
                            <div className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: employeeReview.cons }} />
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}