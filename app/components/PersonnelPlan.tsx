'use client';

import { useMemo, useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { employees, getOrderById, getProcessById, getMachineById } from '../data/mockData';

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

export default function PersonnelPlan() {
  const { dateRange, tasks, orders, language, t, selectedEmployeeId, setSelectedEmployeeId } = usePlanning();
  const [filterEmployee, setFilterEmployee] = useState<string>('');

  const dates = useMemo(() => getDatesInRange(dateRange.start, dateRange.end), [dateRange]);

  const filteredEmployees = useMemo(() => {
    if (!filterEmployee) return employees;
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(filterEmployee.toLowerCase())
    );
  }, [filterEmployee]);

  // Get all tasks for an employee on a specific date
  const getTasksForEmployeeDate = (employeeId: string, dateStr: string) => {
    return tasks.filter(
      task => task.employeeId === employeeId && task.date === dateStr
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t('view.personal')}</h2>
              <p className="text-sm text-slate-500">{employees.length} {t('label.employee')}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={`${t('label.search')} ${t('label.employee')}...`}
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="sticky left-0 z-20 bg-slate-100 w-40 px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-b border-slate-200">
                {t('label.employee')}
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
            {filteredEmployees.map(employee => (
              <tr
                key={employee.id}
                className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                  selectedEmployeeId === employee.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => setSelectedEmployeeId(selectedEmployeeId === employee.id ? null : employee.id)}
              >
                <td className="sticky left-0 z-10 bg-white w-40 px-4 py-3 border-r border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{employee.name}</div>
                      <div className="text-xs text-slate-500">
                        {employee.skills.map(s => t(`process.${s}`)).join(', ')}
                      </div>
                    </div>
                  </div>
                </td>
                {dates.map((date, idx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayTasks = getTasksForEmployeeDate(employee.id, dateStr);

                  return (
                    <td
                      key={idx}
                      className={`w-24 px-1 py-1 border-r border-b border-slate-200 align-top ${
                        isWeekend(date) ? 'bg-slate-50' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        {dayTasks.map(task => {
                          const order = getOrderById(task.orderId);
                          const process = getProcessById(task.processType);
                          return order ? (
                            <div
                              key={task.id}
                              className="rounded px-1.5 py-1 text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: order.color }}
                              title={`${order.name} - ${process?.name}`}
                            >
                              <div>{order.name}</div>
                              <div className="font-normal opacity-80 truncate">
                                {process?.name}
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
