import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { formatCurrency, formatDate, getImagePath, getCompanySetting } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Building2, User, FileText, Calculator, Clock, CalendarDays, Coins, Package, ArrowLeft, Calendar } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BadgeUI from '@/components/badge-ui';
import GenerateAvatar from '@/components/generate-avatar';
import RandomBadgeUI from '@/components/random-badge-ui';

interface CreditNote {
    id: number;
    credit_note_number: string;
    credit_note_date: string;
    customer: {
        name: string;
        email: string;
        avatar?: string;
    };
    total_amount: number;
    applied_amount: number;
    balance_amount: number;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    status: string;
    reason: string;
    notes?: string;
    items: Array<{
        id: number;
        product: {
            name: string;
            sku?: string;
            description?: string;
            image?: string;
        };
        quantity: number;
        unit_price: number;
        discount_percentage: number;
        discount_amount: number;
        tax_percentage: number;
        tax_amount: number;
        total_amount: number;
        taxes?: Array<{
            tax_name: string;
            tax_rate: number;
        }>;
    }>;
    sales_return?: {
        id: number;
        return_number: string;
    };
    applications: Array<{
        id: number;
        applied_amount: number;
        application_date: string;
        payment: {
            payment_number: string;
        };
    }>;
}

interface ViewProps {
    creditNote: CreditNote;
    auth: any;
    [key: string]: any;
}

