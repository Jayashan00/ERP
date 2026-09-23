import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { ClipboardCheck } from 'lucide-react';
import { CandidateAssessment } from './types';
import { formatDate } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';

interface ViewProps {
    candidateassessment: CandidateAssessment;
}

export default function View({ candidateassessment }: ViewProps) {
    const { t } = useTranslation();

    const score = candidateassessment.score || 0;
    const maxScore = candidateassessment.max_score || 0;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const firstName = candidateassessment.candidate?.first_name || '';
    const lastName = candidateassessment.candidate?.last_name || '';
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || '-');

    const getStatusColor = (status: string) => {
        switch (status) {
            case '0': return 'bg-green-100 text-green-800';
            case '1': return 'bg-red-100 text-red-800';
            case '2': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        const options: any = { "0": "Pass", "1": "Fail", "2": "Pending" };
        return options[status] || status || '-';
    };

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold">{t('Candidate Assessments Details')}</DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">{t('Assessment Name')}</label>
                            <p className="text-gray-900 font-medium">{candidateassessment.assessment_name || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">{t('Candidate')}</label>
                            <p className="text-gray-900 font-medium">{fullName}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">{t('Conducted By')}</label>
                            <p className="text-gray-900">{candidateassessment.conducted_by?.name || '-'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600">{t('Assessment Date')}</label>
                            <p className="text-gray-900">{formatDate(candidateassessment.assessment_date) || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600">{t('Status')}</label>
                            <p>
                                <BadgeUI className={getStatusColor(candidateassessment.pass_fail_status)}>
                                    {t(getStatusText(candidateassessment.pass_fail_status))}
                                </BadgeUI>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Score Section */}
                <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/60 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6">
                    {/* Circle progress */}
                    {(() => {
                        const radius = 32;
                        const strokeWidth = 5;
                        const circumference = 2 * Math.PI * radius;
                        const offset = circumference - (percentage / 100) * circumference;

                        let colorClass = "text-emerald-500 dark:text-emerald-400";
                        let bgClass = "text-emerald-100 dark:text-emerald-950/30";

                        if (percentage < 40) {
                            colorClass = "text-red-500 dark:text-red-400";
                            bgClass = "text-red-100 dark:text-red-950/30";
                        } else if (percentage < 70) {
                            colorClass = "text-amber-500 dark:text-amber-400";
                            bgClass = "text-amber-100 dark:text-amber-950/30";
                        }

                        return (
                            <div className="relative flex items-center justify-center h-24 w-24 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        className={`${bgClass} stroke-current`}
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                        r={radius}
                                        cx="48"
                                        cy="48"
                                    />
                                    <circle
                                        className={`${colorClass} stroke-current transition-all duration-500 ease-out`}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        fill="transparent"
                                        r={radius}
                                        cx="48"
                                        cy="48"
                                    />
                                </svg>
                                <span className="absolute text-lg font-extrabold text-zinc-800 dark:text-zinc-200">
                                    {percentage}%
                                </span>
                            </div>
                        );
                    })()}

                    {/* Numeric details */}
                    <div className="flex-1 w-full">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center sm:text-start">{t('Score Details')}</h3>
                        <div className="grid grid-cols-3 gap-4 text-center sm:text-start">
                            <div>
                                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{score}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{t('Score')}</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{maxScore}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{t('Max Score')}</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{percentage}%</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{t('Percentage')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments */}
                {candidateassessment.comments && (
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-2">{t('Comments')}</label>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{candidateassessment.comments}</p>
                        </div>
                    </div>
                )}


            </div>
        </DialogContent>
    );
}