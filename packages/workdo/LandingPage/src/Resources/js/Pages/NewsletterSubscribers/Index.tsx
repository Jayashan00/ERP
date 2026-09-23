import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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
import { Download, Trash2, Mail, Eye, Calendar, Globe, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from '@/utils/helpers';
import { Dialog } from '@/components/ui/dialog';
import ViewSubscriber from './View';
import BadgeUI from '@/components/badge-ui'

interface NewsletterSubscriber {
    id: number;
    email: string;
    subscribed_at: string;
    ip_address?: string;
    country?: string;
    city?: string;
    region?: string;
    country_code?: string;
    isp?: string;
    org?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    browser?: string;
    os?: string;
    device?: string;
}

interface IndexProps {
    subscribers: {
        data: NewsletterSubscriber[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export default function Index({ subscribers }: IndexProps) {
    const { t } = useTranslation();
    const { auth } = usePage<{ auth: { user: any } }>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        email: urlParams.get('email') || ''
    });
    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState<NewsletterSubscriber | null>(null);

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'newsletter-subscribers.destroy',
        defaultMessage: t('Are you sure you want to delete this subscriber?')
    });

    const handleFilter = () => {
        router.get(route('newsletter-subscribers.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('newsletter-subscribers.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ email: '' });
        router.get(route('newsletter-subscribers.index'), { per_page: perPage });
    };

    const handleExport = () => {
        window.open(route('newsletter-subscribers.export', filters));
    };

    const handleViewSubscriber = (subscriber: NewsletterSubscriber) => {
        setSelectedSubscriber(subscriber);
        setViewModalOpen(true);
    };

    const tableColumns = [
        {
            key: 'email',
            header: t('Email'),
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{value}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'ip_address',
            header: t('IP Address'),
            sortable: true,
            render: (value: string) => (
                <BadgeUI className="font-mono">
                    {value || '-'}
                </BadgeUI>
            )
        },
        {
            key: 'subscribed_at',
            header: t('Subscribed At'),
            sortable: true,
            type: 'date'
        },
        ...(auth.user?.permissions?.includes('delete-newsletter-subscribers') ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-right w-[120px]',
            render: (_: any, subscriber: NewsletterSubscriber) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewSubscriber(subscriber)}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('View Details')}</p>
                            </TooltipContent>
                        </Tooltip>

                        {auth.user?.permissions?.includes('delete-newsletter-subscribers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(subscriber.id)}
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
                { label: t('Newsletter Subscribers') }
            ]}
            pageTitle={t('Manage Newsletter Subscribers')}
            pageDescription={t('Manage your newsletter subscribers and export subscriber data.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    {auth.user?.permissions?.includes('export-newsletter-subscribers') && (
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        onClick={handleExport}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Export')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            }
        >
            <Head title={t('Newsletter Subscribers')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="w-full sm:max-w-md">
                                <SearchInput
                                    value={filters.email}
                                    onChange={(value) => setFilters({ ...filters, email: value })}
                                    onSearch={handleFilter}
                                    placeholder={t('Search subscribers...')}
                                />
                            </div>
                            {filters.email && (
                                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                                    <X className="h-4 w-4" />
                                    {t('Reset')}
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="newsletter-subscribers.index"
                                filters={filters}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                        <DataTable
                            data={subscribers.data}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none shadow-none border-0"
                            emptyState={
                                <NoRecordsFound
                                    icon={Mail}
                                    title={t('No newsletter subscribers found')}
                                    description={t('No subscribers have signed up yet.')}
                                    hasFilters={!!filters.email}
                                    onClearFilters={clearFilters}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-6 sm:py-3">
                    <Pagination
                        data={subscribers}
                        routeName="newsletter-subscribers.index"
                        filters={{ ...filters, per_page: perPage }}
                    />
                </CardContent>
            </Card>

            {/* View Details Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                {selectedSubscriber && (
                    <ViewSubscriber subscriber={selectedSubscriber} />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Newsletter Subscriber')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}