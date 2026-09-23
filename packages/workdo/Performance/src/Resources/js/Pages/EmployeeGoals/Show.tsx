import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Target, Calendar } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { formatDate } from '@/utils/helpers';
import UserColumn from '@/components/user-column';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

interface EmployeeGoal {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    target: string;
    progress: number;
    status: string;
    created_at: string;
    updated_at: string;
    employee: {
        id: number;
        name: string;
        email?: string;
        avatar?: string | null;
    };
    goal_type: {
        id: number;
        name: string;
    };
}

interface ShowProps {
    goal: EmployeeGoal;
}

export default function Show({ goal }: ShowProps) {
    const { t } = useTranslation();
    const { goal_types } = usePage<any>().props;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20';
            case 'in_progress': return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20';
            case 'not_started': return 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20';
            case 'overdue': return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20';
            default: return 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            completed: t('Completed'),
            in_progress: t('In Progress'),
            not_started: t('Not Started'),
            overdue: t('Overdue')
        };
        return labels[status] || status;
    };

    const goalTypeName = goal_types?.find((type: any) => type.id.toString() === goal.goal_type?.id?.toString())?.name || goal.goal_type?.name;

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold">{t('Employee Goal Details')}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{goal.title}</p>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Title')}</label>
                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{goal.title}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Employee')}</label>
                            <UserColumn user={goal.employee || null} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Goal Type')}</label>
                            <div>
                                {goalTypeName ? <RandomBadgeUI name={goalTypeName} /> : <span className="text-sm text-gray-900">-</span>}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Target')}</label>
                            <p className="mt-1 text-sm text-gray-900">{goal.target || '-'}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Progress')}</label>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-900">{goal.progress || 0}%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-1 block">{t('Status')}</label>
                            <div>
                                <BadgeUI className={getStatusColor(goal.status)}>
                                    {getStatusLabel(goal.status)}
                                </BadgeUI>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Start Date')}
                            </label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(goal.start_date)}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('End Date')}
                            </label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(goal.end_date)}</p>
                        </div>
                    </div>
                </div>

                {goal.description && (
                    <div>
                        <label className="text-sm font-medium text-gray-500">{t('Description')}</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{goal.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}