import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, User, Clock, CheckCircle, MessageSquare, Tag } from 'lucide-react';
import { LeaveApplication } from './types';
import { formatDate, formatDateTime } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import UserColumn from '@/components/user-column';

interface ViewProps {
    leaveapplication: LeaveApplication;
}

export default function View({ leaveapplication }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold">{t('Leave Application Details')}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{leaveapplication.employee?.name || 'Unknown Employee'}</p>
                    </div>
                </div>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {t('Employee')}
                            </label>
                            <p className="mt-1 font-medium">{leaveapplication.employee?.name || '-'}</p>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                {t('Leave Type')}
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: leaveapplication.leave_type?.color || '#gray' }}
                                ></div>
                                <p className="font-medium">{leaveapplication.leave_type?.name || '-'}</p>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {t('Start Date')}
                            </label>
                            <div className="flex items-center gap-1.5 mt-1 font-medium text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{leaveapplication.start_date ? formatDate(leaveapplication.start_date) : '-'}</span>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {t('End Date')}
                            </label>
                            <div className="flex items-center gap-1.5 mt-1 font-medium text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{leaveapplication.end_date ? formatDate(leaveapplication.end_date) : '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {t('Total Days')}
                            </label>
                            <p className="mt-1 font-medium">{leaveapplication.total_days || '-'}</p>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                {t('Status')}
                            </label>
                            <div className="mt-1">
                                <BadgeUI className={
                                    leaveapplication.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 ring-amber-600/10' :
                                    leaveapplication.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 ring-emerald-600/10' :
                                    leaveapplication.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 ring-rose-600/10' :
                                    'bg-slate-50 text-slate-700 ring-slate-600/10'
                                }>
                                    {t(leaveapplication.status?.charAt(0).toUpperCase() + leaveapplication.status?.slice(1) || 'Unknown')}
                                </BadgeUI>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {t('Approved By')}
                            </label>
                            <p className="mt-1 font-medium">{leaveapplication.approved_by?.name || '-'}</p>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {t('Approved At')}
                            </label>
                            <div className="flex items-center gap-1.5 mt-1 font-medium text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{leaveapplication.approved_at ? formatDateTime(leaveapplication.approved_at) : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {leaveapplication.reason && (
                    <div>
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('Reason')}
                        </label>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm">{leaveapplication.reason}</p>
                        </div>
                    </div>
                )}
                
                <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {t('Approver Comment')}
                    </label>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">{leaveapplication.approver_comment || '-'}</p>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}