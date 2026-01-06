'use client';

import { useState, useEffect } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { ScheduledTask, WorkProcessType } from '../types';
import { employees, machines, workProcesses, productionOrders } from '../data/mockData';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: ScheduledTask;
  defaultDate?: string;
  defaultEmployeeId?: string;
  defaultProcessType?: WorkProcessType;
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  defaultDate,
  defaultEmployeeId,
  defaultProcessType,
}: TaskModalProps) {
  const { addTask, updateTask, deleteTask, t, language } = usePlanning();

  const [formData, setFormData] = useState({
    orderId: '',
    processType: '' as WorkProcessType | '',
    employeeId: '',
    machineId: '',
    date: '',
    duration: 8,
    durationDays: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        orderId: task.orderId,
        processType: task.processType,
        employeeId: task.employeeId,
        machineId: task.machineId || '',
        date: task.date,
        duration: task.duration,
        durationDays: task.durationDays || 1,
      });
    } else {
      setFormData({
        orderId: '',
        processType: defaultProcessType || '',
        employeeId: defaultEmployeeId || '',
        machineId: '',
        date: defaultDate || new Date().toISOString().split('T')[0],
        duration: 8,
        durationDays: 1,
      });
    }
    setErrors({});
  }, [task, defaultDate, defaultEmployeeId, defaultProcessType, isOpen]);

  const filteredEmployees = formData.processType
    ? employees.filter(e => e.skills.includes(formData.processType as WorkProcessType))
    : employees;

  const filteredMachines = formData.processType
    ? machines.filter(m => m.processType === formData.processType)
    : machines;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.orderId) newErrors.orderId = 'Pflichtfeld';
    if (!formData.processType) newErrors.processType = 'Pflichtfeld';
    if (!formData.employeeId) newErrors.employeeId = 'Pflichtfeld';
    if (!formData.date) newErrors.date = 'Pflichtfeld';
    if (formData.duration < 1) newErrors.duration = 'Min. 1 Stunde';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const taskData: ScheduledTask = {
      id: task?.id || `task-${Date.now()}`,
      orderId: formData.orderId,
      processType: formData.processType as WorkProcessType,
      employeeId: formData.employeeId,
      machineId: formData.machineId || undefined,
      date: formData.date,
      duration: formData.duration,
      durationDays: formData.durationDays,
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (task && confirm(language === 'de' ? 'Aufgabe wirklich löschen?' : 'Really delete task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {task ? t('action.edit') : t('action.add')} Aufgabe
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('label.order')} *
            </label>
            <select
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.orderId ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">-- Auswählen --</option>
              {productionOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.name}
                </option>
              ))}
            </select>
            {errors.orderId && <p className="text-red-500 text-xs mt-1">{errors.orderId}</p>}
          </div>

          {/* Process Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('label.process')} *
            </label>
            <select
              value={formData.processType}
              onChange={(e) => setFormData({
                ...formData,
                processType: e.target.value as WorkProcessType,
                employeeId: '',
                machineId: '',
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.processType ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">-- Auswählen --</option>
              {workProcesses.map(process => (
                <option key={process.id} value={process.id}>
                  {language === 'de' ? process.name : process.nameEn}
                </option>
              ))}
            </select>
            {errors.processType && <p className="text-red-500 text-xs mt-1">{errors.processType}</p>}
          </div>

          {/* Employee */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('label.employee')} *
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === e.target.value);
                setFormData({
                  ...formData,
                  employeeId: e.target.value,
                  machineId: emp?.defaultMachine || formData.machineId,
                });
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.employeeId ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">-- Auswählen --</option>
              {filteredEmployees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
          </div>

          {/* Machine (optional) */}
          {filteredMachines.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('label.machine')}
              </label>
              <select
                value={formData.machineId}
                onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Optional --</option>
                {filteredMachines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('label.date')} *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.date ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* Duration and Days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('label.duration')} ({language === 'de' ? 'Std/Tag' : 'hrs/day'})
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.duration ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('label.days')}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {task ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                {t('action.delete')}
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t('action.cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/30 transition-colors"
              >
                {t('action.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
