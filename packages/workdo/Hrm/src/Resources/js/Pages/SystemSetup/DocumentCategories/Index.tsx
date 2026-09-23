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
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

import Create from './Create';
import EditDocumentCategory from './Edit';
import NoRecordsFound from '@/components/no-records-found';
import { DocumentCategory, DocumentCategoriesIndexProps, DocumentCategoryModalState } from './types';
import SystemSetupSidebar from "../SystemSetupSidebar";
import { formatDate, formatTime, formatDateTime, formatCurrency, getImagePath } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';

export default function Index() {
    const { t } = useTranslation();
    const { documentcategories, auth } = usePage<DocumentCategoriesIndexProps>().props;

    const [modalState, setModalState] = useState<DocumentCategoryModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'hrm.document-categories.destroy',
        defaultMessage: t('Are you sure you want to delete this DocumentCategory?')
    });

    const openModal = (mode: 'add' | 'edit', data: DocumentCategory | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'document_type',
            header: t('Document Type'),
            sortable: false
        },
        {
            key: 'status',
            header: t('Status'),
            sortable: false,
            render: (value: boolean) => (
                <BadgeUI className={`${
                    value ? 'bg-green-100 text-green-800 ring-green-200' : 'bg-red-100 text-red-800 ring-red-200'
                }`}>
                    {value ? t('Enabled') : t('Disabled')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-document-categories', 'delete-document-categories'].includes(p)) ? [{
            key: 'actions',
            header: t('Action'),
            render: (_: any, documentcategory: DocumentCategory) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-document-categories') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', documentcategory)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-document-categories') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(documentcategory.id)}
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
                    { label: t('HRM'), url: route('hrm.index') },
                    {label: t('System Setup')},
                    {label: t('Document Categories')}
                ]}
                pageTitle={t('System Setup')}
                pageDescription={t('Manage your HRM system configurations, branches, departments, designations, and document types.')}
            >
                <Head title={t('Document Categories')} />

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-64 flex-shrink-0">
                        <SystemSetupSidebar activeItem="document-categories" />
                    </div>

                    <div className="flex-1">
                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                                    <h3 className="text-lg font-medium">{t('Document Categories')}</h3>
                                    {auth.user?.permissions?.includes('create-document-categories') && (
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
                                        data={documentcategories}
                                        columns={tableColumns}
                                        className="rounded-none"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={FileText}
                                                title={t('No DocumentCategories found')}
                                                description={t('Get started by creating your first DocumentCategory.')}
                                                createPermission="create-document-categories"
                                                onCreateClick={() => openModal('add')}
                                                createButtonText={t('Create DocumentCategory')}
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
                        <EditDocumentCategory
                            documentcategory={modalState.data}
                            onSuccess={closeModal}
                        />
                    )}
                </Dialog>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete DocumentCategory')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />
            </AuthenticatedLayout>
        </TooltipProvider>
    );
}