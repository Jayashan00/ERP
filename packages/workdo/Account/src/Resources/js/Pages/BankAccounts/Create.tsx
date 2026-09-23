import { useForm, router, Head } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { CreateBankAccountFormData } from './types';

interface CreateProps {
    chartofaccounts: any[];
}

export default function Create({ chartofaccounts = [] }: CreateProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm<CreateBankAccountFormData>({
        account_number: '',
        account_name: '',
        bank_name: '',
        branch_name: '',
        account_type: '0',
        opening_balance: '',
        current_balance: '',
        iban: '',
        swift_code: '',
        routing_number: '',
        is_active: false,
        gl_account_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('account.bank-accounts.store'));
    };

    const handleCancel = () => {
        router.visit(route('account.bank-accounts.index'));
    };

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Accounting'), url: route('account.index') },
                { label: t('Bank Accounts'), url: route('account.bank-accounts.index') },
                { label: t('Create') }
            ]}
            pageTitle={t('Create Bank Account')}
            pageDescription={t('Add a new bank account with its account number, bank details, and initial balances.')}
            backUrl={route('account.bank-accounts.index')}
        >
            <Head title={t('Create Bank Account')} />

            <form onSubmit={submit} className="mx-auto space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: General & Financial Information (takes 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50 mb-4">{t('Account Details')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="account_number" required>{t('Account Number')}</Label>
                                        <Input
                                            id="account_number"
                                            type="text"
                                            value={data.account_number}
                                            onChange={(e) => setData('account_number', e.target.value)}
                                            placeholder={t('Enter Account Number')}
                                            required
                                        />
                                        <InputError message={errors.account_number} />
                                    </div>

                                    <div>
                                        <Label htmlFor="account_name" required>{t('Account Name')}</Label>
                                        <Input
                                            id="account_name"
                                            type="text"
                                            value={data.account_name}
                                            onChange={(e) => setData('account_name', e.target.value)}
                                            placeholder={t('Enter Account Name')}
                                            required
                                        />
                                        <InputError message={errors.account_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="gl_account_id" required>{t('Gl Account')}</Label>
                                        <Select value={data.gl_account_id?.toString() || ''} onValueChange={(value) => setData('gl_account_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('Select Gl Account')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {chartofaccounts.map((item: any) => (
                                                    <SelectItem key={item.id} value={item.id.toString()}>
                                                        {item.account_code} - {item.account_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.gl_account_id} />
                                    </div>

                                    <div>
                                        <Label required>{t('Account Type')}</Label>
                                        <RadioGroup value={data.account_type?.toString() || '0'} onValueChange={(value) => setData('account_type', value)} className="flex flex-wrap gap-6 mt-2">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="0" id="account_type_0" />
                                                <Label htmlFor="account_type_0" className="cursor-pointer capitalize">{t('checking')}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="1" id="account_type_1" />
                                                <Label htmlFor="account_type_1" className="cursor-pointer capitalize">{t('savings')}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="2" id="account_type_2" />
                                                <Label htmlFor="account_type_2" className="cursor-pointer capitalize">{t('credit')}</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="3" id="account_type_3" />
                                                <Label htmlFor="account_type_3" className="cursor-pointer capitalize">{t('loan')}</Label>
                                            </div>
                                        </RadioGroup>
                                        <InputError message={errors.account_type} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50 mb-4">{t('Financial Details')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <CurrencyInput
                                            label={t('Opening Balance')}
                                            value={data.opening_balance}
                                            onChange={(value) => setData('opening_balance', value)}
                                            error={errors.opening_balance}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <CurrencyInput
                                            label={t('Current Balance')}
                                            value={data.current_balance}
                                            onChange={(value) => setData('current_balance', value)}
                                            error={errors.current_balance}
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex items-center space-x-2 mt-2">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active || false}
                                            onCheckedChange={(checked) => setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="is_active" className="cursor-pointer">{t('Status')}</Label>
                                        <InputError message={errors.is_active} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Bank Details & Actions (takes 1 col) */}
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardContent className="p-4 sm:p-6">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50 mb-4">{t('Bank Information')}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="bank_name" required>{t('Bank Name')}</Label>
                                        <Input
                                            id="bank_name"
                                            type="text"
                                            value={data.bank_name}
                                            onChange={(e) => setData('bank_name', e.target.value)}
                                            placeholder={t('Enter Bank Name')}
                                            required
                                        />
                                        <InputError message={errors.bank_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="branch_name">{t('Branch Name')}</Label>
                                        <Input
                                            id="branch_name"
                                            type="text"
                                            value={data.branch_name}
                                            onChange={(e) => setData('branch_name', e.target.value)}
                                            placeholder={t('Enter Branch Name')}
                                        />
                                        <InputError message={errors.branch_name} />
                                    </div>

                                    <div>
                                        <Label htmlFor="iban">{t('Iban')}</Label>
                                        <Input
                                            id="iban"
                                            type="text"
                                            value={data.iban}
                                            onChange={(e) => setData('iban', e.target.value)}
                                            placeholder={t('Enter Iban')}
                                        />
                                        <InputError message={errors.iban} />
                                    </div>

                                    <div>
                                        <Label htmlFor="swift_code">{t('Swift Code')}</Label>
                                        <Input
                                            id="swift_code"
                                            type="text"
                                            value={data.swift_code}
                                            onChange={(e) => setData('swift_code', e.target.value)}
                                            placeholder={t('Enter Swift Code')}
                                        />
                                        <InputError message={errors.swift_code} />
                                    </div>

                                    <div>
                                        <Label htmlFor="routing_number">{t('Routing Number')}</Label>
                                        <Input
                                            id="routing_number"
                                            type="text"
                                            value={data.routing_number}
                                            onChange={(e) => setData('routing_number', e.target.value)}
                                            placeholder={t('Enter Routing Number')}
                                        />
                                        <InputError message={errors.routing_number} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-end gap-3">
                            <Button type="button" variant="outline" onClick={handleCancel} className="w-full">
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? t('Creating...') : t('Create')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
