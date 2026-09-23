import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit as EditIcon, Trash2, Eye, Calendar, List, MoreVertical, Briefcase, Video, MapPin } from "lucide-react";
import GenerateAvatar from '@/components/generate-avatar';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import KanbanBoard, { KanbanTask } from '@/components/kanban-board';
import { formatDate, formatTime, getImagePath } from '@/utils/helpers';
import { Interview } from './types';
import Create from './Create';
import EditInterview from './Edit';
import View from './View';

interface KanbanProps {
    interviews: Interview[];
    auth: { user?: { permissions?: string[] } };
}

export default function Kanban() {
    const { t } = useTranslation();
    const { interviews, auth } = usePage<KanbanProps>().props;

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: 'add' | 'edit';
        data?: Interview;
    }>({
        isOpen: false,
        mode: 'add',
        data: undefined
    });

    const [viewingItem, setViewingItem] = useState<Interview | null>(null);

    const openModal = (mode: 'add' | 'edit', data?: Interview) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: 'add', data: undefined });
    };

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.interviews.destroy',
        defaultMessage: t('Are you sure you want to delete this interview?')
    });

    const handleMove = (interviewId: number, fromStatus: string, toStatus: string) => {
        router.patch(route('recruitment.interviews.update-status', interviewId), {
            status: toStatus
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const columns = [
        { id: '0', title: t('Scheduled'), color: '#3b82f6' },
        { id: '1', title: t('Completed'), color: '#10b981' },
        { id: '2', title: t('Cancelled'), color: '#6b7280' },
        { id: '3', title: t('No-show'), color: '#ef4444' },
    ];

    const groupedTasks = {
        '0': interviews.filter(i => String(i.status) === '0'),
        '1': interviews.filter(i => String(i.status) === '1'),
        '2': interviews.filter(i => String(i.status) === '2'),
        '3': interviews.filter(i => String(i.status) === '3'),
    };

    const InterviewCard = ({ task }: { task: KanbanTask }) => {
        const interview = task as unknown as Interview;
        const candidateName = interview.candidate
            ? `${interview.candidate.first_name || ''} ${interview.candidate.last_name || ''}`.trim()
            : '-';

        const handleDragStart = (e: React.DragEvent) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: interview.id }));
            e.dataTransfer.effectAllowed = 'move';
        };

        return (
            <div
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3.5 mb-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-move select-none group text-start"
                draggable={true}
                onDragStart={handleDragStart}
            >
                {/* Candidate Avatar/Name on left, Actions on right */}
                <div className="flex items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <GenerateAvatar name={candidateName} className="w-9 h-9 rounded-lg text-xs font-bold flex-shrink-0" />
                        <div className="flex flex-col text-start min-w-0">
                            <span className="font-semibold text-gray-900 dark:text-gray-150 text-xs truncate">
                                {candidateName}
                            </span>
                            {interview.job_posting?.title && (
                                <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                    <Briefcase className="h-2.5 w-2.5 shrink-0" />
                                    {interview.job_posting.title}
                                </span>
                            )}
                        </div>
                    </div>

                    {(auth.user?.permissions?.includes('edit-interviews') ||
                        auth.user?.permissions?.includes('delete-interviews')) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-250 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-all"
                                    >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                    <DropdownMenuItem onClick={() => setViewingItem(interview)} className="gap-2 text-xs">
                                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                                        {t('View')}
                                    </DropdownMenuItem>
                                    {auth.user?.permissions?.includes('edit-interviews') && (
                                        <DropdownMenuItem onClick={() => openModal('edit', interview)} className="gap-2 text-xs">
                                            <EditIcon className="h-3.5 w-3.5 text-amber-500" />
                                            {t('Edit')}
                                        </DropdownMenuItem>
                                    )}
                                    {auth.user?.permissions?.includes('delete-interviews') && (
                                        <DropdownMenuItem
                                            onClick={() => openDeleteDialog(interview.id)}
                                            className="gap-2 text-xs text-red-600 hover:!text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {t('Delete')}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                </div>

                {/* Interview details: Date, Time, Duration */}
                <div className="flex flex-col gap-1 border-t border-gray-200 dark:border-gray-700 pt-2 text-[10px] text-muted-foreground mb-2">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span>
                            {formatDate(interview.scheduled_date)} @ {formatTime(interview.scheduled_time)}
                        </span>
                    </div>
                    {interview.duration && (
                        <div className="flex items-center gap-1.5 pl-5 text-[9px] text-gray-400">
                            <span>{interview.duration} {t('mins')}</span>
                        </div>
                    )}
                </div>

                {/* Round and Type Badges */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {interview.interview_round?.name && (
                        <RandomBadgeUI name={interview.interview_round.name} />
                    )}
                    {interview.interview_type?.name && (
                        <RandomBadgeUI name={interview.interview_type.name} />
                    )}
                </div>

                {/* Location / Meeting link */}
                {interview.location && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{interview.location}</span>
                    </div>
                )}
                {/* Interviewers Avatar Stack */}
                {interview.interviewers && interview.interviewers.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 mb-2">
                        <span className="text-[10px] text-muted-foreground font-medium">{t('Interviewers')}</span>
                        <div className="flex -space-x-1.5 overflow-hidden">
                            <TooltipProvider>
                                {interview.interviewers.slice(0, 3).map((interviewer) => (
                                    <Tooltip key={interviewer.id} delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-800 overflow-hidden bg-gray-100 dark:bg-zinc-800">
                                                {interviewer.avatar ? (
                                                    <img
                                                        className="h-full w-full object-cover"
                                                        src={getImagePath(interviewer.avatar)}
                                                        alt={interviewer.name}
                                                    />
                                                ) : (
                                                    <GenerateAvatar
                                                        name={interviewer.name}
                                                        className="h-full w-full rounded-full text-[9px] font-bold"
                                                    />
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{interviewer.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                {interview.interviewers.length > 3 && (
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-800 select-none">
                                                +{interview.interviewers.length - 3}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="text-xs flex flex-col gap-0.5">
                                                {interview.interviewers.slice(3).map((interviewer) => (
                                                    <span key={interviewer.id}>{interviewer.name}</span>
                                                ))}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </TooltipProvider>
                        </div>
                    </div>
                )}

                {/* Join link if meeting link is provided */}
                {interview.meeting_link && (
                    <a
                        href={interview.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full mt-1 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black transition-all duration-200"
                    >
                        <Video className="w-3 h-3" />
                        {t('Join Interview')}
                    </a>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Interviews'), url: route('recruitment.interviews.index') },
                { label: t('Kanban') }
            ]}
            pageTitle={t('Interviews Kanban')}
            pageDescription={t('Track and manage interview schedules visually')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-interviews') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('recruitment.interviews.index'))}>
                                        <List className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('List View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-interviews') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Interviews Kanban')} />

            <KanbanBoard
                tasks={groupedTasks}
                columns={columns}
                onMove={handleMove}
                taskCard={InterviewCard}
            />

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditInterview
                        interview={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View interview={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Interview')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
