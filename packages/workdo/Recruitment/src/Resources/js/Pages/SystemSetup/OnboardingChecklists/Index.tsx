import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, CheckSquare, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

import Create from './Create';
import EditOnboardingChecklist from './Edit';
import View from './View';
import BadgeUI from '@/components/badge-ui';
import NoRecordsFound from '@/components/no-records-found';
import { OnboardingChecklist, OnboardingChecklistsIndexProps, OnboardingChecklistModalState } from './types';
import SystemSetupSidebar from "../SystemSetupSidebar";
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';

export default function Index() {
    const { t } = useTranslation();
    const { onboardingchecklists, auth } = usePage<OnboardingChecklistsIndexProps>().props;

    const [modalState, setModalState] = useState<OnboardingChecklistModalState>({
        isOpen: false,
        mode: '',
        data: null
    });
    const [viewingItem, setViewingItem] = useState<OnboardingChecklist | null>(null);


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.onboarding-checklists.destroy',
        defaultMessage: t('Are you sure you want to delete this Onboarding Checklist?')
    });

    const openModal = (mode: 'add' | 'edit', data: OnboardingChecklist | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name'),
            sortable: false
        },
        {
            key: 'items',
            header: t('Items'),
            sortable: false,
            render: (value: any, row: OnboardingChecklist) => {
                const itemCount = row.checklist_items_count || 0;
                return (
                    <BadgeUI className="bg-zinc-50 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20">
                        {itemCount === 0 ? '0 items' : itemCount === 1 ? '1 item' : `${itemCount} items`}
                    </BadgeUI>
                );
            }
        },
        {
            key: 'is_default',
            header: t('Is Default'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={value ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'}>
                    {value ? t('Yes') : t('No')}
                </BadgeUI>
            )
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={value ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['view-onboarding-checklists', 'edit-onboarding-checklists','delete-onboarding-checklists'].includes(p)) ? [{
            key: 'actions',
            header: t('Action'),
            render: (_: any, onboardingchecklist: OnboardingChecklist) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('view-onboarding-checklists') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => setViewingItem(onboardingchecklist)} className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('edit-onboarding-checklists') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', onboardingchecklist)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-onboarding-checklists') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(onboardingchecklist.id)}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
        <TooltipProvider>
            <AuthenticatedLayout
                breadcrumbs={[
                    { label: t('Recruitment'), url: route('recruitment.index') },
                    { label: t('System Setup') },
                    { label: t('Onboarding Checklists') }
                ]}
                pageTitle={t('System Setup')}
                pageDescription={t('Manage recruitment system setup and configuration settings.')}
            >
                <Head title={t('Onboarding Checklists')} />

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-64 flex-shrink-0">
                        <SystemSetupSidebar activeItem="onboarding-checklists" />
                    </div>

                    <div className="flex-1">
                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                                    <h3 className="text-lg font-medium">{t('Onboarding Checklists')}</h3>
                                    {auth.user?.permissions?.includes('create-onboarding-checklists') && (
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
                                </div>
                                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[75vh] rounded-none w-full">
                                    <DataTable
                                        data={onboardingchecklists}
                                        columns={tableColumns}
                                        className="rounded-none"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={CheckSquare}
                                                title={t('No Onboarding Checklists found')}
                                                description={t('Get started by creating your first Onboarding Checklist.')}
                                                createPermission="create-onboarding-checklists"
                                                onCreateClick={() => openModal('add')}
                                                createButtonText={t('Create Onboarding Checklist')}
                                                className="h-auto"
                                            />
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                    {modalState.mode === 'add' && (
                        <Create onSuccess={closeModal} />
                    )}
                    {modalState.mode === 'edit' && modalState.data && (
                        <EditOnboardingChecklist
                            onboardingchecklist={modalState.data}
                            onSuccess={closeModal}
                        />
                    )}
                </Dialog>

                <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                    {viewingItem && <View onboardingchecklist={viewingItem} />}
                </Dialog>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Onboarding Checklist')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />
            </AuthenticatedLayout>
        </TooltipProvider>
    );
}