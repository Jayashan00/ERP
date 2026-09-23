import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Trash2, ArrowRightLeft, Package, Warehouse as WarehouseIcon, CalendarDays, Image } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import NoRecordsFound from '@/components/no-records-found';
import Create from './create';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { formatDate, getImagePath } from '@/utils/helpers';
import { TransferFilters, TransferModalState, TransfersIndexProps } from './types';

interface Warehouse {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
}

export default function Index() {
    const { t } = useTranslation();
    const { transfers, warehouses, products, auth } = usePage<TransfersIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<TransferFilters>({
        product_name: urlParams.get('product_name') || '',
        from_warehouse: urlParams.get('from_warehouse') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [showFilters, setShowFilters] = useState(false);
    const [modalState, setModalState] = useState<TransferModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'transfers.destroy',
        defaultMessage: t('Are you sure you want to delete this transfer?')
    });

    const handleFilter = () => {
        router.get(route('transfers.index'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('transfers.index'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ product_name: '', from_warehouse: '' });
        router.get(route('transfers.index'), {per_page: perPage});
    };

    const openModal = (mode: 'add', data: any | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'product.name',
            header: t('Product'),
            sortable: true,
            className: 'w-[280px]',
            render: (value: any, transfer: any) => {
                const imageUrl = transfer.product.image ? getImagePath(transfer.product.image) : '';
                return (
                    <div className="flex items-center gap-3">
                        {imageUrl ? (
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <img
                                    src={imageUrl}
                                    alt={transfer.product.name}
                                    className="w-12 h-12 object-cover rounded-md border hover:scale-110 transition-transform cursor-pointer"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.classList.remove('hidden');
                                    }}
                                />
                                <div className="hidden w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                                    <Image className="w-6 h-6 text-gray-400" />
                                </div>
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-violet-50 rounded-md border border-violet-100 flex items-center justify-center flex-shrink-0 dark:bg-violet-900/20 dark:border-violet-800">
                                <Package className="h-5 w-5 text-violet-500" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{transfer.product.name}</p>
                            {transfer.product.sku && (
                                <BadgeUI className="bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800 dark:text-gray-300">
                                    SKU: {transfer.product.sku}
                                </BadgeUI>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'from_warehouse.name',
            header: t('From Warehouse'),
            render: (_: any, transfer: any) => (
                <RandomBadgeUI name={transfer.from_warehouse.name} />
            )
        },
        {
            key: 'to_warehouse.name',
            header: t('To Warehouse'),
            render: (_: any, transfer: any) => (
                <RandomBadgeUI name={transfer.to_warehouse.name} />
            )
        },
        {
            key: 'quantity',
            header: t('Quantity'),
            sortable: true,
            render: (value: number) => (
                <BadgeUI className="bg-blue-50 text-blue-700 ring-blue-600/20">
                    {Math.floor(value) || 0}
                </BadgeUI>
            )
        },
        {
            key: 'date',
            header: t('Date'),
            type: 'date',
            sortable: true
        },
        {
            key: 'actions',
            header: t('Actions'),
            render: (_: any, transfer: any) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                {auth.user?.permissions?.includes('delete-transfers') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(transfer.id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{label: t('Transfers')}]}
            pageTitle={t('Manage Transfers')}
            pageDescription={t('Manage and track stock transfers between warehouses.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                {auth.user?.permissions?.includes('create-transfers') && (
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Create')}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Transfers')} />

            <Card className="shadow-sm dark:border-gray-700">
                {/* Search & Controls */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 dark:bg-gray-800/50 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.product_name}
                                onChange={(value) => setFilters({...filters, product_name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search transfers...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <PerPageSelector
                                routeName="transfers.index"
                                filters={filters}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {filters.from_warehouse && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                        1
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-2.5 bg-blue-50/30 border-b dark:bg-blue-950/20 sm:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('From Warehouse')}</label>
                                <Select value={filters.from_warehouse} onValueChange={(value) => setFilters({...filters, from_warehouse: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Filter by warehouse')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                                {warehouse.name}
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

                {/* Table */}
                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                        <DataTable
                            data={transfers.data}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={ArrowRightLeft}
                                    title={t('No transfers found')}
                                    description={t('Get started by creating your first transfer.')}
                                    hasFilters={!!(filters.product_name || filters.from_warehouse)}
                                    onClearFilters={clearFilters}
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create Transfer')}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                {/* Pagination */}
                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30 dark:bg-gray-800/30 dark:border-gray-700">
                    <Pagination
                        data={transfers}
                        routeName="transfers.index"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Transfer')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
