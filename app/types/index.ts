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
export type ViewType = 'overview' | 'personal' | 'machine' | 'capacity' | 'schedule' | 'settings';

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
