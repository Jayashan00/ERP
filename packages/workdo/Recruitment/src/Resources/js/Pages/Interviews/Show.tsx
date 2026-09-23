import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import BadgeUI from '@/components/badge-ui';
import GenerateAvatar from '@/components/generate-avatar';
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    User,
    Briefcase,
    FileText,
    CheckCircle,
    AlertCircle,
    Star,
    ArrowLeft,
    ThumbsUp,
    CheckCircle2,
    XCircle,
    Users,
    ChevronRight,
    TrendingUp,
    FileQuestion,
    MessageSquare,
    HelpCircle,
    Plus,
    Trash2,
    Edit as EditIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, getImagePath } from '@/utils/helpers';
import RandomBadgeUI from '@/components/random-badge-ui';
import { RadarChart } from '@/components/charts/RadarChart';

interface InterviewShowProps {
    interview: any;
    interviewers: any[];
    feedbacks: any[];
    auth: any;
}

export default function Show() {
    const { t } = useTranslation();
    const { interview, interviewers, feedbacks, auth } = usePage<InterviewShowProps>().props;

    const hasManageAll = auth.user?.permissions?.includes('manage-interview-feedbacks') &&
        auth.user?.permissions?.includes('manage-any-interview-feedbacks');

    const isManageOwn = !hasManageAll &&
        auth.user?.permissions?.includes('manage-own-interview-feedbacks') &&
        auth.user?.permissions?.includes('manage-own-interview-feedbacks');

    const defaultInterviewerId = isManageOwn
        ? (interviewers.find((i: any) => i.id === auth.user?.id)?.id || (interviewers[0]?.id || 'overall'))
        : 'overall';

    const [selectedInterviewerId, setSelectedInterviewerId] = useState<number | 'overall'>(defaultInterviewerId);

    const statusOptions: any = { "0": "Scheduled", "1": "Completed", "2": "Cancelled", "3": "No-show" };
    const getStatusColor = (status: string) => {
        switch (status) {
            case '0': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case '1': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case '2': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case '3': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-400';
        }
    };

    const statusValue = String(interview.status || '0');

    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'recruitment.interview-feedbacks.destroy',
        defaultMessage: t('Are you sure you want to delete this interview feedback?')
    });

    // Avatar stack for the header
    const renderHeaderInterviewerStack = () => {
        if (!interview?.interviewers || interview?.interviewers.length === 0) return '-';
        return (
            <div className="flex -space-x-1.5 overflow-hidden">
                <TooltipProvider>
                    {interview?.interviewers.slice(0, 3).map((interviewer) => (
                        <Tooltip key={interviewer.id} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                    {interviewer.avatar ? (
                                        <img
                                            className="h-full w-full object-cover"
                                            src={getImagePath(interviewer.avatar)}
                                            alt={interviewer.name}
                                        />
                                    ) : (
                                        <GenerateAvatar
                                            name={interviewer.name}
                                            className="h-full w-full rounded-full text-[10px] font-bold"
                                        />
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{interviewer.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    {interview?.interviewers.length > 3 && (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900 select-none">
                                    +{interview?.interviewers.length - 3}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-xs flex flex-col gap-0.5">
                                    {interview?.interviewers.slice(3).map((interviewer) => (
                                        <span key={interviewer.id}>{interviewer.name}</span>
                                    ))}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </TooltipProvider>
            </div>
        );
    };

    // Calculate overall statistics
    const totalFeedbacks = feedbacks.length;
    const avgTechnical = totalFeedbacks > 0
        ? parseFloat((feedbacks.reduce((sum, fb) => sum + fb.technical_rating, 0) / totalFeedbacks).toFixed(1))
        : 0;
    const avgCommunication = totalFeedbacks > 0
        ? parseFloat((feedbacks.reduce((sum, fb) => sum + fb.communication_rating, 0) / totalFeedbacks).toFixed(1))
        : 0;
    const avgCulturalFit = totalFeedbacks > 0
        ? parseFloat((feedbacks.reduce((sum, fb) => sum + fb.cultural_fit_rating, 0) / totalFeedbacks).toFixed(1))
        : 0;
    const avgOverall = totalFeedbacks > 0
        ? parseFloat((feedbacks.reduce((sum, fb) => sum + fb.overall_rating, 0) / totalFeedbacks).toFixed(1))
        : 0;

    const radarData = [
        { subject: t('Technical'), value: avgTechnical },
        { subject: t('Communication'), value: avgCommunication },
        { subject: t('Cultural Fit'), value: avgCulturalFit },
    ];

    const getRecommendationDetails = (val: string) => {
        const options: any = {
            "0": { label: t("Strong Hire"), color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/30", icon: ThumbsUp },
            "1": { label: t("Hire"), color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30", icon: CheckCircle2 },
            "2": { label: t("Maybe"), color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/30", icon: HelpCircle },
            "3": { label: t("Reject"), color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30", icon: XCircle },
            "4": { label: t("Strong Reject"), color: "bg-red-200 text-red-900 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50", icon: XCircle },
        };
        return options[val] || { label: t("No Recommendation"), color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700", icon: HelpCircle };
    };

    // Calculate average recommendation score
    const recScores = feedbacks.map(fb => {
        const val = String(fb.recommendation);
        if (val === '0') return 5;
        if (val === '1') return 4;
        if (val === '2') return 3;
        if (val === '3') return 2;
        if (val === '4') return 1;
        return 0;
    }).filter(s => s > 0);

    const avgRecScore = recScores.length > 0 ? (recScores.reduce((sum, s) => sum + s, 0) / recScores.length) : 0;

    const getRecommendationFromAvg = (avg: number) => {
        if (avg >= 4.5) return '0'; // Strong Hire
        if (avg >= 3.5) return '1'; // Hire
        if (avg >= 2.5) return '2'; // Maybe
        if (avg >= 1.5) return '3'; // Reject
        return '4'; // Strong Reject
    };

    const overallRecommendationVal = avgRecScore > 0 ? getRecommendationFromAvg(avgRecScore) : null;
    const overallRecommendation = overallRecommendationVal ? getRecommendationDetails(overallRecommendationVal) : null;

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-zinc-200 dark:text-zinc-700'
                            }`}
                    />
                ))}
            </div>
        );
    };

    // Helper to find if interviewer has submitted feedback
    const getInterviewerFeedback = (interviewerId: number) => {
        return feedbacks.find(fb =>
            fb.interviewer_id === interviewerId ||
            fb.creator_id === interviewerId
        );
    };



    const candidateName = `${interview.candidate?.first_name || ''} ${interview.candidate?.last_name || ''}`.trim() || t('Unknown Candidate');
    const jobTitle = interview.jobPosting?.title || interview.job_posting?.title || '-';

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Interviews'), url: route('recruitment.interviews.index') },
                { label: t('Interview Details') },
            ]}
            pageTitle={t('Interview Details')}
            pageDescription={t('View candidates feedback, scorecards, and scheduling details.')}
            backUrl={route('recruitment.interviews.index')}
        >
            <Head title={`${t('Interview Details')} - ${candidateName}`} />

            <div className="space-y-6">
                {/* Standardized Candidate Header Card */}
                <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    <GenerateAvatar
                                        name={candidateName}
                                        className="h-full w-full text-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{candidateName}</h2>
                                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{jobTitle}</p>
                                </div>
                            </div>

                            <div className="h-px md:h-12 w-full md:w-px bg-zinc-200 dark:bg-zinc-800" />

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="block text-xs text-zinc-400 tracking-wider font-semibold">{t('Interview Date')}</span>
                                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        {interview.scheduled_date ? formatDate(interview.scheduled_date) : '-'} at {interview.scheduled_time || '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px md:h-12 w-full md:w-px bg-zinc-200 dark:bg-zinc-800" />

                            <div className="flex items-center gap-3">
                                <div>
                                    <span className="block text-xs text-zinc-400 tracking-wider font-semibold mb-1">{t('Interviewers')}</span>
                                    {renderHeaderInterviewerStack()}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 justify-start md:justify-end">
                                <BadgeUI className={getStatusColor(statusValue)}>
                                    {t(statusOptions[statusValue] || statusValue || 'Scheduled')}
                                </BadgeUI>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Split Screen Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar: Interviewers List */}
                    {auth?.user?.permissions?.includes('manage-interview-feedbacks') && <div className="lg:col-span-4 space-y-4">
                        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-zinc-500" />
                                    {t('Interviewer List')}
                                </CardTitle>
                                <CardDescription className="text-xs">{t('Select an interviewer to view their specific feedback.')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-2 space-y-1">
                                {/* Overall Summary Tab */}
                                {(auth?.user?.permissions?.includes('manage-interview-feedbacks') && auth?.user?.permissions?.includes('manage-any-interview-feedbacks')) && (
                                    <>
                                        <button
                                            onClick={() => setSelectedInterviewerId('overall')}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all text-left border-l-4 ${selectedInterviewerId === 'overall'
                                                ? 'bg-primary/5 dark:bg-primary/10 border-primary text-primary font-semibold'
                                                : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${selectedInterviewerId === 'overall' ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                                    <TrendingUp className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="block text-sm">{t('Overall Feedback')}</span>
                                                    <span className="block text-xs text-zinc-400 mt-0.5">{t('Combined rating scorecard')}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform ${selectedInterviewerId === 'overall' ? 'transform translate-x-1 text-primary' : ''}`} />
                                        </button>

                                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />
                                    </>
                                )}

                                {/* Interviewer list */}
                                {interviewers.length > 0 ? (
                                    interviewers.map((interviewer) => {
                                        const feedback = getInterviewerFeedback(interviewer.id);
                                        const isSelected = selectedInterviewerId === interviewer.id;
                                        return (
                                            <button
                                                key={interviewer.id}
                                                onClick={() => setSelectedInterviewerId(interviewer.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all text-left border-l-4 ${isSelected
                                                    ? 'bg-primary/5 dark:bg-primary/10 border-primary text-primary font-semibold'
                                                    : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700">
                                                        {interviewer.avatar ? (
                                                            <img
                                                                className="h-full w-full object-cover"
                                                                src={getImagePath(interviewer.avatar)}
                                                                alt={interviewer.name}
                                                            />
                                                        ) : (
                                                            <GenerateAvatar
                                                                name={interviewer.name}
                                                                className="h-full w-full rounded-full text-xs font-bold"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block text-sm truncate font-medium">{interviewer.name}</span>
                                                        <span className="block text-xs text-zinc-400 truncate">{interviewer.email}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {feedback ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{feedback.overall_rating}</span>
                                                            </div>
                                                            {(() => {
                                                                const rec = getRecommendationDetails(feedback.recommendation);
                                                                return (
                                                                    <BadgeUI className={`${rec.color} px-1.5 py-0.5 text-[10px]`}>
                                                                        {rec.label}
                                                                    </BadgeUI>
                                                                );
                                                            })()}
                                                        </div>
                                                    ) : (
                                                        <BadgeUI className="bg-yellow-100 text-yellow-800">
                                                            {t('Pending')}
                                                        </BadgeUI>
                                                    )}
                                                    <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform ${isSelected ? 'transform translate-x-1 text-primary' : ''}`} />
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 text-center text-xs text-zinc-400">
                                        {t('No interviewers assigned.')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>}

                    {/* Right Panel: Content Details */}
                    <div className="lg:col-span-8">
                        {/* Overall Summary View */}
                        {selectedInterviewerId === 'overall' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    {/* Overall Rating & Radar Chart Card */}
                                    {auth?.user?.permissions?.includes('manage-any-interview-feedbacks') && <Card className="md:col-span-7 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4 flex-shrink-0 flex items-center justify-between">
                                            <CardTitle className="w-full flex justify-between text-base font-bold">
                                                {t('Overall Scorecard')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                                            {totalFeedbacks > 0 ? (
                                                <div className="space-y-6">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">{avgOverall}</span>
                                                        <span className="text-sm font-semibold text-zinc-400">/ 5</span>
                                                        <div className="ml-4">
                                                            {renderStars(avgOverall)}
                                                        </div>
                                                    </div>

                                                    <div className="border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 bg-zinc-50/30 dark:bg-zinc-900/20">
                                                        <RadarChart
                                                            data={radarData}
                                                            dataKey="value"
                                                            angleKey="subject"
                                                            color="#6366f1"
                                                            height={240}
                                                            showTooltip={true}
                                                            strokeWidth={3}
                                                            fillOpacity={0.15}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 mb-3">
                                                        <FileQuestion className="h-6 w-6" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t('No feedback submitted yet')}</h3>
                                                    <p className="text-xs text-zinc-400 mt-1 max-w-[240px]">{t('Feedback scorecards and overall rating chart will display here once submitted.')}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>}

                                    {/* Recommendation & Schedule Cards */}
                                    <div className="md:col-span-5 flex flex-col gap-6">
                                        {/* Recommendation Box */}
                                        {auth?.user?.permissions?.includes('manage-any-interview-feedbacks') &&
                                            (overallRecommendation ? (
                                                <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                                    <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4">
                                                        <CardTitle className="text-base font-bold">{t('Decision Summary')}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <span className="block text-xs text-zinc-400 tracking-wider font-semibold mb-2">{t('Consensus Recommendation')}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <BadgeUI className={`${overallRecommendation.color} px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5`}>
                                                                        <overallRecommendation.icon className="h-4 w-4" />
                                                                        {overallRecommendation.label}
                                                                    </BadgeUI>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
                                                                {t('This consensus is automatically calculated as the average recommendation score from all interviewers who submitted feedback.')}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                                    <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4">
                                                        <CardTitle className="text-base font-bold">{t('Decision Summary')}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-6 text-center py-8">
                                                        <HelpCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                                                        <p className="text-xs text-zinc-400">{t('No recommendation consensus calculated yet.')}</p>
                                                    </CardContent>
                                                </Card>
                                            ))}

                                        {/* Schedule & Metadata Card */}
                                        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1">
                                            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4">
                                                <CardTitle className="text-base font-bold">{t('Schedule Details')}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <span className="text-zinc-400 font-medium block">{t('Interview Type')}</span>
                                                        <RandomBadgeUI name={interview.interviewType?.name || interview.interview_type?.name || '-'} />
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-400 font-medium block">{t('Round')}</span>
                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5 block">{interview.interviewRound?.name || interview.interview_round?.name || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-400 font-medium block">{t('Duration')}</span>
                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5 block">{interview.duration ? `${interview.duration} mins` : '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-400 font-medium block">{t('Location / Type')}</span>
                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5 block">{interview.location || '-'}</span>
                                                    </div>
                                                </div>

                                                {interview.meeting_link && (
                                                    <div className="pt-2">
                                                        <span className="text-zinc-400 text-xs font-medium block mb-1">{t('Meeting Link')}</span>
                                                        <a
                                                            href={interview.meeting_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline break-all block"
                                                        >
                                                            {interview.meeting_link}
                                                        </a>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>



                                {/* Notes Section */}
                                {interview.notes && (
                                    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4">
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-zinc-500" />
                                                {t('Interview Notes')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{interview.notes}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Individual Interviewer Feedback Details View */}
                        {typeof selectedInterviewerId === 'number' && auth?.user?.permissions?.includes('view-interview-feedbacks') && (() => {
                            const interviewer = interviewers.find(i => i.id === selectedInterviewerId);
                            const feedback = getInterviewerFeedback(selectedInterviewerId);

                            if (!interviewer) return null;

                            return (
                                <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                    <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 p-4 flex flex-row flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedInterviewerId('overall')}
                                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                            </button>
                                            <div>
                                                <CardTitle className="text-base font-bold">{t('Interviewer Feedback')}</CardTitle>
                                                <CardDescription className="text-xs">{t('Submitted by')} {interviewer.name}</CardDescription>
                                            </div>
                                        </div>

                                        {feedback ? (
                                            <div className="flex gap-2">
                                                {auth.user?.permissions?.includes('edit-interview-feedbacks') && (
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="sm" onClick={() => router.get(route('recruitment.interviews.edit-interview-feedback', { interviewfeedback: feedback.id }))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                                                                <EditIcon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('Edit')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>

                                                )}
                                                {auth.user?.permissions?.includes('delete-interview-feedbacks') && (
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(feedback.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t('Delete')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        ) : (
                                            feedback && (
                                                (() => {
                                                    const rec = getRecommendationDetails(feedback.recommendation);
                                                    return (
                                                        <BadgeUI className={rec.color}>
                                                            {rec.label}
                                                        </BadgeUI>
                                                    );
                                                })()
                                            )
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {feedback ? (
                                            <div className="space-y-6">
                                                {/* Star Ratings Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                                                        <span className="text-xs text-zinc-400 tracking-wider font-semibold mb-1">{t('Overall Score')}</span>
                                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1.5">{feedback.overall_rating} / 5</span>
                                                        {renderStars(feedback.overall_rating)}
                                                    </div>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                                                        <span className="text-xs text-zinc-400 tracking-wider font-semibold mb-1">{t('Technical')}</span>
                                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1.5">{feedback.technical_rating} / 5</span>
                                                        {renderStars(feedback.technical_rating)}
                                                    </div>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                                                        <span className="text-xs text-zinc-400 tracking-wider font-semibold mb-1">{t('Communication')}</span>
                                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1.5">{feedback.communication_rating} / 5</span>
                                                        {renderStars(feedback.communication_rating)}
                                                    </div>
                                                    <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 text-center flex flex-col items-center justify-center">
                                                        <span className="text-xs text-zinc-400 tracking-wider font-semibold mb-1">{t('Cultural Fit')}</span>
                                                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1.5">{feedback.cultural_fit_rating} / 5</span>
                                                        {renderStars(feedback.cultural_fit_rating)}
                                                    </div>
                                                </div>

                                                <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                                                {/* Textual Feedback Areas */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="block text-xs text-zinc-400 tracking-wider font-semibold mb-2">{t('Candidate Strengths')}</span>
                                                        <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850/80">
                                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                                {feedback.strengths || t('No strengths noted.')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="block text-xs text-zinc-400 tracking-wider font-semibold mb-2">{t('Candidate Weaknesses')}</span>
                                                        <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850/80">
                                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                                {feedback.weaknesses || t('No weaknesses noted.')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="block text-xs text-zinc-400 tracking-wider font-semibold mb-2">{t('General Comments')}</span>
                                                        <div className="bg-zinc-50 dark:bg-zinc-900/20 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850/80">
                                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                                {feedback.comments || t('No comments added.')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                                                <div className="flex justify-between items-center text-xs text-zinc-400">
                                                    <span>{t('Feedback Submitted Date')}</span>
                                                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">{formatDate(feedback.created_at)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 mb-4 animate-pulse">
                                                    <MessageSquare className="h-8 w-8" />
                                                </div>
                                                <h3 className="text-base font-bold text-zinc-850 dark:text-zinc-200">{t('Feedback Pending')}</h3>
                                                <p className="text-xs text-zinc-400 mt-2 max-w-[280px]">
                                                    {interviewer.name} {t('has not submitted their feedback scorecard for this interview yet.')}
                                                </p>
                                                {(auth.user?.permissions?.includes('create-interview-feedbacks')) && (
                                                    <Button onClick={() => router.get(route('recruitment.interviews.create-interview-feedback', { interview_id: interview.id, interviewer_id: selectedInterviewerId }))} className="mt-4 flex items-center gap-1">
                                                        <Plus className="h-4 w-4" />
                                                        {t('Submit Feedback')}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })()}
                    </div>
                </div>
            </div>



            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Interview Feedback')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </AuthenticatedLayout>
    );
}