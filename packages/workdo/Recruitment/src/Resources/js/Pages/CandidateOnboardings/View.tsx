import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { UserCheck, Calendar, User, FileText, Users } from 'lucide-react';
import { CandidateOnboarding } from './types';
import { formatDate, getImagePath } from '@/utils/helpers';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import GenerateAvatar from '@/components/generate-avatar';

interface ViewProps {
    candidateonboarding: CandidateOnboarding;
}

export default function View({ candidateonboarding }: ViewProps) {
    const { t } = useTranslation();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 ring-yellow-200';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 ring-blue-200';
            case 'Completed':
                return 'bg-green-100 text-green-800 ring-green-200';
            default:
                return 'bg-gray-100 text-gray-800 ring-gray-200';
        }
    };

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-6 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold">{t('Candidate Onboarding Details')}</DialogTitle>
                        </div>
                    </div>
                </div>
            </DialogHeader>

            <div className="py-4 space-y-6">
                {/* Candidate Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">{t('Candidate Information')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                {candidateonboarding.candidate?.profile_path ? (
                                    <img
                                        src={getImagePath(candidateonboarding.candidate?.profile_path)}
                                        alt={candidateonboarding.candidate?.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <GenerateAvatar name={candidateonboarding.candidate?.name} />
                                )}
                            </div>
                            <div className="flex flex-col text-start">
                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    {candidateonboarding.candidate?.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {candidateonboarding.candidate?.email || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Onboarding Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">{t('Onboarding Details')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Checklist Name')}</label>
                            <p><RandomBadgeUI name={candidateonboarding.checklist?.name} /></p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Status')}</label>
                            <div className="mt-1">
                                <BadgeUI className={getStatusBadge(candidateonboarding.status)}>
                                    {t(candidateonboarding.status)}
                                </BadgeUI>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">{t('Timeline')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Start Date')}</label>
                            <p className="text-gray-900 font-medium">
                                {candidateonboarding.start_date ? formatDate(candidateonboarding.start_date) : '-'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">{t('Created At')}</label>
                            <p className="text-gray-900 font-medium">
                                {candidateonboarding.created_at ? formatDate(candidateonboarding.created_at) : '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buddy Information */}
                {candidateonboarding.buddy && <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">{t('Assigned Buddy')}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                {candidateonboarding.buddy?.avatar ? (
                                    <img
                                        src={getImagePath(candidateonboarding.buddy?.avatar)}
                                        alt={candidateonboarding.buddy?.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <GenerateAvatar name={candidateonboarding.buddy?.name} />
                                )}
                            </div>
                            <div className="flex flex-col text-start">
                                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    {candidateonboarding.buddy?.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {candidateonboarding.buddy?.email || '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>}
            </div>
        </DialogContent>
    );
}