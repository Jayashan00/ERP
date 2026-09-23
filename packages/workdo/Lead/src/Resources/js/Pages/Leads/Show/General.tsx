import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Lead } from '../types';
import { formatDate, formatDateTime, getImagePath } from '@/utils/helpers';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { InputError } from '@/components/ui/input-error';
import { Textarea } from '@/components/ui/textarea';
import { useForm, usePage } from '@inertiajs/react';
import { Plus, Mail, Phone, Calendar, User, GitBranch, Layers, CheckSquare, Globe, Package, MessageSquare, Clock, Star, Send } from 'lucide-react';
import { useFormFields } from '@/hooks/useFormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';

interface GeneralProps {
    lead: Lead;
}

function ExpandableText({ text }: { text: string }) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const checkOverflow = () => {
            const el = textRef.current;
            if (el && !isExpanded) {
                setHasOverflow(el.scrollHeight > el.clientHeight);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text, isExpanded]);

    return (
        <div>
            <p
                ref={textRef}
                className={`text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground ${
                    !isExpanded ? 'line-clamp-2' : ''
                }`}
            >
                {text}
            </p>
            {hasOverflow && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs font-bold text-primary hover:underline mt-1.5 focus:outline-none block"
                >
                    {isExpanded ? t('Show Less') : t('Show More')}
                </button>
            )}
        </div>
    );
}

