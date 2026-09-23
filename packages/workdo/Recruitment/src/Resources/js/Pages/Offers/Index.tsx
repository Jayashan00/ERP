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
import { Plus, Edit as EditIcon, Trash2, Eye, FileText as FileTextIcon, Download, Kanban, UserPlus, Mail, User, LayoutGrid, CheckCircle2, XCircle, MessageSquare, Clock, Calendar, Globe, Briefcase, Copy, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import BadgeUI from '@/components/badge-ui';
import { DatePicker } from '@/components/ui/date-picker';
import Create from './Create';
import EditOffer from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import GenerateAvatar from '@/components/generate-avatar';
import UserColumn from '@/components/user-column';
import { Offer, OffersIndexProps, OfferFilters, OfferModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { offers, auth, candidates, jobpostings, users, stats, summary } = usePage<OffersIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<OfferFilters>({
        position: urlParams.get('position') || '',
        candidate_id: urlParams.get('candidate_id') || 'all',
        start_date: urlParams.get('start_date') || '',
        expiration_date: urlParams.get('expiration_date') || '',
        status: urlParams.get('status') || '',
        approval_status: urlParams.get('approval_status') || 'all',
        offer_date: urlParams.get('offer_date') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [modalState, setModalState] = useState<OfferModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Offer | null>(null);
    const [filteredJobs, setFilteredJobs] = useState(jobpostings || []);
    const [showFilters, setShowFilters] = useState(false);


    // Handle dependent dropdown for job filters
    useEffect(() => {
        if (filters.candidate_id && filters.candidate_id !== 'all') {
            // Fetch jobs for selected candidate
            fetch(route('recruitment.candidates.jobs', filters.candidate_id))
                .then(response => response.json())
                .then(data => {
                    setFilteredJobs(data);
                    // Clear job if it doesn't belong to selected candidate
                    if (filters.job_id && filters.job_id !== 'all') {
                        const jobExists = data.find((sub: any) => sub.id.toString() === filters.job_id);
                        if (!jobExists) {
                            setFilters(prev => ({ ...prev, job_id: 'all' }));
                        }
                    }
                })
                .catch(() => setFilteredJobs([]));
        } else {
            setFilteredJobs(jobpostings || []);
            setFilters(prev => ({ ...prev, job_id: 'all' }));
        }
    }, [filters.candidate_id]);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.offers.destroy',
        defaultMessage: t('Are you sure you want to delete this offer?')
    });

    const handleFilter = () => {
        router.get(route('recruitment.offers.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('recruitment.offers.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            position: '',
            candidate_id: 'all',
            start_date: '',
            expiration_date: '',
            status: '',
            approval_status: 'all',
            offer_date: '',
        });
        router.get(route('recruitment.offers.index'), { per_page: perPage });
    };

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);
        router.get(route('recruitment.offers.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.status || 'all';

    const openModal = (mode: 'add' | 'edit', data: Offer | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const handleSendEmail = (offerId: number) => {
        router.post(route('recruitment.offers.send-email', offerId));
    };



    const tableColumns = [

        {
            key: 'candidate_id',
            header: t('Candidate'),
            sortable: true,
            render: (value: any, row: any) => {
                const firstName = row.candidate?.first_name || '';
                const lastName = row.candidate?.last_name || '';
                const candidateName = firstName || lastName ? `${firstName} ${lastName}`.trim() : '-';
                const jobTitle = row.job?.title || '';

                return (
                    <UserColumn user={{ name: candidateName, avatar: row.candidate?.avatar }} subText={jobTitle} />
                );
            }
        },
        {
            key: 'position',
            header: t('Position'),
            sortable: true
        },
        {
            key: 'salary',
            header: t('Salary'),
            sortable: false,
            render: (value: number, row: any) => {
                const salary = value ? formatCurrency(value) : '-';
                const bonus = row.bonus ? formatCurrency(row.bonus) : null;

                return (
                    <div>
                        <div className="font-medium">{salary}</div>
                        {bonus && <div className="text-xs text-gray-500">+{bonus}</div>}
                    </div>
                );
            }
        },
        {
            key: 'start_date',
            header: t('Start Date'),
            type: 'date',
            sortable: true
        },
        {
            key: 'expiration_date',
            header: t('Expiration Date'),
            sortable: true,
            render: (value: string) => {
                if (!value) return '-';
                const today = new Date().toISOString().split('T')[0];
                const isExpired = value <= today;

                return (
                    <div className="flex flex-col items-start gap-1.5 text-sm">
                        <div className={`flex items-center gap-1.5 ${isExpired ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDate(value)}</span>
                        </div>
                        {isExpired && <p className="ml-5 text-xs text-red-500">{t('Expired')}</p>}
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: string) => {
                const options: any = { "0": "Draft", "1": "Sent", "2": "Accepted", "3": "Negotiating", "4": "Declined", "5": "Expired" };
                const colors: any = {
                    "0": "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 ring-zinc-600/20 dark:ring-zinc-700/50",
                    "1": "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-900/50",
                    "2": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-900/50",
                    "3": "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-900/50",
                    "4": "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 ring-rose-600/20 dark:ring-rose-900/50",
                    "5": "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 ring-orange-600/20 dark:ring-orange-900/50"
                };
                const displayValue = options[value] || value || '-';
                const colorClass = colors[value] || "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300 ring-zinc-600/20 dark:ring-zinc-700/50";
                return (
                    <BadgeUI className={colorClass}>
                        {t(displayValue)}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'offer_date',
            header: t('Offer Date'),
            type: 'date',
            sortable: true
        },
        {
            key: 'approval_status',
            header: t('Approval Status'),
            sortable: false,
            render: (_: any, offer: Offer) => {
                const getApprovalStatusColor = (status: string) => {
                    switch (status) {
                        case 'approved': return 'bg-green-50 text-green-800 ring-green-600/20 dark:ring-green-900/50';
                        case 'rejected': return 'bg-red-50 text-red-800 ring-red-600/20 dark:ring-red-900/50';
                        default: return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:ring-yellow-900/50';
                    }
                };

                const getApprovalStatusText = (status: string) => {
                    switch (status) {
                        case 'approved': return t('Approved');
                        case 'rejected': return t('Rejected');
                        default: return t('Pending');
                    }
                };

                return (
                    <BadgeUI className={getApprovalStatusColor(offer.approval_status)}>
                        {getApprovalStatusText(offer.approval_status)}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'actions',
            header: t('Actions'),
            sortable: false,
            render: (_: any, offer: Offer) => (
                <div className="flex items-center gap-1 min-w-fit">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('send-offer-emails') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => handleSendEmail(offer.id)} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                        <Mail className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Send Email')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {offer.status === '2' && auth.user?.permissions?.includes('download-offer-letters') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => window.open(offer.download_url, '_blank')} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Download Offer Letter')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {offer.status === '2' && !Boolean(offer.converted_to_employee) && auth.user?.permissions?.includes('convert-offers-to-employees') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('recruitment.offers.convert-to-employee', offer.id))} className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700">
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Convert to Employee')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {Boolean(offer.converted_to_employee) && offer.employee_id && auth.user?.permissions?.includes('view-offer-employees') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.get(route('hrm.employees.show', offer.employee_id))} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                        <User className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Employee Details')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {auth.user?.permissions?.includes('view-offers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(offer)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-offers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', offer)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-offers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(offer.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Offers') }
            ]}
            pageTitle={t('Manage Offers')}
            pageDescription={t('Manage job offers, track responses, and generate offer letters.')}
            pageActions={
                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => router.get(route('recruitment.offers.kanban'))}>
                                <Kanban className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('Kanban View')}</p>
                        </TooltipContent>
                    </Tooltip>
                    {auth.user?.permissions?.includes('create-offers') && (
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
            <Head title={t('Offers')} />

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 p-3 flex flex-col justify-between h-[100px]">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 capitalize tracking-wider">{t('Total Offers')}</span>
                        <Briefcase className="h-5 w-5 text-blue-700 dark:text-blue-300 opacity-80" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats?.all ?? 0}</div>
                        <p className="text-[10px] text-blue-700 dark:text-blue-400 opacity-80">{t('All time offers')}</p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 p-3 flex flex-col justify-between h-[100px]">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 capitalize tracking-wider">{t('Accepted Offers')}</span>
                        <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-300 opacity-80" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.accepted ?? 0}</div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 opacity-80">
                            {stats?.all > 0 ? Math.round(((stats?.accepted ?? 0) / stats.all) * 100) : 0}% {t('of total')}
                        </p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 p-3 flex flex-col justify-between h-[100px]">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 capitalize tracking-wider">{t('Sent Offers')}</span>
                        <Mail className="h-5 w-5 text-amber-700 dark:text-amber-300 opacity-80" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats?.sent ?? 0}</div>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 opacity-80">{t('Offers sent to candidates')}</p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 dark:border-rose-800/50 p-3 flex flex-col justify-between h-[100px]">
                    <div className="flex flex-row items-center justify-between">
                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 capitalize tracking-wider">{t('Declined & Expired')}</span>
                        <XCircle className="h-5 w-5 text-rose-700 dark:text-rose-300 opacity-80" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-rose-700 dark:text-rose-300">{(stats?.expired_declined ?? 0)}</div>
                        <p className="text-[10px] text-rose-700 dark:text-rose-400 opacity-80">{t('Declined or expired offers')}</p>
                    </div>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.position}
                                onChange={(value) => setFilters({ ...filters, position: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Offers...')}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="recruitment.offers.index"
                                filters={filters}
                            />

                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.candidate_id !== 'all' ? filters.candidate_id : '', filters.job_id !== 'all' ? filters.job_id : '', filters.status, filters.start_date, filters.expiration_date, filters.approval_status !== 'all' ? filters.approval_status : '', filters.offer_date].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            { key: '0', label: t('Draft'), icon: FileTextIcon, count: summary?.draft || 0 },
                            { key: '1', label: t('Sent'), icon: Mail, count: summary?.sent || 0 },
                            { key: '2', label: t('Accepted'), icon: CheckCircle2, count: summary?.accepted || 0 },
                            { key: '3', label: t('Negotiating'), icon: Clock, count: summary?.negotiating || 0 },
                            { key: '4', label: t('Declined'), icon: XCircle, count: summary?.declined || 0 },
                            { key: '5', label: t('Expired'), icon: Clock, count: summary?.expired || 0 },
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
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Candidate')}</label>
                                <Select value={filters.candidate_id} onValueChange={(value) => setFilters({ ...filters, candidate_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Candidates')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Candidates')}</SelectItem>
                                        {candidates?.map((candidate: any) => (
                                            <SelectItem key={candidate.id} value={candidate.id.toString()}>
                                                {candidate.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Approval Status')}</label>
                                <Select value={filters.approval_status} onValueChange={(value) => setFilters({ ...filters, approval_status: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Status')}</SelectItem>
                                        <SelectItem value="pending">{t('Pending')}</SelectItem>
                                        <SelectItem value="approved">{t('Approved')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Offer Date')}</label>
                                <DatePicker
                                    value={filters.offer_date}
                                    onChange={(value) => setFilters({ ...filters, offer_date: value })}
                                    placeholder={t('Select Offer Date')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Start Date')}</label>
                                <DatePicker
                                    value={filters.start_date}
                                    onChange={(value) => setFilters({ ...filters, start_date: value })}
                                    placeholder={t('Select Start Date')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Expiration Date')}</label>
                                <DatePicker
                                    value={filters.expiration_date}
                                    onChange={(value) => setFilters({ ...filters, expiration_date: value })}
                                    placeholder={t('Select Expiration Date')}
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
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                        <DataTable
                            data={offers?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={FileTextIcon}
                                    title={t('No Offers found')}
                                    description={t('Get started by creating your first Offer.')}
                                    hasFilters={!!(filters.position || (filters.candidate_id !== 'all' && filters.candidate_id) || filters.status || (filters.approval_status !== 'all' && filters.approval_status) || filters.offer_date || filters.start_date || filters.expiration_date)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-offers"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Offer')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
                    <Pagination
                        data={offers || { data: [], links: [], meta: {} }}
                        routeName="recruitment.offers.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditOffer
                        offer={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View offer={viewingItem} onClose={() => setViewingItem(null)} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Offer')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}