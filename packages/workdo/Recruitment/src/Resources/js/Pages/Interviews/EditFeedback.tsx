import { useForm, usePage, Head, router } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import GenerateAvatar from '@/components/generate-avatar';
import { formatDate, getImagePath, formatTime } from '@/utils/helpers';
import RandomBadgeUI from '@/components/random-badge-ui';

interface EditFeedbackProps {
    interviewfeedback: any;
    interview: any;
    interviewer: any;
}

export default function EditFeedback({ interviewfeedback, interview, interviewer }: EditFeedbackProps) {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();

    const { data, setData, put, processing, errors } = useForm({
        technical_rating: interviewfeedback.technical_rating?.toString() ?? '',
        communication_rating: interviewfeedback.communication_rating?.toString() ?? '',
        cultural_fit_rating: interviewfeedback.cultural_fit_rating?.toString() ?? '',
        overall_rating: interviewfeedback.overall_rating?.toString() ?? '',
        strengths: interviewfeedback.strengths ?? '',
        weaknesses: interviewfeedback.weaknesses ?? '',
        comments: interviewfeedback.comments ?? '',
        recommendation: interviewfeedback.recommendation?.toString() ?? '0',
        interview_id: interview.id.toString(),
        interviewer_id: interviewer.id.toString(),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('recruitment.interview-feedbacks.update', interviewfeedback.id));
    };

    const handleBack = () => {
        router.get(route('recruitment.interviews.show', interview.id));
    };

    const StarRating = ({ value, onChange, labelLeft = "Poor", labelRight = "Exceptional" }: { value: number, onChange: (val: number) => void, labelLeft?: string, labelRight?: string }) => {
        return (
            <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onChange(star)}
                            className="focus:outline-none transition-transform active:scale-90 hover:scale-110"
                        >
                            <Star
                                className={`h-8 w-8 transition-colors ${star <= value
                                    ? 'fill-amber-400 stroke-amber-400'
                                    : 'stroke-zinc-300 dark:stroke-zinc-700 fill-none'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
                <div className="flex justify-between w-56 text-[11px] text-zinc-400 font-medium px-1">
                    <span>{t(labelLeft)}</span>
                    <span>{t(labelRight)}</span>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Recruitment'), url: route('recruitment.index') },
                { label: t('Interviews'), url: route('recruitment.interviews.index') },
                { label: t('Interview Details'), url: route('recruitment.interviews.show', interview.id) },
                { label: t('Edit Feedback') }
            ]}
            pageTitle={t('Edit Interview Feedback')}
            pageDescription={t('Modify and update evaluation and feedback for the candidate.')}
            backUrl={route('recruitment.interviews.show', interview.id)}
        >
            <Head title={t('Edit Interview Feedback')} />

            <div className="space-y-6">
                {/* Header Profile Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-6 rounded-2xl mb-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-55 tracking-tight">
                                {t('Job')} : <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{interview.job_posting?.title}</span>
                            </h1>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-12 gap-8">
                    {/* Left Column - Meta Details Sidebar */}
                    <div className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
                        {/* Candidate Info Card */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-300 dark:border-zinc-700 pb-2">
                                {t('Candidate')}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="inline-block h-12 w-12 rounded-lg ring-2 ring-white dark:ring-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-808">
                                    <GenerateAvatar
                                        name={interview.candidate.name}
                                        className="h-full w-full rounded-lg text-[10px] font-bold"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200 leading-none">{interview.candidate.name}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{interview.candidate.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interviewer Info Card */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-300 dark:border-zinc-700 pb-2">
                                {t('Submitting Feedback As')}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="inline-block h-12 w-12 rounded-lg ring-2 ring-white dark:ring-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-808">
                                    {interviewer.avatar ? (
                                        <img
                                            className="h-full w-full object-cover"
                                            src={getImagePath(interviewer.avatar)}
                                            alt={interviewer.name}
                                        />
                                    ) : (
                                        <GenerateAvatar
                                            name={interviewer.name}
                                            className="h-full w-full rounded-lg text-[10px] font-bold"
                                        />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200 leading-none">{interviewer.name}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{interviewer.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interview Details Card */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-300 dark:border-zinc-700 pb-2">
                                {t('Interview Details')}
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 tracking-wider">{t('Date & Time')}</p>
                                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                                        {interview.scheduled_date ? formatDate(interview.scheduled_date) : '-'}, {interview.scheduled_time ? formatTime(interview.scheduled_time) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-400 tracking-wider">{t('Interview Type')}</p>
                                    <RandomBadgeUI name={interview.interview_type?.name || t('On-site Panel')} />
                                </div>
                                {interview.notes && (
                                    <div>
                                        <p className="text-[11px] font-bold text-zinc-400 tracking-wider">{t('Interview Notes')}</p>
                                        <p className="text-xs text-zinc-500 mt-1 bg-zinc-50 dark:bg-zinc-850 p-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                                            {interview.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Main Form */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {/* Section 1: Ratings Selection */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-300 dark:border-zinc-700 pb-3">
                                {t('Ratings Selection')}
                            </h3>
                            {/* Skills & Evaluation */}
                            <div className="flex flex-col md:flex-row lg:flex-row gap-5 justify-between">
                                {/* Technical Skills */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('Technical Skills & Prototyping')}</Label>
                                    <StarRating
                                        value={Number(data.technical_rating) || 0}
                                        onChange={(val) => setData('technical_rating', val.toString())}
                                        labelLeft="Poor"
                                        labelRight="Exceptional"
                                    />
                                    <InputError message={errors.technical_rating} />
                                </div>

                                {/* Communication Skills */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('Expression & Communication')}</Label>
                                    <StarRating
                                        value={Number(data.communication_rating) || 0}
                                        onChange={(val) => setData('communication_rating', val.toString())}
                                        labelLeft="Needs Improvement"
                                        labelRight="Exemplary"
                                    />
                                    <InputError message={errors.communication_rating} />
                                </div>

                                {/* Cultural Fit & Behavioral */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('Team Collaboration & Values')}</Label>
                                    <StarRating
                                        value={Number(data.cultural_fit_rating) || 0}
                                        onChange={(val) => setData('cultural_fit_rating', val.toString())}
                                        labelLeft="Poor"
                                        labelRight="Exceptional"
                                    />
                                    <InputError message={errors.cultural_fit_rating} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Descriptive Section */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-300 dark:border-zinc-700 pb-3">
                                {t('Descriptive Section')}
                            </h3>

                            {/* Strengths */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="strengths" className="text-xs font-bold text-zinc-500">{t('Strengths')}</Label>
                                </div>
                                <Textarea
                                    id="strengths"
                                    value={data.strengths}
                                    onChange={(e) => setData('strengths', e.target.value)}
                                    placeholder={t('Detail candidate technical strengths and prototyping ability...')}
                                    rows={3}
                                    className="resize-none border border-zinc-300 dark:border-zinc-700 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                                    required
                                />
                                <InputError message={errors.strengths} />
                            </div>

                            {/* Weaknesses */}
                            <div className="space-y-2 pt-4 border-t border-zinc-300 dark:border-zinc-700">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="weaknesses" className="text-xs font-bold text-zinc-500">{t('Weaknesses')}</Label>
                                </div>
                                <Textarea
                                    id="weaknesses"
                                    value={data.weaknesses}
                                    onChange={(e) => setData('weaknesses', e.target.value)}
                                    placeholder={t('Detail candidate expression, confidence and structured thinking...')}
                                    rows={3}
                                    className="resize-none border border-zinc-300 dark:border-zinc-700 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                                    required
                                />
                                <InputError message={errors.weaknesses} />
                            </div>

                            {/* Comments */}
                            <div className="space-y-2 pt-4 border-t border-zinc-300 dark:border-zinc-700">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="comments" className="text-xs font-bold text-zinc-500">{t('Comments')}</Label>
                                </div>
                                <Textarea
                                    id="comments"
                                    value={data.comments}
                                    onChange={(e) => setData('comments', e.target.value)}
                                    placeholder={t('Detail candidate alignment with organization values and team collaboration...')}
                                    rows={3}
                                    className="resize-none border border-zinc-300 dark:border-zinc-700 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                                    required
                                />
                                <InputError message={errors.comments} />
                            </div>
                        </div>

                        {/* Section 3: Recommendation */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 shadow-sm space-y-5">
                            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-300 dark:border-zinc-700 pb-3">
                                {t('Recommendation')}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                {[
                                    { value: '0', label: t('Strong Hire'), colorClass: 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-955/20', activeClass: 'bg-emerald-500 text-white' },
                                    { value: '1', label: t('Hire'), colorClass: 'border-teal-500 text-teal-600 bg-teal-50/50 dark:bg-teal-955/20', activeClass: 'bg-teal-500 text-white' },
                                    { value: '2', label: t('Maybe'), colorClass: 'border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-955/20', activeClass: 'bg-amber-500 text-white' },
                                    { value: '3', label: t('Reject'), colorClass: 'border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-955/20', activeClass: 'bg-rose-500 text-white' },
                                    { value: '4', label: t('Strong Reject'), colorClass: 'border-red-700 text-red-700 bg-red-50/50 dark:bg-red-955/20', activeClass: 'bg-red-700 text-white' },
                                ].map((option) => {
                                    const isSelected = data.recommendation === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setData('recommendation', option.value)}
                                            className={`p-4 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 ${isSelected
                                                ? `${option.activeClass} border-transparent shadow-lg scale-105`
                                                : `${option.colorClass} border-zinc-300 dark:border-zinc-700 hover:scale-102`
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-white' : 'border-current'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.recommendation} />
                        </div>

                        {/* Actions bar */}
                        <div className="flex justify-end items-center">
                            <Button
                                type="submit"
                                disabled={processing}
                            >
                                {processing ? t('Updating...') : t('Update Feedback')}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
