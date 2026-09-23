import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatAdminCurrency } from '@/utils/helpers';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { ShoppingCart, Calendar, CreditCard, Tag, Download } from 'lucide-react';
import NoRecordsFound from '@/components/no-records-found';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import GenerateAvatar from '@/components/generate-avatar';

interface Order {
    id: number;
    order_id: string;
    name: string;
    email: string;
    plan_name: string;
    price: string;
    currency: string;
    payment_status: string;
    payment_type: string;
    receipt?: string;
    created_at: string;
    original_price?: string;
    total_coupon_used?: {
        coupon_detail?: {
            code: string;
            name: string;
        };
    };
    user?: {
        name: string;
        email: string;
    };
}

interface Props {
    orders: {
        data: Order[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: any;
        meta: any;
    };
}

export default function OrdersIndex({ orders }: Props) {
    const { t } = useTranslation();
    const pageProps = usePage().props as any;
    const urlParams = new URLSearchParams(window.location.search);
    
    const [filters, setFilters] = useState({
        search: urlParams.get('search') || ''
    });
    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'desc');

    

    const handleFilter = () => {
        const params: any = {...filters, per_page: perPage};
        if (sortField) {
            params.sort = sortField;
            params.direction = sortDirection;
        }
        router.get(route('orders.index'), params, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('orders.index'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ search: '' });
        setSortField('');
        setSortDirection('desc');
        router.get(route('orders.index'), {per_page: perPage});
    };

    const getStatusBadge = (status: string) => {
        const lower = (status || '').toLowerCase();
        let colorClasses = 'bg-gray-100 text-gray-800 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300';

        if (['succeeded', 'approved', 'success', 'paid'].includes(lower)) {
            colorClasses = 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800';
        } else if (['pending', 'processing'].includes(lower)) {
            colorClasses = 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800';
        } else if (['failed', 'cancelled', 'rejected'].includes(lower)) {
            colorClasses = 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800';
        }

        return (
            <BadgeUI className={colorClasses}>
                {t(status ? status.charAt(0).toUpperCase() + status.slice(1) : '')}
            </BadgeUI>
        );
    };

    const tableColumns = [
        {
            key: 'order_id',
            header: t('Order ID'),
            sortable: true,
            render: (_: any, order: Order) => (
                <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800">
                    {order.order_id}
                </BadgeUI>
            )
        },
        {
            key: 'plan_name',
            header: t('Plan'),
            sortable: true,
            render: (_: any, order: Order) => (
                <RandomBadgeUI name={order.plan_name || '-'} />
            )
        },
        {
            key: 'coupon_code',
            header: t('Coupon'),
            render: (_: any, order: Order) => {
                const couponCode = order.total_coupon_used?.coupon_detail?.code;
                return couponCode ? (
                    <BadgeUI icon={Tag} className="bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800">
                        {couponCode}
                    </BadgeUI>
                ) : (
                    <span className="text-gray-400 text-xs">-</span>
                );
            }
        },
        {
            key: 'price',
            header: t('Amount'),
            sortable: true,
            render: (_: any, order: Order) => (
                <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {formatAdminCurrency(order.price, pageProps)}
                    </div>
                    {order.total_coupon_used?.coupon_detail && order.original_price && (
                        <div className="text-xs text-muted-foreground line-through">
                            {formatAdminCurrency(order.original_price, pageProps)}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'payment_status',
            header: t('Status'),
            sortable: true,
            render: (_: any, order: Order) => getStatusBadge(order.payment_status)
        },
        {
            key: 'payment_type',
            header: t('Payment Method'),
            sortable: true,
            render: (_: any, order: Order) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 capitalize">
                        {order.payment_type || t('N/A')}
                    </span>
                </div>
            )
        },
        {
            key: 'created_at',
            header: t('Date'),
            sortable: true,
            type: 'date'
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Orders') }]}
            pageTitle={t('Manage Orders')}
            pageDescription={t('View and manage plan subscription orders and payment history.')}
        >
            <Head title={t('Orders')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-3 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <SearchInput
                            value={filters.search}
                            onChange={(value) => setFilters({...filters, search: value})}
                            onSearch={handleFilter}
                            placeholder={t('Search orders...')}
                        />
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <PerPageSelector
                                routeName="orders.index"
                                filters={filters}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                        <DataTable
                            data={orders.data}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={ShoppingCart}
                                    title={t('No orders found')}
                                    description={t('Orders will appear here when customers make purchases.')}
                                    hasFilters={!!(filters.search)}
                                    onClearFilters={clearFilters}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-3 py-2 border-t bg-gray-50/30 sm:px-4">
                    <Pagination
                        data={orders}
                        routeName="orders.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}