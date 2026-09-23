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
import { Plus, Edit as EditIcon, Trash2, Eye, HelpCircle, Download, FileImage, Tag, Type, AlignLeft, List, CircleDot, CheckSquare, FileText, Calendar, Text, LayoutGrid, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BadgeUI from '@/components/badge-ui';
import Create from './Create';
import EditCustomQuestion from './Edit';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { CustomQuestion, CustomQuestionsIndexProps, CustomQuestionFilters, CustomQuestionModalState } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { customquestions, auth, summary } = usePage<CustomQuestionsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CustomQuestionFilters>({
        question: urlParams.get('question') || '',
        type: urlParams.get('type') || '',
        is_active: urlParams.get('is_active') || '',
        is_required: urlParams.get('is_required') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<CustomQuestionModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<CustomQuestion | null>(null);

    const [showFilters, setShowFilters] = useState(false);




    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.custom-questions.destroy',
        defaultMessage: t('Are you sure you want to delete this custom question?')
    });

    const activeTab = filters.is_required || 'all';

    const handleTabChange = (isRequired: string) => {
        const newRequired = isRequired === 'all' ? '' : isRequired;
        const newFilters = { ...filters, is_required: newRequired };
        setFilters(newFilters);
        router.get(route('recruitment.custom-questions.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleFilter = () => {
        router.get(route('recruitment.custom-questions.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('recruitment.custom-questions.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            question: '',
            type: '',
            is_active: '',
            is_required: '',
        });
        router.get(route('recruitment.custom-questions.index'), { per_page: perPage, view: viewMode });
    };

    const openModal = (mode: 'add' | 'edit', data: CustomQuestion | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'question',
            header: t('Question'),
            sortable: true,
            render: (value: any, row: any) => {
                const typeConfig: any = {
                    text: { label: t("Text"), icon: Text, color: "bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/20" },
                    textarea: { label: t("Textarea"), icon: AlignLeft, color: "bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-950/30 dark:text-indigo-400 dark:ring-indigo-800/20" },
                    select: { label: t("Select"), icon: List, color: "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/20" },
                    radio: { label: t("Radio"), icon: CircleDot, color: "bg-purple-50 text-purple-700 ring-purple-600/10 dark:bg-purple-950/30 dark:text-purple-400 dark:ring-purple-800/20" },
                    checkbox: { label: t("Checkbox"), icon: CheckSquare, color: "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20" },
                    number: { label: t("Number"), icon: FileText, color: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20" },
                    date: { label: t("Date"), icon: Calendar, color: "bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20" },
                };
                const config = typeConfig[row?.type] || { label: row?.type || '-', icon: Tag, color: "bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-800/20" };
                const IconComponent = config.icon;
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm text-gray-900 font-normal dark:text-gray-100">{value.length > 50 ? value.substring(0, 50) + '...' : value || '-'}
                            {row?.is_required && <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <span className="text-red-500 ml-1">*</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Required')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>}
                        </span>
                        <BadgeUI icon={IconComponent} className={`capitalize ${config.color}`}>
                            {config.label}
                        </BadgeUI>
                    </div>
                )
            }
        },
        {
            key: 'sort_order',
            header: t('Sort Order'),
            sortable: true,
            render: (value: number) => value !== undefined && value !== null ? (
                <BadgeUI className="bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 ring-gray-200">
                    {value}
                </BadgeUI>
            ) : '-'
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={`${value ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-red-100 text-red-800 ring-red-200'
                    }`}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-custom-questions', 'edit-custom-questions', 'delete-custom-questions'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, customquestion: CustomQuestion) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-custom-questions') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(customquestion)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-custom-questions') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', customquestion)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-custom-questions') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(customquestion.id)}
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
                { label: t('Custom Questions') }
            ]}
            pageTitle={t('Manage Custom Questions')}
            pageDescription={t('Create and manage custom questions for job applications, set answer types, and designate required questions.')}
            pageActions={
                <TooltipProvider>
                    {auth.user?.permissions?.includes('create-custom-questions') && (
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
            <Head title={t('Custom Questions')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.question}
                                onChange={(value) => setFilters({ ...filters, question: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Custom Questions...')}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="recruitment.custom-questions.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.type, filters.is_active].filter(f => f !== '' && f !== null && f !== undefined).length;
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
                            { key: '1', label: t('Required'), icon: AlertCircle, count: summary?.required || 0 },
                            { key: '0', label: t('Optional'), icon: HelpCircle, count: summary?.optional || 0 },
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Type')}</label>
                                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">{t('Text')}</SelectItem>
                                        <SelectItem value="textarea">{t('Textarea')}</SelectItem>
                                        <SelectItem value="select">{t('Select')}</SelectItem>
                                        <SelectItem value="radio">{t('Radio')}</SelectItem>
                                        <SelectItem value="checkbox">{t('Checkbox')}</SelectItem>
                                        <SelectItem value="date">{t('Date')}</SelectItem>
                                        <SelectItem value="number">{t('Number')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.is_active} onValueChange={(value) => setFilters({ ...filters, is_active: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by Status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">{t('Active')}</SelectItem>
                                        <SelectItem value="0">{t('Inactive')}</SelectItem>
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
                            data={customquestions?.data || []}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={HelpCircle}
                                    title={t('No Custom Questions found')}
                                    description={t('Get started by creating your first Custom Question.')}
                                    hasFilters={!!(filters.question || filters.type || filters.is_active || filters.is_required)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-custom-questions"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Custom Question')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
                    <Pagination
                        data={customquestions || { data: [], links: [], meta: {} }}
                        routeName="recruitment.custom-questions.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditCustomQuestion
                        customquestion={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View customquestion={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Custom Question')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}