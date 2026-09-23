import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Trash2, Paperclip, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatMessageProps } from './types';
import { formatDateTime, getImagePath } from '@/utils/helpers';
import { isImageFile } from '@/utils/fileHelpers';
import { usePage } from '@inertiajs/react';
import BadgeUI from '@/components/badge-ui';
import GenerateAvatar from '@/components/generate-avatar';

export default function ChatMessage({ reply, isOwnMessage, onDelete, canDelete }: ChatMessageProps) {
    const pageProps = usePage().props as any;
    const { imageUrlPrefix } = pageProps;
    const { t } = useTranslation();
    const [showActions, setShowActions] = useState(false);

    return (
        <div className={`flex mb-5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] sm:max-w-[80%] md:max-w-[70%] relative group`}>
                <div
                    className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all duration-200 ${reply.is_internal
                        ? 'bg-amber-50/80 dark:bg-amber-950/20 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 border border-amber-200/40'
                        : 'bg-gray-50 dark:bg-zinc-900/50 text-gray-800 dark:text-zinc-200 border border-gray-100 dark:border-zinc-800/80 rounded-tl-none'
                        }`}
                    onMouseEnter={() => setShowActions(true)}
                    onMouseLeave={() => setShowActions(false)}
                >
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-black/5 dark:border-white/5 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                {reply?.creator?.avatar ? (
                                    <img
                                        src={getImagePath(reply?.creator?.avatar)}
                                        alt={reply?.creator?.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <GenerateAvatar name={reply?.creator?.name || 'Unknown'} />
                                )}
                            </div>
                            <span className={`text-xs font-semibold tracking-wide ${reply.is_internal
                                ? 'text-amber-800 dark:text-amber-300'
                                : 'text-gray-500 dark:text-zinc-400'
                                }`}>
                                {reply.creator?.name}
                            </span>
                            {reply.is_internal && (
                                <BadgeUI className="bg-amber-100/80 dark:bg-amber-950 text-amber-800 dark:text-amber-30 ring-amber-200" >
                                    {t('Internal Note')}
                                </BadgeUI>
                            )}
                        </div>
                        {canDelete && onDelete && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(reply.id)}
                                            className={`h-4 w-4 inline-block p-0 ${showActions ? '' : 'opacity-0 hover:opacity-100'} ${reply.is_internal
                                                ? 'text-orange-600 hover:text-red-600 hover:bg-red-50'
                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                }`}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('Delete')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>

                    <div
                        className={`text-sm whitespace-pre-wrap leading-relaxed ${!reply.is_internal && 'text-gray-700 dark:text-zinc-300'}`}
                        dangerouslySetInnerHTML={{ __html: reply.message }}
                    />

                    {(() => {
                        let attachments = [];
                        if (typeof reply.attachments === 'string') {
                            try {
                                attachments = JSON.parse(reply.attachments);
                            } catch {
                                attachments = [reply.attachments];
                            }
                        } else if (Array.isArray(reply.attachments)) {
                            attachments = reply.attachments;
                        }
                        return attachments.length > 0 ? (
                            <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
                                {attachments.map((attachment: string, index: number) => {
                                    const isImage = isImageFile(attachment);
                                    return (
                                        <div key={index} className={`flex items-center justify-between gap-2 p-2 rounded-xl border dark:bg-zinc-950 border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-zinc-200'
                                            }`}>
                                            {isImage ? (
                                                <img
                                                    src={getImagePath(attachment)}
                                                    alt="Preview"
                                                    className="w-14 h-14 object-cover rounded-lg shadow-sm"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <Paperclip className="h-4 w-4 shrink-0 text-current/60" />
                                                    <span className="text-xs truncate font-medium">{attachment.split('/').pop() || attachment}</span>
                                                </div>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = isImage ? getImagePath(attachment) : `${imageUrlPrefix}/${attachment}`;
                                                    link.download = attachment.split('/').pop() || 'file';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="h-7 w-7 p-0 rounded-lg bg-black/5 dark:bg-white/5 text-gray-500"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null;
                    })()}
                </div>

                <div className={`text-[10px] text-gray-400 dark:text-zinc-500 mt-1 px-1 font-medium tracking-tight ${isOwnMessage ? 'text-right' : 'text-left'
                    }`}>
                    {formatDateTime(reply.created_at)}
                </div>
            </div>
        </div>
    );
}