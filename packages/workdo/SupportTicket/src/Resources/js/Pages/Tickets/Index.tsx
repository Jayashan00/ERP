import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Eye, Headphones, Grid3X3, List, Tag, Calendar, LayoutGrid, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageSelector } from '@/components/ui/per-page-selector';
import { ListGridToggle } from '@/components/ui/list-grid-toggle';
import Create from './Create';
import NoRecordsFound from '@/components/no-records-found';
import { formatDateTime } from '@/utils/helpers';
import { usePageButtons } from '@/hooks/usePageButtons';
import BadgeUI from '@/components/badge-ui';
import RandomBadgeUI from '@/components/random-badge-ui';
import GenerateAvatar from '@/components/generate-avatar';
import UserColumn from '@/components/user-column'

interface Ticket {
  id: number;
  encrypted_id: string;
  ticket_id: string;
  name: string;
  email: string;
  account_type: string;
  subject: string;
  status: string;
  category: {
    name: string;
    color: string;
  };
  created_at: string;
}

interface TicketsIndexProps {
  tickets: {
    data: Ticket[];
    links: any[];
    meta: any;
  };
  auth: {
    user: {
      permissions: string[];
      slug: string;
    };
  };
  summary?: Record<string, any>;
}

interface TicketFilters {
  search: string;
  status: string;
}

interface TicketModalState {
  isOpen: boolean;
  mode: string;
  data: any;
}

