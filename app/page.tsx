'use client';

import Header from './components/Header';
import GanttChart from './components/GanttChart';
import PersonnelPlan from './components/PersonnelPlan';
import MachinePlan from './components/MachinePlan';
import CapacityView from './components/CapacityView';
import ScheduleView from './components/ScheduleView';
import SettingsView from './components/SettingsView';
import TaskModal from './components/TaskModal';
import TimeTracker from './components/TimeTracker';
import CRMDashboard from './components/CRMDashboard';
import ContactsView from './components/ContactsView';
import MeetingsView from './components/MeetingsView';
import CRMTasksView from './components/CRMTasksView';
import CalendarView from './components/CalendarView';
import { usePlanning } from './context/PlanningContext';

export default function Home() {
  const { currentView, t, modalState, closeTaskModal } = usePlanning();

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <GanttChart />;
      case 'personal':
        return <PersonnelPlan />;
      case 'machine':
        return <MachinePlan />;
      case 'capacity':
        return <CapacityView />;
      case 'schedule':
        return <ScheduleView />;
      case 'settings':
        return <SettingsView />;
      case 'crm':
        return <CRMDashboard />;
      case 'crm-contacts':
        return <ContactsView />;
      case 'crm-meetings':
        return <MeetingsView />;
      case 'crm-tasks':
        return <CRMTasksView />;
      case 'crm-calendar':
        return <CalendarView />;
      default:
        return <GanttChart />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1800px] mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{t('app.title')} © 2024</span>
            <span className="text-xs">Version 1.0</span>
          </div>
        </div>
      </footer>

      {/* Task Modal */}
      <TaskModal
        isOpen={modalState.isOpen}
        onClose={closeTaskModal}
        task={modalState.task}
        defaultDate={modalState.defaultDate}
        defaultEmployeeId={modalState.defaultEmployeeId}
        defaultProcessType={modalState.defaultProcessType}
      />

      {/* Time Tracker */}
      <TimeTracker />
    </div>
  );
}
