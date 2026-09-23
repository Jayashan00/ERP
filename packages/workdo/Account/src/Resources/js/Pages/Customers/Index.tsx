import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Edit as EditIcon, Trash2, Building2, User as UserIcon, Lock, FileText, Eye, LayoutGrid, CheckCircle2, XCircle } from "lucide-react";
import { getImagePath } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from "@/components/ui/list-grid-toggle";
import { PerPageSelector } from "@/components/ui/per-page-selector";
import { FilterButton } from "@/components/ui/filter-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import NoRecordsFound from '@/components/no-records-found';
import { Pagination } from "@/components/ui/pagination";
import BadgeUI from "@/components/badge-ui";
import RandomBadgeUI from "@/components/random-badge-ui";
import GenerateAvatar from '@/components/generate-avatar';
import UserColumn from '@/components/user-column';


import View from './View';
import { Customer, User } from './types';
import { usePageButtons } from '@/hooks/usePageButtons';
interface CustomerFilters {
    company_name: string;
    customer_code: string;
    tax_number: string;
    status: string;
}

interface CustomerModalState {
    isOpen: boolean;
    mode: string;
    data: Customer | null;
}

interface CustomersIndexProps {
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Index() {
    const { customers, auth, is_demo } = usePage<any>().props;
    const { t } = useTranslation();
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<CustomerFilters>({
        company_name: urlParams.get('company_name') || '',
        customer_code: urlParams.get('customer_code') || '',
        tax_number: urlParams.get('tax_number') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<CustomerModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<Customer | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Customer', settingKey: 'GoogleDrive Customer' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Customer', settingKey: 'OneDrive Customer' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Account Customer', settingKey: 'Dropbox Account Customer' });
    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.customers.destroy',
        defaultMessage: 'Are you sure you want to delete this customer?'
    });

    const handleFilter = () => {
        router.get(route('account.customers.index'), {
            ...filters,
            per_page: perPage,
            sort: sortField,
            direction: sortDirection,
            view: viewMode
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('account.customers.index'), {
            ...filters,
            per_page: perPage,
            sort: field,
            direction,
            view: viewMode
        }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ company_name: '', customer_code: '', tax_number: '' });
        router.get(route('account.customers.index'), { per_page: perPage, view: viewMode });
    };

    const openModal = (mode: 'add' | 'edit', data: Customer | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'user',
            header: t('User'),
            render: (_: any, customer: any) => {
                if (!customer.user) return null;
                return <UserColumn user={customer.user} email={customer.company_name} />;
            }
        },
        {
            key: 'customer_code',
            header: t('Customer Code'),
            sortable: true,
            render: (value: any, customer: any) => {
                if (!customer.customer_code) return '-';
                return (
                    auth.user?.permissions?.includes('view-customers') ? (
                        <span className="cursor-pointer hover:opacity-90" onClick={() => setViewingItem(customer)}>
                            <RandomBadgeUI name={customer.customer_code} />
                        </span>
                    ) : (
                        <RandomBadgeUI name={customer.customer_code} />
                    )
                );
            }
        },
        {
            key: 'contact_person_name',
            header: t('Contact Person'),
            sortable: true
        },
        {
            key: 'contact_person_email',
            header: t('Email'),
            sortable: false
        },
        {
            key: 'tax_number',
            header: t('Tax Number'),
            sortable: false,
            render: (value: any, customer: any) => {
                if (!customer.tax_number) return '-';
                return <RandomBadgeUI name={customer.tax_number} />;
            }
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-customers', 'edit-customers', 'delete-customers', 'view-customer-detail-report'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, customer: Customer) => (
                <div className="flex gap-1">
                    {customer.user?.is_disable === 1 ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="h-8 w-8 p-0 flex items-center justify-center text-gray-400">
                                    <Lock className="h-4 w-4" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('User is disabled')}</p></TooltipContent>
                        </Tooltip>
                    ) : (
                        <TooltipProvider>
                            {auth.user?.permissions?.includes('view-customer-detail-report') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            const params: any = { customer: customer.user_id };
                                            if (is_demo) {
                                                const year = new Date().getFullYear();
                                                params.start_date = `${year}-01-01`;
                                                params.end_date = `${year}-12-31`;
                                            }
                                            router.visit(route('account.reports.customer-detail', params));
                                        }} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('View Report')}</p></TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('view-customers') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => setViewingItem(customer)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('View')}</p></TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('edit-customers') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => router.get(route('account.customers.edit', customer.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                            <EditIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('delete-customers') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteDialog(customer.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    )}
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Accounting'), url: route('account.index') }, { label: t('Customers') }]}
            pageTitle={t('Manage Customers')}
            pageDescription={t('Manage your customers, view details and perform actions.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    {googleDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {oneDriveButtons.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {dropboxBtn.map((button) => (
                        <div key={button.id}>{button.component}</div>
                    ))}
                    {auth.user?.permissions?.includes('create-customers') && (
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.get(route('account.customers.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
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
            <Head title="Customers" />

            <Card className="shadow-sm">
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.company_name}
                                onChange={(value) => setFilters({ ...filters, company_name: value })}
                                onSearch={handleFilter}
                                placeholder="Search customers..."
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="account.customers.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="account.customers.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.customer_code, filters.tax_number].filter(Boolean).length;
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
                    <CardContent className="p-2.5 bg-blue-50/30 border-b sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Customer Code')}</label>
                                <Input
                                    value={filters.customer_code}
                                    onChange={(e) => setFilters({ ...filters, customer_code: e.target.value })}
                                    placeholder={t('Filter by customer code')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Company Name')}</label>
                                <Input
                                    value={filters.company_name}
                                    onChange={(e) => setFilters({ ...filters, company_name: e.target.value })}
                                    placeholder={t('Filter by company name')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Tax Number')}</label>
                                <Input
                                    value={filters.tax_number}
                                    onChange={(e) => setFilters({ ...filters, tax_number: e.target.value })}
                                    placeholder={t('Filter by tax number')}
                                />
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
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <DataTable
                                    data={customers.data}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={Building2}
                                            title="No customers found"
                                            description="Get started by creating your first customer."
                                            hasFilters={!!(filters.company_name || filters.customer_code || filters.tax_number)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-customers"
                                            onCreateClick={() => router.get(route('account.customers.create'))}
                                            createButtonText="Create Customer"
                                            className="h-auto"
                                        />
                                    }
                                />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-3 sm:p-6">
                            {customers.data.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                                    {customers.data.map((customer) => {
                                        const isDisabled = customer.user?.is_disable === 1;
                                        return (
                                            <Card key={customer.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                                {/* Card Header — Avatar + Name + Subtitle (Company Name) + Code */}
                                                <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-zinc-100 dark:border-zinc-800/80 flex-shrink-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                                {customer.user.avatar ? (
                                                                    <img
                                                                        src={getImagePath(customer.user.avatar)}
                                                                        alt={customer.user.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <GenerateAvatar name={customer.user.name} />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col text-start">
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                                                    {customer.user.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {customer.company_name || '-'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Status Badge */}
                                                        <BadgeUI className={`${isDisabled
                                                            ? 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20'
                                                            : 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20'
                                                            }`}>
                                                            {isDisabled ? t('Disabled') : t('Active')}
                                                        </BadgeUI>
                                                    </div>
                                                </div>

                                                {/* Card Content - Contact Details */}
                                                <CardContent className="p-4 flex-1 space-y-2.5">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">{t('Customer Code')}</span>
                                                        <RandomBadgeUI name={customer.customer_code} className="text-xs" />
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">{t('Contact Person')}</span>
                                                        <span className="font-medium text-zinc-850 dark:text-zinc-200 truncate ml-2 max-w-[120px]" title={customer.contact_person_name}>
                                                            {customer.contact_person_name || '-'}
                                                        </span>
                                                    </div>
                                                    {customer.contact_person_email && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground">{t('Email')}</span>
                                                            <span className="text-zinc-600 dark:text-zinc-400 truncate ml-2 max-w-[120px]" title={customer.contact_person_email}>
                                                                {customer.contact_person_email}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">{t('Tax Number')}</span>
                                                        {customer.tax_number ? (
                                                            <RandomBadgeUI name={customer.tax_number} className="text-xs" />
                                                        ) : (
                                                            <span className="text-zinc-400 dark:text-zinc-600">-</span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">{t('Payment Terms')}</span>
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate ml-2 max-w-[120px]" title={customer.payment_terms || '-'}>
                                                            {customer.payment_terms || '-'}
                                                        </span>
                                                    </div>
                                                </CardContent>

                                                <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                                                {/* Card Footer - Action Buttons Only */}
                                                <CardFooter className="p-2 flex justify-end items-center bg-zinc-50/50 dark:bg-zinc-950/20">
                                                    {customer.user?.is_disable === 1 ? (
                                                        <Tooltip delayDuration={0}>
                                                            <TooltipTrigger asChild>
                                                                <div className="h-8 w-8 p-0 flex items-center justify-center text-gray-400">
                                                                    <Lock className="h-4 w-4" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('User is disabled')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <TooltipProvider>
                                                            {auth.user?.permissions?.includes('view-customer-detail-report') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                                            const params: any = { customer: customer.user_id };
                                                                            if (is_demo) {
                                                                                const year = new Date().getFullYear();
                                                                                params.start_date = `${year}-01-01`;
                                                                                params.end_date = `${year}-12-31`;
                                                                            }
                                                                            router.visit(route('account.reports.customer-detail', params));
                                                                        }} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700">
                                                                            <FileText className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('View Report')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('view-customers') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => setViewingItem(customer)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('View')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('edit-customers') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="sm" onClick={() => router.get(route('account.customers.edit', customer.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                            <EditIcon className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('Edit')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {auth.user?.permissions?.includes('delete-customers') && (
                                                                <Tooltip delayDuration={0}>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openDeleteDialog(customer.id)}
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
                                                    )}
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={Building2}
                                    title="No customers found"
                                    description="Get started by creating your first customer."
                                    hasFilters={!!(filters.company_name || filters.customer_code || filters.tax_number)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-customers"
                                    onCreateClick={() => router.get(route('account.customers.create'))}
                                    createButtonText="Create Customer"
                                    className="h-auto"
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30">
                    <Pagination
                        data={customers}
                        routeName="account.customers.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>



            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View customer={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title="Delete Customer"
                message={deleteState.message}
                confirmText="Delete"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
