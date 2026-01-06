'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { productionOrders, workProcesses, employees } from '../data/mockData';

interface TimeEntry {
  id: string;
  orderId: string;
  processType: string;
  employeeId: string;
  startTime: Date;
  endTime?: Date;
  piecesCompleted?: number;
}

export default function TimeTracker() {
  const { language, t } = usePlanning();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Form state
  const [selectedOrder, setSelectedOrder] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [piecesInput, setPiecesInput] = useState('');

  // Load entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timeEntries');
    if (saved) {
      const parsed = JSON.parse(saved);
      setEntries(parsed.map((e: TimeEntry) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: e.endTime ? new Date(e.endTime) : undefined,
      })));
    }

    const activeTimer = localStorage.getItem('activeTimer');
    if (activeTimer) {
      const parsed = JSON.parse(activeTimer);
      setActiveTimer({
        ...parsed,
        startTime: new Date(parsed.startTime),
      });
      setSelectedOrder(parsed.orderId);
      setSelectedProcess(parsed.processType);
      setSelectedEmployee(parsed.employeeId);
    }
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    localStorage.setItem('timeEntries', JSON.stringify(entries));
  }, [entries]);

  // Timer tick
  useEffect(() => {
    if (!activeTimer) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!selectedOrder || !selectedProcess || !selectedEmployee) {
      alert(language === 'de' ? 'Bitte alle Felder ausfüllen' : 'Please fill all fields');
      return;
    }

    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      orderId: selectedOrder,
      processType: selectedProcess,
      employeeId: selectedEmployee,
      startTime: new Date(),
    };

    setActiveTimer(newEntry);
    setElapsedTime(0);
    localStorage.setItem('activeTimer', JSON.stringify(newEntry));
  };

  const stopTimer = () => {
    if (!activeTimer) return;

    const pieces = parseInt(piecesInput) || 0;
    const completedEntry: TimeEntry = {
      ...activeTimer,
      endTime: new Date(),
      piecesCompleted: pieces,
    };

    setEntries(prev => [completedEntry, ...prev]);
    setActiveTimer(null);
    setElapsedTime(0);
    setPiecesInput('');
    localStorage.removeItem('activeTimer');
  };

  const getOrderName = (id: string) => productionOrders.find(o => o.id === id)?.name || id;
  const getProcessName = (id: string) => {
    const process = workProcesses.find(p => p.id === id);
    return process ? (language === 'de' ? process.name : process.nameEn) : id;
  };
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || id;

  const todayEntries = entries.filter(e => {
    const entryDate = new Date(e.startTime).toDateString();
    return entryDate === new Date().toDateString();
  });

  const totalTodaySeconds = todayEntries.reduce((sum, e) => {
    if (e.endTime) {
      return sum + Math.floor((e.endTime.getTime() - e.startTime.getTime()) / 1000);
    }
    return sum;
  }, 0);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
          activeTimer
            ? 'bg-green-500 animate-pulse'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600'
        }`}
      >
        {activeTimer ? (
          <div className="text-white text-xs font-bold">
            {formatTime(elapsedTime).slice(0, 5)}
          </div>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Time Tracker Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-lg font-bold text-white">
                    {language === 'de' ? 'Zeiterfassung' : 'Time Tracking'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Today's Total */}
              <div className="mt-3 text-white/80 text-sm">
                {language === 'de' ? 'Heute erfasst:' : 'Today:'}{' '}
                <span className="font-bold text-white">{formatTime(totalTodaySeconds)}</span>
              </div>
            </div>

            {/* Timer Display */}
            {activeTimer && (
              <div className="bg-green-50 border-b border-green-200 p-6 text-center">
                <div className="text-4xl font-mono font-bold text-green-600 mb-2">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-green-700">
                  {getOrderName(activeTimer.orderId)} • {getProcessName(activeTimer.processType)}
                </div>
              </div>
            )}

            {/* Form */}
            <div className="p-6 space-y-4">
              {!activeTimer ? (
                <>
                  {/* Order Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t('label.order')}
                    </label>
                    <input
                      type="text"
                      list="orders"
                      value={selectedOrder}
                      onChange={(e) => setSelectedOrder(e.target.value)}
                      placeholder="FAF..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <datalist id="orders">
                      {productionOrders.map(order => (
                        <option key={order.id} value={order.id}>{order.name}</option>
                      ))}
                    </datalist>
                  </div>

                  {/* Process Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t('label.process')}
                    </label>
                    <select
                      value={selectedProcess}
                      onChange={(e) => setSelectedProcess(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- {language === 'de' ? 'Auswählen' : 'Select'} --</option>
                      {workProcesses.map(process => (
                        <option key={process.id} value={process.id}>
                          {language === 'de' ? process.name : process.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t('label.employee')}
                    </label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- {language === 'de' ? 'Auswählen' : 'Select'} --</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={startTimer}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {language === 'de' ? 'Start' : 'Start'}
                  </button>
                </>
              ) : (
                <>
                  {/* Pieces Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'de' ? 'Fertiggestellte Stückzahl' : 'Pieces Completed'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={piecesInput}
                      onChange={(e) => setPiecesInput(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-bold"
                    />
                  </div>

                  {/* Stop Button */}
                  <button
                    onClick={stopTimer}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                    {language === 'de' ? 'Stop' : 'Stop'}
                  </button>
                </>
              )}
            </div>

            {/* Recent Entries */}
            {todayEntries.length > 0 && (
              <div className="border-t border-slate-200 p-4 max-h-48 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  {language === 'de' ? 'Heutige Einträge' : "Today's Entries"}
                </h3>
                <div className="space-y-2">
                  {todayEntries.slice(0, 5).map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-2"
                    >
                      <div>
                        <div className="font-medium text-slate-800">
                          {getOrderName(entry.orderId)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {getProcessName(entry.processType)} • {getEmployeeName(entry.employeeId)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-slate-700">
                          {entry.endTime
                            ? formatTime(Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000))
                            : '--:--:--'}
                        </div>
                        {entry.piecesCompleted !== undefined && entry.piecesCompleted > 0 && (
                          <div className="text-xs text-slate-500">
                            {entry.piecesCompleted} {language === 'de' ? 'Stk.' : 'pcs'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
