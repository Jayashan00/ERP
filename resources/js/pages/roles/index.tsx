import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { usePageButtons } from '@/hooks/usePageButtons';
import { Input } from '@/components/ui/input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Shield, KeyRound, Users as UsersIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from '@/components/ui/separator';
import { getImagePath } from '@/utils/helpers';

import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import NoRecordsFound from '@/components/no-records-found';
import { RolesIndexProps, RoleFilters, Role } from './types';
import RandomBadgeUI from '@/components/random-badge-ui';
import BadgeUI from '@/components/badge-ui';
import GenerateAvatar from '@/components/generate-avatar';

export default function Index() {
    const { roles, auth } = usePage<RolesIndexProps>().props;
    const { t } = useTranslation();
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<RoleFilters>({
        name: urlParams.get('name') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');

    const pageButtons = usePageButtons('roleBtn', 'Test data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'roles.destroy',
        defaultMessage: t('Are you sure you want to delete this role?')
    });

    const handleFilter = () => {
        router.get(route('roles.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('roles.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '' });
        router.get(route('roles.index'), { per_page: perPage, view: viewMode });
    };

    const tableColumns = [
        {
            key: 'label',
            header: t('Role'),
            sortable: true,
            render: (_: any, role: Role) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                        <Shield className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {role.label || role.name}
                    </span>
                </div>
            )
        },
        {
            key: 'permissions_count',
            header: t('Permissions'),
            render: (_: any, role: Role) => (
                <BadgeUI className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-800/60 font-medium" icon={KeyRound}>
                    {role.permissions_count || 0} {t('Permissions')}
                </BadgeUI>
            )
        },
        {
            key: 'users',
            header: t('Users'),
            render: (_: any, role: Role) => (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {role.users && role.users.length > 0 ? (
                        <>
                            <TooltipProvider>
                                {role.users.slice(0, 3).map((user: any) => (
                                    <Tooltip key={user.id} delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                {user.avatar ? (
                                                    <img
                                                        src={getImagePath(user.avatar)}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <GenerateAvatar name={user.name} />
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{user.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </TooltipProvider>
                            {role.users.length > 3 && (
                                <BadgeUI className="rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ring-zinc-200 dark:ring-zinc-700">
                                    +{role.users.length - 3}
                                </BadgeUI>
                            )}
                        </>
                    ) : (
                        <span className="text-muted-foreground text-xs">{t('No users')}</span>
                    )}
                </div>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-roles', 'delete-roles'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, role: Role) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-roles') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('roles.edit', role.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-roles') && role.editable == true && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(role.id)}
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
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Roles') }]}
            pageTitle={t('Manage Roles')}
            pageDescription={t('Manage roles and set permissions for users across system.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('create-roles') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => router.visit(route('roles.create'))}>
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
            <Head title={t('Roles')} />

            {/* Main Content Card */}
            <Card className="shadow-sm">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({ ...filters, name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search roles...')}
                            />
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="roles.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="roles.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                        </div>
                    </div>
                </CardContent>

                {/* Table / Grid Content */}
                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full">
                            <DataTable
                                data={roles.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={Shield}
                                        title={t('No roles found')}
                                        description={t('Get started by creating your first role.')}
                                        hasFilters={!!filters.name}
                                        onClearFilters={clearFilters}
                                        createPermission="create-roles"
                                        onCreateClick={() => router.visit(route('roles.create'))}
                                        createButtonText={t('Create Role')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-3 sm:p-6">
                            {roles.data.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {roles.data.map((role) => (
                                        <Card key={role.id} className="p-0 flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group">
                                            {/* Card Header — Role Icon + Label + Badge */}
                                            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-zinc-100 dark:border-zinc-800/80 flex-shrink-0">
                                                <div className="flex items-center justify-between gap-2.5">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary group-hover:scale-105 transition-transform">
                                                            <Shield className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                                        </div>
                                                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors truncate" title={role.label}>
                                                            {role.label}
                                                        </h3>
                                                    </div>

                                                    <BadgeUI className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-800/60 text-xs shrink-0" icon={KeyRound}>
                                                        {role.permissions_count || 0}
                                                    </BadgeUI>
                                                </div>
                                            </div>

                                            {/* Card Content — Assigned Users */}
                                            <CardContent className="p-4 flex-1 space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                                        <span className="font-medium flex items-center gap-1">
                                                            <UsersIcon className="w-3.5 h-3.5" />
                                                            {t('Assigned Users')}
                                                        </span>
                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                                            {role.users?.length || 0}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                                                        {role.users && role.users.length > 0 ? (
                                                            <>
                                                                <TooltipProvider>
                                                                    {role.users.slice(0, 3).map((user: any) => (
                                                                        <Tooltip key={user.id} delayDuration={100}>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                                                    {user.avatar ? (
                                                                                        <img
                                                                                            src={getImagePath(user.avatar)}
                                                                                            alt={user.name}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    ) : (
                                                                                        <GenerateAvatar name={user.name} />
                                                                                    )}
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>{user.name}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    ))}
                                                                </TooltipProvider>
                                                                {role.users.length > 3 && (
                                                                    <BadgeUI className="rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 ring-zinc-200 dark:ring-zinc-700">
                                                                        +{role.users.length - 3}
                                                                    </BadgeUI>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">{t('No users assigned')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                                            {/* Card Footer — Action Buttons */}
                                            <CardFooter className="p-2 flex justify-end items-center bg-zinc-50/50 dark:bg-zinc-950/20">
                                                <TooltipProvider>
                                                    {auth.user?.permissions?.includes('edit-roles') && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" onClick={() => router.visit(route('roles.edit', role.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{t('Edit')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {auth.user?.permissions?.includes('delete-roles') && role.editable == true && (
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog(role.id)}
                                                                    className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
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
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={Shield}
                                    title={t('No roles found')}
                                    description={t('Get started by creating your first role.')}
                                    hasFilters={!!filters.name}
                                    onClearFilters={clearFilters}
                                    createPermission="create-roles"
                                    onCreateClick={() => router.visit(route('roles.create'))}
                                    createButtonText={t('Create Role')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-4 py-3 border-t bg-gray-50/30 overflow-x-auto">
                    <Pagination
                        data={roles as any}
                        routeName="roles.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Role')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
