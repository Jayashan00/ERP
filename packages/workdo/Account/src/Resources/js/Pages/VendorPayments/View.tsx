import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { VendorPaymentViewProps } from './types';
import { formatDate, formatCurrency, getImagePath } from '@/utils/helpers';
import RandomBadgeUI from '@/components/random-badge-ui';
import BadgeUI from '@/components/badge-ui';
import {
    ArrowLeft,
    FileText,
    Calculator,
    Receipt,
    Coins,
    User
} from 'lucide-react';

export default function View({ payment }: VendorPaymentViewProps) {
    const { t } = useTranslation();
    const [isNotesExpanded, setIsNotesExpanded] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'cleared':
                return 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-900/50';
            case 'pending':
                return 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:ring-yellow-900/50';
            case 'cancelled':
                return 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-900/50';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-900/50';
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Vendor Payments'), url: route('account.vendor-payments.index') },
                { label: `${t('Payment Details')} - ${payment.payment_number || `#${payment.id}`}` }
            ]}
            pageTitle={`${t('Payment Details')} - ${payment.payment_number || `#${payment.id}`}`}
            pageDescription={t('Detailed breakdown of allocations, bank settings, and debit notes applied to this vendor payment.')}
            pageActions={
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit(route('account.vendor-payments.index'))}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('Back')}
                </Button>
            }
        >
            <Head title={`${t('Payment Details')} - ${payment.payment_number || `#${payment.id}`}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start mx-auto w-full">
                {/* Left Column - Main Details, Allocated Bills & Debit Notes */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                    {/* Payment Information Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Payment Details')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground">{t('Payment Number')}</span>
                                    <p className="font-semibold text-foreground">{payment.payment_number || `#${payment.id}`}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground">{t('Payment Date')}</span>
                                    <p className="font-semibold text-foreground">{formatDate(payment.payment_date)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground">{t('Bank Account')}</span>
                                    <p className="font-semibold text-foreground">
                                        {payment.bank_account?.account_name || '-'}
                                        {payment.bank_account?.account_number && ` (${payment.bank_account.account_number})`}
                                    </p>
                                </div>
                                {payment.reference_number && (
                                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                                        <span className="text-xs font-medium text-muted-foreground">{t('Reference Number')}</span>
                                        <p><RandomBadgeUI name={payment.reference_number} /></p>
                                    </div>
                                )}
                            </div>
                            {payment.notes && (
                                <div className="mt-6 pt-4 border-t">
                                    <span className="text-xs font-medium text-muted-foreground">{t('Notes')}</span>
                                    <div className="mt-1.5 p-3 bg-muted/20 border rounded-xl text-sm text-foreground">
                                        <p className="break-words leading-relaxed">
                                            {payment.notes.length > 200 && !isNotesExpanded
                                                ? `${payment.notes.substring(0, 200)}...`
                                                : payment.notes}
                                        </p>
                                        {payment.notes.length > 200 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                                                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors focus:outline-none mt-2 block"
                                            >
                                                {isNotesExpanded ? t('Show less') : t('Show more')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Allocated Bills Card */}
                    {payment.allocations && payment.allocations.length > 0 && (
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <Receipt className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Allocated Bills')}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {payment.allocations.map((allocation) => (
                                        <div key={allocation.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border rounded-xl bg-muted/5 relative">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                                                <RandomBadgeUI name={allocation.invoice?.invoice_number} />
                                                <div className="text-muted-foreground text-xs whitespace-nowrap">
                                                    {t('Bill Date')}: <span className="font-semibold text-foreground">{formatDate(allocation.invoice?.invoice_date)}</span>
                                                </div>
                                                <div className="text-muted-foreground text-xs whitespace-nowrap">
                                                    {t('Total Amount')}: <span className="font-semibold text-foreground">{formatCurrency(allocation.invoice?.total_amount)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-start md:self-center">
                                                <span className="text-xs text-muted-foreground font-medium">{t('Allocated')}:</span>
                                                <span className="text-sm font-bold text-foreground bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                                                    {formatCurrency(allocation.allocated_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Debit Note History Card */}
                    {payment.debit_note_applications && payment.debit_note_applications.length > 0 && (
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                     <div className="bg-red-100 dark:bg-red-950/30 p-2 rounded-lg text-red-600 dark:text-red-400">
                                         <Coins className="h-5 w-5" />
                                     </div>
                                     <div>
                                         <CardTitle className="text-base font-semibold text-foreground">
                                             {t('Applied Debit Note')}
                                         </CardTitle>
                                     </div>
                                 </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {payment.debit_note_applications.map((application) => (
                                        <div key={application.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border border-red-200 rounded-xl bg-red-50/5 relative">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                                                <RandomBadgeUI name={application.debit_note?.debit_note_number} />
                                                <div className="text-muted-foreground text-xs whitespace-nowrap">
                                                    {t('Application Date')}: <span className="font-semibold text-foreground">{formatDate(application.application_date)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-start md:self-center">
                                                <span className="text-xs text-muted-foreground font-medium">{t('Applied')}:</span>
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400 px-3 py-1 bg-red-500/5 rounded-lg border border-red-500/10">
                                                    {formatCurrency(application.applied_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Summary & Quick Actions sidebar */}
                <div className="space-y-6 lg:sticky lg:top-6 self-start">
                    {/* Status & Summary Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Summary & Status')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-6">
                            <div className="space-y-1.5 text-center sm:text-start">
                                <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Net Payment Amount')}</span>
                                <div className="text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(payment.payment_amount)}</div>
                                <div className="pt-2">
                                    <BadgeUI className={`capitalize ${getStatusColor(payment.status)}`}>
                                        {t(payment.status)}
                                    </BadgeUI>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>{t('Total Bills Allocated')}</span>
                                    <span className="font-semibold text-foreground">
                                        {formatCurrency(payment.allocations?.reduce((sum, a) => sum + Number(a.allocated_amount || 0), 0) || 0)}
                                    </span>
                                </div>
                                {payment.debit_note_applications && payment.debit_note_applications.length > 0 && (
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>{t('Total Debit Notes Applied')}</span>
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                            - {formatCurrency(payment.debit_note_applications.reduce((sum, app) => sum + parseFloat(app.applied_amount || '0'), 0))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vendor Info Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Vendor Info')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary overflow-hidden flex items-center justify-center text-sm capitalize shadow-sm">
                                    {payment.vendor?.avatar ? (
                                        <img
                                            src={getImagePath(payment.vendor.avatar)}
                                            alt={payment.vendor.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${payment.vendor?.avatar ? 'hidden' : ''} font-bold`}>
                                        {payment.vendor?.name ? payment.vendor.name.charAt(0) : '?'}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-foreground truncate">{payment.vendor?.name || t('Guest Vendor')}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{payment.vendor?.email || t('No email address')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
