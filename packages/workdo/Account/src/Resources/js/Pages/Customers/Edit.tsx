import { useForm, router, Head } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/ui/input-error";
import { PhoneInputComponent } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Customer, CustomerFormData, User } from './types';
import { useFormFields } from '@/hooks/useFormFields';
import { useState } from 'react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import Wizard from "@/components/ui/wizard";

interface EditCustomerProps {
    customer: Customer;
    auth: {
        user: {
            permissions: string[];
        };
    };
}

export default function Edit({ customer, auth }: EditCustomerProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('general');

    const { data, setData, put, processing, errors } = useForm<CustomerFormData>({
        user_id: customer.user_id,
        company_name: customer.company_name || '',
        contact_person_name: customer.contact_person_name || '',
        contact_person_email: customer.contact_person_email || '',
        contact_person_mobile: customer.contact_person_mobile || '',
        tax_number: customer.tax_number || '',
        payment_terms: customer.payment_terms || '',
        billing_address: {
            name: customer.billing_address?.name || '',
            address_line_1: customer.billing_address?.address_line_1 || '',
            address_line_2: customer.billing_address?.address_line_2 || '',
            city: customer.billing_address?.city || '',
            state: customer.billing_address?.state || '',
            country: customer.billing_address?.country || '',
            zip_code: customer.billing_address?.zip_code || ''
        },
        shipping_address: {
            name: customer.shipping_address?.name || '',
            address_line_1: customer.shipping_address?.address_line_1 || '',
            address_line_2: customer.shipping_address?.address_line_2 || '',
            city: customer.shipping_address?.city || '',
            state: customer.shipping_address?.state || '',
            country: customer.shipping_address?.country || '',
            zip_code: customer.shipping_address?.zip_code || ''
        },
        same_as_billing: customer.same_as_billing || false,
        notes: customer.notes || '',
    });

    const setDataWrapper = (key: string, value: any) => {
        setData(key as keyof CustomerFormData, value);
    };

    const formFields = useFormFields('customerEditFields', data, setDataWrapper, errors, 'edit');

    const validateGeneralTab = () => {
        return data.company_name.trim() !== '' &&
            data.contact_person_name.trim() !== '' &&
            data.contact_person_email.trim() !== '';
    };

    const validateBillingTab = () => {
        return data.billing_address.name.trim() !== '' &&
            data.billing_address.address_line_1.trim() !== '' &&
            data.billing_address.city.trim() !== '' &&
            data.billing_address.state.trim() !== '' &&
            data.billing_address.country.trim() !== '' &&
            data.billing_address.zip_code.trim() !== '';
    };

    const validateShippingTab = () => {
        if (data.same_as_billing) {
            return true;
        }
        return data.shipping_address.name.trim() !== '' &&
            data.shipping_address.address_line_1.trim() !== '' &&
            data.shipping_address.city.trim() !== '' &&
            data.shipping_address.state.trim() !== '' &&
            data.shipping_address.country.trim() !== '' &&
            data.shipping_address.zip_code.trim() !== '';
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        put(route('account.customers.update', customer.id));
    };

    const steps = [
        {
            id: 'general',
            label: t('General Info'),
            isValid: validateGeneralTab(),
            hasErrors: !!(errors.company_name || errors.contact_person_name || errors.contact_person_email || errors.contact_person_mobile || errors.tax_number || errors.payment_terms),
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="company_name" required>{t('Company Name')}</Label>
                            <Input
                                id="company_name"
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                placeholder={t('Enter company name')}
                                required
                            />
                            <InputError message={errors.company_name} />
                        </div>

                        <div>
                            <Label htmlFor="tax_number">{t('Tax Number')}</Label>
                            <Input
                                id="tax_number"
                                value={data.tax_number}
                                onChange={(e) => setData('tax_number', e.target.value)}
                                placeholder={t('Enter tax number')}
                            />
                            <InputError message={errors.tax_number} />
                        </div>

                        <div>
                            <Label htmlFor="payment_terms">{t('Payment Terms')}</Label>
                            <Input
                                id="payment_terms"
                                value={data.payment_terms}
                                onChange={(e) => setData('payment_terms', e.target.value)}
                                placeholder={t('e.g., Net 30')}
                            />
                            <InputError message={errors.payment_terms} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="contact_person_name" required>{t('Contact Person')}</Label>
                            <Input
                                id="contact_person_name"
                                value={data.contact_person_name}
                                onChange={(e) => setData('contact_person_name', e.target.value)}
                                placeholder={t('Enter contact person name')}
                                required
                            />
                            <InputError message={errors.contact_person_name} />
                        </div>

                        <div>
                            <Label htmlFor="contact_person_email" required>{t('Email')}</Label>
                            <Input
                                id="contact_person_email"
                                type="email"
                                value={data.contact_person_email}
                                onChange={(e) => setData('contact_person_email', e.target.value)}
                                placeholder={t('Enter email address')}
                                required
                            />
                            <InputError message={errors.contact_person_email} />
                        </div>

                        <div>
                            <PhoneInputComponent
                                label={t('Mobile Number')}
                                value={data.contact_person_mobile}
                                onChange={(value) => setData('contact_person_mobile', value || '')}
                                placeholder="+1234567890"
                                error={errors.contact_person_mobile}
                            />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'billing',
            label: t('Billing Address'),
            isValid: validateBillingTab(),
            hasErrors: !!(errors['billing_address.name'] || errors['billing_address.address_line_1'] || errors['billing_address.address_line_2'] || errors['billing_address.city'] || errors['billing_address.state'] || errors['billing_address.country'] || errors['billing_address.zip_code']),
            content: (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="billing_name" required>{t('Billing Name')}</Label>
                        <Input
                            id="billing_name"
                            value={data.billing_address.name}
                            onChange={(e) => setData('billing_address', { ...data.billing_address, name: e.target.value })}
                            placeholder={t('Enter billing name')}
                            required
                        />
                        <InputError message={errors['billing_address.name']} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="billing_address" required>{t('Billing Address')}</Label>
                            <Input
                                id="billing_address"
                                value={data.billing_address.address_line_1}
                                onChange={(e) => setData('billing_address', { ...data.billing_address, address_line_1: e.target.value })}
                                placeholder={t('Enter address')}
                                required
                            />
                            <InputError message={errors['billing_address.address_line_1']} />
                        </div>
                        <div>
                            <Label htmlFor="billing_address_2">{t('Address Line 2')}</Label>
                            <Input
                                id="billing_address_2"
                                value={data.billing_address.address_line_2}
                                onChange={(e) => setData('billing_address', { ...data.billing_address, address_line_2: e.target.value })}
                                placeholder={t('Apartment, suite, etc. (optional)')}
                            />
                            <InputError message={errors['billing_address.address_line_2']} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="billing_city" required>{t('City')}</Label>
                            <Input
                                id="billing_city"
                                value={data.billing_address.city}
                                onChange={(e) => setData('billing_address', { ...data.billing_address, city: e.target.value })}
                                placeholder={t('Enter city')}
                                required
                            />
                            <InputError message={errors['billing_address.city']} />
                        </div>
                        <div>
                            <Label htmlFor="billing_state" required>{t('State')}</Label>
                            <Input
                                id="billing_state"
                                value={data.billing_address.state}
                                onChange={(e) => setData('billing_address', { ...data.billing_address, state: e.target.value })}
                                placeholder={t('Enter state')}
                                required
                            />
                            <InputError message={errors['billing_address.state']} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="billing_country" required>{t('Country')}</Label>
                            <Input
                                id="billing_country"
                                value={data.billing_address.country}
                                onChange={(e) => setData('billing_address', { ...data.billing_address, country: e.target.value })}
                                placeholder={t('Enter country')}
                                required
                            />
                            <InputError message={errors['billing_address.country']} />
                        </div>
                        <div>
                            <Label htmlFor="billing_zip" required>{t('Zip Code')}</Label>
                            <Input
                                id="billing_zip"
                                value={data.billing_address.zip_code}
                                onChange={(e) => setData('billing_address', { ...data.billing_address, zip_code: e.target.value })}
                                placeholder={t('Enter zip code')}
                                required
                            />
                            <InputError message={errors['billing_address.zip_code']} />
                        </div>
                    </div>

                    {formFields.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            {formFields.map((field) => (
                                <div key={field.id}>
                                    {field.component}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
        },
        {
            id: 'shipping',
            label: t('Shipping Address & Notes'),
            isValid: validateShippingTab(),
            hasErrors: !!(errors['shipping_address.name'] || errors['shipping_address.address_line_1'] || errors['shipping_address.address_line_2'] || errors['shipping_address.city'] || errors['shipping_address.state'] || errors['shipping_address.country'] || errors['shipping_address.zip_code'] || errors.notes),
            content: (
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-lg border border-gray-100 dark:border-zinc-700/60">
                        <Checkbox
                            id="same_as_billing"
                            checked={data.same_as_billing}
                            onCheckedChange={(checked) => {
                                setData('same_as_billing', !!checked);
                                if (checked) {
                                    setData('shipping_address', { ...data.billing_address });
                                }
                            }}
                        />
                        <Label htmlFor="same_as_billing" className="cursor-pointer">{t('Shipping address same as billing')}</Label>
                    </div>

                    {!data.same_as_billing && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{t('Shipping Address')}</h3>
                            <div>
                                <Label htmlFor="shipping_name" required>{t('Shipping Name')}</Label>
                                <Input
                                    id="shipping_name"
                                    value={data.shipping_address.name}
                                    onChange={(e) => setData('shipping_address', { ...data.shipping_address, name: e.target.value })}
                                    placeholder={t('Enter shipping name')}
                                    required
                                />
                                <InputError message={errors['shipping_address.name']} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="shipping_address" required>{t('Shipping Address')}</Label>
                                    <Input
                                        id="shipping_address"
                                        value={data.shipping_address.address_line_1}
                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, address_line_1: e.target.value })}
                                        placeholder={t('Enter shipping address')}
                                        required
                                    />
                                    <InputError message={errors['shipping_address.address_line_1']} />
                                </div>
                                <div>
                                    <Label htmlFor="shipping_address_2">{t('Address Line 2')}</Label>
                                    <Input
                                        id="shipping_address_2"
                                        value={data.shipping_address.address_line_2}
                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, address_line_2: e.target.value })}
                                        placeholder={t('Apartment, suite, etc. (optional)')}
                                    />
                                    <InputError message={errors['shipping_address.address_line_2']} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="shipping_city" required>{t('City')}</Label>
                                    <Input
                                        id="shipping_city"
                                        value={data.shipping_address.city}
                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, city: e.target.value })}
                                        placeholder={t('Enter city')}
                                        required
                                    />
                                    <InputError message={errors['shipping_address.city']} />
                                </div>
                                <div>
                                    <Label htmlFor="shipping_state" required>{t('State')}</Label>
                                    <Input
                                        id="shipping_state"
                                        value={data.shipping_address.state}
                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, state: e.target.value })}
                                        placeholder={t('Enter state')}
                                        required
                                    />
                                    <InputError message={errors['shipping_address.state']} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="shipping_country" required>{t('Country')}</Label>
                                    <Input
                                        id="shipping_country"
                                        value={data.shipping_address.country}
                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, country: e.target.value })}
                                        placeholder={t('Enter country')}
                                        required
                                    />
                                    <InputError message={errors['shipping_address.country']} />
                                </div>
                                <div>
                                    <Label htmlFor="shipping_zip" required>{t('Zip Code')}</Label>
                                    <Input
                                        id="shipping_zip"
                                        value={data.shipping_address.zip_code}
                                        onChange={(e) => setData('shipping_address', { ...data.shipping_address, zip_code: e.target.value })}
                                        placeholder={t('Enter zip code')}
                                        required
                                    />
                                    <InputError message={errors['shipping_address.zip_code']} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 border-t pt-4">
                        <Label htmlFor="notes">{t('Notes')}</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder={t('Enter notes')}
                            rows={3}
                        />
                        <InputError message={errors.notes} />
                    </div>
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Account'), url: route('account.customers.index') },
                { label: t('Customers'), url: route('account.customers.index') },
                { label: t('Edit') }
            ]}
            pageTitle={t('Edit Customer')}
            pageDescription={t('Update the customer general profile, billing, and shipping details.')}
            backUrl={route('account.customers.index')}
        >
            <Head title={t('Edit Customer')} />

            <Card className="shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <Wizard
                        steps={steps}
                        activeStep={activeTab}
                        onStepChange={setActiveTab}
                        submitButtonText={t('Save Changes')}
                        isSubmitting={processing}
                        onSubmit={handleSubmit}
                    />
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}