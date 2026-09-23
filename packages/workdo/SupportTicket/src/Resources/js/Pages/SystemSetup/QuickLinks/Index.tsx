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
import { Plus, Edit, Trash2, Link as LinkIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NoRecordsFound from '@/components/no-records-found';
import SystemSetupSidebar from "../SystemSetupSidebar";
import CreateModal from './Create';
import EditModal from './Edit';
import RandomBadgeUI from '@/components/random-badge-ui';

interface QuickLink {
    id: number;
    title: string;
    icon: string;
    link: string;
    order: number;
}

interface QuickLinksProps {
    quickLinks: QuickLink[];
    auth: any;
}

interface ModalState {
    isOpen: boolean;
    mode: 'add' | 'edit' | '';
    data: QuickLink | null;
}

export default function Index() {
    const { t } = useTranslation();
    const { quickLinks, auth } = usePage<QuickLinksProps>().props;

    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'support-ticket.quick-links.destroy',
        defaultMessage: t('Are you sure you want to delete this quick link?')
    });

    const openModal = (mode: 'add' | 'edit', data: QuickLink | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'title',
            header: t('Title'),
            sortable: false,
            render: (_: any, link: QuickLink) => (
                <div className="font-medium">{link.title}</div>
            )
        },
        {
            key: 'icon',
            header: t('Icon'),
            sortable: false,
            render: (_: any, link: QuickLink) => (
                <RandomBadgeUI name={link.icon} />
            )
        },
        {
            key: 'link',
            header: t('Link'),
            sortable: false,
            render: (_: any, link: QuickLink) => (
                <div className="text-sm text-gray-600 truncate max-w-xs">{link.link}</div>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['manage-support-settings'].includes(p)) ? [{
            key: 'actions',
            header: t('Action'),
            render: (_: any, link: QuickLink) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-support-settings') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal('edit', link)}
                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('manage-support-settings') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(link.id)}
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
                    { label: t('Support Tickets'), url: route('dashboard.support-tickets') },
                    { label: t('System Setup') },
                    { label: t('Quick Links') }
                ]}
                pageTitle={t('System Setup')}
                pageDescription={t('Manage support ticket system setup and configuration settings.')}
            >
                <Head title={t('Quick Links')} />

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-64 flex-shrink-0">
                        <SystemSetupSidebar activeItem="quick-links" />
                    </div>

                    <div className="flex-1">
                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                                    <h3 className="text-lg font-medium">{t('Quick Links')}</h3>
                                    {auth.user?.permissions?.includes('manage-support-settings') && (
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
                                        data={quickLinks}
                                        columns={tableColumns}
                                        className="rounded-none"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={LinkIcon}
                                                title={t('No Quick Links found')}
                                                description={t('Get started by creating your first Quick Link.')}
                                                createPermission="manage-support-settings"
                                                onCreateClick={() => openModal('add')}
                                                createButtonText={t('Create Quick Link')}
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
                        <CreateModal onSuccess={closeModal} />
                    )}
                    {modalState.mode === 'edit' && modalState.data && (
                        <EditModal
                            quickLink={modalState.data}
                            onSuccess={closeModal}
                        />
                    )}
                </Dialog>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Quick Link')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />
            </AuthenticatedLayout>
        </TooltipProvider>
    );
}