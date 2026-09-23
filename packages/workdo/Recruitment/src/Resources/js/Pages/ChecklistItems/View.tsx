import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { CheckCircle, Calendar, User, Tag, Clock, AlertCircle } from 'lucide-react';
import { ChecklistItem } from './types';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

interface ViewProps {
    checklistitem: ChecklistItem;
}

export default function View({ checklistitem }: ViewProps) {
    const { t } = useTranslation();

    const getCategoryBadge = (category: string) => {
        const styles = {
            'Other': 'bg-gray-100 text-gray-800 ring-gray-200',
            'Documentation': 'bg-blue-100 text-blue-800 ring-blue-200',
            'HR': 'bg-orange-100 text-orange-800 ring-orange-200',
            'IT Setup': 'bg-purple-100 text-purple-800 ring-purple-200',
            'Training': 'bg-green-100 text-green-800 ring-green-200',
            'Facilities': 'bg-yellow-100 text-yellow-800 ring-yellow-200'
        };
        return styles[category] || 'bg-gray-100 text-gray-800 ring-gray-200';
    };

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <DialogTitle className="text-xl font-semibold">{t('Checklist Item Details')}</DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <Tag className="h-4 w-4" />
                                {t('Task Name')}
                            </label>
                            <p className="text-base font-medium">{checklistitem.task_name}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4" />
                                {t('Checklist')}
                            </label>
                            {checklistitem.checklist?.name ? (
                                <p><RandomBadgeUI name={checklistitem.checklist.name} /></p>
                            ) : (
                                <p className="text-gray-400">-</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <Tag className="h-4 w-4" />
                                {t('Category')}
                            </label>
                            {checklistitem.category ? (
                                <BadgeUI className={getCategoryBadge(checklistitem.category)}>{checklistitem.category}</BadgeUI>
                            ) : (
                                <p className="text-gray-400">-</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <User className="h-4 w-4" />
                                {t('Assigned To Role')}
                            </label>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{checklistitem.assigned_to_role || '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4" />
                                {t('Due Days')}
                            </label>
                            {checklistitem.due_day !== undefined && checklistitem.due_day !== null ? (
                                <BadgeUI className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200">
                                    {checklistitem.due_day} {checklistitem.due_day === 1 ? t('Day') : t('Days')}
                                </BadgeUI>
                            ) : (
                                <p className="text-gray-400">-</p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4" />
                                {t('Status')}
                            </label>
                            <BadgeUI className={checklistitem.status ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-red-100 text-red-800 ring-red-200'}>
                                {checklistitem.status ? t('Active') : t('Inactive')}
                            </BadgeUI>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4" />
                                {t('Required')}
                            </label>
                            <BadgeUI className={checklistitem.is_required ? 'bg-red-100 text-red-800 ring-red-200' : 'bg-green-100 text-green-800 ring-green-200'}>
                                {checklistitem.is_required ? t('Yes') : t('No')}
                            </BadgeUI>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {checklistitem.description && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                            {t('Description')}
                        </label>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-base leading-relaxed whitespace-pre-wrap">{checklistitem.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}