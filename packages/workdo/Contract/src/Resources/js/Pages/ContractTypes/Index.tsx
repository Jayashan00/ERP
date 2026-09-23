import { useState } from 'react';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Edit as EditIcon, Trash2, Tag as TagIcon, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import { FilterButton } from '@/components/ui/filter-button';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import NoRecordsFound from '@/components/no-records-found';
import BadgeUI from '@/components/badge-ui';
import { ContractType, ContractTypesIndexProps, ContractTypeFilters } from './types';

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<ContractTypesIndexProps>().props;
    const { contracttypes, auth } = pageProps;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<ContractTypeFilters>({
        name: urlParams.get('name') || '',
        is_active: urlParams.get('is_active') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [editingItem, setEditingItem] = useState<ContractType | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const isCreateMode = !editingItem;

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'contract-types.destroy',
        defaultMessage: t('Are you sure you want to delete this contract type?')
    });

    // Create form
    const createForm = useForm({
        name: '',
        is_active: true,
    });

    // Edit form
    const editForm = useForm({
        name: '',
        is_active: true,
    });

    const handleFilter = () => {
        router.get(route('contract-types.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('contract-types.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', is_active: '' });
        router.get(route('contract-types.index'), { per_page: perPage });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('contract-types.store'), {
            onSuccess: () => createForm.reset()
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('contract-types.update', editingItem.id), {
            onSuccess: () => setEditingItem(null)
        });
    };

    const startEdit = (item: ContractType) => {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            is_active: item.is_active,
        });
    };

    const cancelEdit = () => {
        setEditingItem(null);
        editForm.reset();
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name'),
            sortable: true,
            className: 'w-1/3 max-w-0',
            render: (_: any, item: ContractType) => {
                const ExpandableName = () => {
                    const [expanded, setExpanded] = useState(false);
                    const maxLength = 60;
                    const shouldTruncate = item.name.length > maxLength;
                    const displayText = expanded || !shouldTruncate ? item.name : item.name.substring(0, maxLength) + '...';
                    return (
                        <div className="flex items-center gap-3 w-full overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <TagIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-gray-900">{displayText}</p>
                                {shouldTruncate && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                        className="text-xs text-blue-500 hover:text-blue-600 mt-0.5 flex items-center gap-0.5"
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
                return <ExpandableName />;
            }
        },
        {
            key: 'contracts_count',
            header: t('Contracts'),
            sortable: true,
            render: (value: number, contracttype: ContractType) => {
                const contracts = contracttype.contracts || [];
                const totalCount = contracts.length;

                if (totalCount === 0) {
                    return (
                        <div className="flex">
                            <span className="text-gray-400 text-sm font-medium">{t('No contracts')}</span>
                        </div>
                    );
                }

                const displayContracts = contracts.slice(0, 4);
                const remainingCount = totalCount - displayContracts.length;

                return (
                    <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                            {displayContracts.map((contract) => (
                                <BadgeUI
                                    key={contract.id}
                                    className="bg-blue-50 text-blue-700 ring-blue-600/20"
                                >
                                    {contract.contract_number}
                                </BadgeUI>
                            ))}
                            {remainingCount > 0 && (
                                <BadgeUI
                                    className="bg-gray-100 text-gray-600 ring-gray-200"
                                >
                                    +{remainingCount} {t('more')}
                                </BadgeUI>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: false,
            className: 'text-center',
            render: (value: boolean) => (
                <BadgeUI className={value ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-rose-50 text-rose-700 ring-rose-600/20'}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-contract-types', 'delete-contract-types'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'text-right',
            render: (_: any, contracttype: ContractType) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-contract-types') && (contracttype.creator_id === auth.user?.id || contracttype.created_by === auth.user?.id) && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(contracttype)} className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-contract-types') && (contracttype.creator_id === auth.user?.id || contracttype.created_by === auth.user?.id) && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(contracttype.id)}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
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
                { label: t('Contract') },
                { label: t('Contract Types') }
            ]}
            pageTitle={t('Contract Types')}
            pageDescription={t('Manage contract types and system setup preferences.')}
        >
            <Head title={t('Contract Types')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Create/Edit Form */}
                <div className="lg:col-span-4">
                    <Card className="shadow-sm sticky top-6">
                        <CardContent className="p-4 sm:p-6">
                            {isCreateMode ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Add New Contract Type')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new contract type')}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Edit Contract Type')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Update the contract type details below')}</p>
                                </>
                            )}

                            <form onSubmit={isCreateMode ? handleCreate : handleUpdate} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <Label htmlFor="name">{t('Name')}</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={isCreateMode ? createForm.data.name : editForm.data.name}
                                        onChange={(e) => isCreateMode ? createForm.setData('name', e.target.value) : editForm.setData('name', e.target.value)}
                                        placeholder={t('Enter contract type name')}
                                        required
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.name : editForm.errors.name} />
                                </div>

                                {/* Is Active Toggle */}
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{t('Active')}</p>
                                        <p className="text-xs text-gray-500">{t('Enable or disable this contract type')}</p>
                                    </div>
                                    <Switch
                                        id="is_active"
                                        checked={isCreateMode ? createForm.data.is_active : editForm.data.is_active}
                                        onCheckedChange={(checked) => isCreateMode ? createForm.setData('is_active', !!checked) : editForm.setData('is_active', !!checked)}
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreateMode ? createForm.processing : editForm.processing}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isCreateMode
                                            ? (createForm.processing ? t('Creating...') : t('Add Contract Type'))
                                            : (editForm.processing ? t('Updating...') : t('Update Contract Type'))
                                        }
                                    </Button>
                                    {!isCreateMode && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            {t('Cancel')}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - List View */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Search & Controls Header */}
                    <Card className="shadow-sm">
                        <CardContent className="p-4 border-b bg-gray-50/50 sm:p-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="w-full sm:max-w-md">
                                    <SearchInput
                                        value={filters.name}
                                        onChange={(value) => setFilters({ ...filters, name: value })}
                                        onSearch={handleFilter}
                                        placeholder={t('Search by name or contract number...')}
                                    />
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                                    <PerPageSelector
                                        routeName="contract-types.index"
                                        filters={{ ...filters, sort: sortField, direction: sortDirection }}
                                    />
                                    <div className="relative">
                                        <FilterButton
                                            showFilters={showFilters}
                                            onToggle={() => setShowFilters(!showFilters)}
                                        />
                                        {(() => {
                                            const activeFilters = [filters.is_active].filter(Boolean).length;
                                            return activeFilters > 0 ? (
                                                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                    {activeFilters}
                                                </span>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <CardContent className="p-4 bg-blue-50/30 border-b sm:p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('Status')}</label>
                                        <Select value={filters.is_active || 'all'} onValueChange={(value) => setFilters({ ...filters, is_active: value === 'all' ? '' : value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('All Status')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('All Status')}</SelectItem>
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
                    </Card>

                    {/* Contract Types List */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                                <DataTable
                                    data={contracttypes?.data || []}
                                    columns={tableColumns}
                                    onSort={handleSort}
                                    sortKey={sortField}
                                    sortDirection={sortDirection as 'asc' | 'desc'}
                                    className="shadow-none border-0"
                                    emptyState={
                                        <NoRecordsFound
                                            icon={TagIcon}
                                            title={t('No Contract Types found')}
                                            description={t('Get started by creating your first Contract Type.')}
                                            hasFilters={!!(filters.name || filters.is_active)}
                                            onClearFilters={clearFilters}
                                            createPermission="create-contract-types"
                                            onCreateClick={() => {}}
                                            createButtonText={t('Create Contract Type')}
                                            className="h-auto"
                                        />
                                    }
                                />
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {contracttypes?.data?.length > 0 && (
                            <CardContent className="px-3 py-2 border-t bg-gray-50/30 sm:px-6 sm:py-3">
                                <Pagination
                                    data={contracttypes || { data: [], links: [], meta: {} }}
                                    routeName="contract-types.index"
                                    filters={{ ...filters, per_page: perPage, sort: sortField, direction: sortDirection }}
                                />
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Contract Type')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
