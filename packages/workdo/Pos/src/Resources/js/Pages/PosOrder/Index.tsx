import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from '@/components/ui/pagination';
import { Eye, ShoppingCart, User as UserIcon, Warehouse as WarehouseIcon, Package } from 'lucide-react';
import { formatCurrency, getImagePath } from '@/utils/helpers';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import NoRecordsFound from '@/components/no-records-found';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageButtons } from '@/hooks/usePageButtons';
import BadgeUI from '@/components/badge-ui';
import UserColumn from '@/components/user-column';

interface PosSale {
    id: number;
    sale_number: string;
    customer_id?: number;
    customer?: {
        name: string;
        email: string;
        avatar?: string | null;
    };
    warehouse?: {
        name: string;
        email?: string | null;
    };
    tax_amount: number;
    pos_date: string;
    created_at: string;
    items_count: number;
    items?: Array<{
        total_amount: number;
    }>;
}

interface IndexProps {
    sales: {
        data: PosSale[];
        links: any[];
        meta: any;
    };
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Index() {
    const { t } = useTranslation();
    const { sales, auth } = usePage<IndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        search: urlParams.get('search') || '',
        customer: urlParams.get('customer') || '',
        warehouse: urlParams.get('warehouse') || ''
    });
    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [showFilters, setShowFilters] = useState(false);

    const pageButtons = usePageButtons('googleDriveBtn', { module: 'POS Order', settingKey: 'GoogleDrive POS Order' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'POS Order', settingKey: 'OneDrive POS Order' });

    const handleFilter = () => {
        router.get(route('pos.orders'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '', customer: '', warehouse: '' });
        router.get(route('pos.orders'), {per_page: perPage, view: viewMode});
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('pos.orders'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const tableColumns = [
        {
            key: 'sale_number',
            header: t('Sale Number'),
            sortable: true,
            render: (value: string, sale: PosSale) =>
                auth.user?.permissions?.includes('view-pos-orders') ? (
                    <BadgeUI
                        className="bg-blue-50 text-blue-600 ring-blue-300 hover:bg-blue-100 cursor-pointer transition-colors dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900"
                        onClick={() => router.get(route('pos.show', sale.id))}
                    >
                        {value}
                    </BadgeUI>
                ) : (
                    <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800">
                        {value}
                    </BadgeUI>
                )
        },
        {
            key: 'customer',
            header: t('Customer'),
            render: (_: any, sale: PosSale) => (
                <UserColumn user={sale.customer} />
            )
        },
        {
            key: 'warehouse',
            header: t('Warehouse'),
            render: (_: any, sale: PosSale) => (
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 dark:bg-orange-900/20 dark:border-orange-800">
                        <WarehouseIcon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {sale.warehouse?.name || '-'}
                        </span>
                        {sale.warehouse?.email && (
                            <span className="text-xs text-muted-foreground truncate">{sale.warehouse.email}</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'items_count',
            header: t('Items'),
            sortable: false,
            render: (value: number) => (
                <BadgeUI icon={Package}>
                    {value || 0}
                </BadgeUI>
            )
        },
        {
            key: 'total',
            header: t('Total'),
            sortable: false,
            render: (_: any, sale: PosSale) => (
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(sale.total || 0)}
                </span>
            )
        },
        ...(auth.user?.permissions?.includes('view-pos-orders') ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, sale: PosSale) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.get(route('pos.show', sale.id))}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('View')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('POS'), url: route('pos.index') },
                { label: t('POS Orders') }
            ]}
            pageTitle={t('POS Orders')}
            pageDescription={t('Manage and view details of your POS sales, orders, and customer checkouts.')}
            pageActions={
                <div className="flex flex-wrap items-center gap-2">
                    {pageButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {oneDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                </div>
            }
        >
            <Head title={t('POS Orders')} />

            <Card className="shadow-sm dark:border-gray-700">
                {/* Search & Controls */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-800/50 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.search}
                                onChange={(value) => setFilters({...filters, search: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by order number, customer, warehouse...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="pos.orders"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer, filters.warehouse].filter(Boolean).length;
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

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-2.5 bg-blue-50/30 border-b dark:bg-blue-950/20 sm:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('Customer')}</label>
                                <Input
                                    placeholder={t('Filter by customer')}
                                    value={filters.customer}
                                    onChange={(e) => setFilters({...filters, customer: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('Warehouse')}</label>
                                <Input
                                    placeholder={t('Filter by warehouse')}
                                    value={filters.warehouse}
                                    onChange={(e) => setFilters({...filters, warehouse: e.target.value})}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* Table */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                        <DataTable
                            data={sales.data}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={ShoppingCart}
                                    title={t('No orders found')}
                                    description={t('Get started by creating your first POS order.')}
                                    hasFilters={!!(filters.search || filters.customer || filters.warehouse)}
                                    onClearFilters={clearFilters}
                                    createPermission="manage-pos"
                                    onCreateClick={() => router.visit(route('pos.create'))}
                                    createButtonText={t('Create Order')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination */}
                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                    <Pagination
                        data={sales}
                        routeName="pos.orders"
                        filters={{...filters, per_page: perPage, view: viewMode}}
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
