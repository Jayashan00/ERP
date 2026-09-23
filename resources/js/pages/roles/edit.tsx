import { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InputError from '@/components/ui/input-error';
import { RoleEditProps } from './types';
import { getPackageAlias } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import { SearchInput } from '@/components/ui/search-input';
import { Shield, KeyRound, Search, Layers, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Edit() {
    const { t } = useTranslation();
    const { role, permissions, rolePermissions } = usePage<RoleEditProps>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        label: role.label,
        permissions: rolePermissions || []
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    const handlePermissionChange = (permissionName: string, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter(p => p !== permissionName));
        }
    };

    const handleModuleChange = (modulePermissions: any[], checked: boolean) => {
        const modulePermissionNames = modulePermissions.map(p => p.name);
        if (checked) {
            const newPermissions = [...new Set([...data.permissions, ...modulePermissionNames])];
            setData('permissions', newPermissions);
        } else {
            setData('permissions', data.permissions.filter(p => !modulePermissionNames.includes(p)));
        }
    };

    const getModuleCheckState = (modulePermissions: any[]) => {
        const modulePermissionNames = modulePermissions.map(p => p.name);
        const checkedCount = modulePermissionNames.filter(name => data.permissions.includes(name)).length;

        if (checkedCount === 0) return { checked: false, indeterminate: false, count: 0, total: modulePermissionNames.length };
        if (checkedCount === modulePermissionNames.length) return { checked: true, indeterminate: false, count: checkedCount, total: modulePermissionNames.length };
        return { checked: false, indeterminate: true, count: checkedCount, total: modulePermissionNames.length };
    };

    const getAddOnSelectedCount = (addOn: string) => {
        const modules = permissions[addOn] || {};
        let count = 0;
        Object.values(modules).forEach((modPerms: any) => {
            modPerms.forEach((p: any) => {
                if (data.permissions.includes(p.name)) count++;
            });
        });
        return count;
    };

    const filteredFeatures = Object.keys(permissions).filter(addOn => {
        const alias = getPackageAlias(addOn)?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        if (alias.includes(search)) return true;

        const modules = permissions[addOn] || {};
        return Object.entries(modules).some(([modName, modPerms]: [string, any]) => {
            if (modName.toLowerCase().includes(search)) return true;
            return modPerms.some((p: any) => p.label?.toLowerCase().includes(search) || p.name?.toLowerCase().includes(search));
        });
    });

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Roles'), url: route('roles.index') },
                { label: t('Edit Role') }
            ]}
            pageTitle={`${t('Edit Role')}: ${role.label}`}
            pageDescription={t('Modify role details and permission assignments.')}
            backUrl={route('roles.index')}
        >
            <Head title={t('Edit Role')} />

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mx-auto">
                {/* Basic Details Section */}
                <Card className="border border-border shadow-sm overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 p-4 sm:p-6 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 sm:p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 flex-shrink-0">
                                    <Shield className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{t('Role Details')}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">{t('Specify the identifier and display title for this role.')}</CardDescription>
                                </div>
                            </div>
                            <BadgeUI className="bg-primary/10 text-primary ring-primary/20 font-semibold px-3 py-1 text-xs self-start sm:self-auto shrink-0" icon={KeyRound}>
                                {data.permissions.length} {t('Permissions Selected')}
                            </BadgeUI>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">
                                    {t('Name')}
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder={t('e.g., manager, finance-specialist')}
                                    disabled={role.editable == false}
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">{t('Unique system identifier used for permissions.')}</p>
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="label" className="text-sm font-medium mb-1.5 block">
                                    {t('Label')}
                                </Label>
                                <Input
                                    id="label"
                                    value={data.label}
                                    onChange={(e) => setData('label', e.target.value)}
                                    placeholder={t('e.g., Manager, Finance Specialist')}
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">{t('Human-readable display name for the role.')}</p>
                                <InputError message={errors.label} className="mt-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions Matrix Card */}
                <Card className="border border-border shadow-sm overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 p-4 sm:p-6 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 sm:p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 flex-shrink-0">
                                    <Layers className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{t('Module Permissions')}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">{t('Grant or revoke specific access rights across features.')}</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Search & Filter Bar */}
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 w-full sm:max-w-md">
                                <SearchInput
                                    value={searchTerm}
                                    onChange={(value) => setSearchTerm(value)}
                                    onSearch={() => { }}
                                    placeholder={t('Search modules or permissions...')}
                                />
                            </div>
                        </div>

                        {/* Tabs & Content */}
                        {filteredFeatures.length > 0 ? (
                            <Tabs defaultValue={filteredFeatures[0]} className="w-full">
                                <TabsList className="mb-4 sm:mb-6 w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1.5 bg-muted/50 border border-border/50 rounded-xl gap-1 flex-nowrap">
                                    {filteredFeatures.map((addOn) => {
                                        const selectedCount = getAddOnSelectedCount(addOn);
                                        return (
                                            <TabsTrigger
                                                key={addOn}
                                                value={addOn}
                                                className="capitalize whitespace-nowrap px-3 sm:px-4 py-2 text-xs font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 sm:gap-2 shrink-0"
                                            >
                                                <span>{getPackageAlias(addOn)}</span>
                                                {selectedCount > 0 && (
                                                    <span className="text-primary font-semibold">
                                                        {selectedCount}
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>

                                {filteredFeatures.map((addOn) => {
                                    const modules = permissions[addOn] || {};
                                    return (
                                        <TabsContent key={addOn} value={addOn} className="mt-0 focus-visible:outline-none">
                                            <div className="space-y-3 sm:space-y-4">
                                                {Object.entries(modules).map(([module, modulePermissions]) => {
                                                    const moduleState = getModuleCheckState(modulePermissions as any);
                                                    return (
                                                        <div key={module} className="border border-border/80 rounded-xl bg-card p-3 sm:p-4 transition-all hover:border-primary/30 shadow-xs">
                                                            {/* Module Header */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-border/40 gap-2">
                                                                <div className="flex items-center space-x-3">
                                                                    <Checkbox
                                                                        id={`module-${module}`}
                                                                        checked={moduleState.checked}
                                                                        ref={(el) => {
                                                                            if (el) (el as any).indeterminate = moduleState.indeterminate;
                                                                        }}
                                                                        onCheckedChange={(checked) =>
                                                                            handleModuleChange(modulePermissions as any, checked as boolean)
                                                                        }
                                                                        className="data-[state=checked]:bg-primary"
                                                                    />
                                                                    <Label htmlFor={`module-${module}`} className="font-semibold text-sm capitalize cursor-pointer text-foreground">
                                                                        {module?.replaceAll(/-/g, ' ')}
                                                                    </Label>
                                                                </div>

                                                                <BadgeUI className={`text-[11px] font-medium self-start sm:self-auto ${moduleState.count > 0 ? 'bg-primary/10 text-primary ring-primary/20' : 'bg-muted text-muted-foreground ring-border'}`}>
                                                                    {moduleState.count} / {moduleState.total} {t('Selected')}
                                                                </BadgeUI>
                                                            </div>

                                                            {/* Module Permissions Grid */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                                                                {(modulePermissions as any).map((permission: any) => {
                                                                    const isChecked = data.permissions.includes(permission.name);
                                                                    return (
                                                                        <div
                                                                            key={permission.name}
                                                                            className={`flex items-center space-x-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${isChecked
                                                                                ? 'bg-primary/5 border-primary/30 text-foreground'
                                                                                : 'bg-background hover:bg-muted/40 border-border/60 text-muted-foreground'
                                                                                }`}
                                                                            onClick={() => handlePermissionChange(permission.name, !isChecked)}
                                                                        >
                                                                            <Label
                                                                                htmlFor={permission.name}
                                                                                className="text-xs font-medium leading-none cursor-pointer flex-1 truncate"
                                                                            >
                                                                                {permission.label}
                                                                            </Label>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">{t('No features match your search criteria.')}</p>
                            </div>
                        )}
                        <InputError message={errors.permissions} />
                    </CardContent>
                </Card>

                {/* Submit / Cancel Actions Footer */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" disabled={processing} variant="outline" onClick={() => router.visit(route('roles.index'))}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Updating...') : t('Update Role')}
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
