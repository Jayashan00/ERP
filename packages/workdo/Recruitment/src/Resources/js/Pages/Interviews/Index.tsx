import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
    Plus, Edit as EditIcon, Trash2, Eye, Calendar as CalendarIcon,
    MapPin, Video, Clock, LayoutGrid, CheckCircle2, XCircle, UserX, Kanban,
    Calendar
} from "lucide-react";
import GenerateAvatar from '@/components/generate-avatar';
import WeekMonthSwitcher from '@/components/week-month-switcher';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import UserColumn from '@/components/user-column';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Create from './Create';
import EditInterview from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { Interview, InterviewsIndexProps, InterviewFilters, InterviewModalState } from './types';
import { formatDate, formatTime, formatDateTime, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';

export default function Index() {
    const { t } = useTranslation();
    const { interviews, auth, interviewtypes, summary, upcomingInterviews, selectedDateSummary } =
        usePage<InterviewsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const todayStr = new Date().toISOString().split('T')[0];

    const [filters, setFilters] = useState<InterviewFilters>({
        search: urlParams.get('search') || '',
        selected_date: urlParams.get('selected_date') || todayStr,
        feedback: urlParams.get('feedback') || 'all',
        status: urlParams.get('status') || '',
        interview_type_id: urlParams.get('interview_type_id') || 'all',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [modalState, setModalState] = useState<InterviewModalState>({ isOpen: false, mode: '', data: null });
    const [viewingItem, setViewingItem] = useState<Interview | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Calendar handler
    const handleCalendarChange = (dateStr: string) => {
        setFilters(prev => ({ ...prev, selected_date: dateStr }));
        router.get(route('recruitment.interviews.index'), { ...filters, selected_date: dateStr, per_page: perPage }, {
            preserveState: true,
            replace: true
        });
    };

    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Interview Schedule', settingKey: 'Dropbox Interview Schedule' });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.interviews.destroy',
        defaultMessage: t('Are you sure you want to delete this interview?'),
    });

    const navigate = (overrides: Partial<InterviewFilters & { per_page: string; sort: string; direction: string; view: string }> = {}) => {
        const f = { ...filters, ...overrides };
        const params: Record<string, any> = {};
        if (f.search) params.search = f.search;
        if (f.selected_date) params.selected_date = f.selected_date;
        if (f.feedback && f.feedback !== 'all') params.feedback = f.feedback;
        if (f.status && f.status !== 'all') params.status = f.status;
        if (f.interview_type_id && f.interview_type_id !== 'all') params.interview_type_id = f.interview_type_id;
        params.per_page = (overrides as any).per_page || perPage;
        if ((overrides as any).sort || sortField) {
            params.sort = (overrides as any).sort || sortField;
            params.direction = (overrides as any).direction || sortDirection;
        }
        router.get(route('recruitment.interviews.index'), params, { preserveState: true, replace: true });
    };

    const handleFilter = () => navigate();

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        navigate({ sort: field, direction } as any);
    };

    const clearFilters = () => {
        const reset: InterviewFilters = {
            search: '', selected_date: todayStr,
            feedback: 'all', status: 'all', interview_type_id: 'all',
        };
        setFilters(reset);
        router.get(route('recruitment.interviews.index'), { selected_date: todayStr, per_page: perPage });
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        setFilters(prev => ({ ...prev, status: newStatus }));
        navigate({ status: newStatus });
    };

    const activeTab = filters.status || 'all';



    const openModal = (mode: 'add' | 'edit', data: Interview | null = null) => setModalState({ isOpen: true, mode, data });
    const closeModal = () => setModalState({ isOpen: false, mode: '', data: null });

    // Avatar helpers
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const activeFiltersCount = [
        filters.feedback !== 'all' ? filters.feedback : '',
        filters.interview_type_id !== 'all' ? filters.interview_type_id : '',
    ].filter(Boolean).length;

    // Check if any interview has non-remote job to show location column
    const hasNonRemoteJobs = interviews?.data?.some((interview: any) =>
        !interview.jobPosting?.location?.remote_work
    ) || false;

    const tableColumns = [
        {
            key: 'candidate_name',
            header: t('Candidate'),
            sortable: true,
            render: (value: any, row: any) => {
                const fullName = `${row?.candidate?.first_name || ''} ${row?.candidate?.last_name || ''}`.trim() || '-';
                return (
                    <UserColumn user={{ name: fullName, email: row?.candidate?.email, avatar: row?.candidate?.profile_path }} />
                );
            }
        },
        {
            key: 'round_name',
            header: t('Round'),
            sortable: true,
            render: (value: any, row: any) => row.interviewRound?.name || row.interview_round?.name || (row.round_id ? `Round ID: ${row.round_id}` : '-')
        },
        {
            key: 'interview_type_name',
            header: t('Interview Type'),
            sortable: true,
            render: (value: any, row: any) => <RandomBadgeUI name={row.interviewType?.name || row.interview_type?.name || (row.interview_type_id ? `Type ID: ${row.interview_type_id}` : '-')} className='whitespace-nowrap' />
        },
        {
            key: 'scheduled_date',
            header: t('Date & Time'),
            sortable: true,
            render: (value: any, row: any) => (
                <div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatDate(row.scheduled_date) || '-'}</span>
                    </div>
                    <div className="text-xs text-gray-500">{formatTime(row.scheduled_time) || '-'} ({row.duration ? `${row.duration} min` : '-'})</div>
                </div>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string, row: any) => {
                const options: any = { "0": "Scheduled", "1": "Completed", "2": "Cancelled", "3": "No-show" };
                const statusValue = String(row.status || value || '0');
                const displayValue = options[statusValue] || statusValue || '-';

                const getStatusColor = (status: string) => {
                    switch (status) {
                        case '0': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'; // Scheduled
                        case '1': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'; // Completed
                        case '2': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'; // Cancelled
                        case '3': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'; // No-show
                        default: return 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-400';
                    }
                };

                return (
                    <BadgeUI className={getStatusColor(statusValue)}>
                        {t(displayValue)}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'feedback_submitted',
            header: t('Feedback'),
            sortable: false,
            render: (value: any, row: any) => {
                const isSubmitted = row.feedback_submitted === true || row.feedback_submitted === 1 || row.feedback_submitted === '1';
                return (
                    <BadgeUI className={isSubmitted
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}>
                        {t(isSubmitted ? t('Submitted') : t('Pending'))}
                    </BadgeUI>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-interviews', 'edit-interviews', 'delete-interviews'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, interview: Interview) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-interviews') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('recruitment.interviews.show', interview.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-interviews') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', interview)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-interviews') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(interview.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Delete')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Interviews') }
            ]}
            pageTitle={t('Manage Interviews')}
            pageDescription={t('Manage and track recruitment interviews.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {dropboxBtn.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                        {auth.user?.permissions?.includes('manage-interviews') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('recruitment.interviews.kanban'))}>
                                        <Kanban className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Kanban View')}</p>
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
            <Head title={t('Interviews')} />

            {/* Main Content Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full">
                <div className="md:col-span-8 lg:col-span-9 w-full">
                    {/* Date Switcher */}
                    <WeekMonthSwitcher
                        mode="week"
                        value={filters.selected_date || todayStr}
                        onChange={handleCalendarChange}
                    />
                    <Card className="mb-6 border border-gray-300 dark:border-zinc-700 shadow-sm overflow-hidden bg-card">
                        {/* Search & Controls Header */}
                        <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                                <div className="flex-1 max-w-md w-full">
                                    <SearchInput
                                        value={filters.search}
                                        onChange={(value) => setFilters({ ...filters, search: value })}
                                        onSearch={handleFilter}
                                        placeholder={t('Search Interviews...')}
                                    />
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                    <PerPageSelector
                                        routeName="recruitment.interviews.index"
                                        filters={{ ...filters }}
                                    />
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {(() => {
                                            const activeFilters = [
                                                filters.feedback !== 'all' ? filters.feedback : '',
                                                filters.interview_type_id !== 'all' ? filters.interview_type_id : '',
                                            ].filter(Boolean).length;
                                            return activeFilters > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                                    {activeFilters}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        {/* Status Tabs */}
                        <CardContent className="px-2.5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0 sm:px-5">
                            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                                {[
                                    { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.total || 0 },
                                    { key: '0', label: t('Scheduled'), icon: CalendarIcon, count: summary?.scheduled || 0 },
                                    { key: '1', label: t('Completed'), icon: CheckCircle2, count: summary?.completed || 0 },
                                    { key: '2', label: t('Cancelled'), icon: XCircle, count: summary?.cancelled || 0 },
                                    { key: '3', label: t('No-show'), icon: UserX, count: summary?.no_show || 0 },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                                            ? 'border-primary text-primary font-semibold'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-zinc-700'
                                            }`}
                                    >
                                        <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span>{tab.label}</span>
                                        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <CardContent className="p-2.5 bg-blue-50/30 border-b sm:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Interview Type')}</label>
                                        <Select value={filters.interview_type_id} onValueChange={(value) => setFilters({ ...filters, interview_type_id: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Types')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Types')}</SelectItem>
                                                {interviewtypes?.map((type: any) => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Feedback')}</label>
                                        <Select value={filters.feedback} onValueChange={(value) => setFilters({ ...filters, feedback: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Feedback')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Feedback')}</SelectItem>
                                                <SelectItem value="submitted">{t('Submitted')}</SelectItem>
                                                <SelectItem value="pending">{t('Pending')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                        <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                                    </div>
                                </div>
                            </CardContent>
                        )}

                        {/* Table Content */}
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <DataTable
                                    data={interviews?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={CalendarIcon}
                                            title={t('No Interviews found')}
                                            description={t('Get started by creating your first Interview.')}
                                            hasFilters={!!(filters.search || filters.feedback !== 'all' || filters.status !== '' || filters.interview_type_id !== 'all')}
                                            onClearFilters={clearFilters}
                                            createPermission="create-interviews"
                                            onCreateClick={() => openModal('add')}
                                            createButtonText={t('Create Interview')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </CardContent>

                        {/* Pagination Footer */}
                        <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
                            <Pagination
                                data={interviews || { data: [], links: [], meta: {} }}
                                routeName="recruitment.interviews.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Sidebar */}
                <div className="md:col-span-4 lg:col-span-3 sticky top-20 space-y-6 self-start w-full">

                    {/* Upcoming Interviews Card */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                        <CardContent className="px-0 py-4 border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b px-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                                    <CalendarIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('Upcoming Interviews')}</p>
                                    <p className="text-[11px] text-muted-foreground">{formatDateTime(new Date()) || '-'}</p>
                                </div>
                            </div>
                            <div className="space-y-3 px-4  h-[280px] overflow-auto">
                                {upcomingInterviews?.length > 0 ? upcomingInterviews.map((item) => {
                                    const initials = getInitials(item.candidate_name || '-');
                                    return (
                                        <div key={item.id} className="group relative rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 space-y-3 hover:border-primary/20 dark:hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                                            {/* Time + duration */}
                                            <div className="flex items-center justify-between pl-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
                                                        {formatDate(item.scheduled_date || '') + '  ' + formatTime(item.scheduled_time || '')}
                                                    </span>
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                                                    </span>
                                                </div>
                                                {item.duration && (
                                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Clock className="w-3 h-3 text-muted-foreground/60" />{item.duration} {t('min')}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Candidate */}
                                            <div className="flex items-center gap-2.5 pl-1">
                                                <div className="flex items-center gap-3">
                                                    <GenerateAvatar name={initials} />
                                                    <div className="flex flex-col text-start">
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                                            {item.candidate_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.type_name || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Round + Location */}
                                            <div className="flex items-center gap-2 flex-wrap pl-1">
                                                {item.round_name && (
                                                    <RandomBadgeUI name={item.round_name} />
                                                )}
                                                {item.location && (
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <MapPin className="w-3 h-3 text-muted-foreground/50" />
                                                        <span className="truncate">{item.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Join link */}
                                            {item.meeting_link && (
                                                <a href={item.meeting_link} target="_blank" rel="noreferrer"
                                                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-black transition-all duration-200">
                                                    <Video className="w-3.5 h-3.5" />{t('Join Interview')}
                                                </a>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="flex flex-col h-full items-center justify-center py-8 px-4 text-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-800/10">
                                        <CalendarIcon className="w-8 h-8 text-muted-foreground/30 mb-2.5" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('No upcoming interviews')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Day Summary Card */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-0">
                        <CardContent className="py-4 border-gray-200 dark:border-zinc-800 px-0">
                            <div className="flex items-center gap-2.5 border-b  mb-4 pb-3  px-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                                    <CalendarIcon className="w-4 h-4 text-primary " />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('Day Summary')}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {formatDate(selectedDateSummary?.date || '')}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5 px-4">
                                {[
                                    { label: t('Total'), value: selectedDateSummary?.total ?? 0, cls: 'bg-gray-50 dark:bg-zinc-800/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-800' },
                                    { label: t('Scheduled'), value: selectedDateSummary?.scheduled ?? 0, cls: 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/20' },
                                    { label: t('Completed'), value: selectedDateSummary?.completed ?? 0, cls: 'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20' },
                                    { label: t('Cancelled'), value: selectedDateSummary?.cancelled ?? 0, cls: 'bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/20' },
                                    { label: t('No-show'), value: selectedDateSummary?.no_show ?? 0, cls: 'bg-orange-50/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/20' },
                                    { label: t('Pending Feedback'), value: selectedDateSummary?.pending_feedback ?? 0, cls: 'bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/20' },
                                ].map((row, i) => (
                                    <div key={i} className={`rounded-xl p-3 flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] ${row.cls}`}>
                                        <p className="text-xl font-black leading-none">{row.value}</p>
                                        <p className="text-[10px] font-bold mt-1.5 tracking-wider opacity-85">{row.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>

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
