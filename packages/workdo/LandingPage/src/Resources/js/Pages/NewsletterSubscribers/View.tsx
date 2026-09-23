import { useTranslation } from 'react-i18next';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/utils/helpers';
import { Mail, Calendar, Globe, Monitor, Shield, MapPin, Cpu } from 'lucide-react';
import BadgeUI from '@/components/badge-ui'

interface NewsletterSubscriber {
    id: number;
    email: string;
    subscribed_at: string;
    ip_address?: string;
    country?: string;
    city?: string;
    region?: string;
    country_code?: string;
    isp?: string;
    org?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    browser?: string;
    os?: string;
    device?: string;
}

interface ViewSubscriberProps {
    subscriber: NewsletterSubscriber;
}

export default function ViewSubscriber({ subscriber }: ViewSubscriberProps) {
    const { t } = useTranslation();

    const locationText = [subscriber.city, subscriber.region, subscriber.country]
        .filter(Boolean)
        .join(', ');

    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between pr-6">
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {t('Subscriber Details')}
                    </DialogTitle>
                </div>
            </DialogHeader>

            <div className="space-y-6 my-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {/* Subscriber Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 sm:p-5 flex items-center justify-between sm:col-span-2 shadow-sm gap-3">
                        <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 tracking-wider capitalize">{t('Email Address')}</span>
                            <div className="text-base sm:text-xl font-extrabold text-blue-900 dark:text-blue-100 mt-0.5 break-all">
                                {subscriber.email}
                            </div>
                        </div>
                        <div className="bg-blue-500/15 p-2.5 rounded-lg text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <Mail className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Left Column Fields - Subscription & Network */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Subscribed Date')}
                            </span>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(subscriber.subscribed_at)}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('IP Address')}
                            </span>
                            <BadgeUI className="font-mono">
                                {subscriber.ip_address || '-'}
                            </BadgeUI>
                        </div>

                        {subscriber.timezone && (
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                    {t('Timezone')}
                                </span>
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    {subscriber.timezone}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column Fields - Location & Device */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Location')}
                            </span>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {locationText || '-'}
                                {subscriber.country_code && (
                                    <span className="ml-1 text-xs text-muted-foreground">({subscriber.country_code})</span>
                                )}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                                {t('Device & OS')}
                            </span>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 capitalize">
                                {[subscriber.browser, subscriber.os, subscriber.device].filter(Boolean).join(' / ') || '-'}
                            </p>
                        </div>

                        {(subscriber.isp || subscriber.org) && (
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                                    {t('ISP / Network')}
                                </span>
                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                    {[subscriber.isp, subscriber.org].filter(Boolean).join(' - ')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}