const DescriptionShowMore = ({ text, className = "text-xs text-muted-foreground break-words", wrapperClassName = "mt-1.5 max-w-md" }: { text: string; className?: string; wrapperClassName?: string }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = React.useState(false);
    const isLong = text.length > 100;

    return (
        <div className={wrapperClassName}>
            <p className={`${className} ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                {text}
            </p>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary font-semibold hover:underline mt-1 focus:outline-none"
                >
                    {isExpanded ? t('Show less') : t('Show more')}
                </button>
            )}
        </div>
    );
};

export default function View() {
    const { t } = useTranslation();
    const { creditNote, auth } = usePage<ViewProps>().props;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:ring-zinc-900/50';
            case 'partial':
                return 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:ring-yellow-900/50';
            case 'approved':
                return 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-900/50';
            case 'applied':
                return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-900/50';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-900/50';
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Credit Notes'), url: route('account.credit-notes.index') },
                { label: `${t('Credit Note')} #${creditNote.credit_note_number}` }
            ]}
            pageTitle={`${t('Credit Note')} #${creditNote.credit_note_number}`}
            pageDescription={t('View details, applied payments, items, and validation history for this credit note.')}
            pageActions={
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit(route('account.credit-notes.index'))}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('Back')}
                </Button>
            }
        >
            <Head title={`${t('Credit Note')} #${creditNote.credit_note_number}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start mx-auto w-full">
                {/* Left Column - Main Details, Items & Notes */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-6">

                    {/* Credit Note Items Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <Calculator className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Credit Note Items')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/10">
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-start font-semibold text-foreground capitalize tracking-wider text-xs">{t('Product')}</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-24">{t('Qty')}</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Unit Price')}</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Discount')}</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-44">{t('Tax')}</th>
                                            <th className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground capitalize tracking-wider text-xs w-36">{t('Total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {creditNote.items?.map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-3 py-3 sm:px-6 sm:py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                                                            {item.product?.image ? (
                                                                <img
                                                                    src={getImagePath(item.product.image)}
                                                                    alt={item.product.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                                        if (fallback) fallback.classList.remove('hidden');
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className={`${item.product?.image ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                                                <Package className="h-5 w-5 text-muted-foreground/45" />
                                                            </div>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-semibold text-foreground truncate">{item.product?.name}</div>
                                                            {item.product?.sku && (
                                                                <BadgeUI className="px-1.5 py-0.5 mt-1">
                                                                    SKU: {item.product.sku}
                                                                </BadgeUI>
                                                            )}

                                                            {item.product?.description && (
                                                                <DescriptionShowMore text={item.product.description} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 sm:px-6 sm:py-4 text-end font-medium text-foreground">{item.quantity}</td>
                                                <td className="px-3 py-3 sm:px-6 sm:py-4 text-end font-medium text-foreground">{formatCurrency(parseFloat(item.unit_price.toString()))}</td>
                                                <td className="px-3 py-3 sm:px-6 sm:py-4 text-end">
                                                    {item.discount_percentage > 0 ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                                                                {item.discount_percentage}%
                                                            </span>
                                                            <div className="text-xs text-muted-foreground font-medium">
                                                                -{formatCurrency(parseFloat(item.discount_amount.toString()))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 sm:px-6 sm:py-4 text-end">
                                                    {item.taxes && item.taxes.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {item.taxes.map((tax, taxIndex) => (
                                                                <div key={taxIndex} className="text-xs text-foreground font-medium">
                                                                    {tax.tax_name} <span className="text-muted-foreground">({tax.tax_rate}%)</span>
                                                                </div>
                                                            ))}
                                                            <div className="text-xs text-muted-foreground font-semibold">
                                                                {formatCurrency(parseFloat(item.tax_amount.toString()))}
                                                            </div>
                                                        </div>
                                                    ) : item.tax_percentage > 0 ? (
                                                        <div className="space-y-0.5">
                                                            <span className="text-xs text-foreground font-medium">{item.tax_percentage}%</span>
                                                            <div className="text-xs text-muted-foreground font-semibold">
                                                                {formatCurrency(parseFloat(item.tax_amount.toString()))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground">
                                                    {formatCurrency(parseFloat(item.total_amount.toString()))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 border-t border-border flex justify-end">
                                <div className="w-full sm:w-80 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">{t('Subtotal')}</span>
                                        <span className="font-semibold text-foreground">{formatCurrency(parseFloat(creditNote.subtotal.toString()))}</span>
                                    </div>
                                    {creditNote.discount_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Discount')}</span>
                                            <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(parseFloat(creditNote.discount_amount.toString()))}</span>
                                        </div>
                                    )}
                                    {creditNote.tax_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Tax')}</span>
                                            <span className="font-semibold text-foreground">{formatCurrency(parseFloat(creditNote.tax_amount.toString()))}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-foreground">{t('Total Amount')}</span>
                                        <span className="font-bold text-lg text-foreground">{formatCurrency(parseFloat(creditNote.total_amount.toString()))}</span>
                                    </div>
                                    {creditNote.applied_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground font-medium">{t('Applied Amount')}</span>
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(parseFloat(creditNote.applied_amount.toString()))}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-foreground">{t('Balance Amount')}</span>
                                        <span className="font-bold text-2xl text-primary">{formatCurrency(parseFloat(creditNote.balance_amount.toString()))}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Applications Card */}
                    {creditNote.applications && creditNote.applications.length > 0 && (
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-100 dark:bg-emerald-950/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                                        <Coins className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Applications')}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[250px] overflow-y-auto overflow-x-auto">
                                    <table className="w-full text-sm relative">
                                        <thead>
                                            <tr className="border-b bg-muted/10 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                                                <th className="px-3 py-3 sm:px-6 sm:py-4 text-start font-semibold text-foreground">{t('Payment')}</th>
                                                <th className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground">{t('Applied Amount')}</th>
                                                <th className="px-3 py-3 sm:px-6 sm:py-4 text-end font-semibold text-foreground">{t('Date')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {creditNote.applications.map((application) => (
                                                <tr key={application.id} className="hover:bg-muted/10 transition-colors">
                                                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                                                        <RandomBadgeUI name={application.payment.payment_number} />
                                                    </td>
                                                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-end font-medium text-foreground">
                                                        {formatCurrency(parseFloat(application.applied_amount.toString()))}
                                                    </td>
                                                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-end text-muted-foreground">
                                                        <div className="flex justify-end items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span>{formatDate(application.application_date)}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes Card */}
                    {creditNote.notes && (
                        <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                            <CardHeader className="border-b pb-4 bg-muted/10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {t('Notes')}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <DescriptionShowMore
                                    text={creditNote.notes}
                                    className="text-sm text-muted-foreground break-words whitespace-pre-line leading-relaxed"
                                    wrapperClassName="w-full"
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Summary & Quick Actions sidebar */}
                <div className="space-y-6 lg:sticky lg:top-6 self-start">
                    {/* Status & Quick Actions Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Summary & Actions')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-6">
                            <div className="space-y-1.5 text-center sm:text-start">
                                <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Balance Amount')}</span>
                                <div className="text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(parseFloat(creditNote.balance_amount.toString()))}</div>
                                <div className="pt-2">
                                    <BadgeUI className={`capitalize ${getStatusColor(creditNote.status)}`}>
                                        {t(creditNote.status)}
                                    </BadgeUI>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>{t('Total Amount')}</span>
                                    <span className="font-semibold text-foreground">
                                        {formatCurrency(parseFloat(creditNote.total_amount.toString()))}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span>{t('Applied Amount')}</span>
                                    <span className="font-semibold text-foreground">
                                        {formatCurrency(parseFloat(creditNote.applied_amount.toString()))}
                                    </span>
                                </div>
                            </div>

                            {creditNote.status === 'draft' && auth.user?.permissions?.includes('approve-credit-notes') && (
                                <>
                                    <Separator />
                                    <div className="flex flex-col gap-2.5">
                                        <Button
                                            className="w-full justify-center gap-2 font-semibold rounded-lg shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                                            onClick={() => router.post(route('account.credit-notes.approve', creditNote.id), {}, {
                                                onSuccess: () => {
                                                    router.reload();
                                                }
                                            })}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>{t('Approve Credit Note')}</span>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer Information Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Customer Info')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 text-primary overflow-hidden flex items-center justify-center text-sm capitalize shadow-sm">
                                    {creditNote.customer?.avatar ? (
                                        <img
                                            src={getImagePath(creditNote.customer.avatar)}
                                            alt={creditNote.customer.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.classList.remove('hidden');
                                            }}
                                        />
                                    ) : (
                                        <GenerateAvatar name={creditNote.customer?.name || ''} />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-foreground truncate">{creditNote.customer?.name || t('Guest Customer')}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{creditNote.customer?.email || t('No email address')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Credit Note Details Card */}
                    <Card className="border border-border shadow-md rounded-xl overflow-hidden bg-card">
                        <CardHeader className="border-b pb-4 bg-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-foreground">
                                        {t('Credit Note Details')}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Date')}</span>
                                    <span className="text-sm font-medium text-foreground">{formatDate(creditNote.credit_note_date)}</span>
                                </div>
                            </div>

                            {creditNote.sales_return && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Sales Return')}</span>
                                        <span className="text-sm font-medium text-foreground">{creditNote.sales_return.return_number}</span>
                                    </div>
                                </div>
                            )}

                            {creditNote.reason && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-muted-foreground bg-muted/30 p-1.5 rounded-md">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-semibold text-muted-foreground capitalize tracking-wider">{t('Reason')}</span>
                                        <span className="text-sm font-medium text-foreground">{creditNote.reason}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}