import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import WeekMonthSwitcher from '@/components/week-month-switcher';
import { FilterButton } from '@/components/ui/filter-button';
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, Calendar, List, MoreVertical, Briefcase, Mail, Phone } from "lucide-react";
import GenerateAvatar from '@/components/generate-avatar';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import KanbanBoard, { KanbanTask } from '@/components/kanban-board';
import { formatDate, getImagePath } from '@/utils/helpers';
import { Candidate, CandidateFilters } from './types';

interface KanbanProps {
    candidates: Candidate[];
    auth: { user?: { permissions?: string[] } };
    jobpostings: any[];
    candidatesources: any[];
}

export default function Kanban() {
    const { t } = useTranslation();
    const { candidates, auth, jobpostings, candidatesources } = usePage<KanbanProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CandidateFilters>({
        name: urlParams.get('name') || '',
        job_id: urlParams.get('job_id') || 'all',
        source_id: urlParams.get('source_id') || 'all',
        status: urlParams.get('status') || '',
        application_date: urlParams.get('application_date') || '',
    });

    const [selectedYear, setSelectedYear] = useState(
        parseInt(urlParams.get('year') || '') || new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState(
        urlParams.get('month') !== null && urlParams.get('month') !== ''
            ? parseInt(urlParams.get('month') || '0')
            : new Date().getMonth()
    );

    const [showFilters, setShowFilters] = useState(false);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.candidates.destroy',
        defaultMessage: t('Are you sure you want to delete this candidate?')
    });

    const handleFilter = () => {
        router.get(route('recruitment.candidates.kanban'), {
            ...filters,
            year: selectedYear,
            month: selectedMonth
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            job_id: 'all',
            source_id: 'all',
            status: '',
            application_date: '',
        });
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        setSelectedYear(currentYear);
        setSelectedMonth(currentMonth);
        router.get(route('recruitment.candidates.kanban'), { year: currentYear, month: currentMonth });
    };

    const handleCalendarChange = (dateStr: string, year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);
        router.get(route('recruitment.candidates.kanban'), {
            ...filters,
            year,
            month
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleMove = (candidateId: number, fromStatus: string, toStatus: string) => {
        router.patch(route('recruitment.candidates.update-status', candidateId), {
            status: toStatus
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const columns = [
        { id: '0', title: t('New'), color: '#3b82f6' },
        { id: '1', title: t('Screening'), color: '#f59e0b' },
        { id: '2', title: t('Interview'), color: '#6366f1' },
        { id: '3', title: t('Offer'), color: '#f97316' },
        { id: '4', title: t('Hired'), color: '#10b981' },
        { id: '5', title: t('Rejected'), color: '#ef4444' },
    ];

    const groupedTasks = {
        '0': candidates.filter(c => String(c.status) === '0'),
        '1': candidates.filter(c => String(c.status) === '1'),
        '2': candidates.filter(c => String(c.status) === '2'),
        '3': candidates.filter(c => String(c.status) === '3'),
        '4': candidates.filter(c => String(c.status) === '4'),
        '5': candidates.filter(c => String(c.status) === '5'),
    };

    const CandidateCard = ({ task }: { task: KanbanTask }) => {
        const candidate = task as unknown as Candidate;
        const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || '-';

        const handleDragStart = (e: React.DragEvent) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: candidate.id }));
            e.dataTransfer.effectAllowed = 'move';
        };

        return (
            <div
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-250 dark:border-zinc-700 p-3.5 mb-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-move select-none group"
                draggable={true}
                onDragStart={handleDragStart}
            >
                {/* Top row: tracking ID badge + action dropdown */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <BadgeUI
                        onClick={() => router.get(route('recruitment.candidates.show', candidate.id))}
                    >
                        {candidate.tracking_id || '-'}
                    </BadgeUI>

                    {(auth.user?.permissions?.includes('view-candidates') ||
                        auth.user?.permissions?.includes('edit-candidates') ||
                        auth.user?.permissions?.includes('delete-candidates')) && (
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
                                    {auth.user?.permissions?.includes('view-candidates') && (
                                        <DropdownMenuItem onClick={() => router.get(route('recruitment.candidates.show', candidate.id))} className="gap-2 text-xs">
                                            <Eye className="h-3.5 w-3.5 text-blue-500" />
                                            {t('View')}
                                        </DropdownMenuItem>
                                    )}
                                    {auth.user?.permissions?.includes('edit-candidates') && (
                                        <DropdownMenuItem onClick={() => router.get(route('recruitment.candidates.edit', candidate.id))} className="gap-2 text-xs">
                                            <EditIcon className="h-3.5 w-3.5 text-amber-500" />
                                            {t('Edit')}
                                        </DropdownMenuItem>
                                    )}
                                    {auth.user?.permissions?.includes('delete-candidates') && (
                                        <DropdownMenuItem
                                            onClick={() => openDeleteDialog(candidate.id)}
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

                {/* Profile Avatar & Name Info */}
                <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        {candidate.profile_path ? (
                            <img
                                src={getImagePath(candidate.profile_path)}
                                alt={fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <GenerateAvatar name={fullName} />
                        )}
                    </div>
                    <div className="flex flex-col text-start min-w-0">
                        <span className="font-semibold text-gray-900 dark:text-gray-150 text-xs truncate">
                            {fullName}
                        </span>
                        {candidate.current_position && (
                            <span className="text-[10px] text-muted-foreground truncate">
                                {candidate.current_position}
                            </span>
                        )}
                    </div>
                </div>

                {/* Job Title */}
                {candidate.job_posting?.title && (
                    <div className="flex items-center gap-1 mb-1.5">
                        <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] text-gray-700 dark:text-zinc-300 font-medium truncate">
                            {candidate.job_posting.title}
                        </span>
                    </div>
                )}

                {/* Source Badge */}
                {candidate.candidate_source?.name && (
                    <div className="mb-2">
                        <RandomBadgeUI name={candidate.candidate_source.name} />
                    </div>
                )}

                {/* Contact details */}
                <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-zinc-700/60 pt-2 text-[10px] text-muted-foreground">
                    {candidate.email && (
                        <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{candidate.email}</span>
                        </a>
                    )}
                    {candidate.phone && (
                        <span className="flex items-center gap-1.5 truncate">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{candidate.phone}</span>
                        </span>
                    )}
                </div>

                {/* Footer: Date applied */}
                {candidate.application_date && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700/60 text-[9px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{formatDate(candidate.application_date)}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Candidates'), url: route('recruitment.candidates.index') },
                { label: t('Kanban') }
            ]}
            pageTitle={t('Candidates Kanban')}
            pageDescription={t('Manage candidate pipelines via drag-and-drop through recruitment stages.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-candidates') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('recruitment.candidates.index'))}>
                                        <List className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('List View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-candidates') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.get(route('recruitment.candidates.create'))}>
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
            <Head title={t('Candidates Kanban')} />

            <KanbanBoard
                tasks={groupedTasks}
                columns={columns}
                onMove={handleMove}
                taskCard={CandidateCard}
            />

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Candidate')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
