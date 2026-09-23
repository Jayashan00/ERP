import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calendar } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatDate } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

interface PerformanceIndicator {
    id: number;
    name: string;
    description: string;
    measurement_unit: string;
    target_value: string;
    status: string;
    created_at: string;
    updated_at: string;
    category?: {
        id: number;
        name: string;
    };
}

interface ShowProps {
    indicator: PerformanceIndicator;
}

export default function Show({ indicator }: ShowProps) {
    const { t } = useTranslation();
    const { categories } = usePage<any>().props;

    const getStatusColor = (status: string) => {
        return status === 'active' 
            ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20' 
            : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20';
    };

    const getStatusLabel = (status: string) => {
        return status === 'active' ? t('Active') : t('Inactive');
    };

    const categoryName = categories?.find((cat: any) => cat.id.toString() === indicator.category?.id?.toString())?.name || indicator.category?.name;

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold">{t('Performance Indicator Details')}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{indicator.name}</p>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Name')}</label>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{indicator.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Category')}</label>
                            <div>
                                {categoryName ? <RandomBadgeUI name={categoryName} /> : <span className="text-sm text-gray-900">-</span>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Measurement Unit')}</label>
                            <p className="mt-1 text-sm text-gray-900">{indicator.measurement_unit || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Target Value')}</label>
                            <p className="mt-1 text-sm text-gray-900">{indicator.target_value || '-'}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Status')}</label>
                            <div>
                                <BadgeUI className={getStatusColor(indicator.status)}>
                                    {getStatusLabel(indicator.status)}
                                </BadgeUI>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Created At')}
                            </label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(indicator.created_at)}</p>
                        </div>
                    </div>
                </div>

                {indicator.description && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">{t('Description')}</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{indicator.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}