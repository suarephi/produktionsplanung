// Work Process Types
export type WorkProcessType =
  | 'ruesten'      // Setup
  | 'kabelschneiden' // Cable Cutting
  | 'loeten'       // Soldering
  | 'umspritzen'   // Overmolding
  | 'nacharbeit'   // Rework
  | 'qs'           // Quality Assurance
  | 'versand';     // Shipping

export interface WorkProcess {
  id: WorkProcessType;
  name: string;
  nameEn: string;
  color: string;
  bgColor: string;
}

// Machine Types
export interface Machine {
  id: string;
  name: string;
  processType: WorkProcessType;
}

// Employee
export interface Employee {
  id: string;
  name: string;
  skills: WorkProcessType[];
  defaultMachine?: string;
}

// Production Order
export interface ProductionOrder {
  id: string;
  name: string;
  status: 'planned' | 'in_progress' | 'completed';
  color: string;
}

// Scheduled Task - links order to employee/machine/date
export interface ScheduledTask {
  id: string;
  orderId: string;
  processType: WorkProcessType;
  employeeId: string;
  machineId?: string;
  date: string; // ISO date string (start date)
  duration: number; // in hours per day
  durationDays: number; // number of days the task spans
  startHour?: number; // 0-23
}

// View Types
export type ViewType = 'overview' | 'personal' | 'machine' | 'capacity' | 'schedule' | 'settings' | 'crm' | 'crm-contacts' | 'crm-meetings' | 'crm-tasks';

// CRM Types
export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  tags: string[];
  notes: string;
  createdAt: string;
  lastInteraction?: string;
}

export interface CRMInteraction {
  id: string;
  contactId: string;
  type: 'meeting' | 'call' | 'email' | 'note';
  date: string;
  summary: string;
  details?: string;
}

export interface CRMMeeting {
  id: string;
  title: string;
  date: string;
  duration: number; // minutes
  attendeeIds: string[];
  transcript?: string;
  summary?: string;
  actionItems: string[];
  topics: string[];
  calendarEventId?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface CRMTask {
  id: string;
  title: string;
  description?: string;
  contactId?: string;
  meetingId?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
}

export interface AIRecommendation {
  contactId: string;
  reason: string;
  priority: number; // 1-10
  suggestedAction: string;
  basedOn: 'time_gap' | 'meeting_topic' | 'task_pending';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  description?: string;
}

// Date Range
export interface DateRange {
  start: Date;
  end: Date;
}

// Diagram Settings
export interface DiagramSettings {
  cellWidth: number; // pixels
  rowHeight: number; // pixels
  showWeekends: boolean;
  compactMode: boolean;
}
