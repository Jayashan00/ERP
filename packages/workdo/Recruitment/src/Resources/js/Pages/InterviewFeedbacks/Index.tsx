import { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, MessageSquare as MessageSquareIcon, Download, FileImage, Star, LayoutGrid, ThumbsUp, CheckCircle2, HelpCircle, XCircle, UserMinus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BadgeUI from '@/components/badge-ui';
import GenerateAvatar from '@/components/generate-avatar';
import Create from './Create';
import Edit from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { InterviewFeedback, InterviewFeedbacksIndexProps, InterviewFeedbackFilters, InterviewFeedbackModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { interviewfeedbacks, auth, interviews, users, summary } = usePage<InterviewFeedbacksIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<InterviewFeedbackFilters>({
        strengths: urlParams.get('strengths') || '',
        weaknesses: urlParams.get('weaknesses') || '',
        comments: urlParams.get('comments') || '',
        interview_id: urlParams.get('interview_id') || 'all',
        interviewer_id: urlParams.get('interviewer_id') || 'all',
        recommendation: urlParams.get('recommendation') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<InterviewFeedbackModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<InterviewFeedback | null>(null);
    const [filteredInterviewers, setFilteredInterviewers] = useState(users || []);
    const [showFilters, setShowFilters] = useState(false);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.interview-feedbacks.destroy',
        defaultMessage: t('Are you sure you want to delete this interview feedback?')
    });

    const handleFilter = () => {
        router.get(route('recruitment.interview-feedbacks.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('recruitment.interview-feedbacks.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            strengths: '',
            weaknesses: '',
            comments: '',
            interview_id: 'all',
            interviewer_id: 'all',
            recommendation: '',
        });
        router.get(route('recruitment.interview-feedbacks.index'), { per_page: perPage, view: viewMode });
    };

    const handleTabChange = (recommendation: string) => {
        const newRecommendation = recommendation === 'all' ? '' : recommendation;
        const newFilters = { ...filters, recommendation: newRecommendation };
        setFilters(newFilters);
        router.get(route('recruitment.interview-feedbacks.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.recommendation || 'all';

    const openModal = (mode: 'add' | 'edit', data: InterviewFeedback | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const renderInterviewers = (interviewers: any[]) => {
        if (!interviewers || interviewers.length === 0) return '-';
        return (
            <div className="flex -space-x-1.5 overflow-hidden">
                <TooltipProvider>
                    {interviewers.slice(0, 3).map((interviewer) => (
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
                    {interviewers.length > 3 && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-800 select-none">
                                    +{interviewers.length - 3}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-xs flex flex-col gap-0.5">
                                    {interviewers.slice(3).map((interviewer) => (
                                        <span key={interviewer.id}>{interviewer.name}</span>
                                    ))}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            </div>
        );
    };

    const tableColumns = [
        {
            key: 'candidate',
            header: t('Candidate'),
            sortable: true,
            render: (value: any, row: any) => (
                <div>
                    <div className="font-medium">
                        {(row.interview?.candidate?.first_name && row.interview?.candidate?.last_name)
                            ? `${row.interview.candidate.first_name} ${row.interview.candidate.last_name}`
                            : '-'
                        }
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row.interview?.job_posting?.title || '-'}
                    </div>
                </div>
            )
        },
        {
            key: 'interviewer_names',
            header: t('Interviewer'),
            sortable: true,
            render: (value: any, row: any) => renderInterviewers(row.interviewers)
        },
        {
            key: 'created_at',
            header: t('Submitted Date'),
            sortable: true,
            render: (value: string) => value ? formatDate(value) : '-'
        },
        {
            key: 'overall_rating',
            header: t('Overall Rating'),
            sortable: false,
            render: (value: number, row: any) => {
                if (!value) return '-';
                return (
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{value}/5</span>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-4 w-4 ${star <= value
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-xs space-y-1 p-1">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">{t('Technical')}:</span>
                                        <span className="font-semibold">{row.technical_rating || 0}/5</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">{t('Communication')}:</span>
                                        <span className="font-semibold">{row.communication_rating || 0}/5</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">{t('Cultural Fit')}:</span>
                                        <span className="font-semibold">{row.cultural_fit_rating || 0}/5</span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
        },
        {
            key: 'recommendation',
            header: t('Recommendation'),
            sortable: false,
            render: (value: string) => {
                const options: any = { "0": "Strong Hire", "1": "Hire", "2": "Maybe", "3": "Reject", "4": "Strong Reject" };
                const displayValue = options[value] || value || '-';
                const getBadgeColor = (val: string) => {
                    switch (val) {
                        case '0': return 'bg-green-100 text-green-800'; // Strong Hire
                        case '1': return 'bg-blue-100 text-blue-800';   // Hire
                        case '2': return 'bg-yellow-100 text-yellow-800'; // Maybe
                        case '3': case '4': return 'bg-red-100 text-red-800'; // Reject & Strong Reject
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };
                return (
                    <BadgeUI className={`${getBadgeColor(value)}`}>
                        {t(displayValue)}
                    </BadgeUI>
                );
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-interview-feedbacks', 'edit-interview-feedbacks', 'delete-interview-feedbacks'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, interviewfeedback: InterviewFeedback) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-interview-feedbacks') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(interviewfeedback)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-interview-feedbacks') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', interviewfeedback)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-interview-feedbacks') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(interviewfeedback.id)}
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
                { label: t('Interview Feedback') }
            ]}
            pageTitle={t('Manage Interview Feedback')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-interview-feedbacks') && (
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
            }
        >
            <Head title={t('Interview Feedback')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.strengths}
                                onChange={(value) => setFilters({ ...filters, strengths: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Interview Feedback...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="recruitment.interview-feedbacks.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="recruitment.interview-feedbacks.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.interview_id !== 'all' ? filters.interview_id : '', filters.interviewer_id !== 'all' ? filters.interviewer_id : '', filters.recommendation].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            { key: '0', label: t('Strong Hire'), icon: ThumbsUp, count: summary?.strong_hire || 0 },
                            { key: '1', label: t('Hire'), icon: CheckCircle2, count: summary?.hire || 0 },
                            { key: '2', label: t('Maybe'), icon: HelpCircle, count: summary?.maybe || 0 },
                            { key: '3', label: t('Reject'), icon: XCircle, count: summary?.reject || 0 },
                            { key: '4', label: t('Strong Reject'), icon: UserMinus, count: summary?.strong_reject || 0 },
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Interview')}</label>
                                <Select value={filters.interview_id} onValueChange={(value) => setFilters({ ...filters, interview_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Interviews')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Interviews')}</SelectItem>
                                        {interviews?.map((interview: any) => (
                                            <SelectItem key={interview.id} value={interview.id.toString()}>
                                                {interview.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Interviewer')}</label>
                                <Select value={filters.interviewer_id} onValueChange={(value) => setFilters({ ...filters, interviewer_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Interviewers')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Interviewers')}</SelectItem>
                                        {users?.map((interviewer: any) => (
                                            <SelectItem key={interviewer.id} value={interviewer.id.toString()}>
                                                {interviewer.name}
                                            </SelectItem>
                                        ))}
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
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={interviewfeedbacks?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={MessageSquareIcon}
                                        title={t('No Interview Feedback found')}
                                        description={t('Get started by creating your first Interview Feedback.')}
                                        hasFilters={!!(filters.strengths || filters.weaknesses || filters.comments || (filters.interview_id !== 'all' && filters.interview_id) || (filters.interviewer_id !== 'all' && filters.interviewer_id) || filters.recommendation)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-interview-feedbacks"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Interview Feedback')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4 sm:p-6">
                            {interviewfeedbacks?.data?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {interviewfeedbacks?.data?.map((interviewfeedback) => {
                                        const options: any = { "0": "Strong Hire", "1": "Hire", "2": "Maybe", "3": "Reject", "4": "Strong Reject" };
                                        const recommendationColors: any = { "0": "bg-green-100 text-green-800", "1": "bg-blue-100 text-blue-800", "2": "bg-yellow-100 text-yellow-800", "3": "bg-red-100 text-red-800", "4": "bg-red-100 text-red-800" };
                                        const recommendationInfo = { label: options[interviewfeedback.recommendation] || 'No Recommendation', class: recommendationColors[interviewfeedback.recommendation] || 'bg-gray-100 text-gray-800' };

                                        return (
                                            <Card key={interviewfeedback.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-3 p-3 border-b bg-gray-50/50">
                                                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                                        <MessageSquareIcon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-sm leading-tight">
                                                            {(interviewfeedback.interview?.candidate?.first_name && interviewfeedback.interview?.candidate?.last_name)
                                                                ? `${interviewfeedback.interview.candidate.first_name} ${interviewfeedback.interview.candidate.last_name}`
                                                                : 'Unknown Candidate'
                                                            }
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground">{interviewfeedback.interview?.job_posting?.title || 'No Job Title'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-3 space-y-3">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs capitalize tracking-wide">{t('Interviewers')}</p>
                                                        <div className="mt-1">
                                                            {renderInterviewers(interviewfeedback.interviewers)}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="text-xs min-w-0">
                                                            <p className="text-muted-foreground mb-1 text-xs capitalize tracking-wide">{t('Overall Rating')}</p>
                                                            {interviewfeedback.overall_rating ? (
                                                                <TooltipProvider>
                                                                    <Tooltip delayDuration={0}>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="flex">
                                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                                        <Star
                                                                                            key={star}
                                                                                            className={`h-4 w-4 ${star <= interviewfeedback.overall_rating
                                                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                                                : 'text-gray-300'
                                                                                                }`}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                                <span className="text-sm font-medium">{interviewfeedback.overall_rating}/5</span>
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div className="text-xs space-y-1 p-1">
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-muted-foreground">{t('Technical')}:</span>
                                                                                    <span className="font-semibold">{interviewfeedback.technical_rating || 0}/5</span>
                                                                                </div>
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-muted-foreground">{t('Communication')}:</span>
                                                                                    <span className="font-semibold">{interviewfeedback.communication_rating || 0}/5</span>
                                                                                </div>
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-muted-foreground">{t('Cultural Fit')}:</span>
                                                                                    <span className="font-semibold">{interviewfeedback.cultural_fit_rating || 0}/5</span>
                                                                                </div>
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">{t('No rating')}</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs min-w-0">
                                                            <p className="text-muted-foreground mb-1 text-xs capitalize tracking-wide">{t('Date')}</p>
                                                            <p className="font-medium">{interviewfeedback.created_at ? formatDate(interviewfeedback.created_at) : '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-3 border-t bg-gray-50/50 flex-shrink-0 mt-auto">
                                                    <BadgeUI className={recommendationInfo.class}>
                                                        {t(recommendationInfo.label)}
                                                    </BadgeUI>
                                                    <div className="flex gap-2">
                                                        <TooltipProvider>
                                                            {auth.user?.permissions?.includes('view-interview-feedbacks') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => setViewingItem(interviewfeedback)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('View')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('edit-interview-feedbacks') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => openModal('edit', interviewfeedback)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                            <EditIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('Edit')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('delete-interview-feedbacks') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openDeleteDialog(interviewfeedback.id)}
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
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={MessageSquareIcon}
                                    title={t('No Interview Feedback found')}
                                    description={t('Get started by creating your first Interview Feedback.')}
                                    hasFilters={!!(filters.strengths || filters.weaknesses || filters.comments || (filters.interview_id !== 'all' && filters.interview_id) || (filters.interviewer_id !== 'all' && filters.interviewer_id) || filters.recommendation)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-interview-feedbacks"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Interview Feedback')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
                    <Pagination
                        data={interviewfeedbacks || { data: [], links: [], meta: {} }}
                        routeName="recruitment.interview-feedbacks.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <Edit
                        interviewfeedback={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View interviewfeedback={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Interview Feedback')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}