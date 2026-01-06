'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ViewType, ScheduledTask, ProductionOrder, DateRange, WorkProcessType, Machine, Employee, DiagramSettings } from '../types';
import {
  scheduledTasks as initialTasks,
  productionOrders as initialOrders,
  machines as initialMachines,
  employees as initialEmployees,
} from '../data/mockData';

interface ModalState {
  isOpen: boolean;
  task?: ScheduledTask;
  defaultDate?: string;
  defaultEmployeeId?: string;
  defaultProcessType?: WorkProcessType;
}

interface PlanningContextType {
  // View state
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Language
  language: 'de' | 'en';
  setLanguage: (lang: 'de' | 'en') => void;
  t: (key: string) => string;

  // Date range
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  // Diagram settings
  diagramSettings: DiagramSettings;
  updateDiagramSettings: (updates: Partial<DiagramSettings>) => void;

  // Tasks
  tasks: ScheduledTask[];
  addTask: (task: ScheduledTask) => void;
  updateTask: (taskId: string, updates: Partial<ScheduledTask>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, newDate: string, newEmployeeId?: string) => void;

  // Orders
  orders: ProductionOrder[];
  addOrder: (order: ProductionOrder) => void;
  updateOrder: (orderId: string, updates: Partial<ProductionOrder>) => void;
  deleteOrder: (orderId: string) => void;

  // Machines
  machines: Machine[];
  addMachine: (machine: Machine) => void;
  updateMachine: (machineId: string, updates: Partial<Machine>) => void;
  deleteMachine: (machineId: string) => void;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  deleteEmployee: (employeeId: string) => void;

  // Selection
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;

  // Modal
  modalState: ModalState;
  openTaskModal: (options?: Partial<ModalState>) => void;
  closeTaskModal: () => void;
}

const translations: Record<string, Record<string, string>> = {
  de: {
    'app.title': 'Produktionsplanungstool',
    'view.overview': 'Übersicht',
    'view.personal': 'Personalplan',
    'view.machine': 'Maschinenplan',
    'view.capacity': 'Kapazitäten',
    'view.schedule': 'Zeitplan',
    'view.settings': 'Einstellungen',
    'process.ruesten': 'Rüsten',
    'process.kabelschneiden': 'Kabelschneiden',
    'process.loeten': 'Löten',
    'process.umspritzen': 'Umspritzen',
    'process.nacharbeit': 'Nacharbeit',
    'process.qs': 'QS',
    'process.versand': 'Versand',
    'label.employee': 'Mitarbeiter',
    'label.machine': 'Maschine',
    'label.order': 'Fertigungsauftrag',
    'label.orders': 'Fertigungsaufträge',
    'label.date': 'Datum',
    'label.duration': 'Dauer',
    'label.days': 'Tage',
    'label.status': 'Status',
    'label.process': 'Arbeitsgang',
    'status.planned': 'Geplant',
    'status.in_progress': 'In Arbeit',
    'status.completed': 'Abgeschlossen',
    'action.add': 'Hinzufügen',
    'action.edit': 'Bearbeiten',
    'action.delete': 'Löschen',
    'action.save': 'Speichern',
    'action.cancel': 'Abbrechen',
    'label.today': 'Heute',
    'label.week': 'Woche',
    'label.month': 'Monat',
    'label.filter': 'Filter',
    'label.search': 'Suchen',
    'label.noTasks': 'Keine Aufgaben',
  },
  en: {
    'app.title': 'Production Planning Tool',
    'view.overview': 'Overview',
    'view.personal': 'Personnel Plan',
    'view.machine': 'Machine Plan',
    'view.capacity': 'Capacities',
    'view.schedule': 'Schedule',
    'view.settings': 'Settings',
    'process.ruesten': 'Setup',
    'process.kabelschneiden': 'Cable Cutting',
    'process.loeten': 'Soldering',
    'process.umspritzen': 'Overmolding',
    'process.nacharbeit': 'Rework',
    'process.qs': 'QC',
    'process.versand': 'Shipping',
    'label.employee': 'Employee',
    'label.machine': 'Machine',
    'label.order': 'Production Order',
    'label.orders': 'Production Orders',
    'label.date': 'Date',
    'label.duration': 'Duration',
    'label.days': 'Days',
    'label.status': 'Status',
    'label.process': 'Work Process',
    'status.planned': 'Planned',
    'status.in_progress': 'In Progress',
    'status.completed': 'Completed',
    'action.add': 'Add',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'label.today': 'Today',
    'label.week': 'Week',
    'label.month': 'Month',
    'label.filter': 'Filter',
    'label.search': 'Search',
    'label.noTasks': 'No tasks',
  },
};

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

