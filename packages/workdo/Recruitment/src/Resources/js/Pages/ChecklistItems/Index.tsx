import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, CheckCircle as CheckCircleIcon, Tag, FileImage, LayoutGrid, Clock, CheckCircle2, FileText, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import Create from './Create';
import EditChecklistItem from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { ChecklistItem, ChecklistItemsIndexProps, ChecklistItemFilters, ChecklistItemModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

export default function Index() {
    const { t } = useTranslation();
    const { checklistitems, auth, onboardingchecklists, summary } = usePage<ChecklistItemsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ChecklistItemFilters>({
        task_name: urlParams.get('task_name') || '',
        description: urlParams.get('description') || '',
        assigned_to_role: urlParams.get('assigned_to_role') || '',
        checklist_id: urlParams.get('checklist_id') || 'all',
        category: urlParams.get('category') || '',
        is_required: urlParams.get('is_required') || '',
        status: urlParams.get('status') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [modalState, setModalState] = useState<ChecklistItemModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<ChecklistItem | null>(null);

    const [showFilters, setShowFilters] = useState(false);




    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.checklist-items.destroy',
        defaultMessage: t('Are you sure you want to delete this checklist item?')
    });

    const activeTab = filters.status || 'all';

    const handleTabChange = (status: string) => {
        const newStatus = status === 'all' ? '' : status;
        const newFilters = { ...filters, status: newStatus };
        setFilters(newFilters);
        router.get(route('recruitment.checklist-items.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleFilter = () => {
        router.get(route('recruitment.checklist-items.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('recruitment.checklist-items.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            task_name: '',
            description: '',
            assigned_to_role: '',
            checklist_id: 'all',
            category: '',
            is_required: '',
            status: '',
        });
        router.get(route('recruitment.checklist-items.index'), { per_page: perPage });
    };

    const openModal = (mode: 'add' | 'edit', data: ChecklistItem | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'checklist.name',
            header: t('Checklist'),
            sortable: true,
            render: (value: any, row: ChecklistItem) => {
                const getCategoryBadge = (category: string) => {
                    const styles = {
                        'Other': 'bg-gray-100 text-gray-800 ring-gray-200',
                        'Documentation': 'bg-blue-100 text-blue-800 ring-blue-200',
                        'HR': 'bg-orange-100 text-orange-800 ring-orange-200',
                        'IT Setup': 'bg-purple-100 text-purple-800 ring-purple-200',
                        'Training': 'bg-green-100 text-green-800 ring-green-200',
                        'Facilities': 'bg-yellow-100 text-yellow-800 ring-yellow-200'
                    };
                    return styles[category] || 'bg-gray-100 text-gray-800 ring-gray-200';
                };
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm text-gray-900 font-normal dark:text-gray-100">{row.checklist?.name || '-'}</span>
                        {row.category ? <BadgeUI icon={Tag} className={getCategoryBadge(row.category)}>{row.category || '-'}</BadgeUI> : ''}
                    </div>
                )
            }
        },
        {
            key: 'task_name',
            header: t('Task'),
            sortable: true,
            render: (value: string, row: ChecklistItem) => (
                <div className="flex flex-col gap-1 text-start">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{value}</span>
                    {row.is_required && (
                        <span className="text-red-600 text-xs font-semibold">
                            {t('Required')}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'assigned_to_role',
            header: t('Assigned To Role'),
            sortable: true,
            render: (value: string) => value ? (
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {value}
                </span>
            ) : '-'
        },
        {
            key: 'due_day',
            header: t('Due Day'),
            sortable: false,
            render: (value: number) => value !== undefined && value !== null ? (
                <BadgeUI className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200">
                    {value} {value === 1 ? t('Day') : t('Days')}
                </BadgeUI>
            ) : '-'
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={value ? 'bg-green-100 text-green-700 ring-green-200' : 'bg-red-100 text-red-700 ring-red-200'}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-checklist-items', 'edit-checklist-items', 'delete-checklist-items'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, checklistitem: ChecklistItem) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-checklist-items') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(checklistitem)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-checklist-items') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', checklistitem)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-checklist-items') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(checklistitem.id)}
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
                { label: t('Checklist Items') }
            ]}
            pageTitle={t('Manage Checklist Items')}
            pageDescription={t('Manage onboarding checklist items, categorize tasks, and assign roles.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-checklist-items') && (
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
            <Head title={t('Checklist Items')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.task_name}
                                onChange={(value) => setFilters({ ...filters, task_name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Checklist Items...')}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="recruitment.checklist-items.index"
                                filters={{ ...filters }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.checklist_id !== 'all' ? filters.checklist_id : '', filters.category, filters.is_required, filters.status].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            { key: '1', label: t('Active'), icon: CheckCircle2, count: summary?.active || 0 },
                            { key: '0', label: t('Inactive'), icon: XCircle, count: summary?.inactive || 0 },
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Checklist')}</label>
                                <Select value={filters.checklist_id} onValueChange={(value) => setFilters({ ...filters, checklist_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('All Checklists')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Checklists')}</SelectItem>
                                        {onboardingchecklists?.map((checklist: any) => (
                                            <SelectItem key={checklist.id} value={checklist.id.toString()}>
                                                {checklist.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Category')}</label>
                                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Category')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Documentation">{t('Documentation')}</SelectItem>
                                        <SelectItem value="IT Setup">{t('IT Setup')}</SelectItem>
                                        <SelectItem value="Training">{t('Training')}</SelectItem>
                                        <SelectItem value="HR">{t('HR')}</SelectItem>
                                        <SelectItem value="Facilities">{t('Facilities')}</SelectItem>
                                        <SelectItem value="Other">{t('Other')}</SelectItem>
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
                            data={checklistitems?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={CheckCircleIcon}
                                    title={t('No Checklist Items found')}
                                    description={t('Get started by creating your first Checklist Item.')}
                                    hasFilters={!!(filters.task_name || filters.description || filters.assigned_to_role || (filters.checklist_id !== 'all' && filters.checklist_id) || filters.category || filters.is_required || filters.status)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-checklist-items"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Checklist Item')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
                    <Pagination
                        data={checklistitems || { data: [], links: [], meta: {} }}
                        routeName="recruitment.checklist-items.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditChecklistItem
                        checklistitem={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View checklistitem={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Checklist Item')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}