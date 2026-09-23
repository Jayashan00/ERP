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
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import Create from './Create';
import EditExpenseCategories from './Edit';
import NoRecordsFound from '@/components/no-records-found';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { ExpenseCategories, ExpenseCategoriesIndexProps, ExpenseCategoriesModalState } from './types';
import SystemSetupSidebar from "../SystemSetupSidebar";
import { url } from 'inspector';

export default function Index() {
    const { t } = useTranslation();
    const { expensecategories, auth, chartofaccounts } = usePage<ExpenseCategoriesIndexProps>().props;

    const [modalState, setModalState] = useState<ExpenseCategoriesModalState>({
        isOpen: false,
        mode: '',
        data: null
    });


    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'account.expense-categories.destroy',
        defaultMessage: t('Are you sure you want to delete this expense categories?')
    });

    const openModal = (mode: 'add' | 'edit', data: ExpenseCategories | null = null) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const tableColumns = [
        {
            key: 'category_name',
            header: t('Category Name'),
            sortable: false
        },
        {
            key: 'category_code',
            header: t('Category Code'),
            sortable: false
        },
        {
            key: 'gl_account.account_name',
            header: t('GL Account'),
            render: (value: any, row: any) => row.gl_account?.account_name ? <RandomBadgeUI name={row.gl_account.account_name} /> : '-'
        },
        {
            key: 'description',
            header: t('Description'),
            sortable: false
        },
        {
            key: 'is_active',
            header: t('Is Active'),
            render: (value: boolean) => (
                <BadgeUI className={value ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'}>
                    {value ? t('Active') : t('Inactive')}
                </BadgeUI>
            )
        },
        ...(auth.user?.permissions?.some((p: string) => ['edit-expense-categories', 'delete-expense-categories'].includes(p)) ? [{
            key: 'actions',
            header: t('Action'),
            render: (_: any, expensecategories: ExpenseCategories) => (
                <div className="flex gap-1">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('edit-expense-categories') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" onClick={() => openModal('edit', expensecategories)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Edit')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('delete-expense-categories') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDeleteDialog(expensecategories.id)}
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
                    {label: t('Accounting'), url:route('account.index')},
                    {label: t('System Setup')},
                    {label: t('Expense Categories')}
                ]}
                pageTitle={t('System Setup')}
                pageDescription={t('Manage your accounting system configurations, account types, expense categories, and revenue categories.')}
            >
                <Head title={t('Expense Categories')} />

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-64 flex-shrink-0">
                        <SystemSetupSidebar activeItem="expense-categories" />
                    </div>

                    <div className="flex-1">
                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-medium">{t('Expense Categories')}</h3>
                                    {auth.user?.permissions?.includes('create-expense-categories') && (
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
                                            data={expensecategories}
                                            columns={tableColumns}
                                            className="rounded-none"
                                            emptyState={
                                                <NoRecordsFound
                                                    icon={Settings}
                                                    title={t('No Expense Categories found')}
                                                    description={t('Get started by creating your first Expense Categories.')}
                                                    createPermission="create-expense-categories"
                                                    onCreateClick={() => openModal('add')}
                                                    createButtonText={t('Create Expense Categories')}
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
                        <Create onSuccess={closeModal} chartofaccounts={chartofaccounts} />
                    )}
                    {modalState.mode === 'edit' && modalState.data && (
                        <EditExpenseCategories
                            expensecategories={modalState.data}
                            onSuccess={closeModal} chartofaccounts={chartofaccounts}
                        />
                    )}
                </Dialog>

                <ConfirmationDialog
                    open={deleteState.isOpen}
                    onOpenChange={closeDeleteDialog}
                    title={t('Delete Expense Categories')}
                    message={deleteState.message}
                    confirmText={t('Delete')}
                    onConfirm={confirmDelete}
                    variant="destructive"
                />
            </AuthenticatedLayout>
        </TooltipProvider>
    );
}
