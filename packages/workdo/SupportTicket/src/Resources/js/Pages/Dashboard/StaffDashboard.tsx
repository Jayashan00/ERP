import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import { TicketIcon, CheckCircleIcon, LinkIcon, BookOpenIcon, HelpCircleIcon, UsersIcon, Clock, TrendingUp, Users, Calendar, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useMobileChartTicks } from '@/hooks/use-mobile-chart-ticks';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/helpers';

interface StaffDashboardProps {
  stats: {
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
    todayTickets: number;
    resolutionRate: number;
    canViewTickets: boolean;
  };
  monthlyData: Record<string, number>;
  recentTickets: Array<{
    id: number;
    ticket_id: string;
    name: string;
    email: string;
    subject: string;
    status: string;
    category: string;
    created_at: string;
  }>;
  statusData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  slug: string;
}

export default function StaffDashboard({ stats, monthlyData, recentTickets, statusData, slug }: StaffDashboardProps) {
  const { t } = useTranslation();

  const monthlyChartData = Object.entries(monthlyData).map(([month, value]) => ({
    month,
    tickets: value
  }));
  const monthlyChartTicks = useMobileChartTicks(monthlyChartData, 'month');

  const copyToClipboard = async () => {    
    const ticketUrl = route('support-ticket.index',[slug]);
    await navigator.clipboard.writeText(ticketUrl);
    toast.success(t('Link copied to clipboard!'));
  };

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: t('Staff Dashboard') }
      ]}
      pageTitle={t('Staff Dashboard')}
      pageDescription={t('Manage assigned support tickets, resolution workload, and customer queries.')}
    >
      <Head title={t('Staff Dashboard')} />

      <div className="space-y-6">
        {!stats.canViewTickets ? (
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">{t('Access Restricted')}</h2>
              <p className="text-red-700">{t('You do not have permission to view support ticket data. Please contact your administrator.')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main Dashboard Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-indigo-100 opacity-50"></div>
              <CardContent className="relative p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t('Staff Support Dashboard')}
                    </h2>
                    <p className="text-gray-600 max-w-md">
                      {t('Manage company tickets and provide excellent customer support.')}
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                        onClick={() => router.get(route('support-tickets.index'))}
                      >
                        <TicketIcon className="h-4 w-4 mr-2" />
                        {t('View All Tickets')}
                      </Button>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                      <UsersIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => router.get(route('support-tickets.index'))}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">{t('Total Tickets')}</CardTitle>
                  <TicketIcon className="h-6 w-6 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">{stats.totalTickets}</div>
                  <p className="text-xs text-blue-600 mt-1">{t('My tickets')}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => router.get(route('support-tickets.index'))}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">{t('In Progress')}</CardTitle>
                  <Clock className="h-6 w-6 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">{stats.openTickets}</div>
                  <p className="text-xs text-orange-600 mt-1">{t('Need attention')}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => router.get(route('support-tickets.index'))}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">{t('Resolved')}</CardTitle>
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{stats.closedTickets}</div>
                  <p className="text-xs text-green-600 mt-1">{stats.resolutionRate}% {t('resolution rate')}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">{t('Today\'s Tickets')}</CardTitle>
                  <Calendar className="h-6 w-6 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">{stats.todayTickets}</div>
                  <p className="text-xs text-purple-600 mt-1">{t('Created today')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Monthly Tickets Chart */}
              <Card className="xl:col-span-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('My Ticket Trends - This Year')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyChartData}>
                        <defs>
                          <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} {...(monthlyChartTicks ? { ticks: monthlyChartTicks, interval: 0 } : {})} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="tickets" stroke="#6366f1" fillOpacity={1} fill="url(#colorTickets)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="xl:col-span-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    {t('Ticket Status Distribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {statusData && statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>{t('No ticket data available')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('My Recent Tickets')}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => router.get(route('support-tickets.index'))}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('View All')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentTickets && recentTickets.length > 0 ? (
                  <div className="space-y-4">
                    {recentTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => router.get(route('support-tickets.edit', ticket.id))}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-gray-900">#{ticket.ticket_id}</div>
                            <BadgeUI className={
                              ticket.status === 'In Progress' ? 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800/20' :
                              ticket.status === 'closed' || ticket.status === 'Closed' ? 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-950/30 dark:text-rose-400 dark:ring-rose-800/20' :
                              ticket.status === 'On Hold' ? 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800/20' :
                              'bg-gray-50 text-gray-700 ring-gray-600/10 dark:bg-gray-950/30 dark:text-gray-400 dark:ring-gray-800/20'
                            }>
                              {ticket.status}
                            </BadgeUI>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{ticket.subject}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            {ticket.name} • <RandomBadgeUI name={ticket.category} /> • {formatDateTime(ticket.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TicketIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('No recent tickets found')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}