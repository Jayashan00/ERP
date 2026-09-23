import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BadgeUI from '@/components/badge-ui';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Users, Play, X, CalendarDays } from 'lucide-react';
import { formatDateTime, getImagePath } from '@/utils/helpers';
import { ZoomMeeting } from './types';
import { toast } from 'sonner';

interface ShowModalProps {
    isOpen: boolean;
    onClose: () => void;
    zoommeeting: ZoomMeeting;
    users: Array<{id: number; name: string}>;
}

export default function Show({ isOpen, onClose, zoommeeting, users }: ShowModalProps) {
    const { t } = useTranslation();
    const { auth } = usePage().props as any;

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast.success(t('Meeting URL copied to clipboard'));
    };

    const getParticipantNames = () => {
        if (!zoommeeting.participants) return [];
        let items = [];
        if (typeof zoommeeting.participants === 'string') {
            try {
                items = JSON.parse(zoommeeting.participants);
            } catch {
                items = [zoommeeting.participants];
            }
        } else if (Array.isArray(zoommeeting.participants)) {
            items = zoommeeting.participants;
        }
        return items.map((item: any) => {
            const user = users.find((u: any) => u.id.toString() === item?.toString());
            return user?.name || item;
        });
    };

    const statusColors: Record<string, string> = {
        "Scheduled": "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/20 dark:text-amber-300 dark:ring-amber-500/20",
        "Started": "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/20 dark:text-emerald-300 dark:ring-emerald-500/20",
        "Ended": "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/20 dark:text-purple-300 dark:ring-purple-500/20",
        "Cancelled": "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/20 dark:text-rose-300 dark:ring-rose-500/20"
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="transform-gpu sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('Meeting Details')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-2 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Title')}</label>
                            <p className="mt-1 text-sm text-gray-900">{zoommeeting.title}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Meeting ID')}</label>
                            <p className="mt-1 text-sm text-gray-900">{zoommeeting.meeting_id || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Meeting Password')}</label>
                            <p className="mt-1 text-sm text-gray-900">{zoommeeting.meeting_password || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Start Time')}</label>
                            <p className="mt-1 text-sm text-gray-900 flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                {zoommeeting.start_time ? formatDateTime(zoommeeting.start_time) : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Duration')}</label>
                            <p className="mt-1 text-sm text-gray-900">{zoommeeting.duration ? `${zoommeeting.duration} minutes` : '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Status')}</label>
                            <div className="mt-1">
                                <BadgeUI className={statusColors[zoommeeting.status] || 'bg-gray-100 text-gray-800'}>
                                    {t(zoommeeting.status)}
                                </BadgeUI>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Host')}</label>
                            {zoommeeting.host?.name ? (
                                <div className="mt-1 flex items-center gap-2">
                                    <img
                                        src={getImagePath(zoommeeting.host?.avatar || '')}
                                        alt={zoommeeting.host.name}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                    />
                                    <span className="text-sm text-gray-900">{zoommeeting.host.name}</span>
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-gray-900">-</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('Description')}</label>
                        <p className="mt-1 text-sm text-gray-900">{zoommeeting.description || '-'}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('Participants')}</label>
                        <div className="mt-1">
                            {(() => {
                                if (!zoommeeting.participants) return <span className="text-sm text-gray-500">-</span>;
                                let items = [];
                                if (typeof zoommeeting.participants === 'string') {
                                    try {
                                        items = JSON.parse(zoommeeting.participants);
                                    } catch {
                                        items = [zoommeeting.participants];
                                    }
                                } else if (Array.isArray(zoommeeting.participants)) {
                                    items = zoommeeting.participants;
                                }
                                if (items.length === 0) return <span className="text-sm text-gray-500">-</span>;
                                return (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <TooltipProvider>
                                            {items.map((item: any, index: number) => {
                                                const modelItem = users.find((u: any) => u.id.toString() === item?.toString());
                                                const userName = modelItem?.name || item;
                                                return (
                                                    <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                                          <img
                                                                src={getImagePath(modelItem?.avatar || '')}
                                                                alt={userName}
                                                                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                            />
                                                        <span className="text-sm font-medium text-gray-700">{userName}</span>
                                                    </div>
                                                );
                                            })}
                                        </TooltipProvider>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Host Video')}</label>
                            <div className="mt-1">
                                <BadgeUI color={zoommeeting.host_video ? "#10b981" : "#6b7280"}>
                                    {zoommeeting.host_video ? t('Enabled') : t('Disabled')}
                                </BadgeUI>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Participant Video')}</label>
                            <div className="mt-1">
                                <BadgeUI color={zoommeeting.participant_video ? "#10b981" : "#6b7280"}>
                                    {zoommeeting.participant_video ? t('Enabled') : t('Disabled')}
                                </BadgeUI>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Waiting Room')}</label>
                            <div className="mt-1">
                                <BadgeUI color={zoommeeting.waiting_room ? "#10b981" : "#6b7280"}>
                                    {zoommeeting.waiting_room ? t('Enabled') : t('Disabled')}
                                </BadgeUI>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">{t('Recording')}</label>
                            <div className="mt-1">
                                <BadgeUI color={zoommeeting.recording ? "#10b981" : "#6b7280"}>
                                    {zoommeeting.recording ? t('Enabled') : t('Disabled')}
                                </BadgeUI>
                            </div>
                        </div>
                    </div>

                    {zoommeeting.meeting_id && ['Scheduled', 'Started'].includes(zoommeeting.status) && (
                        <div className="border-t pt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-4">{t('Meeting Links')}</h4>
                            <div className="space-y-3">
                                {auth.user?.permissions?.includes('join-zoom-meetings') && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 w-20">{t('Join URL')}:</span>
                                        <code className="flex-1 min-w-0 text-xs bg-gray-100 p-2 rounded break-all">
                                            {zoommeeting.join_url || `https://zoom.us/j/${zoommeeting.meeting_id}`}
                                        </code>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(zoommeeting.join_url || `https://zoom.us/j/${zoommeeting.meeting_id}`, 'join')}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Copy Join URL')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}
                                {auth.user?.permissions?.includes('start-zoom-meetings') && (zoommeeting.host_id === auth.user?.id || auth.user?.type === 'company') && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 w-20">{t('Start URL')}:</span>
                                        <code className="flex-1 min-w-0 text-xs bg-gray-100 p-2 rounded break-all">
                                            {zoommeeting.start_url || `https://zoom.us/s/${zoommeeting.meeting_id}`}
                                        </code>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(zoommeeting.start_url || `https://zoom.us/s/${zoommeeting.meeting_id}`, 'start')}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Copy Start URL')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <TooltipProvider>
                        {zoommeeting.meeting_id && ['Scheduled', 'Started'].includes(zoommeeting.status) && auth.user?.permissions?.includes('join-zoom-meetings') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(zoommeeting.join_url || `https://zoom.us/j/${zoommeeting.meeting_id}`, '_blank')}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        {t('Join Meeting')}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Join Meeting')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {zoommeeting.meeting_id && ['Scheduled', 'Started'].includes(zoommeeting.status) && auth.user?.permissions?.includes('start-zoom-meetings') && (zoommeeting.host_id === auth.user?.id || auth.user?.type === 'company') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={() => window.open(zoommeeting.start_url || `https://zoom.us/s/${zoommeeting.meeting_id}`, '_blank')}
                                        className="text-white bg-green-600 hover:bg-green-700"
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        {t('Start Meeting')}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Start Meeting')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}