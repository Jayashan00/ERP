import { useState, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { formatDate } from '@/utils/helpers';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Plus, Edit, Trash2, Clock, Users, ChevronLeft, ChevronRight, User, Folder, FileText, List, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BadgeUI from '@/components/badge-ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Create from './Create';
import EditTimesheet from './Edit';
import View from './View';
import { getImagePath } from '@/utils/helpers';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Timesheet {
    id: number;
    user: { id: number; name: string, email: string, avatar?: string };
    project_name?: string;
    task_name?: string;
    date: string;
    hours: number;
    minutes: number;
    type: 'clock_in_out' | 'project' | 'manual';
    formatted_time: string;
    notes?: string;
}

interface TimesheetIndexProps {
    timesheets: Timesheet[];
    hasHRM: boolean;
    hasTaskly: boolean;
    auth: any;
    users: Array<{ id: number; name: string; email?: string; avatar?: string }>;
    projects: Array<{ id: number; name: string }>;
    selectedMonth: string;
    selectedYear: string;
    selectedUser?: string;
}


interface TimesheetModalState {
    isOpen: boolean;
    mode: string;
    data: Timesheet | null;
}

function formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalDateString(dateStr: string): string {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr: string, t: any): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const monthName = d.toLocaleDateString(undefined, { month: 'long' });
    return `${day} ${t(monthName)} ${year} • ${t(dayName)}`;
}

interface MonthDayCellProps {
    cell: any;
    user: any;
    t: any;
    openModal: (mode: 'add' | 'edit', data: any) => void;
    openDeleteDialog: (id: number) => void;
    openViewModal: (data: any) => void;
    auth: any;
}

