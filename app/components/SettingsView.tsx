'use client';

import { useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { Machine, Employee, ProductionOrder, WorkProcessType, DiagramSettings } from '../types';
import { workProcesses } from '../data/mockData';

type SettingsTab = 'employees' | 'machines' | 'orders' | 'diagram';

export default function SettingsView() {
  const {
    language,
    t,
    employees,
    machines,
    orders,
    diagramSettings,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addMachine,
    updateMachine,
    deleteMachine,
    addOrder,
    updateOrder,
    deleteOrder,
    updateDiagramSettings,
    dateRange,
    setDateRange,
  } = usePlanning();

  const [activeTab, setActiveTab] = useState<SettingsTab>('employees');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [machineForm, setMachineForm] = useState<Partial<Machine>>({});
  const [orderForm, setOrderForm] = useState<Partial<ProductionOrder>>({});

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'employees',
      label: language === 'de' ? 'Mitarbeiter' : 'Employees',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'machines',
      label: language === 'de' ? 'Maschinen' : 'Machines',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'orders',
      label: language === 'de' ? 'Aufträge' : 'Orders',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'diagram',
      label: language === 'de' ? 'Diagramm' : 'Diagram',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
  ];

  const resetForms = () => {
    setEmployeeForm({});
    setMachineForm({});
    setOrderForm({});
    setEditingItem(null);
    setIsAdding(false);
  };

  // Employee handlers
  const handleSaveEmployee = () => {
    if (!employeeForm.name || !employeeForm.skills?.length) return;

    if (editingItem) {
      updateEmployee(editingItem, employeeForm);
    } else {
      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        name: employeeForm.name,
        skills: employeeForm.skills as WorkProcessType[],
        defaultMachine: employeeForm.defaultMachine,
      };
      addEmployee(newEmployee);
    }
    resetForms();
  };

  const handleEditEmployee = (emp: Employee) => {
    setEmployeeForm(emp);
    setEditingItem(emp.id);
    setIsAdding(true);
  };

  // Machine handlers
  const handleSaveMachine = () => {
    if (!machineForm.name || !machineForm.processType) return;

    if (editingItem) {
      updateMachine(editingItem, machineForm);
    } else {
      const newMachine: Machine = {
        id: `machine-${Date.now()}`,
        name: machineForm.name,
        processType: machineForm.processType as WorkProcessType,
      };
      addMachine(newMachine);
    }
    resetForms();
  };

  const handleEditMachine = (machine: Machine) => {
    setMachineForm(machine);
    setEditingItem(machine.id);
    setIsAdding(true);
  };

  // Order handlers
  const handleSaveOrder = () => {
    if (!orderForm.name) return;

    if (editingItem) {
      updateOrder(editingItem, orderForm);
    } else {
      const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
      const newOrder: ProductionOrder = {
        id: orderForm.name?.toUpperCase().replace(/\s/g, '') || `ORD-${Date.now()}`,
        name: orderForm.name,
        status: orderForm.status || 'planned',
        color: orderForm.color || colors[Math.floor(Math.random() * colors.length)],
      };
      addOrder(newOrder);
    }
    resetForms();
  };

  const handleEditOrder = (order: ProductionOrder) => {
    setOrderForm(order);
    setEditingItem(order.id);
    setIsAdding(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {language === 'de' ? 'Einstellungen' : 'Settings'}
            </h2>
            <p className="text-sm text-slate-300">
              {language === 'de' ? 'Verwalten Sie Mitarbeiter, Maschinen und Aufträge' : 'Manage employees, machines, and orders'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); resetForms(); }}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {employees.length} {language === 'de' ? 'Mitarbeiter' : 'Employees'}
              </h3>
              <button
                onClick={() => { setIsAdding(true); setEmployeeForm({ skills: [] }); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('action.add')}
              </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-medium text-slate-800 mb-3">
                  {editingItem ? (language === 'de' ? 'Mitarbeiter bearbeiten' : 'Edit Employee') : (language === 'de' ? 'Neuer Mitarbeiter' : 'New Employee')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={employeeForm.name || ''}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'de' ? 'Standard-Maschine' : 'Default Machine'}
                    </label>
                    <select
                      value={employeeForm.defaultMachine || ''}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, defaultMachine: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- {language === 'de' ? 'Keine' : 'None'} --</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'de' ? 'Fähigkeiten' : 'Skills'} *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {workProcesses.map(process => (
                        <label
                          key={process.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            employeeForm.skills?.includes(process.id)
                              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={employeeForm.skills?.includes(process.id) || false}
                            onChange={(e) => {
                              const skills = employeeForm.skills || [];
                              if (e.target.checked) {
                                setEmployeeForm({ ...employeeForm, skills: [...skills, process.id] });
                              } else {
                                setEmployeeForm({ ...employeeForm, skills: skills.filter(s => s !== process.id) });
                              }
                            }}
                            className="sr-only"
                          />
                          <span className="text-sm">{language === 'de' ? process.name : process.nameEn}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={resetForms}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {t('action.cancel')}
                  </button>
                  <button
                    onClick={handleSaveEmployee}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    {t('action.save')}
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees.map(emp => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-500">
                        {emp.skills.map(s => workProcesses.find(p => p.id === s)?.name).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditEmployee(emp)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Machines Tab */}
        {activeTab === 'machines' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {machines.length} {language === 'de' ? 'Maschinen' : 'Machines'}
              </h3>
              <button
                onClick={() => { setIsAdding(true); setMachineForm({}); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('action.add')}
              </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-medium text-slate-800 mb-3">
                  {editingItem ? (language === 'de' ? 'Maschine bearbeiten' : 'Edit Machine') : (language === 'de' ? 'Neue Maschine' : 'New Machine')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={machineForm.name || ''}
                      onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="z.B. Komax 3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {language === 'de' ? 'Arbeitsgang' : 'Process'} *
                    </label>
                    <select
                      value={machineForm.processType || ''}
                      onChange={(e) => setMachineForm({ ...machineForm, processType: e.target.value as WorkProcessType })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- {language === 'de' ? 'Auswählen' : 'Select'} --</option>
                      {workProcesses.map(p => (
                        <option key={p.id} value={p.id}>{language === 'de' ? p.name : p.nameEn}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={resetForms} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                    {t('action.cancel')}
                  </button>
                  <button onClick={handleSaveMachine} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                    {t('action.save')}
                  </button>
                </div>
              </div>
            )}

            {/* List grouped by process */}
            {workProcesses.filter(p => machines.some(m => m.processType === p.id)).map(process => (
              <div key={process.id} className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: process.color }} />
                  {language === 'de' ? process.name : process.nameEn}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {machines.filter(m => m.processType === process.id).map(machine => (
                    <div
                      key={machine.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${process.color}20`, color: process.color }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-800">{machine.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditMachine(machine)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteMachine(machine.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {orders.length} {language === 'de' ? 'Aufträge' : 'Orders'}
              </h3>
              <button
                onClick={() => { setIsAdding(true); setOrderForm({ status: 'planned' }); }}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('action.add')}
              </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-medium text-slate-800 mb-3">
                  {editingItem ? (language === 'de' ? 'Auftrag bearbeiten' : 'Edit Order') : (language === 'de' ? 'Neuer Auftrag' : 'New Order')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={orderForm.name || ''}
                      onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                      placeholder="z.B. FAF0010"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={orderForm.status || 'planned'}
                      onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value as ProductionOrder['status'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="planned">{t('status.planned')}</option>
                      <option value="in_progress">{t('status.in_progress')}</option>
                      <option value="completed">{t('status.completed')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Farbe' : 'Color'}</label>
                    <input
                      type="color"
                      value={orderForm.color || '#3b82f6'}
                      onChange={(e) => setOrderForm({ ...orderForm, color: e.target.value })}
                      className="w-full h-10 rounded-lg border border-slate-300 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={resetForms} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                    {t('action.cancel')}
                  </button>
                  <button onClick={handleSaveOrder} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg">
                    {t('action.save')}
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-10 rounded" style={{ backgroundColor: order.color }} />
                    <div>
                      <div className="font-bold text-slate-800">{order.name}</div>
                      <div className={`text-xs px-2 py-0.5 rounded inline-block ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t(`status.${order.status}`)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditOrder(order)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagram Settings Tab */}
        {activeTab === 'diagram' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">
              {language === 'de' ? 'Diagramm-Einstellungen' : 'Diagram Settings'}
            </h3>

            {/* Date Range */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-3">
                {language === 'de' ? 'Datumsbereich' : 'Date Range'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'de' ? 'Startdatum' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={dateRange.start.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'de' ? 'Enddatum' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={dateRange.end.toISOString().split('T')[0]}
                    onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Cell Dimensions */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-3">
                {language === 'de' ? 'Zellengrößen' : 'Cell Dimensions'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'de' ? 'Zellenbreite (px)' : 'Cell Width (px)'}
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="150"
                    value={diagramSettings.cellWidth}
                    onChange={(e) => updateDiagramSettings({ cellWidth: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-sm text-slate-500 text-center">{diagramSettings.cellWidth}px</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {language === 'de' ? 'Zeilenhöhe (px)' : 'Row Height (px)'}
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="80"
                    value={diagramSettings.rowHeight}
                    onChange={(e) => updateDiagramSettings({ rowHeight: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-sm text-slate-500 text-center">{diagramSettings.rowHeight}px</div>
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-3">
                {language === 'de' ? 'Anzeigeoptionen' : 'Display Options'}
              </h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diagramSettings.showWeekends}
                    onChange={(e) => updateDiagramSettings({ showWeekends: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    {language === 'de' ? 'Wochenenden anzeigen' : 'Show weekends'}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diagramSettings.compactMode}
                    onChange={(e) => updateDiagramSettings({ compactMode: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    {language === 'de' ? 'Kompaktmodus' : 'Compact mode'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
