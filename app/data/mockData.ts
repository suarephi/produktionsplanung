import { WorkProcess, Machine, Employee, ProductionOrder, ScheduledTask, WorkProcessType } from '../types';

// Work Processes with colors
export const workProcesses: WorkProcess[] = [
  { id: 'ruesten', name: 'Rüsten', nameEn: 'Setup', color: '#6366f1', bgColor: 'bg-indigo-500' },
  { id: 'kabelschneiden', name: 'Kabelschneiden', nameEn: 'Cable Cutting', color: '#ec4899', bgColor: 'bg-pink-500' },
  { id: 'loeten', name: 'Löten', nameEn: 'Soldering', color: '#f59e0b', bgColor: 'bg-amber-500' },
  { id: 'umspritzen', name: 'Umspritzen', nameEn: 'Overmolding', color: '#10b981', bgColor: 'bg-emerald-500' },
  { id: 'nacharbeit', name: 'Nacharbeit', nameEn: 'Rework', color: '#ef4444', bgColor: 'bg-red-500' },
  { id: 'qs', name: 'QS', nameEn: 'Quality Control', color: '#8b5cf6', bgColor: 'bg-violet-500' },
  { id: 'versand', name: 'Versand', nameEn: 'Shipping', color: '#06b6d4', bgColor: 'bg-cyan-500' },
];

// Machines by process type
export const machines: Machine[] = [
  // Cable Cutting
  { id: 'komax-1', name: 'Komax 1', processType: 'kabelschneiden' },
  { id: 'komax-2', name: 'Komax 2', processType: 'kabelschneiden' },
  // Soldering
  { id: 'station-1', name: 'Station 1', processType: 'loeten' },
  { id: 'station-2', name: 'Station 2', processType: 'loeten' },
  { id: 'station-3', name: 'Station 3', processType: 'loeten' },
  { id: 'station-4', name: 'Station 4', processType: 'loeten' },
  { id: 'station-5', name: 'Station 5', processType: 'loeten' },
  // Overmolding
  { id: 'boy-25e', name: 'Boy 25 E', processType: 'umspritzen' },
  { id: 'babyplast-1', name: 'Babyplast 1', processType: 'umspritzen' },
  { id: 'babyplast-2', name: 'Babyplast 2', processType: 'umspritzen' },
  { id: 'tm6', name: 'TM6', processType: 'umspritzen' },
  { id: 'dm', name: 'DM', processType: 'umspritzen' },
];

// Employees
export const employees: Employee[] = [
  { id: 'tante', name: 'Tante', skills: ['ruesten', 'nacharbeit'] },
  { id: 'my', name: 'My', skills: ['ruesten', 'nacharbeit'] },
  { id: 'panata', name: 'Panata', skills: ['ruesten', 'nacharbeit'] },
  { id: 'tamara', name: 'Tamara', skills: ['kabelschneiden', 'loeten'], defaultMachine: 'komax-1' },
  { id: 'eliza', name: 'Eliza', skills: ['kabelschneiden'], defaultMachine: 'komax-2' },
  { id: 'maria', name: 'Maria', skills: ['loeten'], defaultMachine: 'station-1' },
  { id: 'isabella', name: 'Isabella', skills: ['loeten'], defaultMachine: 'station-2' },
  { id: 'jasminka', name: 'Jasminka', skills: ['loeten'], defaultMachine: 'station-4' },
  { id: 'wendy', name: 'Wendy', skills: ['loeten'], defaultMachine: 'station-5' },
  { id: 'thuy-b', name: 'Thuy B', skills: ['umspritzen'], defaultMachine: 'boy-25e' },
  { id: 'thuy-l', name: 'Thuy L', skills: ['umspritzen'], defaultMachine: 'babyplast-1' },
  { id: 'anna', name: 'Anna', skills: ['umspritzen'], defaultMachine: 'tm6' },
  { id: 'rolf', name: 'Rolf', skills: ['umspritzen'], defaultMachine: 'babyplast-2' },
  { id: 'kosta', name: 'Kosta', skills: ['umspritzen'], defaultMachine: 'dm' },
  { id: 'sarah', name: 'Sarah', skills: ['qs'] },
  { id: 'monique', name: 'Monique', skills: ['qs'] },
  { id: 'dandan', name: 'Dandan', skills: ['versand'] },
];