export default function General({ lead }: GeneralProps) {
    const { t } = useTranslation();
    const { productItems, sourceItems } = usePage<any>().props;
    const productItemsList: { id: number; name: string }[] = productItems || [];
    const sourceItemsList: { id: number; name: string }[] = sourceItems || [];
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [discussionModalOpen, setDiscussionModalOpen] = useState(false);
    const [emailEditorKey, setEmailEditorKey] = useState(0);
    const [expandedEmails, setExpandedEmails] = useState<Record<number, boolean>>({});

    const toggleEmail = (index: number) => {
        setExpandedEmails(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const getInitials = (nameOrEmail: string) => {
        if (!nameOrEmail) return '?';
        const clean = nameOrEmail.split('@')[0].trim();
        const parts = clean.split(/[\s._-]+/);
        const initials = parts.map(p => p[0]).join('').toUpperCase();
        return initials.substring(0, 2);
    };

    const getAvatarColorClass = (initials: string) => {
        const charCode = initials.charCodeAt(0) || 0;
        const colors = [
            'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
            'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
            'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200 dark:border-violet-900/50',
            'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200 dark:border-pink-900/50',
            'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50',
        ];
        return colors[charCode % colors.length];
    };

    const { data: emailForm, setData: setEmailData, post: postEmail, processing: emailProcessing, errors: emailErrors, reset: resetEmail } = useForm({
        to: '',
        subject: '',
        description: '',
    });

    const { data: notesForm, setData: setNotesData, put: putNotes, processing: notesProcessing, errors: notesErrors } = useForm({
        name: lead.name,
        email: lead.email,
        subject: lead.subject,
        user_id: lead.user_id,
        phone: lead.phone || '',
        date: lead.date || '',
        pipeline_id: lead.pipeline_id,
        stage_id: lead.stage_id,
        notes: lead.notes || '',
    });

    const { data: discussionForm, setData: setDiscussionData, post: postDiscussion, processing: discussionProcessing, errors: discussionErrors, reset: resetDiscussion } = useForm({
        message: '',
    });

    const customFields = useFormFields('getCustomFields', { ...lead, module: 'Lead', sub_module: 'Lead', id: lead.id }, () => {}, {}, 'view', t);

    const emailSubjectAI = useFormFields('aiField', emailForm, (field, value) => {
        setEmailData(field as any, value);
    }, {}, 'create', 'subject', 'Subject', 'lead', 'lead_email');

    const emailDescriptionAI = useFormFields('aiField', emailForm, (field, value) => {
        setEmailData(field as any, value);
        setEmailEditorKey(prev => prev + 1);
    }, {}, 'create', 'description', 'Description', 'lead', 'lead_email');

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postEmail(route('lead.leads.store-email', lead.id), {
            onSuccess: () => {
                resetEmail();
                setEmailModalOpen(false);
            }
        });
    };

    const handleDiscussionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postDiscussion(route('lead.leads.store-discussion', lead.id), {
            onSuccess: () => {
                resetDiscussion();
                setDiscussionModalOpen(false);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* 1. Header Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 pb-4 sm:pb-6 border-b border-border/80">
                <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate max-w-full">{lead.name}</h1>
                        {lead.is_converted ? (
                            <BadgeUI className="bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/20">
                                {t('Converted to Deal')}
                            </BadgeUI>
                        ) : (
                            <BadgeUI className="bg-primary/10 text-primary ring-primary/20">
                                {t('Active Lead')}
                            </BadgeUI>
                        )}
                    </div>
                    {lead.subject && (
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{lead.subject}</p>
                    )}
                </div>
                <div className="text-xs text-muted-foreground/80 font-medium capitalize whitespace-nowrap">
                    {t('Created')}: {formatDateTime(lead.created_at)}
                </div>
            </div>

            {/* 2. Theme-Based Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* Total Emails Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 dark:border-blue-800/50 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl">
                    <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-1 sm:pb-1.5 p-3 sm:p-5 gap-1.5">
                        <CardTitle className="text-xs sm:text-sm leading-tight font-semibold text-blue-700 dark:text-blue-300 capitalize min-w-0 break-words">{t('Total Emails')}</CardTitle>
                        <Mail className="h-4 w-4 sm:h-8 sm:w-8 text-blue-700 dark:text-blue-300 opacity-80 flex-shrink-0 mt-0.5 sm:mt-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0">
                        <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{lead.emails?.length ?? 0}</div>
                    </CardContent>
                </Card>

                {/* Sources Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 dark:border-emerald-800/50 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl">
                    <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-1 sm:pb-1.5 p-3 sm:p-5 gap-1.5">
                        <CardTitle className="text-xs sm:text-sm leading-tight font-semibold text-emerald-700 dark:text-emerald-300 capitalize min-w-0 break-words">{t('Sources')}</CardTitle>
                        <Globe className="h-4 w-4 sm:h-8 sm:w-8 text-emerald-700 dark:text-emerald-300 opacity-80 flex-shrink-0 mt-0.5 sm:mt-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0">
                        <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{sourceItemsList.length}</div>
                    </CardContent>
                </Card>

                {/* Products Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-800/50 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl">
                    <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-1 sm:pb-1.5 p-3 sm:p-5 gap-1.5">
                        <CardTitle className="text-xs sm:text-sm leading-tight font-semibold text-amber-700 dark:text-amber-300 capitalize min-w-0 break-words">{t('Products')}</CardTitle>
                        <Package className="h-4 w-4 sm:h-8 sm:w-8 text-amber-700 dark:text-amber-300 opacity-80 flex-shrink-0 mt-0.5 sm:mt-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0">
                        <div className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-300">{productItemsList.length}</div>
                    </CardContent>
                </Card>

                {/* Open Tasks Card */}
                <Card className="relative overflow-hidden bg-gradient-to-r from-violet-50 to-violet-100 border-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 dark:border-violet-800/50 shadow-none hover:shadow-md transition-shadow duration-200 rounded-xl">
                    <CardHeader className="flex flex-row items-start sm:items-center justify-between space-y-0 pb-1 sm:pb-1.5 p-3 sm:p-5 gap-1.5">
                        <CardTitle className="text-xs sm:text-sm leading-tight font-semibold text-violet-700 dark:text-violet-300 capitalize min-w-0 break-words">{t('Open Tasks')}</CardTitle>
                        <CheckSquare className="h-4 w-4 sm:h-8 sm:w-8 text-violet-700 dark:text-violet-300 opacity-80 flex-shrink-0 mt-0.5 sm:mt-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0">
                        <div className="text-lg sm:text-2xl font-bold text-violet-700 dark:text-violet-300">{lead.tasks?.length ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Notes & Details Row (Side-by-Side on desktop, stacked on mobile) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Notes Editor Card (Left, 2/3 Width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Description Area */}
                    {lead.description && (
                        <div className="bg-card border border-gray-300 dark:border-gray-700 shadow-md rounded-xl p-2.5 sm:p-5">
                            <h3 className="text-sm font-bold text-foreground capitalize mb-3">{t('Description')}</h3>
                            <div
                                className="prose prose-sm max-w-none text-foreground/85 leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: lead.description }}
                            />
                        </div>
                    )}

                    {/* Notes Editor */}
                    <div className="bg-card border border-gray-300 dark:border-gray-700 shadow-md rounded-xl p-2.5 sm:p-6 relative overflow-hidden flex flex-col flex-1">
                        <h3 className="text-base font-bold text-foreground capitalize mb-4">{t('Notes Editor')}</h3>
                        <div className="bg-muted/5 p-2 rounded-lg border border-border/80 flex-1 flex flex-col min-w-0">
                            <RichTextEditor
                                content={notesForm.notes}
                                onChange={(content) => setNotesData('notes', content)}
                                placeholder={t('Draft notes here...')}
                                className="min-h-[150px] flex-1 flex flex-col [&>div:last-child]:flex-1 [&>div:last-child]:flex [&>div:last-child]:flex-col [&_div.tiptap]:flex-1 [&_div.tiptap]:flex [&_div.tiptap]:flex-col [&_.ProseMirror]:flex-1 [&_.ProseMirror]:h-[150px] [&_.ProseMirror]:max-h-[150px] [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:scrollbar-thin [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-relaxed"
                            />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button
                                type="button"
                                disabled={notesProcessing}
                                onClick={() => putNotes(route('lead.leads.update', lead.id), { preserveState: false })}
                                className="w-full sm:w-auto px-6 font-semibold"
                            >
                                {notesProcessing ? t('Saving...') : t('Save Notes')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info Card (Right, 1/3 Width) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Lead Attributes Card */}
                    <div className="bg-card border border-gray-300 dark:border-gray-700 shadow-md rounded-xl p-2.5 sm:p-6 relative overflow-hidden flex flex-col flex-1">
                        <h3 className="text-base font-bold text-foreground capitalize mb-4 sm:mb-6 flex items-center gap-2 pb-3 border-b border-border/80">
                            <User className="h-5 w-5 text-primary" />
                            {t('Lead Details')}
                        </h3>
                        <div className="space-y-4 sm:space-y-5 flex-1">
                            {/* Email */}
                            <div className="flex items-start gap-3 sm:gap-4 group">
                                <div className="mt-0.5 h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-200">
                                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-muted-foreground/95 capitalize">{t('Email Address')}</p>
                                    <a href={`mailto:${lead.email}`} className="text-xs sm:text-base font-bold text-blue-600 dark:text-blue-400 hover:underline truncate block mt-0.5">
                                        {lead.email || '-'}
                                    </a>
                                </div>
                            </div>
                            {/* Phone */}
                            <div className="flex items-start gap-3 sm:gap-4 group">
                                <div className="mt-0.5 h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform duration-200">
                                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-muted-foreground/95 capitalize">{t('Phone Number')}</p>
                                    <a href={`tel:${lead.phone}`} className="text-xs sm:text-base font-bold text-foreground hover:text-primary block mt-0.5 truncate">
                                        {lead.phone || '-'}
                                    </a>
                                </div>
                            </div>
                            {/* Follow Up Date */}
                            <div className="flex items-start gap-3 sm:gap-4 group">
                                <div className="mt-0.5 h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform duration-200">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-muted-foreground/95 capitalize">{t('Follow Up Date')}</p>
                                    <p className={`text-xs sm:text-base font-bold mt-0.5 truncate ${
                                        lead.date && new Date(lead.date) < new Date() ? 'text-red-500 font-bold' : 'text-foreground'
                                    }`}>
                                        {lead.date ? formatDate(lead.date) : '-'}
                                    </p>
                                </div>
                            </div>
                            {/* Pipeline */}
                            <div className="flex items-start gap-3 sm:gap-4 group">
                                <div className="mt-0.5 h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform duration-200">
                                    <GitBranch className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-muted-foreground/95 capitalize">{t('Sales Pipeline')}</p>
                                    <p className="text-xs sm:text-base font-bold text-foreground mt-0.5 truncate">
                                        {lead.pipeline?.name || '-'}
                                    </p>
                                </div>
                            </div>
                            {/* Stage */}
                            <div className="flex items-start gap-3 sm:gap-4 group">
                                <div className="mt-0.5 h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform duration-200">
                                    <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-muted-foreground/95 capitalize">{t('Stage')}</p>
                                    <RandomBadgeUI name={lead.stage?.name || '-'} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Fields Card */}
                    {customFields.length > 0 && (
                        <div className="bg-card border border-border shadow-md rounded-xl p-2.5 sm:p-5">
                            <h3 className="text-xs font-bold text-muted-foreground capitalize mb-4 sm:mb-6 flex items-center gap-2 pb-3 border-b border-border/80">
                                <span className="text-primary font-bold text-sm">#</span>
                                {t('Custom Fields')}
                            </h3>
                            <div className="space-y-4">
                                {customFields.map((field, index) => (
                                    <div key={index} className="flex flex-col gap-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground capitalize">{field.label}</p>
                                        <div className="text-sm font-semibold text-foreground">{field.component}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Emails & Discussions Row (Full Row, Side-by-Side on desktop, stacked on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Emails Card Box */}
                <div className="bg-card border border-gray-300 dark:border-gray-700 shadow-md rounded-xl p-2.5 sm:p-5 h-[480px] sm:h-[500px] flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-border/80 pb-2.5 flex-shrink-0">
                        <h3 className="text-base font-bold text-foreground capitalize">{t('Emails')}</h3>
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => setEmailModalOpen(true)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Send Email')}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900/10 flex-1 overflow-y-auto ltr:pr-0 rtl:pl-0 scrollbar-thin">
                        {lead.emails && lead.emails.length > 0 ? (
                            [...lead.emails]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((email: any, index: number) => {
                                const stripHtmlAndDecode = (html: string) => {
                                    if (!html) return '';
                                    return html
                                        .replace(/<[^>]*>/g, '')
                                        .replace(/&amp;/g, '&')
                                        .replace(/&lt;/g, '<')
                                        .replace(/&gt;/g, '>')
                                        .replace(/&quot;/g, '"')
                                        .replace(/&#39;/g, "'")
                                        .replace(/&nbsp;/g, ' ');
                                };
                                const cleanText = stripHtmlAndDecode(email.description);
                                const initials = getInitials(email.to);
                                
                                return (
                                    <div key={index} className="flex flex-col hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-all duration-150">
                                        {/* Main Row */}
                                        <div 
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 py-3 px-3 sm:px-4 cursor-pointer select-none"
                                            onClick={() => toggleEmail(index)}
                                        >
                                            {/* Top Line on Mobile / Left side on Desktop */}
                                            <div className="flex items-center justify-between gap-2 sm:justify-start min-w-0">
                                                <span className="text-xs font-bold text-foreground truncate max-w-[160px] sm:w-[130px] sm:flex-shrink-0">
                                                    To: {email.to.split('@')[0]}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-semibold sm:hidden flex-shrink-0">
                                                    {formatDate(email.created_at)}
                                                </span>
                                            </div>

                                            {/* Subject & Preview */}
                                            <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.5 bg-muted text-[10px] font-semibold text-muted-foreground rounded border flex-shrink-0">
                                                    Inbox
                                                </span>
                                                <span className="text-xs font-bold text-foreground truncate max-w-[120px] sm:max-w-[150px]">
                                                    {email.subject}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground truncate hidden xs:inline">
                                                    — {cleanText}
                                                </span>
                                            </div>

                                            {/* Date Desktop */}
                                            <div className="hidden sm:block flex-shrink-0 text-[10px] text-muted-foreground font-semibold pl-2">
                                                {formatDate(email.created_at)}
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        {expandedEmails[index] && (
                                            <div className="px-3 sm:px-4 pb-4 pt-2 border-t border-border/30 bg-gray-50/30 dark:bg-gray-900/10">
                                                <div className="flex items-center justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm bg-primary/10 text-primary border-primary/20">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-bold text-foreground truncate">To: {email.to}</div>
                                                            <div className="text-[10px] text-muted-foreground">{formatDateTime(email.created_at)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-foreground/95 leading-relaxed bg-white dark:bg-gray-900 border border-border/80 rounded-lg p-3 shadow-sm prose dark:prose-invert max-w-none">
                                                    {email.description ? (
                                                        <div dangerouslySetInnerHTML={{ __html: email.description }} />
                                                    ) : (
                                                        <span className="text-muted-foreground italic">{t('No message content')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-muted-foreground/60 bg-muted/5 rounded-xl border border-dashed border-border/40 m-4">
                                <Mail className="h-8 w-8 mx-auto mb-2.5 opacity-30 text-blue-500" />
                                <p className="text-sm font-semibold capitalize">{t('No emails sent yet')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Discussions Card Box */}
                <div className="bg-card border border-gray-300 dark:border-gray-700 shadow-md rounded-xl p-2.5 sm:p-5 h-[480px] sm:h-[500px] flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-border/80 pb-2.5 flex-shrink-0">
                        <h3 className="text-base font-bold text-foreground capitalize">{t('Discussions')}</h3>
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => setDiscussionModalOpen(true)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Add Message')}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto ltr:pr-1.5 ltr:pl-0 rtl:pl-1.5 rtl:pr-0 scrollbar-thin">
                        {lead.discussions && lead.discussions.length > 0 ? (
                            lead.discussions.map((discussion: any, index: number) => {
                                const initials = getInitials(discussion.creator?.name || 'U');

                                return (
                                    <div key={index} className="bg-card border border-border/80 shadow-sm rounded-xl p-3 sm:p-4 transition-all duration-200 hover:shadow-md flex items-start gap-3 sm:gap-4">
                                        {/* Avatar column */}
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {discussion.creator?.avatar ? (
                                                <img
                                                    src={getImagePath(discussion.creator.avatar)}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-primary">
                                                    {initials}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content column */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 pb-1.5 border-b border-border/80">
                                                <div className="min-w-0">
                                                    <span className="font-bold text-xs sm:text-sm text-foreground block truncate">
                                                        {discussion.creator?.name || t('Unknown User')}
                                                    </span>
                                                    {discussion.creator?.email && (
                                                        <span className="text-[10px] text-muted-foreground block truncate">
                                                            {discussion.creator.email}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0 whitespace-nowrap">
                                                    {formatDateTime(discussion.created_at)}
                                                </span>
                                            </div>
                                            <ExpandableText text={discussion.comment} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-muted-foreground/60 bg-muted/5 rounded-xl border border-dashed border-border/40">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2.5 opacity-30 text-violet-500" />
                                <p className="text-sm font-semibold capitalize">{t('No discussions yet')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Send Email Dialog Modal */}
            <Dialog open={emailModalOpen} onOpenChange={(open) => { setEmailModalOpen(open); if (!open) resetEmail(); }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-bold text-lg capitalize">
                            <Mail className="h-5 w-5 text-blue-500" />
                            {t('Compose & Send Email')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEmailSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label htmlFor="to" required className="font-semibold text-sm capitalize">{t('To')}</Label>
                            <Input
                                id="to"
                                type="email"
                                value={emailForm.to}
                                onChange={(e) => setEmailData('to', e.target.value)}
                                placeholder={t('Enter recipient email address')}
                                className="mt-1"
                            />
                            <InputError message={emailErrors.to} />
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label htmlFor="subject" required className="font-semibold text-sm capitalize">{t('Subject')}</Label>
                                <Input
                                    id="subject"
                                    type="text"
                                    value={emailForm.subject}
                                    onChange={(e) => setEmailData('subject', e.target.value)}
                                    placeholder={t('Enter email subject')}
                                    className="mt-1"
                                />
                                <InputError message={emailErrors.subject} />
                            </div>
                            {emailSubjectAI.map(field => <div key={field.id} className="mb-0.5">{field.component}</div>)}
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label htmlFor="description" required className="font-semibold text-sm capitalize">{t('Email Body')}</Label>
                                <div className="flex gap-2">
                                    {emailDescriptionAI.map(field => <div key={field.id}>{field.component}</div>)}
                                </div>
                            </div>
                            <RichTextEditor
                                key={`email-editor-${emailEditorKey}`}
                                content={emailForm.description}
                                onChange={(content) => setEmailData('description', content)}
                                placeholder={t('Type email message details...')}
                                className="mt-1"
                            />
                            <InputError message={emailErrors.description} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" className="font-semibold capitalize" onClick={() => { setEmailModalOpen(false); resetEmail(); }}>{t('Cancel')}</Button>
                            <Button type="submit" disabled={emailProcessing} className="font-semibold gap-1.5 capitalize">
                                <Send className="h-3.5 w-3.5" />
                                {emailProcessing ? t('Sending...') : t('Send')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Discussion/Comment Dialog Modal */}
            <Dialog open={discussionModalOpen} onOpenChange={(open) => { setDiscussionModalOpen(open); if (!open) resetDiscussion(); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-bold text-lg capitalize">
                            <MessageSquare className="h-5 w-5 text-violet-500" />
                            {t('Add New Comment')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDiscussionSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label htmlFor="message" required className="font-semibold text-sm capitalize">{t('Comment Message')}</Label>
                            <Textarea
                                id="message"
                                value={discussionForm.message}
                                onChange={(e) => setDiscussionData('message', e.target.value)}
                                placeholder={t('Enter comment notes or update details...')}
                                className="mt-1.5"
                                rows={4}
                            />
                            <InputError message={discussionErrors.message} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" className="font-semibold capitalize" onClick={() => { setDiscussionModalOpen(false); resetDiscussion(); }}>{t('Cancel')}</Button>
                            <Button type="submit" disabled={discussionProcessing} className="font-semibold capitalize">
                                {discussionProcessing ? t('Saving...') : t('Save Comment')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
