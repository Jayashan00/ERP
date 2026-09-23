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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Key, Users as UsersIcon, User as UserIcon, UserCheck, History, Lock, Mail, Phone, Shield } from "lucide-react";
import { getImagePath } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import Create from './create';
import EditUser from './edit';
import ChangePassword from './change-password';
import NoRecordsFound from '@/components/no-records-found';
import { User, UsersIndexProps, UserFilters, UserModalState } from './types';
import RandomBadgeUI from '@/components/random-badge-ui';
import UserColumn from '@/components/user-column';
import BadgeUI from '@/components/badge-ui';

export default function Index() {
    const { t } = useTranslation();
    const { users, roles, auth } = usePage<UsersIndexProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<UserFilters>({
        name: urlParams.get('name') || '',
        email: urlParams.get('email') || '',
        role: urlParams.get('role') || '',
        is_enable_login: urlParams.get('is_enable_login') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');

    const [viewMode, setViewMode] = useState<'list' | 'grid'>(urlParams.get('view') as 'list' | 'grid' || 'list');
    const [modalState, setModalState] = useState<UserModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [showFilters, setShowFilters] = useState(false);

    // Add hook here
    const pageButtons = usePageButtons('userBtn', 'Test data');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'users.destroy',
        defaultMessage: t('Are you sure you want to delete this user?')
    });

    const handleFilter = () => {
        router.get(route('users.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('users.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ name: '', email: '', role: '', is_enable_login: '' });
        router.get(route('users.index'), { per_page: perPage, view: viewMode });
    };

    const openModal = (mode: 'add' | 'edit' | 'change-password', data: User | null = null) => {
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
            header: t('User'),
            sortable: true,
            render: (_: any, user: User) => (
                <UserColumn user={user} />
            )
        },
        {
            key: 'mobile_no',
            header: t('Mobile No'),
            render: (value: string) => value || '-'
        },
        {
            key: 'type',
            header: t('Role'),
            sortable: true,
            render: (value: string) => (
                <RandomBadgeUI icon={Shield} name={value} className="capitalize text-xs" />
            )
        },
        {
            key: 'is_enable_login',
            header: t('Login Status'),
            sortable: true,
            render: (value: boolean) => (
                <BadgeUI className={`${value
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-800/60'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ring-rose-200/60 dark:ring-rose-800/60'
                    }`}>
                    {value ? t('Enabled') : t('Disabled')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['change-password-users', 'edit-users', 'delete-users'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, user: User) => (
                <div className="flex gap-1">
                    {user.is_disable === 1 ? (
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
                            {auth.user?.permissions?.includes('impersonate-users') && user.id !== auth.user?.id && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.post(route('users.impersonate', user.id))}
                                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                                        >
                                            <UserCheck className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Login As User')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('change-password-users') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openModal('change-password', user)} className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700">
                                            <Key className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Change Password')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('edit-users') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => openModal('edit', user)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Edit')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('delete-users') && (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteDialog(user.id)}
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
                </div>
            )
        }] : [])
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Users') }]}
            pageTitle={t('Manage Users')}
            pageDescription={t('Manage user accounts for the system.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-login-history') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('users.login-history'))}>
                                        <History className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('User Login History')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-users') && (
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
            <Head title={t('Users')} />

            {/* Main Content Card */}
            <Card className="shadow-sm rounded-xl border border-border/50 bg-card overflow-hidden">
                {/* Search & Controls Header */}
                <CardContent className="p-2.5 border-b border-border/40 bg-muted/[0.02] sm:p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="w-full md:max-w-md">
                            <SearchInput
                                value={filters.name}
                                onChange={(value) => setFilters({ ...filters, name: value })}
                                onSearch={handleFilter}
                                placeholder={t('Search users...')}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <ListGridToggle
                                currentView={viewMode}
                                routeName="users.index"
                                filters={{ ...filters, per_page: perPage }}
                            />
                            <PerPageSelector
                                routeName="users.index"
                                filters={{ ...filters, view: viewMode }}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.email, filters.role, filters.is_enable_login].filter(Boolean).length;
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
                    <CardContent className="p-2.5 bg-blue-50/30 dark:bg-blue-950/20 border-b sm:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{t('Email')}</label>
                                <Input
                                    placeholder={t('Filter by email')}
                                    value={filters.email}
                                    onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                                    className="h-9 text-sm"
                                />
                            </div>
                            {auth.user?.permissions?.includes('manage-roles') && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{t('Role')}</label>
                                    <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder={t('Filter by role')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roles).map(([name, label]) => (
                                                <SelectItem key={name} value={name}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{t('Login Status')}</label>
                                <Select value={filters.is_enable_login} onValueChange={(value) => setFilters({ ...filters, is_enable_login: value })}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder={t('Filter by login status')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">{t('Enabled')}</SelectItem>
                                        <SelectItem value="0">{t('Disabled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm" className="h-9">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm" className="h-9">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                {/* Table / Grid Content */}
                <CardContent className="p-0">
                    {viewMode === 'list' ? (
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent max-h-[70vh] w-full min-w-0">
                            <DataTable
                                data={users.data}
                                columns={tableColumns}
                                onSort={handleSort}
                                sortKey={sortField}
                                sortDirection={sortDirection as 'asc' | 'desc'}
                                className="rounded-none"
                                emptyState={
                                    <NoRecordsFound
                                        icon={UsersIcon}
                                        title={t('No users found')}
                                        description={t('Get started by creating your first user.')}
                                        hasFilters={!!(filters.name || filters.email || filters.role || filters.is_enable_login)}
                                        onClearFilters={clearFilters}
                                        createPermission="create-users"
                                        onCreateClick={() => openModal('add')}
                                        createButtonText={t('Create User')}
                                        className="h-auto"
                                    />
                                }
                            />
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[70vh] p-4">
                            {users.data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {users.data.map((user) => (
                                        <Card key={user.id} className="relative group overflow-hidden border border-border hover:border-primary hover:shadow-lg transition-all duration-300 rounded-xl bg-card">
                                            {/* Decorative Background Top Accent */}
                                            <div className="h-12 border-b border-border" />

                                            <div className="p-5 pt-0 -mt-6">
                                                {/* Header: Avatar & Role */}
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-background shadow-md ring-2 ring-primary/15 group-hover:ring-primary/40 transition-all bg-muted flex items-center justify-center">
                                                            {user.avatar ? (
                                                                <img
                                                                    src={getImagePath(user.avatar)}
                                                                    alt={user.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <UserIcon className="w-6 h-6 text-primary" />
                                                            )}
                                                        </div>
                                                        <span
                                                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${user.is_enable_login ? 'bg-emerald-500' : 'bg-rose-500'
                                                                }`}
                                                            title={user.is_enable_login ? t('Login Enabled') : t('Login Disabled')}
                                                        />
                                                    </div>
                                                    <RandomBadgeUI name={user.type} className='capitalize absolute top-3 right-2' icon={Shield} />
                                                </div>

                                                {/* User Info Section */}
                                                <div className="mb-4">
                                                    <h3 className="font-semibold text-base text-foreground truncate" title={user.name}>
                                                        {user.name}
                                                    </h3>
                                                    <div className="mt-2 space-y-1.5">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                                                            <span className="truncate" title={user.email}>{user.email}</span>
                                                        </div>
                                                        {user.mobile_no && (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                                                                <span>{user.mobile_no}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer: Status Pill & Actions */}
                                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                                    <BadgeUI className={`${user.is_enable_login
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-800/60'
                                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ring-rose-200/60 dark:ring-rose-800/60'
                                                        }`}>
                                                        {user.is_enable_login ? t('Enabled') : t('Disabled')}
                                                    </BadgeUI>

                                                    <div className="flex items-center gap-1">
                                                        {user.is_disable === 1 ? (
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <div className="h-8 w-8 p-0 flex items-center justify-center text-muted-foreground/60">
                                                                        <Lock className="h-4 w-4" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{t('User is disabled')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <TooltipProvider>
                                                                {auth.user?.permissions?.includes('impersonate-users') && user.id !== auth.user?.id && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => router.post(route('users.impersonate', user.id))}
                                                                                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                                                                            >
                                                                                <UserCheck className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Login As User')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('change-password-users') && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => openModal('change-password', user)}
                                                                                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                                                                            >
                                                                                <Key className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Change Password')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('edit-users') && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => openModal('edit', user)}
                                                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{t('Edit')}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {auth.user?.permissions?.includes('delete-users') && (
                                                                    <Tooltip delayDuration={300}>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => openDeleteDialog(user.id)}
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
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <NoRecordsFound
                                    icon={UsersIcon}
                                    title={t('No users found')}
                                    description={t('Get started by creating your first user.')}
                                    hasFilters={!!(filters.name || filters.email || filters.role || filters.is_enable_login)}
                                    onClearFilters={clearFilters}
                                    createPermission="create-users"
                                    onCreateClick={() => openModal('add')}
                                    createButtonText={t('Create User')}
                                />
                            )}
                        </div>
                    )}
                </CardContent>

                {/* Pagination Footer */}
                <CardContent className="px-3 py-2 border-t bg-gray-50/30 sm:px-4">
                    <Pagination
                        data={users}
                        routeName="users.index"
                        filters={{ ...filters, per_page: perPage, view: viewMode }}
                    />
                </CardContent>
            </Card>

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} roles={roles} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditUser
                        user={modalState.data}
                        onSuccess={closeModal}
                        roles={roles}
                    />
                )}
                {modalState.mode === 'change-password' && modalState.data && (
                    <ChangePassword
                        user={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete User')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
