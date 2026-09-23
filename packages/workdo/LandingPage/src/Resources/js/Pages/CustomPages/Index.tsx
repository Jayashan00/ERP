import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { SearchInput } from "@/components/ui/search-input";
import { Pagination } from "@/components/ui/pagination";
import { PerPageSelector } from '@/components/ui/per-page-selector';
import NoRecordsFound from '@/components/no-records-found';
import { Plus, Edit, Trash2, Eye, FileText, Calendar, Globe, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui'

interface CustomPage {
    id: number;
    title: string;
    slug: string;
    is_active: boolean;
    is_disabled?: boolean;
    created_at: string;
    updated_at: string;
}

interface IndexProps {
    pages: {
        data: CustomPage[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export default function Index({ pages }: IndexProps) {
    const { t } = useTranslation();
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        title: urlParams.get('title') || ''
    });
    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'custom-pages.destroy',
        defaultMessage: t('Are you sure you want to delete this page?')
    });

    const handleFilter = () => {
        router.get(route('custom-pages.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('custom-pages.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ title: '' });
        router.get(route('custom-pages.index'), { per_page: perPage });
    };

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{value}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'slug',
            header: t('URL Slug'),
            render: (value: string, page: CustomPage) => (
                (auth.user?.permissions?.includes('view-custom-pages')) ?
                    <BadgeUI className="cursor-pointer" icon={Globe}
                        onClick={() => window.open(route('custom-page.show', page.slug), '_blank')}
                    >
                        /{value}
                    </BadgeUI>
                    :
                    <BadgeUI icon={Globe}>
                        /{value}
                    </BadgeUI>
            )
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: true,
            render: (value: boolean) => (
                <BadgeUI className={`${value
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 ring-green-200 dark:border-green-800'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 ring-red-200 dark:ring-red-800'
                    }`}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        {
            key: 'updated_at',
            header: t('Last Updated'),
            sortable: true,
            type: 'date'
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-custom-pages', 'edit-custom-pages', 'delete-custom-pages'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, page: CustomPage) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-custom-pages') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(route('custom-page.show', page.slug), '_blank')}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View Page')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-custom-pages') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Link href={route('custom-pages.edit', page.id)}>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {!page.is_disabled && auth.user?.permissions?.includes('delete-custom-pages') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(page.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
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
                { label: t('Landing Page') },
                { label: t('Custom Pages') }
            ]}
            pageTitle={t('Manage Custom Pages')}
            pageDescription={t('Create, manage, and publish custom pages for your landing page.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    {auth.user?.permissions?.includes('create-custom-pages') && (
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Link href={route('custom-pages.create')}>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            }
        >
            <Head title={t('Custom Pages')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="w-full sm:max-w-md">
                                <SearchInput
                                    value={filters.title}
                                    onChange={(value) => setFilters({ ...filters, title: value })}
                                    onSearch={handleFilter}
                                    placeholder={t('Search pages...')}
                                />
                            </div>
                            {filters.title && (
                                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                                    <X className="h-4 w-4" />
                                    {t('Reset')}
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="custom-pages.index"
                                filters={filters}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                        <DataTable
                            data={pages.data}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none shadow-none border-0"
                            emptyState={
                                <NoRecordsFound
                                    icon={FileText}
                                    title={t('No custom pages found')}
                                    description={t('Get started by creating your first custom page.')}
                                    hasFilters={!!filters.title}
                                    onClearFilters={clearFilters}
                                    createPermission="create-custom-pages"
                                    onCreateClick={() => auth.user?.permissions?.includes('create-custom-pages') && router.get(route('custom-pages.create'))}
                                    createButtonText={t('Create Page')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-6 sm:py-3">
                    <Pagination
                        data={pages}
                        routeName="custom-pages.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Custom Page')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}