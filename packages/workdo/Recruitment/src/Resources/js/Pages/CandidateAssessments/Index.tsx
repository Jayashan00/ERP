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
import { Plus, Edit as EditIcon, Trash2, Eye, ClipboardCheck as ClipboardCheckIcon, Calendar, LayoutGrid, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import Create from './Create';
import Edit from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { CandidateAssessment, CandidateAssessmentsIndexProps, CandidateAssessmentFilters, CandidateAssessmentModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import GenerateAvatar from '@/components/generate-avatar';
import BadgeUI from '@/components/badge-ui';

export default function Index() {
    const { t } = useTranslation();
    const { candidateassessments, auth, candidates, users, summary } = usePage<CandidateAssessmentsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CandidateAssessmentFilters>({
        assessment_name: urlParams.get('assessment_name') || '',
        comments: urlParams.get('comments') || '',
        pass_fail_status: urlParams.get('pass_fail_status') || '',
        start_date: urlParams.get('start_date') || '',
        end_date: urlParams.get('end_date') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<CandidateAssessmentModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<CandidateAssessment | null>(null);
    const [showFilters, setShowFilters] = useState(false);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.candidate-assessments.destroy',
        defaultMessage: t('Are you sure you want to delete this candidate assessment?')
    });

    const handleFilter = () => {
        router.get(route('recruitment.candidate-assessments.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('recruitment.candidate-assessments.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            assessment_name: '',
            comments: '',
            pass_fail_status: '',
            start_date: '',
            end_date: '',
        });
        router.get(route('recruitment.candidate-assessments.index'), { per_page: perPage, view: viewMode });
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, pass_fail_status: newStatus };
        setFilters(newFilters);
        router.get(route('recruitment.candidate-assessments.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.pass_fail_status || 'all';

    const openModal = (mode: 'add' | 'edit', data: CandidateAssessment | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'candidate_id',
            header: t('Candidate'),
            sortable: true,
            render: (value: any, row: any) => {
                const firstName = row.candidate?.first_name || '';
                const lastName = row.candidate?.last_name || '';
                const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || '-');
                const position = row.candidate?.job_posting?.title || '';
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            {row.candidate?.profile_path ? (
                                <img
                                    src={getImagePath(row.candidate?.profile_path)}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <GenerateAvatar name={fullName} className="w-9 h-9" />
                            )}
                        </div>
                        <div className="flex flex-col text-start">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {fullName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {position || '-'}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'conducted_by',
            header: t('Conducted By'),
            sortable: true,
            render: (value: any, row: any) => {
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            {row.conducted_by?.avatar ? (
                                <img
                                    src={getImagePath(row.conducted_by?.avatar)}
                                    alt={row.conducted_by?.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <GenerateAvatar name={row.conducted_by?.name} />
                            )}
                        </div>
                        <div className="flex flex-col text-start">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {row.conducted_by?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {row.conducted_by?.email || '-'}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'assessment_name',
            header: t('Assessment'),
            sortable: true
        },
        {
            key: 'score_percentage',
            header: t('Score'),
            sortable: false,
            render: (value: any, row: any) => {
                const score = row.score || 0;
                const maxScore = row.max_score || 0;

                if (!score && !maxScore) return '-';

                const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

                const radius = 16;
                const strokeWidth = 3;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (percentage / 100) * circumference;

                let colorClass = "text-emerald-500 dark:text-emerald-400";
                let bgClass = "text-emerald-100 dark:text-emerald-950/30";

                if (percentage < 40) {
                    colorClass = "text-red-500 dark:text-red-400";
                    bgClass = "text-red-100 dark:text-red-950/30";
                } else if (percentage < 70) {
                    colorClass = "text-amber-500 dark:text-amber-400";
                    bgClass = "text-amber-100 dark:text-amber-950/30";
                }

                return (
                    <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center h-10 w-10 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    className={`${bgClass} stroke-current`}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    r={radius}
                                    cx="20"
                                    cy="20"
                                />
                                <circle
                                    className={`${colorClass} stroke-current transition-all duration-500 ease-out`}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r={radius}
                                    cx="20"
                                    cy="20"
                                />
                            </svg>
                            <span className="absolute text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                                {percentage}%
                            </span>
                        </div>
                        <div className="text-xs">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{score} / {maxScore}</div>
                            <div className="text-[10px] text-zinc-400 font-medium">{t('Score')}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'pass_fail_status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const options: any = { "0": "Pass", "1": "Fail", "2": "Pending" };
                const displayValue = options[value] || value || '-';

                const getStatusColor = (status: string) => {
                    switch (status) {
                        case '0': return 'bg-green-100 text-green-800 ring-green-300'; // Pass - Green
                        case '1': return 'bg-red-100 text-red-800 ring-red-300';     // Fail - Red
                        case '2': return 'bg-yellow-100 text-yellow-800 ring-yellow-300'; // Pending - Yellow
                        default: return 'bg-gray-100 text-gray-800 ring-gray-300';
                    }
                };

                return (
                    <BadgeUI className={getStatusColor(value)}>
                        {t(displayValue)}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'assessment_date',
            header: t('Assessment Date'),
            sortable: true,
            render: (value: any) => value ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(value)}</span>
                </div>
            ) : '-'
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-candidate-assessments', 'edit-candidate-assessments', 'delete-candidate-assessments'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, candidateassessment: CandidateAssessment) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-candidate-assessments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(candidateassessment)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-candidate-assessments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', candidateassessment)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-candidate-assessments') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(candidateassessment.id)}
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
                { label: t('Candidate Assessments') }
            ]}
            pageTitle={t('Manage Candidate Assessments')}
            pageDescription={t('Track assessment scores, reviews, and test dates for candidate evaluations.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-candidate-assessments') && (
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
            <Head title={t('Candidate Assessments')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.assessment_name}
                                onChange={(value) => setFilters({ ...filters, assessment_name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search by Assessment, Candidate, Conducted By...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="recruitment.candidate-assessments.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="recruitment.candidate-assessments.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.pass_fail_status, filters.start_date, filters.end_date].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.all || 0 },
                            { key: '0', label: t('Pass'), icon: CheckCircle2, count: summary?.pass || 0 },
                            { key: '1', label: t('Fail'), icon: XCircle, count: summary?.fail || 0 },
                            { key: '2', label: t('Pending'), icon: HelpCircle, count: summary?.pending || 0 },
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
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Start Date')}</label>
                                <DatePicker
                                    value={filters.start_date}
                                    onChange={(value) => setFilters({ ...filters, start_date: value })}
                                    placeholder={t('Select Start Date')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('End Date')}</label>
                                <DatePicker
                                    value={filters.end_date}
                                    onChange={(value) => setFilters({ ...filters, end_date: value })}
                                    placeholder={t('Select End Date')}
                                    minDate={filters.start_date}
                                />
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
                                data={candidateassessments?.data || []}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={ClipboardCheckIcon}
                                        title={t('No Candidate Assessments found')}
                                        description={t('Get started by creating your first Candidate Assessment.')}
                                        hasFilters={!!(filters.assessment_name || filters.comments || filters.pass_fail_status || filters.start_date || filters.end_date)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-candidate-assessments"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Candidate Assessment')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4 sm:p-6">
                            {candidateassessments?.data?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {candidateassessments?.data?.map((candidateassessment) => {
                                        const score = candidateassessment.score || 0;
                                        const maxScore = candidateassessment.max_score || 0;
                                        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                                        const firstName = candidateassessment.candidate?.first_name || '';
                                        const lastName = candidateassessment.candidate?.last_name || '';
                                        const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || '-');
                                        const statusOptions: any = { "0": "Pass", "1": "Fail", "2": "Pending" };
                                        const statusColors: any = { "0": "bg-green-100 text-green-800", "1": "bg-red-100 text-red-800", "2": "bg-yellow-100 text-yellow-800" };
                                        const statusInfo = { label: statusOptions[candidateassessment.pass_fail_status] || 'Pending', class: statusColors[candidateassessment.pass_fail_status] || 'bg-gray-100 text-gray-800' };

                                        return (
                                            <Card key={candidateassessment.id} className="flex flex-col h-full hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-3 p-3 border-b bg-gray-50/50">
                                                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                                        <ClipboardCheckIcon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-sm leading-tight line-clamp-1">{candidateassessment.assessment_name}</h3>
                                                        {candidateassessment.candidate?.job_posting?.title && (
                                                            <p className="text-xs text-muted-foreground line-clamp-1">{candidateassessment.candidate.job_posting.title}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-3 space-y-3">
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs capitalize tracking-wide">{t('Candidate')}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                                {candidateassessment.candidate?.profile_path ? (
                                                                    <img
                                                                        src={getImagePath(candidateassessment.candidate?.profile_path)}
                                                                        alt={candidateassessment.candidate?.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <GenerateAvatar name={fullName} className="w-7 h-7 text-xs" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col text-start">
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                                                                    {fullName}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {candidateassessment.candidate?.email || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs min-w-0">
                                                        <p className="text-muted-foreground mb-1 text-xs capitalize tracking-wide">{t('Conducted By')}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                                {candidateassessment.conducted_by?.avatar ? (
                                                                    <img
                                                                        src={getImagePath(candidateassessment.conducted_by?.avatar)}
                                                                        alt={candidateassessment.conducted_by?.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <GenerateAvatar name={candidateassessment.conducted_by?.name} />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col text-start">
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                                                                    {candidateassessment.conducted_by?.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {candidateassessment.conducted_by?.email || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-4">
                                                        <div className="text-xs min-w-0 flex-1">
                                                            <p className="text-muted-foreground mb-1 text-xs capitalize tracking-wide">{t('Assessment Date')}</p>
                                                            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span>{formatDate(candidateassessment.assessment_date)}</span>
                                                            </div>
                                                        </div>

                                                        {(score > 0 || maxScore > 0) && (() => {
                                                            const radius = 16;
                                                            const strokeWidth = 3;
                                                            const circumference = 2 * Math.PI * radius;
                                                            const offset = circumference - (percentage / 100) * circumference;

                                                            let colorClass = "text-emerald-500 dark:text-emerald-400";
                                                            let bgClass = "text-emerald-100 dark:text-emerald-950/30";

                                                            if (percentage < 40) {
                                                                colorClass = "text-red-500 dark:text-red-400";
                                                                bgClass = "text-red-100 dark:text-red-950/30";
                                                            } else if (percentage < 70) {
                                                                colorClass = "text-amber-500 dark:text-amber-400";
                                                                bgClass = "text-amber-100 dark:text-amber-950/30";
                                                            }

                                                            return (
                                                                <div className="flex items-center gap-2 pl-4 flex-shrink-0">
                                                                    <div className="relative flex items-center justify-center h-10 w-10 flex-shrink-0">
                                                                        <svg className="w-full h-full transform -rotate-90">
                                                                            <circle
                                                                                className={`${bgClass} stroke-current`}
                                                                                strokeWidth={strokeWidth}
                                                                                fill="transparent"
                                                                                r={radius}
                                                                                cx="20"
                                                                                cy="20"
                                                                            />
                                                                            <circle
                                                                                className={`${colorClass} stroke-current transition-all duration-500 ease-out`}
                                                                                strokeWidth={strokeWidth}
                                                                                strokeDasharray={circumference}
                                                                                strokeDashoffset={offset}
                                                                                strokeLinecap="round"
                                                                                fill="transparent"
                                                                                r={radius}
                                                                                cx="20"
                                                                                cy="20"
                                                                            />
                                                                        </svg>
                                                                        <span className="absolute text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                                                                            {percentage}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{score} / {maxScore}</div>
                                                                        <div className="text-[10px] text-zinc-400 font-medium">{t('Score')}</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-3 border-t bg-gray-50/50 flex-shrink-0 mt-auto">
                                                    <BadgeUI className={statusInfo.class}>
                                                        {t(statusInfo.label)}
                                                    </BadgeUI>
                                                    <div className="flex gap-2">
                                                        <TooltipProvider>
                                                            {auth.user?.permissions?.includes('view-candidate-assessments') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => setViewingItem(candidateassessment)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('View')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('edit-candidate-assessments') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => openModal('edit', candidateassessment)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                            <EditIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('Edit')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('delete-candidate-assessments') && (
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openDeleteDialog(candidateassessment.id)}
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
                                    icon={ClipboardCheckIcon}
                                    title={t('No Candidate Assessments found')}
                                    description={t('Get started by creating your first Candidate Assessment.')}
                                    hasFilters={!!(filters.assessment_name || filters.comments || filters.pass_fail_status || filters.start_date || filters.end_date)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-candidate-assessments"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Candidate Assessment')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
                    <Pagination
                        data={candidateassessments || { data: [], links: [], meta: {} }}
                        routeName="recruitment.candidate-assessments.index"
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
                        candidateassessment={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View candidateassessment={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Candidate Assessment')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}