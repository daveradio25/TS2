// Supabase database types

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  hourly_rate?: number;
  is_active: boolean;
  manager_id?: string;
}

export interface Project {
  id: string;
  project_number: string;
  name: string;
  client_name: string;
  description?: string;
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  budget_hours?: number;
  is_active: boolean;
  project_manager_id?: string;
}

export interface StandardPhase {
  id: string;
  phase_code: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface Timesheet {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  total_hours: number;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
}

export interface TimeEntry {
  id: string;
  timesheet_id: string;
  date: string;
  hours: number;
  description?: string;
  project_id?: string;
  overhead_category_id?: string;
  phase_id?: string;
  
  // Optional joined data
  projects?: Project;
  phases?: StandardPhase;
}

export interface OverheadCategory {
  id: string;
  category_code: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// Helper type for grouped time entries
export interface GroupedTimeEntries {
  [key: string]: {
    project: Project;
    phase: StandardPhase;
    entries: {
      [date: string]: TimeEntry;
    };
  };
}