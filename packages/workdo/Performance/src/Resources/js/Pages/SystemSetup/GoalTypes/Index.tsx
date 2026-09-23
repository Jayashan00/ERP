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
import { Plus, Edit, Trash2, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NoRecordsFound from '@/components/no-records-found';
import BadgeUI from '@/components/badge-ui';
import SystemSetupSidebar from '../SystemSetupSidebar';
import Create from './Create';
import EditGoalType from './Edit';

interface GoalType {
    id: number;
    name: string;
    description: string;
    status: string;
    created_at: string;
}

interface Props {
    goalTypes: GoalType[];
    auth: any;
}

interface ModalState {
    isOpen: boolean;
    mode: string;
    data: GoalType | null;
}

export default function Index() {
    const { t } = useTranslation();
    const { goalTypes, auth } = usePage<Props>().props;
    
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'performance.goal-types.destroy',
        defaultMessage: t('Are you sure you want to delete this goal type?')
    });

    const openModal = (mode: 'add' | 'edit', data: GoalType | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'name',
            header: t('Name')
        },
        {
            key: 'description',
            header: t('Description'),
            render: (value: string) => value || '-'
        },
        {
            key: 'status',
            header: t('Status'),
            render: (value: string) => (
                <BadgeUI className={value === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20' : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'}>
                    {value === 'active' ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-goal-types', 'delete-goal-types'].includes(p)) ? [{
            key: 'actions',
            header: t('Actions'),
            render: (_: any, item: GoalType) => (
                <div className="flex gap-1">
                    {auth.user?.permissions?.includes('edit-goal-types') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => openModal('edit', item)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                        </Tooltip>
                    )}
                    {auth.user?.permissions?.includes('delete-goal-types') && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(item.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                        </Tooltip>
                    )}
                </div>
            )
        }] : [])
    ];

    return (
        <TooltipProvider>
            <AuthenticatedLayout
                breadcrumbs={[
                    {label: t('Performance')},
                    {label: t('System Setup')},
                    {label: t('Goal Types')}
                ]}
                pageTitle={t('System Setup')}
                pageDescription={t('Manage system setup configurations including indicator categories and goal types.')}
            >
                <Head title={t('Goal Types')} />

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-64 flex-shrink-0">
                        <SystemSetupSidebar activeItem="goal-types" />
                    </div>

                    <div className="flex-1">
                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                                    <h3 className="text-lg font-medium">{t('Goal Types')}</h3>
                                    {auth.user?.permissions?.includes('create-goal-types') && (
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" onClick={() => openModal('add')}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('Create')}</p></TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[60vh] rounded-none w-full">
                                    <DataTable
                                        data={goalTypes}
                                        columns={tableColumns}
                                        className="rounded-none"
                                        emptyState={
                                            <NoRecordsFound
                                                icon={Target}
                                                title={t('No goal types found')}
                                                description={t('Get started by creating your first goal type.')}
                                                createPermission="create-goal-types"
                                                onCreateClick={() => openModal('add')}
                                                createButtonText={t('Create Goal Type')}
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
                        <EditGoalType goalType={modalState.data} onSuccess={closeModal} />
                    )}
                </Dialog>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Goal Type')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />
            </AuthenticatedLayout>
        </TooltipProvider>
    );
}