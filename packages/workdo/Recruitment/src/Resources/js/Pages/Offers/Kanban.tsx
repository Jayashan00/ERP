import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit as EditIcon, Trash2, Eye, Calendar, List, MoreVertical, Briefcase, Mail, Download, UserPlus, User, XCircle, CheckCircle } from "lucide-react";
import GenerateAvatar from '@/components/generate-avatar';
import KanbanBoard from '@/components/kanban-board';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import Create from './Create';
import EditOffer from './Edit';
import View from './View';

import { Offer } from './types';
import { KanbanTask } from '@/components/kanban-board';

interface KanbanProps {
    offers: Offer[];
    auth: { user?: { permissions?: string[] } };
    [key: string]: unknown;
}

export default function Kanban() {
    const { t } = useTranslation();
    const { offers, auth } = usePage<KanbanProps>().props;

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: 'add' | 'edit';
        data?: Offer;
    }>({
        isOpen: false,
        mode: 'add',
        data: undefined
    });

    const [viewingItem, setViewingItem] = useState<Offer | null>(null);

    const openModal = (mode: 'add' | 'edit', data?: Offer) => {
        setModalState({ isOpen: true, mode, data });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: 'add', data: undefined });
    };

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.offers.destroy',
        defaultMessage: t('Are you sure you want to delete this offer?')
    });

    const handleMove = (offerId: number, fromStatus: string, toStatus: string) => {
        router.patch(route('recruitment.offers.update-status', offerId), {
            status: toStatus
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleSendEmail = (offerId: number) => {
        router.post(route('recruitment.offers.send-email', offerId));
    };

    const columns = [
        { id: '0', title: t('Draft'), color: '#71717a' },
        { id: '1', title: t('Sent'), color: '#3b82f6' },
        { id: '2', title: t('Accepted'), color: '#10b981' },
        { id: '3', title: t('Negotiating'), color: '#f59e0b' },
        { id: '4', title: t('Declined'), color: '#f43f5e' },
        { id: '5', title: t('Expired'), color: '#f97316' },
    ];

    const groupedTasks = {
        '0': offers ? offers.filter(o => String(o.status) === '0') : [],
        '1': offers ? offers.filter(o => String(o.status) === '1') : [],
        '2': offers ? offers.filter(o => String(o.status) === '2') : [],
        '3': offers ? offers.filter(o => String(o.status) === '3') : [],
        '4': offers ? offers.filter(o => String(o.status) === '4') : [],
        '5': offers ? offers.filter(o => String(o.status) === '5') : [],
    };

    const OfferCard = ({ task }: { task: KanbanTask }) => {
        const offer = task as unknown as Offer;
        const candidateName = offer.candidate
            ? `${offer.candidate.first_name || ''} ${offer.candidate.last_name || ''}`.trim()
            : '-';

        const handleDragStart = (e: React.DragEvent) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: offer.id }));
            e.dataTransfer.effectAllowed = 'move';
        };

        const isExpired = offer.expiration_date && offer.expiration_date <= new Date().toISOString().split('T')[0];

        return (
            <div
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3.5 mb-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-move select-none group text-start"
                draggable={true}
                onDragStart={handleDragStart}
            >
                {/* Candidate Avatar/Name on left, Actions on right */}
                <div className="flex items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-150 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                            {offer.candidate?.profile_path ? (
                                <img
                                    src={getImagePath(offer.candidate.profile_path)}
                                    alt={candidateName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <GenerateAvatar name={candidateName} className="w-full h-full rounded-lg text-xs font-bold flex-shrink-0" />
                            )}
                        </div>
                        <div className="flex flex-col text-start min-w-0">
                            <span className="font-semibold text-gray-900 dark:text-gray-155 text-xs truncate">
                                {candidateName}
                            </span>
                            {offer.job?.title && (
                                <span className="text-muted-foreground text-xs truncate flex items-center gap-1">
                                    <Briefcase className="h-2.5 w-2.5 shrink-0" />
                                    {offer.job.title}
                                </span>
                            )}
                        </div>
                    </div>

                    {(auth.user?.permissions?.includes('edit-offers') ||
                        auth.user?.permissions?.includes('delete-offers') ||
                        auth.user?.permissions?.includes('send-offer-emails') ||
                        auth.user?.permissions?.includes('download-offer-letters') ||
                        auth.user?.permissions?.includes('convert-offers-to-employees') ||
                        auth.user?.permissions?.includes('view-offers')) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-250 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md transition-all"
                                    >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {auth.user?.permissions?.includes('send-offer-emails') && (
                                        <DropdownMenuItem onClick={() => handleSendEmail(offer.id)} className="gap-2 text-xs">
                                            <Mail className="h-3.5 w-3.5 text-orange-500" />
                                            {t('Send Email')}
                                        </DropdownMenuItem>
                                    )}
                                    {offer.status === '2' && auth.user?.permissions?.includes('download-offer-letters') && (
                                        <DropdownMenuItem onClick={() => window.open(offer.download_url, '_blank')} className="gap-2 text-xs">
                                            <Download className="h-3.5 w-3.5 text-purple-500" />
                                            {t('Download Offer')}
                                        </DropdownMenuItem>
                                    )}
                                    {offer.status === '2' && !Boolean(offer.converted_to_employee) && auth.user?.permissions?.includes('convert-offers-to-employees') && (
                                        <DropdownMenuItem onClick={() => router.get(route('recruitment.offers.convert-to-employee', offer.id))} className="gap-2 text-xs">
                                            <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
                                            {t('Convert to Employee')}
                                        </DropdownMenuItem>
                                    )}
                                    {Boolean(offer.converted_to_employee) && offer.employee_id && auth.user?.permissions?.includes('view-offer-employees') && (
                                        <DropdownMenuItem onClick={() => router.get(route('hrm.employees.show', offer.employee_id))} className="gap-2 text-xs">
                                            <User className="h-3.5 w-3.5 text-indigo-500" />
                                            {t('Employee Details')}
                                        </DropdownMenuItem>
                                    )}
                                    {auth.user?.permissions?.includes('view-offers') && (
                                        <DropdownMenuItem onClick={() => setViewingItem(offer)} className="gap-2 text-xs">
                                            <Eye className="h-3.5 w-3.5 text-blue-500" />
                                            {t('View')}
                                        </DropdownMenuItem>
                                    )}
                                    {auth.user?.permissions?.includes('edit-offers') && (
                                        <DropdownMenuItem onClick={() => openModal('edit', offer)} className="gap-2 text-xs">
                                            <EditIcon className="h-3.5 w-3.5 text-amber-500" />
                                            {t('Edit')}
                                        </DropdownMenuItem>
                                    )}
                                    {auth.user?.permissions?.includes('delete-offers') && (
                                        <DropdownMenuItem
                                            onClick={() => openDeleteDialog(offer.id)}
                                            className="gap-2 text-xs text-red-600 hover:!text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {t('Delete')}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                </div>

                {/* Offer details: Position, Salary, Department */}
                <div className="flex flex-col gap-1 border-t border-gray-200 dark:border-gray-700 pt-2 text-[10px] text-muted-foreground mb-2">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">{offer.position || '-'}</span>
                        <div className="flex flex-col">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{offer.salary ? formatCurrency(offer.salary) : '-'}</span>
                            {offer.bonus && <span className="text-gray-500">+{offer.bonus}</span>}
                        </div>
                    </div>
                    {offer.department?.department_name && (
                        <div className="text-gray-400 mt-0.5">{offer.department.department_name}</div>
                    )}
                </div>

                {/* Date details */}
                <div className="flex flex-col gap-1 border-t border-gray-200 dark:border-gray-700 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span>
                            {t('Start')}: {offer.start_date ? formatDate(offer.start_date) : '-'}
                        </span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${isExpired ? 'text-rose-600 font-semibold' : ''}`}>
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span>
                            {t('Expires')}: {offer.expiration_date ? formatDate(offer.expiration_date) : '-'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Offers'), url: route('recruitment.offers.index') },
                { label: t('Kanban') }
            ]}
            pageTitle={t('Offers Kanban')}
            pageDescription={t('Track and manage job offers visually')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        {auth.user?.permissions?.includes('manage-offers') && (
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => router.get(route('recruitment.offers.index'))}>
                                        <List className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('List View')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {auth.user?.permissions?.includes('create-offers') && (
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
                    </TooltipProvider>
                </div>
            }
        >
            <Head title={t('Offers Kanban')} />

            <KanbanBoard
                tasks={groupedTasks}
                columns={columns}
                onMove={handleMove}
                taskCard={OfferCard}
            />

            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create onSuccess={closeModal} />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditOffer
                        offer={modalState.data}
                        onSuccess={closeModal}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View offer={viewingItem} />}
            </Dialog>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Offer')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}
