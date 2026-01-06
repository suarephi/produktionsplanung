'use client';

import { useMemo } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { workProcesses, machines, employees } from '../data/mockData';
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

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

export default function CapacityView() {
  const { dateRange, tasks, language, t } = usePlanning();

  const dates = useMemo(() => getDatesInRange(dateRange.start, dateRange.end), [dateRange]);
  const workDays = useMemo(() => dates.filter(d => !isWeekend(d)), [dates]);

  // Calculate capacity data per process
  const capacityData = useMemo(() => {
    return workProcesses.map(process => {
      const processMachines = machines.filter(m => m.processType === process.id);
      const processEmployees = employees.filter(e => e.skills.includes(process.id));
      const processTasks = tasks.filter(t => t.processType === process.id);

      // Available hours = employees * 8 hours * work days
      const totalAvailableHours = processEmployees.length * 8 * workDays.length;

      // Scheduled hours
      const scheduledHours = processTasks.reduce((sum, task) => sum + task.duration, 0);

      // Utilization
      const utilization = totalAvailableHours > 0 ? (scheduledHours / totalAvailableHours) * 100 : 0;

      // Daily breakdown
      const dailyData = dates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayTasks = processTasks.filter(t => t.date === dateStr);
        const dayHours = dayTasks.reduce((sum, task) => sum + task.duration, 0);
        const maxCapacity = processEmployees.length * 8;
        return {
          date,
          scheduled: dayHours,
          available: isWeekend(date) ? 0 : maxCapacity,
          utilization: maxCapacity > 0 ? (dayHours / maxCapacity) * 100 : 0,
        };
      });

      return {
        process,
        machines: processMachines.length,
        employees: processEmployees.length,
        totalAvailable: totalAvailableHours,
        scheduled: scheduledHours,
        utilization,
        daily: dailyData,
      };
    });
  }, [dates, workDays, tasks]);

  // Summary stats
  const totalStats = useMemo(() => {
    const totalAvailable = capacityData.reduce((sum, c) => sum + c.totalAvailable, 0);
    const totalScheduled = capacityData.reduce((sum, c) => sum + c.scheduled, 0);
    return {
      totalAvailable,
      totalScheduled,
      utilization: totalAvailable > 0 ? (totalScheduled / totalAvailable) * 100 : 0,
      totalEmployees: employees.length,
      totalMachines: machines.length,
    };
  }, [capacityData]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{totalStats.totalEmployees}</div>
              <div className="text-xs text-slate-500">{t('label.employee')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{totalStats.totalMachines}</div>
              <div className="text-xs text-slate-500">{t('label.machine')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{totalStats.totalAvailable}h</div>
              <div className="text-xs text-slate-500">Verfügbar</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{totalStats.totalScheduled}h</div>
              <div className="text-xs text-slate-500">Geplant</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totalStats.utilization > 80 ? 'bg-red-100' : totalStats.utilization > 50 ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
              <svg className={`w-5 h-5 ${
                totalStats.utilization > 80 ? 'text-red-600' : totalStats.utilization > 50 ? 'text-amber-600' : 'text-emerald-600'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                totalStats.utilization > 80 ? 'text-red-600' : totalStats.utilization > 50 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {totalStats.utilization.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500">Auslastung</div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity by Process */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t('view.capacity')}</h2>
              <p className="text-sm text-slate-500">Kapazitätsübersicht nach Arbeitsgang</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            {capacityData.map(data => (
              <div
                key={data.process.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: data.process.color }}
                    />
                    <span className="font-semibold text-slate-800">
                      {language === 'de' ? data.process.name : data.process.nameEn}
                    </span>
                    <span className="text-xs text-slate-500">
                      {data.employees} {t('label.employee')} • {data.machines} {t('label.machine')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      {data.scheduled}h / {data.totalAvailable}h
                    </span>
                    <span
                      className={`text-sm font-bold px-2 py-0.5 rounded ${
                        data.utilization > 80
                          ? 'bg-red-100 text-red-700'
                          : data.utilization > 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {data.utilization.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(data.utilization, 100)}%`,
                      backgroundColor: data.process.color,
                    }}
                  />
                </div>

                {/* Daily mini chart */}
                <div className="mt-3 flex gap-1">
                  {data.daily.map((day, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center"
                      title={`${formatDate(day.date)}: ${day.scheduled}h / ${day.available}h`}
                    >
                      <div
                        className={`w-full h-6 rounded-sm ${
                          isWeekend(day.date) ? 'bg-slate-100' : 'bg-slate-200'
                        }`}
                      >
                        {day.available > 0 && (
                          <div
                            className="h-full rounded-sm transition-all"
                            style={{
                              height: `${Math.min((day.scheduled / day.available) * 100, 100)}%`,
                              backgroundColor:
                                day.utilization > 100
                                  ? '#ef4444'
                                  : day.utilization > 80
                                  ? '#f59e0b'
                                  : data.process.color,
                              opacity: 0.8,
                            }}
                          />
                        )}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-0.5">
                        {day.date.getDate()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
