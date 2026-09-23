import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { History, Shield } from "lucide-react";
import { FilterButton } from '@/components/ui/filter-button';
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import NoRecordsFound from '@/components/no-records-found';
import { getImagePath, formatDateTime } from '@/utils/helpers';
import GenerateAvatar from '@/components/generate-avatar';
import RandomBadgeUI from '@/components/random-badge-ui';

interface LoginHistoryItem {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    ip: string;
    date: string;
    details: {
        status: string;
        country?: string;
        city?: string;
        browser_name?: string;
        os_name?: string;
        device_type?: string;
        isp?: string;
        org?: string;
        timezone?: string;
        browser_language?: string;
    };
    type: string;
    created_at: string;
}

interface LoginHistoryProps {
    loginHistories: {
        data: LoginHistoryItem[];
        links: any[];
        meta: any;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    roles: Record<string, string>;
    auth: any;
    [key: string]: unknown;
}

interface LoginHistoryFilters {
    user_name: string;
    ip: string;
    role: string;
}

export default function LoginHistory() {
    const { t } = useTranslation();
    const { loginHistories, roles, auth } = usePage<LoginHistoryProps>().props;
    const urlParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState<LoginHistoryFilters>({
        user_name: urlParams.get('user_name') || '',
        ip: urlParams.get('ip') || '',
        role: urlParams.get('role') || ''
    });

    const [perPage] = useState(urlParams.get('per_page') || '10');
    const [sortField, setSortField] = useState(urlParams.get('sort') || '');
    const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
    const [showFilters, setShowFilters] = useState(false);


    const handleFilter = () => {
        router.get(route('users.login-history'), {...filters, per_page: perPage, sort: sortField, direction: sortDirection}, {
            preserveState: true,
            replace: true
        });
    };

    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
        router.get(route('users.login-history'), {...filters, per_page: perPage, sort: field, direction}, {
            preserveState: true,
            replace: true
        });
    };

    const clearFilters = () => {
        setFilters({ user_name: '', ip: '', role: '' });
        router.get(route('users.login-history'), {per_page: perPage});
    };

    const tableColumns = [
        {
            key: 'user.name',
            header: t('User'),
            sortable: true,
            render: (_: any, item: LoginHistoryItem) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        {item.user?.avatar ? (
                            <img
                                src={getImagePath(item.user.avatar)}
                                alt={item.user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <GenerateAvatar name={item.user?.name || ''} />
                        )}
                    </div>
                    <div className="flex flex-col text-start">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {item.user?.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {item.user?.email}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'ip',
            header: t('IP Address'),
            sortable: true,
            render: (value: string) => (
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {value || '-'}
                </span>
            )
        },
        {
            key: 'details',
            header: t('Location & Device'),
            render: (details: any) => (
                <div className="text-xs space-y-1">
                    <div className="font-medium text-foreground">
                        {details?.city ? `${details?.city}, ${details?.country}` : (details?.country || 'Unknown')}
                    </div>
                    <div className="text-muted-foreground">
                        {details?.browser_name} {details?.os_name ? `on ${details?.os_name}` : ''}
                    </div>
                    {details?.device_type && (
                        <div className="text-muted-foreground capitalize">{details?.device_type}</div>
                    )}
                    {details?.isp && <div className="text-muted-foreground capitalize"><span className="text-gray-500 font-medium">ISP:</span> {details?.isp}</div>}
                    {details?.org && <div className="text-muted-foreground capitalize"><span className="text-gray-500 font-medium">Org:</span> {details?.org}</div>}
                    {details?.timezone && <div className="text-muted-foreground capitalize"><span className="text-gray-500 font-medium">TZ:</span> {details?.timezone}</div>}
                    {details?.browser_language && <div className="text-muted-foreground capitalize"><span className="text-gray-500 font-medium">Lang:</span> {details?.browser_language}</div>}
                </div>
            )
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
            key: 'created_at',
            header: t('Time'),
            sortable: true,
            render: (value: string) => (
                <span className="text-xs text-muted-foreground font-medium">
                    {formatDateTime(value)}
                </span>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                {label: t('Users'), url: route('users.index')},
                {label: t('Login History')}
            ]}
            pageTitle={t('User Login History')}
            pageDescription={t('Track user login activity and session history.')}
            backUrl={route('users.index')}
        >
            <Head title={t('User Login History')} />

            <Card className="shadow-sm">
                <CardContent className="p-3 border-b bg-gray-50/50 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <SearchInput
                                value={filters.user_name}
                                onChange={(value) => setFilters({...filters, user_name: value})}
                                onSearch={handleFilter}
                                placeholder={t('Search by user name...')}
                            />
                        <div className="flex items-center gap-1.5 sm:gap-3">
                            <PerPageSelector
                                routeName="users.login-history"
                                filters={filters}
                            />
                            <div className="relative">
                                <FilterButton
                                    showFilters={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                />
                                {(() => {
                                    const activeFilters = [filters.ip, filters.role].filter(Boolean).length;
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

                {showFilters && (
                    <CardContent className="p-3 bg-blue-50/30 border-b sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('IP Address')}</label>
                                <Input
                                    placeholder={t('Filter by IP address')}
                                    value={filters.ip}
                                    onChange={(e) => setFilters({...filters, ip: e.target.value})}
                                />
                            </div>
                            {auth.user?.permissions?.includes('manage-roles') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Role')}</label>
                                    <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                                        <SelectTrigger>
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
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter} size="sm">{t('Apply')}</Button>
                                <Button variant="outline" onClick={clearFilters} size="sm">{t('Clear')}</Button>
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-0">
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
                        <DataTable
                            data={loginHistories.data}
                            columns={tableColumns}
                            onSort={handleSort}
                            sortKey={sortField}
                            sortDirection={sortDirection as 'asc' | 'desc'}
                            className="rounded-none"
                            emptyState={
                                <NoRecordsFound
                                    icon={History}
                                    title={t('No login history found')}
                                    description={t('No login records available.')}
                                    hasFilters={!!(filters.user_name || filters.ip || filters.role)}
                                    onClearFilters={clearFilters}
                                    className="h-auto"
                                />
                            }
                        />
                    </div>
                </CardContent>

                <CardContent className="px-3 py-2 border-t bg-gray-50/30 sm:px-4">
                    <Pagination
                        data={loginHistories}
                        routeName="users.login-history"
                        filters={{...filters, per_page: perPage}}
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}