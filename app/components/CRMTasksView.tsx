'use client';

import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { usePlanning } from '../context/PlanningContext';
import { CRMTask } from '../types';

export default function CRMTasksView() {
  const { crmTasks, contacts, meetings, addCRMTask, updateCRMTask, deleteCRMTask } = useCRM();
  const { language } = usePlanning();
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CRMTask>>({});

  const filteredTasks = crmTasks.filter(t => filter === 'all' || t.status === filter);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getContact = (id?: string) => id ? contacts.find(c => c.id === id) : null;
  const getMeeting = (id?: string) => id ? meetings.find(m => m.id === id) : null;

  const handleSaveTask = () => {
    if (showAddModal) {
      const newTask: CRMTask = {
        id: `t${Date.now()}`,
        title: editForm.title || '',
        description: editForm.description,
        contactId: editForm.contactId,
        meetingId: editForm.meetingId,
        dueDate: editForm.dueDate,
        priority: editForm.priority || 'medium',
        status: 'todo',
        createdAt: new Date().toISOString().split('T')[0],
      };
      addCRMTask(newTask);
      setShowAddModal(false);
      setEditForm({});
    }
  };

  const handleStatusChange = (taskId: string, newStatus: CRMTask['status']) => {
    updateCRMTask(taskId, { status: newStatus });
  };

  const todoTasks = sortedTasks.filter(t => t.status === 'todo');
  const inProgressTasks = sortedTasks.filter(t => t.status === 'in_progress');
  const doneTasks = sortedTasks.filter(t => t.status === 'done');

  const TaskCard = ({ task }: { task: CRMTask }) => {
    const contact = getContact(task.contactId);
    const meeting = getMeeting(task.meetingId);
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

    return (
      <div className={`p-4 bg-white rounded-lg shadow-sm border ${isOverdue ? 'border-red-300' : 'border-slate-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                task.priority === 'high' ? 'bg-red-500' :
                task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
              }`} />
              <span className="font-medium text-slate-800">{task.title}</span>
            </div>
            {task.description && (
              <p className="text-sm text-slate-600 mt-1">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {contact && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {contact.name}
                </span>
              )}
              {meeting && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  {meeting.title}
                </span>
              )}
              {task.dueDate && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {language === 'de' ? 'Fällig:' : 'Due:'} {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm(language === 'de' ? 'Aufgabe löschen?' : 'Delete task?')) {
                deleteCRMTask(task.id);
              }
            }}
            className="text-slate-400 hover:text-red-500 ml-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {task.status !== 'todo' && (
            <button
              onClick={() => handleStatusChange(task.id, 'todo')}
              className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              {language === 'de' ? 'Offen' : 'Todo'}
            </button>
          )}
          {task.status !== 'in_progress' && (
            <button
              onClick={() => handleStatusChange(task.id, 'in_progress')}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            >
              {language === 'de' ? 'In Bearbeitung' : 'In Progress'}
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => handleStatusChange(task.id, 'done')}
              className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
            >
              {language === 'de' ? 'Erledigt' : 'Done'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {language === 'de' ? 'CRM Aufgaben' : 'CRM Tasks'}
        </h1>
        <button
          onClick={() => {
            setEditForm({ priority: 'medium' });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {language === 'de' ? 'Aufgabe hinzufügen' : 'Add Task'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl text-center transition-colors ${
            filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-2xl font-bold">{crmTasks.length}</div>
          <div className="text-sm">{language === 'de' ? 'Alle' : 'All'}</div>
        </button>
        <button
          onClick={() => setFilter('todo')}
          className={`p-4 rounded-xl text-center transition-colors ${
            filter === 'todo' ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-2xl font-bold">{crmTasks.filter(t => t.status === 'todo').length}</div>
          <div className="text-sm">{language === 'de' ? 'Offen' : 'Todo'}</div>
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`p-4 rounded-xl text-center transition-colors ${
            filter === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-2xl font-bold">{crmTasks.filter(t => t.status === 'in_progress').length}</div>
          <div className="text-sm">{language === 'de' ? 'In Bearbeitung' : 'In Progress'}</div>
        </button>
        <button
          onClick={() => setFilter('done')}
          className={`p-4 rounded-xl text-center transition-colors ${
            filter === 'done' ? 'bg-green-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-2xl font-bold">{crmTasks.filter(t => t.status === 'done').length}</div>
          <div className="text-sm">{language === 'de' ? 'Erledigt' : 'Done'}</div>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Todo Column */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            {language === 'de' ? 'Offen' : 'Todo'} ({todoTasks.length})
          </h2>
          <div className="space-y-3">
            {todoTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {todoTasks.length === 0 && (
              <p className="text-slate-400 text-center py-8">
                {language === 'de' ? 'Keine offenen Aufgaben' : 'No tasks'}
              </p>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            {language === 'de' ? 'In Bearbeitung' : 'In Progress'} ({inProgressTasks.length})
          </h2>
          <div className="space-y-3">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {inProgressTasks.length === 0 && (
              <p className="text-slate-400 text-center py-8">
                {language === 'de' ? 'Keine Aufgaben' : 'No tasks'}
              </p>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            {language === 'de' ? 'Erledigt' : 'Done'} ({doneTasks.length})
          </h2>
          <div className="space-y-3">
            {doneTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            {doneTasks.length === 0 && (
              <p className="text-slate-400 text-center py-8">
                {language === 'de' ? 'Keine erledigten Aufgaben' : 'No completed tasks'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {language === 'de' ? 'Neue Aufgabe' : 'New Task'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Titel' : 'Title'} *</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Beschreibung' : 'Description'}</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Kontakt' : 'Contact'}</label>
                <select
                  value={editForm.contactId || ''}
                  onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'de' ? 'Kein Kontakt' : 'No contact'}</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Fälligkeitsdatum' : 'Due Date'}</label>
                <input
                  type="date"
                  value={editForm.dueDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Priorität' : 'Priority'}</label>
                <select
                  value={editForm.priority || 'medium'}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as CRMTask['priority'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">{language === 'de' ? 'Niedrig' : 'Low'}</option>
                  <option value="medium">{language === 'de' ? 'Mittel' : 'Medium'}</option>
                  <option value="high">{language === 'de' ? 'Hoch' : 'High'}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditForm({});
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveTask}
                disabled={!editForm.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {language === 'de' ? 'Erstellen' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
