import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit as EditIcon, Trash2, Eye, CreditCard as CreditCardIcon, Download, FileImage, LayoutGrid, PiggyBank, Coins, Landmark } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import { Input } from '@/components/ui/input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import View from './View';
import NoRecordsFound from '@/components/no-records-found';
import { BankAccount, BankAccountsIndexProps, BankAccountFilters } from './types';
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';
import RandomBadgeUI from '@/components/random-badge-ui';
import BadgeUI from '@/components/badge-ui';

export default function Index() {
    const { t } = useTranslation();
    const { bankaccounts, auth, chartofaccounts, summary } = usePage<BankAccountsIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<BankAccountFilters>({
        account_number: urlParams.get('account_number') || '',
        account_name: urlParams.get('account_name') || '',
        bank_name: urlParams.get('bank_name') || '',
        account_type: urlParams.get('account_type') || '',
        is_active: urlParams.get('is_active') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [viewingItem, setViewingItem] = useState<BankAccount | null>(null);

    const [showFilters, setShowFilters] = useState(false);



    const googleDriveButtons = usePageButtons('googleDriveBtn', { module: 'Bank Accounts', settingKey: 'GoogleDrive Bank Accounts' });
    const oneDriveButtons = usePageButtons('oneDriveBtn', { module: 'Bank Accounts', settingKey: 'OneDrive Bank Accounts' });
    const dropboxBtn = usePageButtons('dropboxBtn', { module: 'Account Bank Accounts', settingKey: 'Dropbox Account Bank Accounts' });
    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.bank-accounts.destroy',
        defaultMessage: t('Are you sure you want to delete this bank account?')
    });

    const handleFilter = () => {
        router.get(route('account.bank-accounts.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('account.bank-accounts.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({
            account_number: '',
            account_name: '',
            bank_name: '',
            account_type: '',
            is_active: '',
        });
        router.get(route('account.bank-accounts.index'), { per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode });
    };

    const handleTabChange = (type: string) => {
        const newType = type === 'all' ? '' : type;
        const newFilters = { ...filters, account_type: newType };
        setFilters(newFilters);

        router.get(route('account.bank-accounts.index'), {
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

    const activeTab = filters.account_type || 'all';


    const tableColumns = [
        {
            key: 'account_number',
            header: t('Account Number'),
            sortable: true,
            render: (value: string, invoice: any) => <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800"> {value} </BadgeUI>
        },
        {
            key: 'account_name',
            header: t('Account Name'),
            sortable: true
        },
        {
            key: 'bank_name',
            header: t('Bank Name'),
            sortable: true
        },
        {
            key: 'account_type',
            header: t('Account Type'),
            sortable: false,
            render: (value: any) => {
                const options: any = { "0": "checking", "1": "savings", "2": "credit", "3": "loan" };
                const label = options[value] || value;
                return (
                    <RandomBadgeUI name={t(label)} className="capitalize" />
                );
            }
        },
        {
            key: 'current_balance',
            header: t('Current Balance'),
            sortable: false,
            render: (value: number) => value ? formatCurrency(value) : '-'
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={`${value
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                    : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
                    }`}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-bank-accounts', 'edit-bank-accounts', 'delete-bank-accounts'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, bankaccount: BankAccount) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-bank-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(bankaccount)} className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-bank-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('account.bank-accounts.edit', bankaccount.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-bank-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(bankaccount.id)}
                                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
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
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Bank Accounts') }
            ]}
            pageTitle={t('Manage Bank Accounts')}
            pageDescription={t('Track and manage all business bank accounts, their details, and current balances.')}
            pageActions={
                <div className="flex flex-wrap items-center gap-2">
                    <TooltipProvider>
                        {googleDriveButtons.map((button) => (
                            <span key={button.id}>{button.component}</span>
                        ))}
                        {oneDriveButtons.map((button) => (
                            <span key={button.id}>{button.component}</span>
                        ))}
                        {dropboxBtn.map((button) => (
                            <span key={button.id}>{button.component}</span>
                        ))}
                        {auth.user?.permissions?.includes('create-bank-accounts') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('account.bank-accounts.create'))}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Create')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Bank Accounts')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.account_number}
                                onChange={(value) => setFilters({ ...filters, account_number: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search Bank Accounts...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="account.bank-accounts.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="account.bank-accounts.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.bank_name, filters.is_active].filter(f => f !== '' && f !== null && f !== undefined).length;
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

                {/* Account Type Tabs */}
                <CardContent className="px-5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {[
                            { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.all || 0 },
                            { key: '0', label: t('Checking'), icon: Landmark, count: summary?.checking || 0 },
                            { key: '1', label: t('Savings'), icon: PiggyBank, count: summary?.savings || 0 },
                            { key: '2', label: t('Credit'), icon: CreditCardIcon, count: summary?.credit || 0 },
                            { key: '3', label: t('Loan'), icon: Coins, count: summary?.loan || 0 },
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

                {/* Advanced Filters */}
                {showFilters && (
                    <CardContent className="p-2.5 bg-blue-50/30 border-b sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Bank Name')}</label>
                                <Input
                                    placeholder={t('Filter by Bank Name')}
                                    value={filters.bank_name}
                                    onChange={(e) => setFilters({ ...filters, bank_name: e.target.value })}
                                />
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
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                <DataTable
                                    data={bankaccounts?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="rounded-none"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={CreditCardIcon}
                                            title={t('No Bank Accounts found')}
                                            description={t('Get started by creating your first Bank Account.')}
                                            hasFilters={!!(filters.account_number || filters.bank_name || filters.account_type || filters.is_active)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-bank-accounts"
                                            onCreateClick={() => router.visit(route('account.bank-accounts.create'))}
                                            createButtonText={t('Create Bank Account')}
                                            className="h-auto"
                                        />
                                    }
                                />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-3 sm:p-6">
                            {bankaccounts?.data?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                                    {bankaccounts?.data?.map((bankaccount) => (
                                        <Card key={bankaccount.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                            {/* Card Header — Icon + Account Number + Subtitle (Bank Name) */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-zinc-100 dark:border-zinc-800/80 flex-shrink-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                            <CreditCardIcon className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col text-start">
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                                                                {bankaccount.account_name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground line-clamp-1">
                                                                {bankaccount.bank_name || '-'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <BadgeUI className={`${!bankaccount.is_active
                                                        ? 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20'
                                                        : 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-800/20'
                                                        }`}>
                                                        {bankaccount.is_active ? t('Active') : t('Inactive')}
                                                    </BadgeUI>
                                                </div>
                                            </div>

                                            {/* Card Content - Account Details */}
                                            <CardContent className="p-4 flex-1 space-y-2.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">{t('Account Number')}</span>
                                                    <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800 text-xs">
                                                        {bankaccount.account_number}
                                                    </BadgeUI>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">{t('Type')}</span>
                                                    <span className="capitalize">
                                                        {(() => {
                                                            const options: any = { "0": "checking", "1": "savings", "2": "credit", "3": "loan" };
                                                            const label = options[bankaccount.account_type] || bankaccount.account_type;
                                                            return <RandomBadgeUI name={t(label)} className="text-xs" />;
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">{t('Current Balance')}</span>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {bankaccount.current_balance ? formatCurrency(bankaccount.current_balance) : '-'}
                                                    </span>
                                                </div>
                                                {bankaccount.gl_account && (
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">{t('GL Account')}</span>
                                                        <span className="font-medium text-zinc-850 dark:text-zinc-200 truncate ml-2 max-w-[120px]" title={bankaccount.gl_account.account_name}>
                                                            {bankaccount.gl_account.account_name}
                                                        </span>
                                                    </div>
                                                )}
                                                {bankaccount.branch_name && (
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">{t('Branch')}</span>
                                                        <RandomBadgeUI name={bankaccount.branch_name} className="text-xs" />
                                                    </div>
                                                )}
                                            </CardContent>

                                            <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                                            {/* Card Footer - Action Buttons Only */}
                                            <CardFooter className="p-2 flex justify-end items-center bg-zinc-50/50 dark:bg-zinc-950/20">
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        {auth.user?.permissions?.includes('view-bank-accounts') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(bankaccount)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('View')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('edit-bank-accounts') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('account.bank-accounts.edit', bankaccount.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                        <EditIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        {auth.user?.permissions?.includes('delete-bank-accounts') && (
                                                            <Tooltip delayDuration={0}>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => openDeleteDialog(bankaccount.id)}
                                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                                    icon={CreditCardIcon}
                                    title={t('No Bank Accounts found')}
                                    description={t('Get started by creating your first Bank Account.')}
                                    hasFilters={!!(filters.account_number || filters.bank_name || filters.account_type || filters.is_active)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-bank-accounts"
                                    onCreateClick={() => router.visit(route('account.bank-accounts.create'))}
                                    createButtonText={t('Create Bank Account')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="p-2.5 sm:px-4 sm:py-3 border-t bg-gray-50/30">
                    <Pagination
                        data={bankaccounts || { data: [], links: [], meta: {} }}
                        routeName="account.bank-accounts.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>


            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View bankaccount={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Bank Account')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
