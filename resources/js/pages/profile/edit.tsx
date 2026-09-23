import AuthenticatedLayout from "@/layouts/authenticated-layout";
import UpdatePasswordForm from "@/pages/profile/partials/update-password-form";
import UpdateProfileInformationForm from "@/pages/profile/partials/update-profile-information-form";
import { Head, usePage } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormFields } from '@/hooks/useFormFields';
import { PageProps } from '@/types';

export default function Edit({
    mustVerifyEmail,
    status,
}: { mustVerifyEmail: boolean; status?: string }) {
    const { t } = useTranslation();
    const { auth } = usePage<PageProps>().props;

    const formFields = useFormFields('getProfileFields', {}, () => { }, {}, 'edit', t);
    const integrationFields = useFormFields('getJobsearchFields', {}, () => { }, {}, 'edit', t, 'JobSearch');

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Profile') }]}
            pageTitle={t('Profile Settings')}
            pageDescription={t('Manage your profile information and update password.')}
        >
            <Head title={t('Profile')} />

            <Card className="shadow-sm">
                <CardContent className="p-3 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="shadow-sm h-full">
                            <CardHeader className="p-4 border-b bg-gray-50/50 sm:p-6">
                                <CardTitle className="text-base">{t('Profile Information')}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">{t('Details about your personal information')}</p>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className=""
                                />
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm h-full">
                            <CardHeader className="p-4 border-b bg-gray-50/50 sm:p-6">
                                <CardTitle className="text-base">{t('Change Password')}</CardTitle>
                                <p className="text-sm text-gray-600 mt-1">{t('Details about your account password change')}</p>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                <UpdatePasswordForm className="" />
                            </CardContent>
                        </Card>
                    </div>

                    {formFields.length > 0 && (
                        <div className="mt-6">
                            {formFields.map((field) => (
                                <div key={field.id}>
                                    {field.component}
                                </div>
                            ))}
                        </div>
                    )}

                    {integrationFields.length > 0 && auth.user?.permissions?.includes('job-seeker-information') && (auth.user as any)?.type !== 'company' && (
                        <div className="mt-6">
                            <Card className="shadow-sm">
                                <CardHeader className="p-4 border-b bg-gray-50/50 sm:p-6">
                                    <CardTitle className="text-base">{t('Job Seeker Information')}</CardTitle>
                                    <p className="text-sm text-gray-600 mt-1">{t('Complete your job seeker profile with this details')}</p>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {integrationFields.map((field) => (
                                            <div key={field.id}>
                                                {field.component}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
