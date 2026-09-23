import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Clock, Folder, FileText, User, Calendar, LayoutGrid } from 'lucide-react';
import BadgeUI from "@/components/badge-ui";
import { getImagePath, formatDate } from "@/utils/helpers";
import { usePage } from '@inertiajs/react';

interface Timesheet {
    id: number;
    user: { id: number; name: string; email: string; avatar?: string };
    project_name?: string;
    task_name?: string;
    date: string;
    hours: number;
    minutes: number;
    type: 'clock_in_out' | 'project' | 'manual';
    formatted_time: string;
    notes?: string;
}

interface ViewProps {
    timesheet: Timesheet;
}

export default function View({ timesheet }: ViewProps) {
    const { t } = useTranslation();

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'clock_in_out':
                return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/20';
            case 'project':
                return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20';
            case 'manual':
                return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-700/10 dark:bg-zinc-900/30 dark:text-gray-400 dark:ring-zinc-850/20';
            default:
                return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-700/10 dark:bg-zinc-900/30 dark:text-gray-400 dark:ring-zinc-850/20';
        }
    };

    return (
        <DialogContent className="max-w-xl">
            <DialogHeader className="pb-4 border-b border-gray-150 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                            {t('Timesheet Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="p-4 sm:p-6 space-y-6">
                {/* Employee / User Section */}
                <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-zinc-900/30 border border-gray-150 dark:border-zinc-800 p-4 rounded-xl">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                        {timesheet.user?.avatar ? (
                            <img
                                src={getImagePath(timesheet.user.avatar)}
                                alt={timesheet.user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">
                            {timesheet.user?.name || '-'}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                            {timesheet.user?.email || '-'}
                        </span>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Logged Time */}
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {t('Logged Time')}
                        </span>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-150 tabular-nums">
                            {String(timesheet.hours).padStart(2, '0')}h {String(timesheet.minutes).padStart(2, '0')}m
                        </p>
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {t('Date')}
                        </span>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-150">
                            {formatDate(timesheet.date, usePage().props)}
                        </p>
                    </div>

                    {/* Type */}
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                            {t('Log Type')}
                        </span>
                        <div className="pt-0.5">
                            <BadgeUI className={getTypeStyle(timesheet.type)}>
                                {timesheet.type === 'clock_in_out' ? t('Clock In/Out') :
                                    timesheet.type === 'project' ? t('Project') : t('Manual')}
                            </BadgeUI>
                        </div>
                    </div>

                    {/* Project */}
                    {timesheet.project_name && (
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                                <Folder className="w-3.5 h-3.5 text-primary" />
                                {t('Project')}
                            </span>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-150">
                                {timesheet.project_name}
                            </p>
                        </div>
                    )}

                    {/* Task */}
                    {timesheet.task_name && (
                        <div className="space-y-1 sm:col-span-2">
                            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                {t('Task')}
                            </span>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-150">
                                {timesheet.task_name === 'cash_flow' ? t('Cash Flow') : t(timesheet.task_name)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Notes */}
                {timesheet.notes && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            {t('Notes')}
                        </h4>
                        <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-900/30 border border-gray-150 dark:border-zinc-800 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                            {timesheet.notes}
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