const STORAGE_KEYS = {
  tasks: 'produktionsplanung_tasks',
  orders: 'produktionsplanung_orders',
  machines: 'produktionsplanung_machines',
  employees: 'produktionsplanung_employees',
  settings: 'produktionsplanung_settings',
};

const defaultDiagramSettings: DiagramSettings = {
  cellWidth: 80,
  rowHeight: 40,
  showWeekends: true,
  compactMode: false,
};

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [isHydrated, setIsHydrated] = useState(false);

  // Data states
  const [tasks, setTasks] = useState<ScheduledTask[]>(initialTasks);
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [diagramSettings, setDiagramSettings] = useState<DiagramSettings>(defaultDiagramSettings);

  // Selection states
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false });

  // Date range
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2024, 7, 11),
    end: new Date(2024, 7, 31),
  });

  // Load from localStorage
  useEffect(() => {
    const loadData = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>) => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setter(JSON.parse(saved) as T);
        } catch {
          console.error(`Failed to parse ${key}`);
        }
      }
    };

    loadData<ScheduledTask[]>(STORAGE_KEYS.tasks, setTasks);
    loadData<ProductionOrder[]>(STORAGE_KEYS.orders, setOrders);
    loadData<Machine[]>(STORAGE_KEYS.machines, setMachines);
    loadData<Employee[]>(STORAGE_KEYS.employees, setEmployees);
    loadData<DiagramSettings>(STORAGE_KEYS.settings, setDiagramSettings);

    setIsHydrated(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
    }
  }, [tasks, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    }
  }, [orders, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.machines, JSON.stringify(machines));
    }
  }, [machines, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.employees, JSON.stringify(employees));
    }
  }, [employees, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(diagramSettings));
    }
  }, [diagramSettings, isHydrated]);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  // Task operations
  const addTask = useCallback((task: ScheduledTask) => {
    setTasks(prev => [...prev, { ...task, durationDays: task.durationDays || 1 }]);
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<ScheduledTask>) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const moveTask = useCallback((taskId: string, newDate: string, newEmployeeId?: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, date: newDate, ...(newEmployeeId && { employeeId: newEmployeeId }) }
        : task
    ));
  }, []);

  // Order operations
  const addOrder = useCallback((order: ProductionOrder) => {
    setOrders(prev => [...prev, order]);
  }, []);

  const updateOrder = useCallback((orderId: string, updates: Partial<ProductionOrder>) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    ));
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  }, []);

  // Machine operations
  const addMachine = useCallback((machine: Machine) => {
    setMachines(prev => [...prev, machine]);
  }, []);

  const updateMachine = useCallback((machineId: string, updates: Partial<Machine>) => {
    setMachines(prev => prev.map(machine =>
      machine.id === machineId ? { ...machine, ...updates } : machine
    ));
  }, []);

  const deleteMachine = useCallback((machineId: string) => {
    setMachines(prev => prev.filter(machine => machine.id !== machineId));
  }, []);

  // Employee operations
  const addEmployee = useCallback((employee: Employee) => {
    setEmployees(prev => [...prev, employee]);
  }, []);

  const updateEmployee = useCallback((employeeId: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(employee =>
      employee.id === employeeId ? { ...employee, ...updates } : employee
    ));
  }, []);

  const deleteEmployee = useCallback((employeeId: string) => {
    setEmployees(prev => prev.filter(employee => employee.id !== employeeId));
  }, []);

  // Diagram settings
  const updateDiagramSettings = useCallback((updates: Partial<DiagramSettings>) => {
    setDiagramSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Modal operations
  const openTaskModal = useCallback((options: Partial<ModalState> = {}) => {
    setModalState({ isOpen: true, ...options });
  }, []);

  const closeTaskModal = useCallback(() => {
    setModalState({ isOpen: false });
  }, []);

  return (
    <PlanningContext.Provider
      value={{
        currentView,
        setCurrentView,
        language,
        setLanguage,
        t,
        dateRange,
        setDateRange,
        diagramSettings,
        updateDiagramSettings,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        machines,
        addMachine,
        updateMachine,
        deleteMachine,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        selectedOrderId,
        setSelectedOrderId,
        selectedEmployeeId,
        setSelectedEmployeeId,
        modalState,
        openTaskModal,
        closeTaskModal,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (context === undefined) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
}
