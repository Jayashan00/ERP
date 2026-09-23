import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { GitCompare, Eye, Calendar } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import NoRecordsFound from '@/components/no-records-found';
import { formatDate } from '@/utils/helpers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComparisonsProps {
    comparisons: {
        data: Array<{
            id: number;
            comparison_date: string;
            current_period: {
                id: number;
                balance_sheet_date: string;
                financial_year: string;
            };
            previous_period: {
                id: number;
                balance_sheet_date: string;
                financial_year: string;
            };
        }>;
        links: any[];
        meta: any;
    };
}

export default function Comparisons() {
    const { t } = useTranslation();
    const { comparisons } = usePage<ComparisonsProps>().props;

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('Double Entry') },
                { label: t('Balance Sheets'), url: route('double-entry.balance-sheets.index') },
                { label: t('Comparisons') }
            ]}
            pageTitle={t('Balance Sheet Comparisons')}
            pageDescription={t('View and analyze comparative reports between different balance sheet periods.')}
        >
            <Head title={t('Balance Sheet Comparisons')} />

            <Card className="shadow-sm pt-5">
                <CardContent>
                    {comparisons.data.length > 0 ? (
                        <div className="space-y-4">
                            {comparisons.data.map((comparison) => (
                                <div key={comparison.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 shadow hover:shadow-md rounded-lg border">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 bg-blue-50 rounded-lg border flex items-center justify-center flex-shrink-0">
                                            <GitCompare className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-medium">
                                                {formatDate(comparison.current_period.balance_sheet_date)} vs {formatDate(comparison.previous_period.balance_sheet_date)}
                                            </h3>
                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {t('Compared on')} {formatDate(comparison.comparison_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.get(route('double-entry.balance-sheets.comparison', comparison.id))}
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t('View')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <NoRecordsFound
                            icon={GitCompare}
                            title={t('No Comparisons found')}
                            description={t('Start comparing balance sheets to see them here.')}
                            className="h-auto"
                        />
                    )}
                </CardContent>

                {comparisons.data.length > 0 && (
                    <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
                        <Pagination
                            data={comparisons}
                            routeName="double-entry.balance-sheets.comparisons"
                        />
                    </CardContent>
                )}
            </Card>
        </AuthenticatedLayout>
    );
}