// Order colors for visual distinction
const orderColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

// Production Orders
export const productionOrders: ProductionOrder[] = [
  { id: 'FAF0001', name: 'FAF0001', status: 'in_progress', color: orderColors[0] },
  { id: 'FAF0002', name: 'FAF0002', status: 'in_progress', color: orderColors[1] },
  { id: 'FAF0003', name: 'FAF0003', status: 'in_progress', color: orderColors[2] },
  { id: 'FAF0004', name: 'FAF0004', status: 'planned', color: orderColors[3] },
  { id: 'FAF0005', name: 'FAF0005', status: 'in_progress', color: orderColors[4] },
  { id: 'FAF0006', name: 'FAF0006', status: 'in_progress', color: orderColors[5] },
  { id: 'FAF0007', name: 'FAF0007', status: 'in_progress', color: orderColors[6] },
  { id: 'FAF0008', name: 'FAF0008', status: 'planned', color: orderColors[7] },
  { id: 'FAF0009', name: 'FAF0009', status: 'in_progress', color: orderColors[8] },
];

// Helper to generate dates
const getDateString = (offset: number): string => {
  const date = new Date(2024, 7, 11 + offset); // August 11, 2024
  return date.toISOString().split('T')[0];
};

// Scheduled Tasks based on the mockup
export const scheduledTasks: ScheduledTask[] = [
  // Rüsten (Setup)
  { id: 'task-1', orderId: 'FAF0001', processType: 'ruesten', employeeId: 'tante', date: getDateString(0), duration: 8, durationDays: 1 },

  // Kabelschneiden (Cable Cutting)
  { id: 'task-2', orderId: 'FAF0002', processType: 'kabelschneiden', employeeId: 'tamara', machineId: 'komax-1', date: getDateString(0), duration: 8, durationDays: 1 },
  { id: 'task-3', orderId: 'FAF0007', processType: 'kabelschneiden', employeeId: 'tamara', machineId: 'komax-1', date: getDateString(1), duration: 8, durationDays: 2 },
  { id: 'task-4', orderId: 'FAF0005', processType: 'kabelschneiden', employeeId: 'eliza', machineId: 'komax-2', date: getDateString(1), duration: 8, durationDays: 1 },
  { id: 'task-5', orderId: 'FAF0009', processType: 'kabelschneiden', employeeId: 'tamara', machineId: 'komax-1', date: getDateString(7), duration: 8, durationDays: 1 },

  // Löten (Soldering)
  { id: 'task-6', orderId: 'FAF0007', processType: 'loeten', employeeId: 'maria', machineId: 'station-1', date: getDateString(3), duration: 8, durationDays: 2 },
  { id: 'task-7', orderId: 'FAF0006', processType: 'loeten', employeeId: 'isabella', machineId: 'station-2', date: getDateString(1), duration: 8, durationDays: 1 },
  { id: 'task-8', orderId: 'FAF0005', processType: 'loeten', employeeId: 'isabella', machineId: 'station-2', date: getDateString(3), duration: 8, durationDays: 3 },
  { id: 'task-9', orderId: 'FAF0002', processType: 'loeten', employeeId: 'tamara', machineId: 'station-3', date: getDateString(0), duration: 8, durationDays: 1 },
  { id: 'task-10', orderId: 'FAF0003', processType: 'loeten', employeeId: 'jasminka', machineId: 'station-4', date: getDateString(0), duration: 8, durationDays: 2 },
  { id: 'task-11', orderId: 'FAF0009', processType: 'loeten', employeeId: 'tamara', machineId: 'station-3', date: getDateString(7), duration: 8, durationDays: 1 },

  // Umspritzen (Overmolding)
  { id: 'task-12', orderId: 'FAF0001', processType: 'umspritzen', employeeId: 'thuy-b', machineId: 'boy-25e', date: getDateString(2), duration: 8, durationDays: 3 },
  { id: 'task-13', orderId: 'FAF0003', processType: 'umspritzen', employeeId: 'thuy-l', machineId: 'babyplast-1', date: getDateString(3), duration: 8, durationDays: 2 },
  { id: 'task-14', orderId: 'FAF0002', processType: 'umspritzen', employeeId: 'anna', machineId: 'tm6', date: getDateString(2), duration: 8, durationDays: 1 },
  { id: 'task-15', orderId: 'FAF0006', processType: 'umspritzen', employeeId: 'anna', machineId: 'tm6', date: getDateString(3), duration: 8, durationDays: 1 },
  { id: 'task-16', orderId: 'FAF0005', processType: 'umspritzen', employeeId: 'rolf', machineId: 'babyplast-2', date: getDateString(7), duration: 8, durationDays: 1 },
  { id: 'task-17', orderId: 'FAF0007', processType: 'umspritzen', employeeId: 'kosta', machineId: 'dm', date: getDateString(4), duration: 8, durationDays: 2 },
  { id: 'task-18', orderId: 'FAF0009', processType: 'umspritzen', employeeId: 'anna', machineId: 'tm6', date: getDateString(8), duration: 8, durationDays: 1 },

  // Nacharbeit (Rework)
  { id: 'task-19', orderId: 'FAF0002', processType: 'nacharbeit', employeeId: 'tante', date: getDateString(3), duration: 8, durationDays: 1 },
  { id: 'task-20', orderId: 'FAF0009', processType: 'nacharbeit', employeeId: 'panata', date: getDateString(9), duration: 8, durationDays: 1 },

  // QS (Quality Control)
  { id: 'task-21', orderId: 'FAF0001', processType: 'qs', employeeId: 'sarah', date: getDateString(9), duration: 4, durationDays: 1 },
  { id: 'task-22', orderId: 'FAF0003', processType: 'qs', employeeId: 'sarah', date: getDateString(3), duration: 4, durationDays: 1 },
  { id: 'task-23', orderId: 'FAF0006', processType: 'qs', employeeId: 'sarah', date: getDateString(7), duration: 4, durationDays: 1 },
  { id: 'task-24', orderId: 'FAF0007', processType: 'qs', employeeId: 'monique', date: getDateString(7), duration: 4, durationDays: 1 },

  // Versand (Shipping)
  { id: 'task-25', orderId: 'FAF0009', processType: 'versand', employeeId: 'dandan', date: getDateString(11), duration: 4, durationDays: 1 },
];

// Get process by ID
export function getProcessById(id: WorkProcessType): WorkProcess | undefined {
  return workProcesses.find(p => p.id === id);
}

// Get employee by ID
export function getEmployeeById(id: string): Employee | undefined {
  return employees.find(e => e.id === id);
}

// Get machine by ID
export function getMachineById(id: string): Machine | undefined {
  return machines.find(m => m.id === id);
}

// Get order by ID
export function getOrderById(id: string): ProductionOrder | undefined {
  return productionOrders.find(o => o.id === id);
}

// Get tasks for a specific date
export function getTasksForDate(date: string): ScheduledTask[] {
  return scheduledTasks.filter(t => t.date === date);
}

// Get tasks for an employee
export function getTasksForEmployee(employeeId: string): ScheduledTask[] {
  return scheduledTasks.filter(t => t.employeeId === employeeId);
}

// Get tasks for a machine
export function getTasksForMachine(machineId: string): ScheduledTask[] {
  return scheduledTasks.filter(t => t.machineId === machineId);
}

// Get tasks for a process type
export function getTasksForProcess(processType: WorkProcessType): ScheduledTask[] {
  return scheduledTasks.filter(t => t.processType === processType);
}
