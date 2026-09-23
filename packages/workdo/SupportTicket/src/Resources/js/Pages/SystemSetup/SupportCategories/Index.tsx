import React from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import SystemSetupSidebar from '../SystemSetupSidebar';

export default function Index() {
    const { t } = useTranslation();

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Support Tickets'), url: route('dashboard.support-tickets') },
                { label: t('System Setup') },
                { label: t('Support Categories') }
            ]}
            pageTitle={t('System Setup')}
            pageDescription={t('Manage support ticket system setup and configuration settings.')}
        >
            <Head title={t('Support Categories')} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="flex flex-col lg:flex-row">
                            <div className="lg:w-64 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r flex-shrink-0">
                                <SystemSetupSidebar activeItem="support-categories" />
                            </div>
                            <div className="flex-1 p-4 sm:p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {t('Support Categories')}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {t('Manage support ticket categories for better organization')}
                                    </p>
                                </div>
                                
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        {t('Support Categories management will be implemented here')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}