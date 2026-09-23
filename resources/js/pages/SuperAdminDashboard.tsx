import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Head } from "@inertiajs/react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from '@/components/charts';
import { Building2, ShoppingCart, CreditCard, Crown } from "lucide-react";
import { formatCurrency } from '@/utils/helpers';

interface SuperAdminDashboardProps {
    stats: {
        order_payments: number;
        total_orders: number;
        total_plans: number;
        total_companies: number;
    };
    chartData: Array<{
        month: string;
        orders: number;
        payments: number;
    }>;
}

export default function SuperAdminDashboard({ stats, chartData }: SuperAdminDashboardProps) {
    const { t } = useTranslation();

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Dashboard') }]}
            pageTitle={t('Dashboard')}
            pageDescription={t('Overview of orders, revenue, plans, and registered companies.')}
        >
            <Head title={t('Dashboard')} />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">{t('Total Orders')}</CardTitle>
                        <ShoppingCart className="h-6 w-6 text-green-700 opacity-80 sm:h-8 sm:w-8" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-green-700 sm:text-2xl">{stats.total_orders}</div>
                        <p className="text-xs text-green-700 opacity-80 mt-1">{t('All orders')}</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">{t('Order Payments')}</CardTitle>
                        <CreditCard className="h-6 w-6 text-blue-700 opacity-80 sm:h-8 sm:w-8" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-blue-700 sm:text-2xl">{formatCurrency(stats.order_payments)}</div>
                        <p className="text-xs text-blue-700 opacity-80 mt-1">{t('Total payments')}</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700">{t('Total Plans')}</CardTitle>
                        <Crown className="h-6 w-6 text-purple-700 opacity-80 sm:h-8 sm:w-8" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-purple-700 sm:text-2xl">{stats.total_plans}</div>
                        <p className="text-xs text-purple-700 opacity-80 mt-1">{t('Available plans')}</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">{t('Total Companies')}</CardTitle>
                        <Building2 className="h-6 w-6 text-orange-700 opacity-80 sm:h-8 sm:w-8" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-orange-700 sm:text-2xl">{stats.total_companies}</div>
                        <p className="text-xs text-orange-700 opacity-80 mt-1">{t('Registered companies')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders Chart */}
            <Card className="mt-4 sm:mt-6">
                <CardHeader>
                    <CardTitle>{t('Recent Orders (Monthly)')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[220px] sm:h-[300px]">
                        <LineChart
                            data={chartData}
                            dataKey="orders"
                            height="100%"
                            showTooltip={true}
                            showGrid={true}
                            lines={[
                                { dataKey: 'orders', color: '#3b82f6', name: 'Orders' }
                            ]}
                            xAxisKey="month"
                            showLegend={true}
                        />
                    </div>
                </CardContent>
            </Card>

        </AuthenticatedLayout>
    );
}
