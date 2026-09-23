import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Ticket, Eye, ChevronDown, Tag, Calendar, Banknote, Hash, LayoutGrid, Percent, Coins } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate } from '@/utils/helpers';
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import BadgeUI from '@/components/badge-ui';
import { toast } from 'sonner';
import Create from './create';
import EditCoupon from './edit';
import NoRecordsFound from '@/components/no-records-found';

import { Coupon, CouponsIndexProps, CouponFilters, CouponModalState } from './types';

function CopyableCode({ code, className = "" }: { code: string; className?: string }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setOpen(true);
        setTimeout(() => {
            setCopied(false);
            setOpen(false);
        }, 2000);
    };

    return (
        <TooltipProvider>
            <Tooltip
                open={open}
                onOpenChange={(isOpen) => {
                    if (!copied) setOpen(isOpen);
                }}
                delayDuration={100}
            >
                <TooltipTrigger asChild>
                    <span
                        onClick={handleCopy}
                        onPointerDown={(e) => e.preventDefault()}
                        className={`font-mono cursor-pointer inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-zinc-50 text-zinc-700 ring-zinc-600/20 ${className}`}
                    >
                        {code}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{copied ? t('Copied!') : t('Click to copy')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default function Index() {
    const { t } = useTranslation();
    const { coupons, summary, auth, ...pageProps } = usePage<CouponsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);
    const currencySymbol = (pageProps as any)?.companyAllSetting?.currencySymbol || '$';

    const [filters, setFilters] = useState<CouponFilters>({
        name: urlParams.get('name') || '',
        code: urlParams.get('code') || '',
        type: urlParams.get('type') || '',
        status: urlParams.get('status') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<CouponModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showFilters, setShowFilters] = useState(false);


    const pageButtons = usePageButtons('couponBtn','Test data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'coupons.destroy',
        defaultMessage: t('Are you sure you want to delete this coupon?')
    });

    const handleFilter = () => {
        router.get(route('coupons.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('coupons.index'), {...filters, per_page: perPage, sort: field, direction, view: viewMode}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', code: '', type: '', status: '' });
        router.get(route('coupons.index'), {per_page: perPage, view: viewMode});
    };

    const handleTabChange = (type: string) => {
        const newType = type === 'all' ? '' : type;
        const newFilters = { ...filters, type: newType };
        setFilters(newFilters);

        router.get(route('coupons.index'), {
            ...newFilters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        }, {
            preserveState: true,
            replace: true
        });
    };

    const activeTab = filters.type || 'all';

    const openModal = (mode: 'add' | 'edit', data: Coupon | null = null) => {
        setModalState({
            isOpen: true,
            mode,
            data
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            mode: '',
            data: null
        });
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name'),
            sortable: true,
            className: 'w-1/3 max-w-0',
            render: (value: string, coupon: Coupon) => {
                const ExpandableCoupon = () => {
                    const [expanded, setExpanded] = useState(false);
                    const maxLength = 60;
                    const description = coupon.description || '';
                    const shouldTruncate = description.length > maxLength;
                    const displayText = expanded || !shouldTruncate ? description : description.substring(0, maxLength) + '...';

                    return (
                        <div className="flex items-start gap-3 w-full overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 dark:from-primary/30 dark:to-primary/10 mt-0.5">
                                <Ticket className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1 align-items-center">
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{value}</p>
                                {description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{displayText}</p>
                                )}
                                {shouldTruncate && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                        className="text-xs text-blue-500 hover:text-blue-600 mt-0.5 flex items-center gap-0.5 font-medium"
                                    >
                                        {expanded ? (
                                            <>{t('Show less')} <ChevronDown className="h-3 w-3 rotate-180" /></>
                                        ) : (
                                            <>{t('Show more')} <ChevronDown className="h-3 w-3" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                };
                return <ExpandableCoupon />;
            }
        },
        {
            key: 'code',
            header: t('Code'),
            sortable: true,
            render: (value: string) => (
                <CopyableCode code={value} className="rounded-full text-sm" />
            )
        },
        {
            key: 'discount',
            header: t('Discount'),
            render: (value: number, coupon: Coupon) => (
                <span className="font-medium">
                    {coupon.type === 'percentage' ? `${value}%` : `${currencySymbol}${value}`}
                </span>
            )
        },
        {
            key: 'type',
            header: t('Type'),
            sortable: true,
            render: (value: string) => (
                <BadgeUI className="capitalize bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800">
                    {value}
                </BadgeUI>
            )
        },
        {
            key: 'limit',
            header: t('Limit'),
            render: (value: number) => value || t('Unlimited')
        },
        {
            key: 'expiry_date',
            header: t('Expiry Date'),
            render: (value: string) => value ? <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatDate(value)}</span>
            </div> : t('No Expiry')
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: true,
            render: (value: boolean) => (
                <BadgeUI className={`${value
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800'
                    : 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800'
                    }`}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, coupon: Coupon) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-coupons') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => router.visit(route('coupons.show', coupon.id))}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-coupons') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', coupon)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-coupons') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(coupon.id)}
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
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Coupons')}]}
            pageTitle={t('Manage Coupons')}
            pageDescription={t('Create, configure, and manage coupon codes for discounts and promotional offers.')}
            pageActions={
                <div className="flex gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('create-coupons') && (
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
                        {pageButtons.map((button) => (
                            <div key={button.id}>{button.component}</div>
                        ))}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Coupons')} />

            <Card className="shadow-sm">
                <CardContent className="p-3 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <SearchInput
                            value={filters.name}
                            onChange={(value) => setFilters({...filters, name: value})}
                            onSearch={handleFilter}
                            placeholder={t('Search coupons...')}
                        />
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="coupons.index"
                                filters={{...filters, per_page: perPage}}
                            />
                            <PerPageSelector
                                routeName="coupons.index"
                                filters={{...filters, view: viewMode}}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.code, filters.type, filters.status].filter(Boolean).length;
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

                {/* Type Tabs */}
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.total || 0 },
                            { key: 'percentage', label: t('Percentage'), icon: Percent, count: summary?.percentage || 0 },
                            { key: 'flat', label: t('Flat'), icon: Coins, count: summary?.flat || 0 },
                            { key: 'fixed', label: t('Fixed'), icon: Banknote, count: summary?.fixed || 0 },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-150 border-b-2 ${activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-200'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4 flex-shrink-0" />
                                {tab.label}
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

                {showFilters && (
                    <CardContent className="p-3 bg-blue-50/30 border-b sm:p-6">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Code')}</label>
                                <Input
                                    placeholder={t('Filter by code')}
                                    value={filters.code}
                                    onChange={(e) => setFilters({...filters, code: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by status')} />
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

                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                            <DataTable
                                data={coupons.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={Ticket}
                                        title={t('No coupons found')}
                                        description={t('Get started by creating your first coupon.')}
                                        hasFilters={!!(filters.name || filters.code || filters.type || filters.status)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-coupons"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create Coupon')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-3 sm:p-4">
                            {(coupons?.data || coupons)?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {(coupons?.data || coupons)?.map((coupon: Coupon) => (
                                        <Card key={coupon.id} className="p-0 flex flex-col hover:shadow-xl transition-all duration-300 overflow-hidden border-0 ring-1 ring-gray-200 hover:ring-primary/40 dark:ring-gray-700 dark:hover:ring-primary/50 group">
                                            {/* Card Header — Large icon + name + status badge */}
                                            <div className="px-5 pt-5 pb-4 flex-shrink-0">
                                                <div className="flex items-start justify-between gap-2 mb-4">
                                                    {/* Big icon */}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${coupon.status
                                                        ? 'bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/10'
                                                        : 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800'
                                                        }`}>
                                                        <Ticket className={`h-7 w-7 ${coupon.status ? 'text-primary' : 'text-gray-400'}`} />
                                                    </div>
                                                    <BadgeUI className={`${coupon.status
                                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800'
                                                        : 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/10 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800'
                                                        }`}>
                                                        {coupon.status ? t('Active') : t('Inactive')}
                                                    </BadgeUI>
                                                </div>
                                                <h3 className="font-bold text-base text-gray-900 truncate dark:text-gray-100 mb-1" title={coupon.name}>{coupon.name}</h3>
                                                <div className="flex items-center gap-1">
                                                    <CopyableCode code={coupon.code} className="rounded text-xs font-medium text-gray-900" />
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Card Body — coupon details */}
                                            <CardContent className="px-5 py-4 flex-1 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 dark:bg-blue-900/20 dark:border-blue-800">
                                                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-muted-foreground mb-0.5">{t('Discount & Type')}</p>
                                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate capitalize">
                                                            {coupon.type === 'percentage' ? `${coupon.discount}%` : `${currencySymbol}${coupon.discount}`} ({coupon.type})
                                                        </p>
                                                    </div>
                                                </div>

                                                {(coupon.limit || coupon.limit_per_user) && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0 dark:bg-purple-900/20 dark:border-purple-800">
                                                            <Hash className="h-3.5 w-3.5 text-purple-500" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground mb-0.5">{t('Usage Limits')}</p>
                                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                                {coupon.limit ? `${t('Total')}: ${coupon.limit}` : t('Unlimited')} {coupon.limit_per_user ? `| ${t('Per User')}: ${coupon.limit_per_user}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {(coupon.minimum_spend || coupon.maximum_spend) && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 dark:bg-emerald-900/20 dark:border-emerald-800">
                                                            <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground mb-0.5">{t('Spend Range')}</p>
                                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                                {coupon.minimum_spend ? `${t('Min')}: ${currencySymbol}${coupon.minimum_spend}` : ''} {coupon.maximum_spend ? `${t('Max')}: ${currencySymbol}${coupon.maximum_spend}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 dark:bg-orange-900/20 dark:border-orange-800">
                                                        <Calendar className="h-3.5 w-3.5 text-orange-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-muted-foreground mb-0.5">{t('Expiry Date')}</p>
                                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                            {coupon.expiry_date ? formatDate(coupon.expiry_date, pageProps) : t('No Expiry')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <Separator />

                                            {/* Card Footer — Actions */}
                                            <CardFooter className="px-4 py-2.5 flex items-center justify-end bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        {auth.user?.permissions?.includes('view-coupons') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('coupons.show', coupon.id))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('edit-coupons') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', coupon)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('delete-coupons') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openDeleteDialog(coupon.id)}
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={Ticket}
                                    title={t('No coupons found')}
                                    description={t('Get started by creating your first coupon.')}
                                    hasFilters={!!(filters.name || filters.code || filters.type || filters.status)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-coupons"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Coupon')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {coupons?.data && (
                    <CardContent className="px-4 py-2 border-t bg-gray-50/30">
                        <Pagination
                            data={coupons}
                            routeName="coupons.index"
                            filters={{ ...filters, per_page: perPage, view: viewMode }}
                        />
                    </CardContent>
                )}
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditCoupon
                        coupon={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Coupon')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}