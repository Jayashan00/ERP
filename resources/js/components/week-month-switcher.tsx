import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface WeekMonthSwitcherProps {
    mode: 'week' | 'month';
    value: string; // YYYY-MM-DD format
    onChange: (dateStr: string, year: number, month: number) => void;
}

const parseDateSafe = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day || 1, 12, 0, 0, 0);
};

const toDateStrSafe = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getWeekStart = (d: Date): Date => {
    const res = new Date(d);
    const dow = res.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    res.setDate(res.getDate() + diff);
    return res;
};

const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekMonthSwitcher({ mode, value, onChange }: WeekMonthSwitcherProps) {
    const { t } = useTranslation();
    const todayStr = toDateStrSafe(new Date());

    const [weekStart, setWeekStart] = useState<Date>(() => {
        const initialDate = value ? parseDateSafe(value) : new Date();
        return getWeekStart(initialDate);
    });

    const [currentYear, setCurrentYear] = useState<number>(() => {
        const initialDate = value ? parseDateSafe(value) : new Date();
        return initialDate.getFullYear();
    });

    const [currentMonth, setCurrentMonth] = useState<number>(() => {
        const initialDate = value ? parseDateSafe(value) : new Date();
        return initialDate.getMonth();
    });

    // Sync local navigation states when value changes from outside
    useEffect(() => {
        if (value) {
            const parsed = parseDateSafe(value);
            setWeekStart(getWeekStart(parsed));
            setCurrentYear(parsed.getFullYear());
            setCurrentMonth(parsed.getMonth());
        }
    }, [value]);

    const selectedDate = value ? parseDateSafe(value) : new Date();
    const selectedDateStr = toDateStrSafe(selectedDate);

    // --- WEEK MODE HANDLERS ---
    const handleWeekChange = (daysOffset: number) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + daysOffset);
        setWeekStart(d);
        const newDateStr = toDateStrSafe(d);
        const parsed = parseDateSafe(newDateStr);
        onChange(newDateStr, parsed.getFullYear(), parsed.getMonth());
    };

    const handleMonthChange = (monthOffset: number) => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + monthOffset);
        const newDateStr = toDateStrSafe(d);
        const newWeekStart = getWeekStart(d);
        setWeekStart(newWeekStart);
        onChange(newDateStr, d.getFullYear(), d.getMonth());
    };

    const handleDayClick = (dayDate: Date) => {
        const newDateStr = toDateStrSafe(dayDate);
        onChange(newDateStr, dayDate.getFullYear(), dayDate.getMonth());
    };

    // --- MONTH MODE HANDLERS ---
    const handleYearChange = (yearOffset: number) => {
        const d = new Date(selectedDate);
        d.setFullYear(d.getFullYear() + yearOffset);
        const newDateStr = toDateStrSafe(d);
        onChange(newDateStr, d.getFullYear(), d.getMonth());
    };

    const handleSideMonthChange = (monthOffset: number) => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + monthOffset);
        const newDateStr = toDateStrSafe(d);
        onChange(newDateStr, d.getFullYear(), d.getMonth());
    };

    const handleMonthClick = (monthIdx: number) => {
        const d = new Date(selectedDate);
        d.setMonth(monthIdx);
        const newDateStr = toDateStrSafe(d);
        onChange(newDateStr, d.getFullYear(), d.getMonth());
    };

    if (mode === 'week') {
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        });
        const monthLabel = weekDays[3].toLocaleString('default', { month: 'long', year: 'numeric' });

        return (
            <Card className="mb-6 border border-gray-300 dark:border-zinc-700 shadow-sm overflow-hidden bg-card">
                {/* Header Row */}
                <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4 border-b border-gray-250 dark:border-zinc-800">
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleMonthChange(-1)}
                        className="h-8 w-8 rounded-full border border-gray-250 dark:border-zinc-800 hover:bg-muted"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 select-none">
                        <span className="font-semibold text-foreground">
                            {monthLabel}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => handleMonthChange(1)}
                        className="h-8 w-8 rounded-full border border-gray-250 dark:border-zinc-800 hover:bg-muted"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Main Row */}
                <div className="flex items-center border-t border-gray-250 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={() => handleWeekChange(-7)}
                        className="h-16 px-4 flex items-center justify-center border-r border-gray-250 dark:border-zinc-800 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex-1 overflow-x-auto scrollbar-none min-w-0">
                        <div className="grid grid-cols-7 min-w-[760px] md:min-w-0">
                            {weekDays.map((day, i) => {
                                const ds = toDateStrSafe(day);
                                const isToday = ds === todayStr;
                                const isSelected = ds === selectedDateStr;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleDayClick(day)}
                                        className={`h-16 flex flex-col items-center justify-center border-r border-gray-250 dark:border-zinc-800 transition-all last:border-r-0 ${isSelected
                                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm border-r-primary'
                                            : 'bg-background hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <span className={`text-[10px] tracking-wider mb-1 font-semibold ${isSelected ? 'text-primary-foreground/95' : 'text-gray-700 dark:text-zinc-300'}`}>
                                            {t(dayNames[i])}
                                        </span>
                                        <span className="text-sm font-bold">
                                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${isSelected
                                                ? 'bg-primary text-primary-foreground/95'
                                                : isToday
                                                    ? 'bg-primary/10 dark:text-primary font-bold'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {day.getDate()}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleWeekChange(7)}
                        className="h-16 px-4 flex items-center justify-center border-l border-gray-250 dark:border-zinc-800 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </Card>
        );
    }

    // Mode is 'month'
    return (
        <Card className="mb-6 border border-gray-300 dark:border-zinc-700 shadow-sm overflow-hidden bg-card">
            {/* Header Row */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-250 dark:border-zinc-800">
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => handleYearChange(-1)}
                    className="h-8 w-8 rounded-full border border-gray-250 dark:border-zinc-800 hover:bg-muted"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 select-none">
                    <span className="font-semibold text-foreground">
                        {t(months[currentMonth])} {currentYear}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => handleYearChange(1)}
                    className="h-8 w-8 rounded-full border border-gray-250 dark:border-zinc-800 hover:bg-muted"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Months Grid Row */}
            <div className="flex items-center border-t border-gray-250 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => handleSideMonthChange(-1)}
                    className="h-16 px-4 flex items-center justify-center border-r border-gray-250 dark:border-zinc-800 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex-1 overflow-x-auto scrollbar-none min-w-0">
                    <div className="grid grid-cols-12 min-w-[760px] md:min-w-0">
                        {months.map((monthName, idx) => {
                            const isSelected = currentMonth === idx;
                            const monthNumber = String(idx + 1).padStart(2, '0');

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleMonthClick(idx)}
                                    className={`h-16 flex flex-col items-center justify-center border-r border-gray-250 dark:border-zinc-800 transition-all last:border-r-0 ${isSelected
                                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm border-r-primary'
                                        : 'bg-background hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <span className={`text-[10px] tracking-wider mb-1 font-semibold ${isSelected ? 'text-primary-foreground/95' : 'text-gray-700 dark:text-zinc-300'}`}>
                                        {t(monthName)}
                                    </span>
                                    <span className="text-sm font-bold">
                                        {monthNumber}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleSideMonthChange(1)}
                    className="h-16 px-4 flex items-center justify-center border-l border-gray-250 dark:border-zinc-800 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </Card>
    );
}
