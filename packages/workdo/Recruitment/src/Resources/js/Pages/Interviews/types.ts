import { PaginatedData, ModalState, AuthContext } from '@/types/common';

export interface Candidate {
    id: number;
    name: string;
}

export interface JobPosting {
    id: number;
    name: string;
    title?: string;
}

export interface InterviewRound {
    id: number;
    name: string;
}

export interface InterviewType {
    id: number;
    name: string;
}

export interface Interview {
    id: number;
    scheduled_date: any;
    scheduled_time: any;
    duration?: number;
    location?: string;
    meeting_link?: any;
    interviewer_ids?: string[];
    interviewer_names?: string;
    status: any;
    feedback_submitted?: any;
    candidate_id?: number;
    candidate?: { id: number; first_name: string; last_name: string };
    job_id?: number;
    jobPosting?: JobPosting & { location?: { remote_work?: boolean } };
    round_id?: number;
    interview_round?: InterviewRound;
    interview_type_id?: number;
    interview_type?: InterviewType;
    interviewers?: Array<{ id: number; name: string; avatar?: string }>;
    created_at: string;
}

export interface SelectedDateSummary {
    date: string;
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    no_show: number;
    pending_feedback: number;
}

export interface UpcomingInterview {
    id: number;
    scheduled_date: string;
    scheduled_time: string;
    duration?: number;
    location?: string;
    meeting_link?: string;
    candidate_name: string;
    candidate_id?: number;
    round_name?: string;
    type_name?: string;
}

export interface CreateInterviewFormData {
    scheduled_date: any;
    scheduled_time: any;
    duration: string;
    location: string;
    meeting_link: any;
    interviewer_ids: string[];
    status: boolean;
    feedback_submitted: boolean;
    candidate_id: string;
    job_id: string;
    round_id: string;
    interview_type_id: string;
    sync_to_google_calendar: boolean;
    sync_to_outlook_calendar: boolean;
}

export interface EditInterviewFormData {
    scheduled_date: any;
    scheduled_time: any;
    duration: string;
    location: string;
    meeting_link: any;
    interviewer_ids: string[];
    status: boolean;
    feedback_submitted: boolean;
    candidate_id: string;
    job_id: string;
    round_id: string;
    interview_type_id: string;
}

export interface InterviewFilters {
    search: string;
    candidate_id?: string;
    selected_date: string;
    feedback: string;
    status: string;
    interview_type_id: string;
}

export type PaginatedInterviews = PaginatedData<Interview>;
export type InterviewModalState = ModalState<Interview>;

export interface InterviewSummary {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    no_show: number;
}

export interface InterviewsIndexProps {
    interviews: PaginatedInterviews;
    auth: AuthContext;
    candidates?: Candidate[];
    jobpostings?: any[];
    interviewrounds?: any[];
    interviewtypes: InterviewType[];
    upcomingInterviews: UpcomingInterview[];
    selectedDateSummary: SelectedDateSummary;
    summary: InterviewSummary;
    [key: string]: unknown;
}

export interface CreateInterviewProps {
    onSuccess: () => void;
}

export interface EditInterviewProps {
    interview: Interview;
    onSuccess: () => void;
}

export interface InterviewShowProps {
    interview: Interview;
    [key: string]: unknown;
}