export default function Index() {
  const { t } = useTranslation();
  const { tickets, auth, summary } = usePage<TicketsIndexProps>().props;
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const pageButtons = usePageButtons('supportTicketShowButtons');

  const [filters, setFilters] = useState<TicketFilters>({
    search: urlParams.get('search') || '',
    status: urlParams.get('status') || '',
  });

  const [perPage, setPerPage] = useState(urlParams.get('per_page') || '10');
  const [sortField, setSortField] = useState(urlParams.get('sort') || '');
  const [sortDirection, setSortDirection] = useState(urlParams.get('direction') || 'asc');
  const viewMode = urlParams.get('view') as 'list' | 'grid' || 'list';

  const handleTabChange = (status: string) => {
    const newStatus = status === 'all' ? '' : status;
    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    router.get(route('support-tickets.index'), { ...newFilters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
      preserveState: true,
      replace: true
    });
  };

  const activeTab = filters.status || 'all';

  const zendeskButtons = usePageButtons('zendeskSyncBtn', { module: 'ticket', settingKey: 'zendesk_is_on' });

  const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
    routeName: 'support-tickets.destroy',
    defaultMessage: t('Are you sure you want to delete this ticket?')
  });

  const handleFilter = () => {
    router.get(route('support-tickets.index'), { ...filters, per_page: perPage, sort: sortField, direction: sortDirection, view: viewMode }, {
      preserveState: true,
      replace: true
    });
  };

  const handlePerPageChange = (newPerPage: string) => {
    setPerPage(newPerPage);
    router.get(route('support-tickets.index'), { ...filters, per_page: newPerPage, sort: sortField, direction: sortDirection, view: viewMode }, {
      preserveState: true,
      replace: true
    });
  };

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    router.get(route('support-tickets.index'), { ...filters, per_page: perPage, sort: field, direction, view: viewMode }, {
      preserveState: true,
      replace: true
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
    });
    router.get(route('support-tickets.index'), { per_page: perPage, view: viewMode });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'open': 'bg-blue-100 text-blue-800 ring-blue-200',
      'Open': 'bg-green-100 text-green-800 ring-green-200',
      'In Progress': 'bg-yellow-100 text-yellow-800 ring-yellow-200',
      'closed': 'bg-gray-100 text-gray-800 ring-gray-200',
      'Closed': 'bg-red-100 text-red-800 ring-red-200',
      'On Hold': 'bg-orange-100 text-orange-800 ring-orange-200'
    };
    return (
      <BadgeUI className={`capitalize ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {t(status.replace('_', ' '))}
      </BadgeUI>
    );
  };

  const tableColumns = [
    {
      key: 'ticket_id',
      header: t('Ticket ID'),
      sortable: true,
      render: (value: string, ticket: Ticket) =>
        auth.user?.permissions?.includes('view-support-tickets') ? (
          <BadgeUI
            onClick={() => router.get(route('support-ticket.show', [auth.user?.slug, ticket.encrypted_id]))}
            className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800 cursor-pointer"
          >
            {value}
          </BadgeUI>
        ) : (
          <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800">
            {value}
          </BadgeUI>
        )
    },
    {
      key: 'subject',
      header: t('Subject'),
      sortable: true,
      render: (value: string) => (
        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          {value}
        </span>
      )
    },
    {
      key: 'category',
      header: t('Category'),
      sortable: true,
      render: (value: any) => <RandomBadgeUI name={value?.name || '-'} icon={Tag} className="w-fit" />
    },
    {
      key: 'name',
      header: t('Created By'),
      sortable: true,
      render: (value: string, ticket: Ticket) => (
        <UserColumn name={ticket.name} email={ticket.email || '-'} />
      )
    },
    {
      key: 'account_type',
      header: t('Account Type'),
      render: (value: string) => (
        <RandomBadgeUI className="w-fit capitalize" name={value || 'N/A'} />
      )
    },
    {
      key: 'created_at',
      header: t('Created'),
      type:'date'
    },
    {
      key: 'status',
      header: t('Status'),
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    },
    ...(auth.user?.permissions?.some((p: string) => ['edit-support-tickets', 'delete-support-tickets'].includes(p)) ? [{
      key: 'actions',
      header: t('Actions'),
      render: (_: any, ticket: Ticket) => (
        <div className="flex gap-1">
          <TooltipProvider>
            {auth.user?.permissions?.includes('view-support-tickets') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                    <Link href={route('support-ticket.show', [auth.user?.slug, ticket.encrypted_id])}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('View')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {auth.user?.permissions?.includes('edit-support-tickets') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => window.location.href = route('support-tickets.edit', ticket.id)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Edit & Replay')}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {auth.user?.permissions?.includes('delete-support-tickets') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(ticket.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Delete')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )
    }] : [])
  ];

  return (
    <AuthenticatedLayout
      breadcrumbs={[
        { label: t('Support Tickets'), url: route('dashboard.support-tickets') },
        { label: t('Tickets') }
      ]}
      pageTitle={t('Manage Tickets')}
      pageDescription={t('Manage your support tickets, track resolutions, and respond to customer queries.')}
      pageActions={
        <div className="flex flex-wrap items-center gap-2">
          {zendeskButtons.map((button) => (
            <div key={button.id}>{button.component}</div>
          ))}
          <TooltipProvider>
            {pageButtons.map((button: any) => (
              <div key={button.id}>{button.component}</div>
            ))}
            {auth.user?.permissions?.includes('create-support-tickets') && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button size="sm" asChild>
                    <Link href={route('support-tickets.create')}>
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Create')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      }
    >
      <Head title={t('Support Tickets')} />

      <Card className="shadow-sm">
        <CardContent className="p-2.5 border-b bg-gray-50/50 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="w-full sm:max-w-md">
              <SearchInput
                value={filters.search}
                onChange={(value) => setFilters({ ...filters, search: value })}
                onSearch={handleFilter}
                placeholder={t('Search tickets...')}
              />
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-3 w-full sm:w-auto">
              <ListGridToggle
                currentView={viewMode}
                routeName="support-tickets.index"
                filters={{ ...filters, per_page: perPage }}
              />
              <PerPageSelector
                routeName="support-tickets.index"
                filters={{ ...filters, view: viewMode }}
                currentPerPage={perPage}
                onPerPageChange={handlePerPageChange}
              />
            </div>
          </div>
        </CardContent>

        {/* Status Tabs */}
        <CardContent className="px-2.5 py-0 border-b bg-white dark:bg-zinc-900 flex-shrink-0 sm:px-5">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { key: 'all', label: t('All'), icon: LayoutGrid, count: summary?.all },
              { key: 'In Progress', label: t('In Progress'), icon: Clock, count: summary?.in_progress },
              { key: 'On Hold', label: t('On Hold'), icon: Clock, count: summary?.on_hold },
              { key: 'Closed', label: t('Closed'), icon: CheckCircle2, count: summary?.closed },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-zinc-700'
                  }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${activeTab === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>

        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 max-h-[70vh] rounded-none w-full min-w-0">
              <DataTable
                data={tickets?.data || []}
                columns={tableColumns}
                onSort={handleSort}
                sortKey={sortField}
                sortDirection={sortDirection as 'asc' | 'desc'}
                className="rounded-none"
                emptyState={
                  <NoRecordsFound
                    icon={Headphones}
                    title={t('No Tickets found')}
                    description={t('Get started by creating your first Ticket.')}
                    hasFilters={!!(filters.search || filters.status)}
                    onClearFilters={clearFilters}
                    createPermission="create-support-tickets"
                    onCreateClick={() => window.location.href = route('support-tickets.create')}
                    createButtonText={t('Create Ticket')}
                    className="h-auto"
                  />
                }
              />
            </div>
          ) : (
            <div className="overflow-auto max-h-[70vh] p-4 sm:p-6">
              {tickets?.data?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {tickets?.data?.map((ticket) => (
                    <Card key={ticket.id} className="p-0 hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full min-w-0">
                      <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/50 border-b flex-shrink-0">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
                            <Headphones className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {auth.user?.permissions?.includes('view-support-tickets') ? (
                              <h3
                                className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-primary transition-colors cursor-pointer truncate"
                                title={ticket.subject}
                                onClick={() => router.get(route('support-ticket.show', [auth.user?.slug, ticket.encrypted_id]))}
                              >
                                {ticket.subject}
                              </h3>
                            ) : (
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate" title={ticket.subject}>
                                {ticket.subject}
                              </h3>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {auth.user?.permissions?.includes('view-support-tickets') ? (
                                <BadgeUI
                                  onClick={() => router.get(route('support-ticket.show', [auth.user?.slug, ticket.encrypted_id]))}
                                  className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800 cursor-pointer font-medium"
                                >
                                  #{ticket.ticket_id}
                                </BadgeUI>
                              ) : (
                                <BadgeUI className="bg-blue-50 text-blue-600 ring-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-800 font-medium">
                                  #{ticket.ticket_id}
                                </BadgeUI>
                              )}
                              {getStatusBadge(ticket.status)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex-1 space-y-3 min-h-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9">
                            <GenerateAvatar name={ticket.name} />
                          </div>
                          <div className="flex flex-col min-w-0 text-start">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                              {ticket.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {ticket.email || '-'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1">{t('Category')}</p>
                            <RandomBadgeUI name={ticket.category?.name || '-'} icon={Tag} className="w-fit" />
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">{t('Account Type')}</p>
                            <RandomBadgeUI className="w-fit capitalize" name={ticket.account_type || 'N/A'} />
                          </div>
                        </div>

                      </div>

                      <div className="flex justify-between items-center p-3 border-t bg-gray-50/50 dark:bg-zinc-900/50 flex-shrink-0 mt-auto">
                        <div className="text-xs">
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDateTime(ticket.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <TooltipProvider>
                            {auth.user?.permissions?.includes('view-support-tickets') && (
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => router.get(route('support-ticket.show', [auth.user?.slug, ticket.encrypted_id]))} className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('View')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('edit-support-tickets') && (
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => router.get(route('support-tickets.edit', ticket.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('Edit & Replay')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {auth.user?.permissions?.includes('delete-support-tickets') && (
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(ticket.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('Delete')}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <NoRecordsFound
                  icon={Headphones}
                  title={t('No Tickets found')}
                  description={t('Get started by creating your first Ticket.')}
                  hasFilters={!!(filters.search || filters.status)}
                  onClearFilters={clearFilters}
                  createPermission="create-support-tickets"
                  onCreateClick={() => window.location.href = route('support-tickets.create')}
                  createButtonText={t('Create Ticket')}
                  className="h-auto"
                />
              )}
            </div>
          )}
        </CardContent>

        <CardContent className="p-2.5 border-t bg-gray-50/30 sm:px-4 sm:py-3">
          <Pagination
            data={tickets}
            routeName="support-tickets.index"
            filters={{ ...filters, per_page: perPage, view: viewMode }}
          />
        </CardContent>
      </Card>



      <ConfirmationDialog
        open={deleteState.isOpen}
        onOpenChange={closeDeleteDialog}
        title={t('Delete Ticket')}
        message={deleteState.message}
        confirmText={t('Delete')}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </AuthenticatedLayout>
  );
}