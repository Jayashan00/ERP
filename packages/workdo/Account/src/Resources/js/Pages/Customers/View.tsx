import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, Receipt, FileText } from 'lucide-react';
import { Customer } from './types';
import RandomBadgeUI from "@/components/random-badge-ui";
import GenerateAvatar from "@/components/generate-avatar";
import { getImagePath } from "@/utils/helpers";

interface ViewProps {
    customer: Customer;
}

export default function View({ customer }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-w-3xl">
            <DialogHeader className="pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                            {t('Customer Details')}
                        </DialogTitle>
                    </div>
                </div>
            </DialogHeader>

            <div className="p-4 sm:p-6 space-y-6">
                {/* General Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Customer Code')}
                            </label>
                            <div className="flex mt-1">
                                <RandomBadgeUI name={customer.customer_code} />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Company Name')}
                            </label>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                                {customer.company_name || '-'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Tax Number')}
                            </label>
                            <div className="flex mt-1">
                                {customer.tax_number ? (
                                    <RandomBadgeUI name={customer.tax_number} />
                                ) : (
                                    <span className="text-sm text-zinc-400 dark:text-zinc-600">-</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Payment Terms')}
                            </label>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                {customer.payment_terms || '-'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Contact Person')}
                            </label>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                                {customer.contact_person_name || '-'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Email')}
                            </label>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mt-1" title={customer.contact_person_email || ''}>
                                {customer.contact_person_email || '-'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Mobile')}
                            </label>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                                {customer.contact_person_mobile || '-'}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                {t('Linked User')}
                            </label>
                            {customer?.user ? (
                                <div className="flex items-center gap-3 mt-1.5">
                                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        {customer.user.avatar ? (
                                            <img
                                                src={getImagePath(customer.user.avatar)}
                                                alt={customer.user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <GenerateAvatar name={customer.user.name || ''} />
                                        )}
                                    </div>
                                    <div className="flex flex-col text-start">
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                                            {customer.user.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {customer.user.email || '-'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                                    -
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Addresses Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Billing Address */}
                    {customer.billing_address && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5" />
                                {t('Billing Address')}
                            </h4>
                            <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/60 p-5 rounded-lg space-y-1.5 min-h-[140px]">
                                {customer.billing_address.name && (
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{customer.billing_address.name}</p>
                                )}
                                {(customer.billing_address as any).address && <p>{(customer.billing_address as any).address}</p>}
                                {customer.billing_address.address_line_1 && <p>{customer.billing_address.address_line_1}</p>}
                                {customer.billing_address.address_line_2 && <p>{customer.billing_address.address_line_2}</p>}
                                {(customer.billing_address.city || customer.billing_address.state || customer.billing_address.zip_code) && (
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        {[customer.billing_address.city, customer.billing_address.state, customer.billing_address.zip_code].filter(Boolean).join(', ')}
                                    </p>
                                )}
                                {customer.billing_address.country && (
                                    <p className="font-semibold text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                                        {customer.billing_address.country}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Shipping Address */}
                    {customer.shipping_address && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {t('Shipping Address')}
                            </h4>
                            <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/60 p-5 rounded-lg space-y-1.5 min-h-[140px] flex flex-col justify-start">
                                {customer.same_as_billing ? (
                                    <div className="flex items-center justify-center flex-1 py-4">
                                        <p className="text-xs text-muted-foreground">{t('Same as billing address')}</p>
                                    </div>
                                ) : (
                                    <>
                                        {customer.shipping_address.name && (
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{customer.shipping_address.name}</p>
                                        )}
                                        {(customer.shipping_address as any).address && <p>{(customer.shipping_address as any).address}</p>}
                                        {customer.shipping_address.address_line_1 && <p>{customer.shipping_address.address_line_1}</p>}
                                        {customer.shipping_address.address_line_2 && <p>{customer.shipping_address.address_line_2}</p>}
                                        {(customer.shipping_address.city || customer.shipping_address.state || customer.shipping_address.zip_code) && (
                                            <p className="text-zinc-600 dark:text-zinc-400">
                                                {[customer.shipping_address.city, customer.shipping_address.state, customer.shipping_address.zip_code].filter(Boolean).join(', ')}
                                            </p>
                                        )}
                                        {customer.shipping_address.country && (
                                            <p className="font-semibold text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                                                {customer.shipping_address.country}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes */}
                {customer.notes && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            {t('Notes')}
                        </h4>
                        <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/60 p-5 rounded-lg leading-relaxed whitespace-pre-wrap">
                            {customer.notes}
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
