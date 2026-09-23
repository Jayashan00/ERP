import { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import ChatMessage from '../components/ChatMessage';
import ReplyForm from '../components/ReplyForm';
import { formatDateTime, getImagePath } from '@/utils/helpers';
import { ShowHelpdeskTicketProps, HelpdeskReply } from './types';
import BadgeUI from '@/components/badge-ui';
import GenerateAvatar from '@/components/generate-avatar';
import {
    Clock,
    MessageSquare,
    Calendar,
    Tag,
    User,
    ShieldAlert,
    FileText
} from 'lucide-react';
import RandomBadgeUI from '@/components/random-badge-ui';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

export default function Show() {
    const { ticket, auth } = usePage<ShowHelpdeskTicketProps>().props;
    const { t } = useTranslation();
    const [replies, setReplies] = useState<HelpdeskReply[]>(ticket.replies || []);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, replyId: null as number | null });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [replies]);

    const handleReplyAdded = (newReply: HelpdeskReply) => {
        setReplies(prev => [...prev, newReply]);
    };

    const handleDeleteReply = (replyId: number) => {
        setDeleteDialog({ isOpen: true, replyId });
    };

    const confirmDeleteReply = async () => {
        if (!deleteDialog.replyId) return;

        try {
            const response = await fetch(route('helpdesk-replies.destroy', deleteDialog.replyId), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                setReplies(prev => prev.filter(reply => reply.id !== deleteDialog.replyId));
                setDeleteDialog({ isOpen: false, replyId: null });
                router.reload({ only: [], onSuccess: () => { } });
            }
        } catch (error) {
            console.error('Error deleting reply:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            open: 'bg-blue-100 text-blue-800 ring-blue-200',
            in_progress: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
            resolved: 'bg-green-100 text-green-800 ring-green-200',
            closed: 'bg-gray-100 text-gray-800 ring-gray-200'
        };
        return (
            <BadgeUI className={`capitalize ${colors[status as keyof typeof colors]}`}>
                {t(status.replace('_', ' '))}
            </BadgeUI>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800 ring-green-200',
            medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
            high: 'bg-orange-100 text-orange-800 ring-orange-200',
            urgent: 'bg-red-100 text-red-800 ring-red-200'
        };
        return (
            <BadgeUI className={`capitalize ${colors[priority as keyof typeof colors]}`}>
                {t(priority)}
            </BadgeUI>
        );
    };

    const priorityBorders = {
        low: 'border-t-4 border-t-green-500 dark:border-t-green-600',
        medium: 'border-t-4 border-t-yellow-500 dark:border-t-yellow-600',
        high: 'border-t-4 border-t-orange-500 dark:border-t-orange-600',
        urgent: 'border-t-4 border-t-red-500 dark:border-t-red-600',
    };
    const topBorderClass = priorityBorders[ticket.priority as keyof typeof priorityBorders] || 'border-t-4 border-t-primary';
    const messagesCount = (replies.filter((reply) => !reply.is_internal || auth.user?.type === 'superadmin')?.length || 0) + 1;
    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Helpdesk Tickets'), url: route('helpdesk-tickets.index') },
                { label: `#${ticket.ticket_id} - ${ticket.title}` }
            ]}
            pageTitle={`${t('Ticket')} #${ticket.ticket_id}`}
            pageDescription={t('View ticket details, track conversation history, and manage replies.')}
            backUrl={route('helpdesk-tickets.index')}
        >
            <Head title={`Ticket #${ticket.ticket_id} - ${ticket.title}`} />

            {/* Left-Right Layout */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6 items-start w-full">

                {/* Left Column: Conversation */}
                <div className="space-y-4 lg:col-span-3 lg:space-y-6 w-full">
                    {/* Conversation Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card transition-all duration-200 hover:shadow-lg">
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10 px-3 py-3 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="relative flex items-center justify-center">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        {ticket.status !== 'closed' && (
                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-450 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-50">
                                        {t('Conversation')}
                                    </CardTitle>
                                </div>
                                <BadgeUI className="bg-primary/10 text-primary border-none">
                                    {messagesCount} {messagesCount === 1 ? t('Message') : t('Messages')}
                                </BadgeUI>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0 flex-1 flex flex-col">
                            {/* Scrollable messages container */}
                            <div className="max-h-[700px] min-h-[350px] overflow-y-auto p-3 space-y-4 sm:p-6 sm:space-y-6 scrollbar-thin scrollbar-thumb-gray-250 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                {/* First Message: Ticket Description */}
                                <ChatMessage
                                    reply={{
                                        id: 0,
                                        ticket_id: ticket.id,
                                        message: ticket.description || t('No description provided.'),
                                        attachments: [],
                                        is_internal: false,
                                        created_by: ticket?.creator?.id || 0,
                                        creator: ticket.creator || { id: 0, name: 'Unknown', email: '', avatar: '' },
                                        created_at: ticket.created_at
                                    }}
                                    isOwnMessage={ticket.creator?.id === auth.user?.id}
                                    onDelete={undefined}
                                    canDelete={false}
                                />

                                {/* Replies */}
                                {replies
                                    .filter(reply => !reply.is_internal || auth.user?.type === 'superadmin')
                                    .map((reply) => (
                                        <ChatMessage
                                            key={reply.id}
                                            reply={reply}
                                            isOwnMessage={reply.created_by === auth.user?.id}
                                            onDelete={handleDeleteReply}
                                            canDelete={auth.user?.permissions?.includes('delete-helpdesk-replies')}
                                        />
                                    ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Form */}
                            {auth.user?.permissions?.includes('create-helpdesk-replies') && (
                                <div className="border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                    {ticket.status === 'closed' && auth.user?.type !== 'superadmin' ? (
                                        <div className="p-4 text-center text-xs font-medium text-gray-500 bg-gray-50 dark:bg-zinc-900/20">
                                            {t('Ticket is closed and cannot send reply.')}
                                        </div>
                                    ) : (
                                        <ReplyForm
                                            ticketId={ticket.id}
                                            onReplyAdded={handleReplyAdded}
                                            disabled={false}
                                        />
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Ticket Overview sidebar */}
                <div className="space-y-4 lg:space-y-6 lg:sticky lg:top-6 self-start w-full">
                    <Card className={`border border-border shadow-md rounded-xl overflow-hidden bg-card transition-all duration-200 hover:shadow-lg ${topBorderClass}`}>
                        <CardHeader className="border-b border-border/50 pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Ticket Overview')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 space-y-4 sm:p-6">
                            {/* Subject */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] font-bold text-muted-foreground tracking-wider">{t('Subject')}</span>
                                    <span className="text-sm font-semibold text-foreground break-words">{ticket.title}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <ShieldAlert className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-muted-foreground tracking-wider">{t('Status')}</span>
                                    <div className="mt-1">{getStatusBadge(ticket.status)}</div>
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <Tag className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-muted-foreground tracking-wider">{t('Priority')}</span>
                                    <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
                                </div>
                            </div>

                            {/* Category */}
                            {ticket.category?.name && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <Tag className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-muted-foreground tracking-wider">{t('Category')}</span>
                                        <div className="mt-1"><RandomBadgeUI icon={Tag} name={ticket.category.name} /></div>
                                    </div>
                                </div>
                            )}

                            {/* Created By */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-[10px] font-bold text-muted-foreground tracking-wider">{t('Created By')}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            {ticket?.creator?.avatar ? (
                                                <img
                                                    src={getImagePath(ticket?.creator?.avatar)}
                                                    alt={ticket?.creator?.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <GenerateAvatar name={ticket?.creator?.name || 'Unknown'} />
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-foreground truncate">{ticket?.creator?.name || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned To */}
                            {ticket.assignedTo && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="block text-[10px] font-bold text-muted-foreground tracking-wider">{t('Assigned To')}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                {ticket.assignedTo?.avatar ? (
                                                    <img
                                                        src={getImagePath(ticket.assignedTo.avatar)}
                                                        alt={ticket.assignedTo.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <GenerateAvatar name={ticket.assignedTo.name} />
                                                )}
                                            </div>
                                            <span className="text-xs font-semibold text-foreground truncate">{ticket.assignedTo.name || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Created At */}
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-muted-foreground tracking-wider">{t('Created At')}</span>
                                    <span className="text-xs font-semibold text-foreground">{formatDateTime(ticket.created_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
            <ConfirmationDialog
                open={deleteDialog.isOpen}
                onOpenChange={(open) => setDeleteDialog({ isOpen: open, replyId: null })}
                title={t('Delete Reply')}
                message={t('Are you sure you want to delete this reply?')}
                confirmText={t('Delete')}
                onConfirm={confirmDeleteReply}
                variant="destructive"
            />
        </AuthenticatedLayout >
    );
}