function MonthDayCell({ cell, user, t, openModal, openDeleteDialog, openViewModal, auth }: MonthDayCellProps) {
    const [isOpen, setIsOpen] = useState(false);

    const hasData = cell.entryCount > 0;
    const isToday = cell.isToday;

    const tooltipText = hasData
        ? cell.entries.map((e: any) => `${e.project_name || e.task_name || t('General')}: ${String(e.hours).padStart(2, '0')}h ${String(e.minutes).padStart(2, '0')}m (${e.type === 'clock_in_out' ? t('Clock In/Out') : e.type === 'project' ? t('Project') : t('Manual')})`).join('\n')
        : t('No Entries');

    if (!hasData) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <button
                            className={["w-full flex flex-col items-center justify-center py-1 px-0.5 rounded transition-all duration-150 min-h-[46px] border border-gray-150/20 dark:border-zinc-800/20 cursor-default bg-gray-50/20 dark:bg-zinc-900/10", isToday ? 'ring-2 ring-primary/40 bg-primary/5' : ''].join(' ')}
                        >
                            <span className="text-gray-300 dark:text-zinc-700 font-semibold text-xs">-</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px] whitespace-pre-line text-xs p-3 shadow-md border bg-popover text-popover-foreground">
                        {tooltipText}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={[
                        'w-full flex flex-col items-center justify-center py-1 px-0.5 rounded transition-all duration-150 min-h-[46px] border border-gray-150/20 dark:border-zinc-800/20 cursor-pointer hover:bg-primary/5 active:scale-95 bg-white dark:bg-zinc-950 shadow-sm',
                        isToday ? 'ring-2 ring-primary/40 bg-primary/5' : '',
                    ].join(' ')}
                >
                    <div className="flex flex-col items-center justify-center leading-tight">
                        <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                            {cell.totalHours}h
                        </span>
                        {cell.totalMinutes > 0 && (
                            <span className="text-[9px] text-gray-500 dark:text-zinc-400 font-medium tabular-nums mt-0.5">
                                {cell.totalMinutes}m
                            </span>
                        )}
                    </div>
                </button>
            </PopoverTrigger>

            <PopoverContent side="bottom" align="end" className="w-[360px] p-4 bg-white dark:bg-zinc-950 border border-gray-150 dark:border-zinc-800 shadow-lg rounded-xl z-50" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                            {user?.avatar ? (
                                <img src={getImagePath(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                        <div className="flex flex-col text-left">
                            <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                {user?.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                {formatDisplayDate(cell.date, t)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <BadgeUI> {cell.entryCount} {cell.entryCount === 1 ? t('Entry') : t('Entries')}</BadgeUI>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            {cell.totalHours}h {cell.totalMinutes}m
                        </span>
                    </div>
                </div>

                <div className="mt-2 divide-y divide-gray-200 dark:divide-zinc-900/60 max-h-[250px] overflow-y-auto pr-1">
                    {cell.entries.map((entry: any) => {
                        let EntryIcon = FileText;
                        let iconColor = 'text-gray-500';
                        let iconBg = 'bg-gray-50/50 dark:bg-zinc-900/40';
                        if (entry.type === 'project') {
                            EntryIcon = Folder;
                            iconColor = 'text-emerald-500';
                            iconBg = 'bg-emerald-50/50 dark:bg-emerald-950/20';
                        } else if (entry.type === 'clock_in_out') {
                            EntryIcon = Clock;
                            iconColor = 'text-blue-500';
                            iconBg = 'bg-blue-50/50 dark:bg-blue-950/20';
                        } return (
                            <div key={entry.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`w-7 h-7 rounded ${iconBg} flex items-center justify-center flex-shrink-0`}>
                                        <EntryIcon className={`h-4 w-4 ${iconColor}`} />
                                    </div>
                                    <div className="flex flex-col text-left min-w-0 flex-1">
                                        <span className="text-xs font-bold text-gray-900 dark:text-gray-150 truncate">
                                            {entry.project_name || (entry.type === 'clock_in_out' ? t('Clock In/Out') : t('Manual'))}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                                            {entry.task_name || entry.notes || '—'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-200">
                                        {entry.hours}h {entry.minutes}m
                                    </span>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsOpen(false);
                                                        openViewModal(entry);
                                                    }}
                                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('View')}</p></TooltipContent>
                                        </Tooltip>
                                        {auth.user?.permissions?.includes('edit-timesheet') && (
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsOpen(false);
                                                            openModal('edit', entry);
                                                        }}
                                                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{t('Edit')}</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                        {auth.user?.permissions?.includes('delete-timesheet') && (
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsOpen(false);
                                                            openDeleteDialog(entry.id);
                                                        }}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>{t('Delete')}</p></TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TooltipProvider>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}

const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

const YEARS = (() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        list.push(String(i));
    }
    return list;
})();

export default function Index() {
    const { t } = useTranslation();
    const { timesheets, hasHRM, hasTaskly, auth, users, projects, selectedMonth, selectedYear, selectedUser } = usePage<TimesheetIndexProps>().props;

    const [modalState, setModalState] = useState<TimesheetModalState>({
        isOpen: false,
        mode: '',
        data: null
    });

    const [viewingItem, setViewingItem] = useState<Timesheet | null>(null);

    const [month, setMonth] = useState(selectedMonth || String(new Date().getMonth() + 1).padStart(2, '0'));
    const [year, setYear] = useState(selectedYear || String(new Date().getFullYear()));
    const [userId, setUserId] = useState(selectedUser || '');

    const daysInMonth = useMemo(() => {
        const d = new Date(parseInt(year, 10), parseInt(month, 10), 0);
        return d.getDate();
    }, [month, year]);

    const monthDays = useMemo(() => {
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, i);
            days.push(d);
        }
        return days;
    }, [daysInMonth, month, year]);

    const dayHeaders = useMemo(() => {
        return monthDays.map(d => {
            const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
            const dateStr = formatLocalDate(d);
            const dayNum = d.getDate();
            return {
                date: dateStr,
                dayName,
                dayNum,
                isToday: dateStr === formatLocalDate(new Date()),
                isFuture: d > new Date(),
            };
        });
    }, [monthDays]);

    const allUniqueUsers = useMemo(() => {
        const list: Array<{ id: number; name: string; email: string; avatar?: string }> = [];
        const data = timesheets || [];
        data.forEach(t => {
            if (t.user && !list.some(u => u.id === t.user.id)) {
                list.push(t.user);
            }
        });
        return list;
    }, [timesheets]);

    const userRows = useMemo(() => {
        const data = timesheets || [];
        return allUniqueUsers.map(user => {
            let totalHoursMonth = 0;
            let totalMinutesMonth = 0;

            const days = dayHeaders.map(hdr => {
                const dateStr = hdr.date;
                const entries = data.filter(t => {
                    const tDate = t.date ? getLocalDateString(t.date) : '';
                    const userId = t.user?.id || t.user_id;
                    return userId === user.id && tDate === dateStr;
                });
                const entryCount = entries.length;

                let totalHours = 0;
                let totalMinutes = 0;
                entries.forEach(e => {
                    totalHours += Number(e.hours) || 0;
                    totalMinutes += Number(e.minutes) || 0;
                });
                totalHoursMonth += totalHours;
                totalMinutesMonth += totalMinutes;

                const displayHours = totalHours + Math.floor(totalMinutes / 60);
                const displayMinutes = totalMinutes % 60;

                let cellStatus: 'timesheet' | 'empty' = 'empty';

                if (entryCount > 0) {
                    cellStatus = 'timesheet';
                }

                return {
                    date: dateStr,
                    entries,
                    entryCount,
                    totalHours: displayHours,
                    totalMinutes: displayMinutes,
                    status: cellStatus,
                    isToday: hdr.isToday,
                    isFuture: hdr.isFuture
                };
            });

            const displayTotalHours = totalHoursMonth + Math.floor(totalMinutesMonth / 60);
            const displayTotalMinutes = totalMinutesMonth % 60;

            return {
                id: user.id,
                name: user.name,
                avatar: (user as any).avatar,
                email: (user as any).email,
                days,
                totalHoursMonth: displayTotalHours,
                totalMinutesMonth: displayTotalMinutes
            };
        });
    }, [allUniqueUsers, timesheets, dayHeaders]);

    const dailyTotals = useMemo(() => {
        return dayHeaders.map(hdr => {
            const dateStr = hdr.date;
            const entries = (timesheets || []).filter(t => {
                const tDate = t.date ? getLocalDateString(t.date) : '';
                return tDate === dateStr;
            });
            let totalHours = 0;
            let totalMinutes = 0;
            entries.forEach(e => {
                totalHours += Number(e.hours) || 0;
                totalMinutes += Number(e.minutes) || 0;
            });
            const displayHours = totalHours + Math.floor(totalMinutes / 60);
            const displayMinutes = totalMinutes % 60;
            return {
                date: dateStr,
                hours: displayHours,
                minutes: displayMinutes,
                hasData: entries.length > 0
            };
        });
    }, [dayHeaders, timesheets]);



    const { deleteState, openDeleteDialog, closeDeleteDialog, confirmDelete } = useDeleteHandler({
        routeName: 'timesheet.destroy',
        defaultMessage: t('Are you sure you want to delete this timesheet?')
    });

    const handleFilterChange = (newMonth: string, newYear: string, newUserId: string) => {
        setMonth(newMonth);
        setYear(newYear);
        setUserId(newUserId);

        const params: any = {
            month: newMonth,
            year: newYear
        };
        if (newUserId) {
            params.user_id = newUserId;
        }

        router.get(route('timesheet.index'), params, { preserveState: false });
    };

    const handlePrevMonth = () => {
        let m = parseInt(month, 10) - 1;
        let y = parseInt(year, 10);
        if (m < 1) {
            m = 12;
            y -= 1;
        }
        handleFilterChange(String(m).padStart(2, '0'), String(y), userId);
    };

    const handleNextMonth = () => {
        let m = parseInt(month, 10) + 1;
        let y = parseInt(year, 10);
        if (m > 12) {
            m = 1;
            y += 1;
        }
        handleFilterChange(String(m).padStart(2, '0'), String(y), userId);
    };


    const openModal = (mode: 'add' | 'edit', data: Timesheet | null = null) => {
        let normalizedData = data;
        if (mode === 'edit' && data && data.date) {
            const dateOnly = getLocalDateString(data.date);
            normalizedData = {
                ...data,
                date: `${dateOnly}T12:00:00`
            };
        }
        setModalState({ isOpen: true, mode, data: normalizedData });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: '', data: null });
    };

    const monthLabel = MONTHS.find(m => m.value === month)?.label || '';

    return (
        <AuthenticatedLayout
            breadcrumbs={[{ label: t('Timesheet') }]}
            pageTitle={t('Manage Timesheet')}
            pageDescription={t('Track and log hours spent on various projects, tasks, or activities.')}
            pageActions={
                <div className="flex flex-wrap gap-2">
                    {auth.user?.permissions?.includes('create-timesheet') && (
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button size="sm" onClick={() => openModal('add')}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('Create')}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            }
        >
            <Head title={t('Timesheet')} />
            {/* Monthly Navigator Card */}
            <Card className="border-none">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">

                        <div className="flex flex-wrap items-center gap-2">
                            {((auth.user?.permissions?.includes('manage-any-timesheet') || auth.user?.permissions?.includes('manage-any-users') || auth.user?.permissions?.includes('manage-own-users'))) && users?.length > 0 && (
                                <Select value={userId || 'all'} onValueChange={(value) => handleFilterChange(month, year, value === 'all' ? '' : value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder={t('All Users')} />
                                    </SelectTrigger>
                                    <SelectContent searchable={true}>
                                        <SelectItem value="all">{t('All Users')}</SelectItem>
                                        {users?.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            <Select
                                value={month}
                                onValueChange={(val) => handleFilterChange(val, year, userId)}
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder={t('Month')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{t(m.label)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={year}
                                onValueChange={(val) => handleFilterChange(month, val, userId)}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder={t('Year')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEARS.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin border rounded-md scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                        <div className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 border-b border-gray-200 capitalize tracking-tight">
                            <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 font-bold text-gray-900 px-3 py-3 text-xs text-center w-full">
                                <div className="flex items-center justify-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePrevMonth}
                                        className="px-2 rounded-r-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {t(monthLabel)} {year}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleNextMonth}
                                        className="px-2 rounded-l-none"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Table className="border-collapse min-w-max">
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 border-b border-gray-100 capitalize tracking-tight">
                                    <TableHead className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-800 min-w-[140px] max-w-[140px] md:min-w-[170px] md:max-w-[170px] border-r border-gray-200 dark:border-gray-700 font-bold text-gray-900 px-2 md:px-3 py-3 text-xs">
                                        {t('Employees')}
                                    </TableHead>
                                    {dayHeaders.map((header) => (
                                        <TableHead
                                            key={header.date}
                                            className="text-center px-1 py-2 font-medium min-w-[38px] w-[38px] border-b border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{header.dayNum}</div>
                                            <div className="text-[10px] text-gray-400 font-bold">{header.dayName}</div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center px-2 py-1.5 min-w-[70px] w-[70px] text-[10px] font-bold tracking-wider text-primary dark:text-primary-400 border-l border-gray-200 dark:border-zinc-800">
                                        {t('Total')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                {userRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={daysInMonth + 2} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-gray-300 dark:text-zinc-700" />
                                                </div>
                                                <p className="text-sm text-gray-400 dark:text-zinc-500">{t('No timesheets found.')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    userRows.map((userRow) => (
                                        <TableRow key={userRow.id} className="group hover:bg-gray-50/60 dark:hover:bg-zinc-900/30 transition-colors">
                                            {/* Sticky User info */}
                                            <TableCell className="sticky left-0 z-10 bg-white dark:bg-zinc-950 group-hover:bg-gray-50 dark:group-hover:bg-zinc-900 min-w-[140px] max-w-[140px] md:min-w-[170px] md:max-w-[170px] px-2 md:px-3 py-2 border-r border-gray-200 dark:border-zinc-800 transition-colors">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center shrink-0">
                                                        {userRow?.avatar ? (
                                                            <img src={getImagePath(userRow.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col text-left min-w-0 flex-1">
                                                        <span className="font-medium text-[11px] md:text-sm text-gray-900 dark:text-gray-100 truncate">{userRow?.name || '-'}</span>
                                                        <span className="text-[10px] md:text-xs text-muted-foreground truncate">{userRow?.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {/* Day Cells */}
                                            {userRow.days.map((cell) => (
                                                <TableCell key={cell.date} className="p-1 text-center border-r border-gray-200 dark:border-zinc-800">
                                                    <MonthDayCell
                                                        cell={cell}
                                                        user={userRow}
                                                        openModal={openModal}
                                                        openDeleteDialog={openDeleteDialog}
                                                        openViewModal={setViewingItem}
                                                        auth={auth}
                                                        t={t}
                                                    />
                                                </TableCell>
                                            ))}
                                            {/* Row Total */}
                                            <TableCell className="px-2 py-1.5 text-center min-w-[70px] w-[70px] bg-gray-50/10 dark:bg-zinc-900/10 border-l border-gray-200 dark:border-zinc-800">
                                                <div className="flex flex-col items-center justify-center leading-tight">
                                                    <span className={`text-[11px] font-bold tabular-nums ${userRow.totalHoursMonth > 0 || userRow.totalMinutesMonth > 0 ? 'text-primary' : 'text-gray-300 dark:text-zinc-800'}`}>
                                                        {userRow.totalHoursMonth}h
                                                    </span>
                                                    {(userRow.totalMinutesMonth > 0 || userRow.totalHoursMonth > 0) && (
                                                        <span className={`text-[9px] font-medium tabular-nums ${userRow.totalHoursMonth > 0 || userRow.totalMinutesMonth > 0 ? 'text-gray-500 dark:text-zinc-400' : 'text-gray-300 dark:text-zinc-850'} mt-0.5`}>
                                                            {userRow.totalMinutesMonth}m
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}

                                {/* Daily Total Row */}
                                {userRows.length > 0 && (
                                    <TableRow className="bg-gray-50/40 dark:bg-zinc-900/10 border-t-2 border-gray-200 dark:border-zinc-800 font-semibold">
                                        <TableCell className="sticky left-0 z-10 bg-gray-50 dark:bg-zinc-900 min-w-[140px] max-w-[140px] md:min-w-[170px] md:max-w-[170px] px-2 md:px-3 py-2 border-r border-gray-200 dark:border-zinc-800">
                                            <span className="text-[11px] md:text-xs font-bold text-gray-700 dark:text-zinc-300">
                                                {t('Daily Total')}
                                            </span>
                                        </TableCell>
                                        {dailyTotals.map((tot) => (
                                            <TableCell key={tot.date} className="p-1 text-center border-r border-gray-200 dark:border-zinc-800 text-xs tabular-nums text-gray-700 dark:text-zinc-300">
                                                {tot.hasData ? (
                                                    <div className="flex flex-col items-center justify-center leading-tight">
                                                        <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 tabular-nums">
                                                            {tot.hours}h
                                                        </span>
                                                        {tot.minutes > 0 && (
                                                            <span className="text-[9px] text-gray-500 dark:text-zinc-400 font-medium tabular-nums mt-0.5">
                                                                {tot.minutes}m
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '—'}
                                            </TableCell>
                                        ))}
                                        <TableCell className="px-2 py-1.5 text-center min-w-[70px] w-[70px] border-l border-gray-200 dark:border-zinc-800 text-xs font-bold text-primary dark:text-primary-400">
                                            {/* Total of the entire month across all users */}
                                            {(() => {
                                                let grandHours = 0;
                                                let grandMinutes = 0;
                                                userRows.forEach(r => {
                                                    grandHours += r.totalHoursMonth;
                                                    grandMinutes += r.totalMinutesMonth;
                                                });
                                                const displayGrandHours = grandHours + Math.floor(grandMinutes / 60);
                                                const displayGrandMinutes = grandMinutes % 60;
                                                return displayGrandHours > 0 || displayGrandMinutes > 0 ? (
                                                    <div className="flex flex-col items-center justify-center leading-tight">
                                                        <span className="text-[11px] font-bold text-primary dark:text-primary-400 tabular-nums">
                                                            {displayGrandHours}h
                                                        </span>
                                                        {displayGrandMinutes > 0 && (
                                                            <span className="text-[9px] text-primary/75 dark:text-primary-400/75 font-medium tabular-nums mt-0.5">
                                                                {displayGrandMinutes}m
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '—';
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

            </Card>

            <ConfirmationDialog
                open={deleteState.isOpen}
                onOpenChange={closeDeleteDialog}
                title={t('Delete Timesheet')}
                message={deleteState.message}
                confirmText={t('Delete')}
                onConfirm={confirmDelete}
                variant="destructive"
            />



            {/* Timesheet Modal */}
            <Dialog open={modalState.isOpen} onOpenChange={closeModal}>
                {modalState.mode === 'add' && (
                    <Create
                        onSuccess={closeModal}
                        users={users || []}
                        projects={projects || []}
                        hasHRM={hasHRM}
                        hasTaskly={hasTaskly}
                    />
                )}
                {modalState.mode === 'edit' && modalState.data && (
                    <EditTimesheet
                        timesheet={modalState.data}
                        onSuccess={closeModal}
                        users={users || []}
                        projects={projects || []}
                        hasHRM={hasHRM}
                        hasTaskly={hasTaskly}
                    />
                )}
            </Dialog>

            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                {viewingItem && <View timesheet={viewingItem} />}
            </Dialog>
        </AuthenticatedLayout>
    );
}
