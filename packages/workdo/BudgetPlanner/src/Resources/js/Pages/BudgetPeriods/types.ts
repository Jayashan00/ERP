import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface User {
    id: number;
    name: string;
}

export interface BudgetPeriod {
    id: number;
    period_name: string;
    financial_year: string;
    start_date: string;
    end_date: string;
    status: string;
    approved_by?: {
        name: string;
        avatar: string;
        email: string;
    };
    created_at: string;
}

export interface CreateBudgetPeriodFormData {
    period_name: string;
    financial_year: string;
    start_date: string;
    end_date: string;
}

export interface EditBudgetPeriodFormData {
    period_name: string;
    financial_year: string;
    start_date: string;
    end_date: string;
    status: string;
}

export interface BudgetPeriodFilters {
    period_name: string;
    financial_year: string;
    status: string;
    date_range: string;
}

export type PaginatedBudgetPeriods = PaginatedData<BudgetPeriod>;
export type BudgetPeriodModalState = ModalState<BudgetPeriod>;

export interface BudgetPeriodSummary {
    all: number;
    draft: number;
    approved: number;
    active: number;
    closed: number;
}

export interface BudgetPeriodsIndexProps {
    budgetperiods: PaginatedBudgetPeriods;
    summary?: BudgetPeriodSummary;
    auth: AuthContext;
    [key: string]: unknown;
}

export interface CreateBudgetPeriodProps {
    onSuccess: () => void;
}

export interface EditBudgetPeriodProps {
    budgetperiod: BudgetPeriod;
    onSuccess: () => void;
}

export interface BudgetPeriodShowProps {
    budgetperiod: BudgetPeriod;
    [key: string]: unknown;
}