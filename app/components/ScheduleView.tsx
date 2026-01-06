'use client';

import { useMemo, useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { getOrderById, getEmployeeById, getMachineById, getProcessById } from '../data/mockData';

function formatDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}

function formatDateShort(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

export default function ScheduleView() {
  const { tasks, orders, language, t } = usePlanning();
  const [filterOrder, setFilterOrder] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'order' | 'process'>('date');

  // Sort and filter tasks
  const sortedTasks = useMemo(() => {
    let filtered = [...tasks];

    if (filterOrder) {
      filtered = filtered.filter(task =>
        task.orderId.toLowerCase().includes(filterOrder.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'order') {
        return a.orderId.localeCompare(b.orderId);
      } else {
        return a.processType.localeCompare(b.processType);
      }
    });

    return filtered;
  }, [tasks, filterOrder, sortBy]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    sortedTasks.forEach(task => {
      if (!grouped[task.date]) {
        grouped[task.date] = [];
      }
      grouped[task.date].push(task);
    });
    return grouped;
  }, [sortedTasks]);

  const dateGroups = Object.keys(tasksByDate).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-cyan-50 to-sky-50 border-b border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{t('view.schedule')}</h2>
                <p className="text-sm text-slate-500">{sortedTasks.length} Aufgaben geplant</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={`${t('label.filter')} ${t('label.order')}...`}
                  value={filterOrder}
                  onChange={(e) => setFilterOrder(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 w-48"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'order' | 'process')}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="date">{t('label.date')}</option>
                <option value="order">{t('label.order')}</option>
                <option value="process">{t('label.process')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4">
          {dateGroups.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('label.noTasks')}
            </div>
          ) : (
            <div className="space-y-6">
              {dateGroups.map(dateStr => {
                const date = new Date(dateStr);
                const dayTasks = tasksByDate[dateStr];

                return (
                  <div key={dateStr} className="relative">
                    {/* Date Header */}
                    <div className="sticky top-0 bg-white z-10 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 flex flex-col items-center justify-center text-white shadow-lg">
                          <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                          <span className="text-[10px] uppercase">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{formatDate(date)}</div>
                          <div className="text-sm text-slate-500">{dayTasks.length} Aufgaben</div>
                        </div>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="ml-6 pl-6 border-l-2 border-slate-200 space-y-3">
                      {dayTasks.map(task => {
                        const order = getOrderById(task.orderId);
                        const employee = getEmployeeById(task.employeeId);
                        const machine = task.machineId ? getMachineById(task.machineId) : null;
                        const process = getProcessById(task.processType);

                        return (
                          <div
                            key={task.id}
                            className="relative bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                          >
                            {/* Timeline dot */}
                            <div
                              className="absolute -left-[31px] top-5 w-4 h-4 rounded-full border-2 border-white"
                              style={{ backgroundColor: order?.color || '#64748b' }}
                            />

                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className="px-2 py-0.5 rounded text-xs font-bold text-white"
                                    style={{ backgroundColor: order?.color }}
                                  >
                                    {order?.name}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor: `${process?.color}20`,
                                      color: process?.color,
                                    }}
                                  >
                                    {language === 'de' ? process?.name : process?.nameEn}
                                  </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {employee?.name}
                                  </div>
                                  {machine && (
                                    <div className="flex items-center gap-1.5">
                                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      </svg>
                                      {machine.name}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-medium text-slate-700">{task.duration}h</div>
                                <div className="text-xs text-slate-400">{t('label.duration')}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
