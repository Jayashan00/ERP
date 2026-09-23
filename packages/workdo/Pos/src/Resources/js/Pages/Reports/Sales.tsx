import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useMobileChartTicks } from '@/hooks/use-mobile-chart-ticks';
import { useIsMobile } from '@/hooks/use-mobile';

interface SalesReportProps {
    salesData: {
        data: Array<{
            id: number;
            sale_number: string;
            total: number;
            created_at: string;
            customer?: { name: string };
            warehouse?: { name: string };
        }>;
    };
    dailySales?: Array<{ date: string; sales: number; count: number }>;
    monthlySales?: Array<{ month: string; sales: number; count: number }>;
    warehouseSales?: Array<{ name: string; sales: number; count: number }>;
}

export default function SalesReport({ salesData, dailySales, monthlySales, warehouseSales }: SalesReportProps) {
    const { t } = useTranslation();
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    const isMobile = useIsMobile();
    const mobileAxisProps = isMobile ? { angle: -45, textAnchor: 'end' as const, height: 70, tick: { fontSize: 11 } } : {};
    const dailySalesTicks = useMobileChartTicks(dailySales, 'date');
    const monthlySalesTicks = useMobileChartTicks(monthlySales, 'month');
    const warehouseSalesTicks = useMobileChartTicks(warehouseSales, 'name');

    return (
        <AuthenticatedLayout
            breadcrumbs={[
                { label: t('POS'), url: route('pos.index') },
                { label: t('Sales Report') }
            ]}
            pageTitle={t('Sales Report')}
            pageDescription={t('Analyze daily, monthly, and warehouse POS sales performance and revenue trends.')}
        >
            <Head title={t('Sales Report')} />

            <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="flex flex-wrap w-full h-auto justify-start gap-1 p-1 sm:grid sm:grid-cols-3 sm:gap-0">
                        <TabsTrigger value="daily" className="flex-1 sm:flex-none">{t('Daily Sales')}</TabsTrigger>
                        <TabsTrigger value="monthly" className="flex-1 sm:flex-none">{t('Monthly Sales')}</TabsTrigger>
                        <TabsTrigger value="warehouse" className="flex-1 sm:flex-none">{t('Warehouse Sales')}</TabsTrigger>
                    </TabsList>

                <TabsContent value="daily" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Daily Sales Performance')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={dailySales || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" {...mobileAxisProps} {...(dailySalesTicks ? { ticks: dailySalesTicks, interval: 0 } : {})} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [formatCurrency(value), t('Sales')]} />
                                    <Bar dataKey="sales" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Monthly Sales Performance')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={monthlySales || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" {...mobileAxisProps} {...(monthlySalesTicks ? { ticks: monthlySalesTicks, interval: 0 } : {})} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [formatCurrency(value), t('Sales')]} />
                                    <Bar dataKey="sales" fill="#00C49F" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="warehouse" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Warehouse Sales Comparison')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={warehouseSales || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" {...mobileAxisProps} {...(warehouseSalesTicks ? { ticks: warehouseSalesTicks, interval: 0 } : {})} />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [formatCurrency(value), t('Sales')]} />
                                    <Bar dataKey="sales" fill="#ff7300" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AuthenticatedLayout>
    );
}