'use client';

import { useMemo } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { machines, workProcesses, getOrderById, getEmployeeById } from '../data/mockData';
import { WorkProcessType } from '../types';

function getDatesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getDayName(date: Date, lang: 'de' | 'en'): string {
  const days = lang === 'de'
    ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

export default function MachinePlan() {
  const { dateRange, tasks, orders, language, t } = usePlanning();

  const dates = useMemo(() => getDatesInRange(dateRange.start, dateRange.end), [dateRange]);

  // Group machines by process type
  const machinesByProcess = useMemo(() => {
    const grouped: Record<WorkProcessType, typeof machines> = {} as Record<WorkProcessType, typeof machines>;
    workProcesses.forEach(process => {
      grouped[process.id] = machines.filter(m => m.processType === process.id);
    });
    return grouped;
  }, []);

  // Get task for a machine on a specific date
  const getTaskForMachineDate = (machineId: string, dateStr: string) => {
    return tasks.find(
      task => task.machineId === machineId && task.date === dateStr
    );
  };

  // Calculate utilization for a machine
  const getMachineUtilization = (machineId: string): number => {
    const machineTasks = tasks.filter(t => t.machineId === machineId);
    const workDays = dates.filter(d => !isWeekend(d)).length;
    return workDays > 0 ? (machineTasks.length / workDays) * 100 : 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t('view.machine')}</h2>
            <p className="text-sm text-slate-500">{machines.length} {t('label.machine')}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {orders.map(order => (
            <span
              key={order.id}
              className="px-2 py-1 rounded text-xs font-bold text-white"
              style={{ backgroundColor: order.color }}
            >
              {order.name}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="sticky left-0 z-20 bg-slate-100 w-32 px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-b border-slate-200">
                {t('label.process')}
              </th>
              <th className="sticky left-32 z-20 bg-slate-100 w-28 px-3 py-3 text-left text-sm font-semibold text-slate-700 border-r border-b border-slate-200">
                {t('label.machine')}
              </th>
              <th className="sticky left-60 z-20 bg-slate-100 w-20 px-2 py-3 text-center text-xs font-semibold text-slate-700 border-r border-b border-slate-200">
                Auslastung
              </th>
              {dates.map((date, idx) => (
                <th
                  key={idx}
                  className={`w-24 px-2 py-2 text-center border-r border-b border-slate-200 ${
                    isWeekend(date) ? 'bg-slate-200' : ''
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-700">{formatDate(date)}</div>
                  <div className="text-[10px] text-slate-500">{getDayName(date, language)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workProcesses
              .filter(process => machinesByProcess[process.id]?.length > 0)
              .map(process => (
                <>
                  {machinesByProcess[process.id]?.map((machine, machineIdx) => {
                    const utilization = getMachineUtilization(machine.id);

                    return (
                      <tr key={machine.id} className="hover:bg-emerald-50/30 transition-colors">
                        {machineIdx === 0 && (
                          <td
                            rowSpan={machinesByProcess[process.id].length}
                            className="sticky left-0 z-10 bg-white w-32 px-4 py-2 border-r border-b border-slate-200 align-top"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: process.color }}
                              />
                              <span className="font-medium text-sm" style={{ color: process.color }}>
                                {language === 'de' ? process.name : process.nameEn}
                              </span>
                            </div>
                          </td>
                        )}
                        <td className="sticky left-32 z-10 bg-white w-28 px-3 py-2 border-r border-b border-slate-200">
                          <div className="font-medium text-sm text-slate-800">{machine.name}</div>
                        </td>
                        <td className="sticky left-60 z-10 bg-white w-20 px-2 py-2 border-r border-b border-slate-200">
                          <div className="flex flex-col items-center">
                            <div
                              className={`text-xs font-bold ${
                                utilization > 80
                                  ? 'text-red-600'
                                  : utilization > 50
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {utilization.toFixed(0)}%
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  utilization > 80
                                    ? 'bg-red-500'
                                    : utilization > 50
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        {dates.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const task = getTaskForMachineDate(machine.id, dateStr);
                          const order = task ? getOrderById(task.orderId) : null;
                          const employee = task ? getEmployeeById(task.employeeId) : null;

                          return (
                            <td
                              key={idx}
                              className={`w-24 px-1 py-1 border-r border-b border-slate-200 ${
                                isWeekend(date) ? 'bg-slate-50' : ''
                              }`}
                            >
                              {task && order && (
                                <div
                                  className="h-full min-h-[40px] rounded-md flex flex-col items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:scale-105 transition-transform shadow-sm p-1"
                                  style={{ backgroundColor: order.color }}
                                  title={`${order.name} - ${employee?.name}`}
                                >
                                  <div>{order.name}</div>
                                  <div className="font-normal opacity-80 text-[9px]">
                                    {employee?.name}
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
