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
import { Textarea } from '@/components/ui/textarea';
import { Edit as EditIcon, Trash2, Tag as TagIcon, Search, X, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Pagination } from "@/components/ui/pagination";
import { FilterButton } from '@/components/ui/filter-button';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import NoRecordsFound from '@/components/no-records-found';
import { HelpdeskCategory, HelpdeskCategoriesIndexProps, HelpdeskCategoryFilters } from './types';
import BadgeUI from '@/components/badge-ui';

export default function Index() {
    const { t } = useTranslation();
    const pageProps = usePage<HelpdeskCategoriesIndexProps>().props;
    const { categories, auth } = pageProps;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<HelpdeskCategoryFilters>({
        name: urlParams.get('name') || '',
        is_active: urlParams.get('is_active') || '',
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [editingItem, setEditingItem] = useState<HelpdeskCategory | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const isCreateMode = !editingItem;

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'helpdesk-categories.destroy',
        defaultMessage: t('Are you sure you want to delete this Helpdesk category?')
    });

    // Create form
    const createForm = useForm({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
    });

    // Edit form
    const editForm = useForm({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
    });

    const handleFilter = () => {
        router.get(route('helpdesk-categories.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('helpdesk-categories.index'), { ...filters, per_page: perPage, sort: field, direction }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', is_active: '' });
        router.get(route('helpdesk-categories.index'), { per_page: perPage });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('helpdesk-categories.store'), {
            onSuccess: () => createForm.reset()
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('helpdesk-categories.update', editingItem.id), {
            onSuccess: () => setEditingItem(null)
        });
    };

    const startEdit = (item: HelpdeskCategory) => {
        setEditingItem(item);
        editForm.setData({
            name: item.name,
            description: item.description || '',
            color: item.color || '#3B82F6',
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
            className: 'w-full max-w-0',
            render: (_: any, item: HelpdeskCategory) => {
                const ExpandableCategory = () => {
                    const [expanded, setExpanded] = useState(false);
                    const maxLength = 60;
                    const description = item.description || '';
                    const shouldTruncate = description.length > maxLength;
                    const displayText = expanded || !shouldTruncate ? description : description.substring(0, maxLength) + '...';

                    return (
                        <div className="flex items-start gap-3 w-full overflow-hidden">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                    backgroundColor: item.color ? `${item.color}20` : 'rgba(59, 130, 246, 0.1)',
                                    color: item.color || '#3B82F6'
                                }}
                            >
                                <TagIcon className="h-5 w-5" style={{ color: item.color || 'currentColor' }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-gray-900">{item.name}</p>
                                {description && (
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{displayText}</p>
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
                return <ExpandableCategory />;
            }
        },
        {
            key: 'is_active',
            header: t('Status'),
            sortable: false,
            className: 'w-[100px] text-center',
            render: (value: boolean) => (
                <BadgeUI className={`${value ? 'bg-green-100 text-green-700 ring-green-200' : 'bg-red-100 text-red-700 ring-red-200'}`}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-helpdesk-categories', 'delete-helpdesk-categories'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            className: 'w-[90px] text-right',
            render: (_: any, category: HelpdeskCategory) => (
                <div className="flex justify-end gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-helpdesk-categories') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => startEdit(category)} className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50">
                                        <EditIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-helpdesk-categories') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(category.id)}
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
                { label: t('Helpdesk') },
                { label: t('Categories') }
            ]}
            pageTitle={t('Helpdesk Categories')}
            pageDescription={t('Manage and configure helpdesk categories to organize your support tickets.')}
        >
            <Head title={t('Helpdesk Categories')} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Create/Edit Form */}
                <div className="lg:col-span-4">
                    <Card className="shadow-sm sticky top-6">
                        <CardContent className="p-4 sm:p-6">
                            {isCreateMode ? (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Add New Category')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Fill in the details to create a new category')}</p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-lg font-semibold mb-1">{t('Edit Category')}</h2>
                                    <p className="text-sm text-gray-500 mb-6">{t('Update the category details below')}</p>
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
                                        placeholder={t('Enter category name')}
                                        required
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.name : editForm.errors.name} />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description">{t('Description')}</Label>
                                    <Textarea
                                        id="description"
                                        value={isCreateMode ? createForm.data.description : editForm.data.description}
                                        onChange={(e) => isCreateMode ? createForm.setData('description', e.target.value) : editForm.setData('description', e.target.value)}
                                        placeholder={t('Enter category description')}
                                        rows={3}
                                        className="mt-1"
                                    />
                                    <InputError message={isCreateMode ? createForm.errors.description : editForm.errors.description} />
                                </div>

                                {/* Color & Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="color">{t('Color')}</Label>
                                        <Input
                                            id="color"
                                            type="color"
                                            value={isCreateMode ? createForm.data.color : editForm.data.color}
                                            onChange={(e) => isCreateMode ? createForm.setData('color', e.target.value) : editForm.setData('color', e.target.value)}
                                            className="mt-1 h-10 p-1 cursor-pointer w-full"
                                        />
                                        <InputError message={isCreateMode ? createForm.errors.color : editForm.errors.color} />
                                    </div>

                                    <div>
                                        <Label htmlFor="is_active">{t('Status')}</Label>
                                        <Select
                                            value={isCreateMode ? (createForm.data.is_active ? "1" : "0") : (editForm.data.is_active ? "1" : "0")}
                                            onValueChange={(value) => isCreateMode ? createForm.setData('is_active', value === "1") : editForm.setData('is_active', value === "1")}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">{t('Active')}</SelectItem>
                                                <SelectItem value="0">{t('Inactive')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={isCreateMode ? createForm.errors.is_active : editForm.errors.is_active} />
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isCreateMode ? createForm.processing : editForm.processing}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isCreateMode
                                            ? (createForm.processing ? t('Creating...') : t('Add Category'))
                                            : (editForm.processing ? t('Updating...') : t('Update Category'))
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
                        <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-wrap items-center gap-2 flex-1">
                                    <div className="relative flex-1 min-w-[180px] max-w-md">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t('Search category by name...')}
                                            value={filters.name}
                                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button onClick={handleFilter} size="sm">{t('Search')}</Button>
                                    {filters.name && (
                                        <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                                            <X className="h-4 w-4" />
                                            {t('Reset')}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <PerPageSelector
                                        routeName="helpdesk-categories.index"
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
                            <CardContent className="p-2.5 bg-blue-50/30 border-b sm:p-6">
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

                    {/* Helpdesk Categories List */}
                    <Card className="shadow-sm">
                        <CardContent className="p-0">
                            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                                    <DataTable
                                        data={categories?.data || []}
                                        columns={tableColumns}
                                        onSort={handleSort}
                                        sortKey={sortField}
                                        sortDirection={sortDirection as 'asc' | 'desc'}
                                        className="shadow-none border-0"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={TagIcon}
                                                title={t('No Helpdesk Categories found')}
                                                description={t('Get started by creating your first Helpdesk Category.')}
                                                hasFilters={!!(filters.name || filters.is_active)}
                                                onClearFilters={clearFilters}
                                                className="h-auto"
                                            />
                                        }
                                    />
                            </div>
                        </CardContent>

                        {/* Pagination */}
                        {categories?.data?.length > 0 && (
                            <CardContent className="p-2.5 sm:px-6 sm:py-3 border-t bg-gray-50/30">
                                <Pagination
                                    data={categories || { data: [], links: [], meta: {} }}
                                    routeName="helpdesk-categories.index"
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
                title={t('Delete Category')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}