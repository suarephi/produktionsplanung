'use client';

import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { usePlanning } from '../context/PlanningContext';
import { CRMMeeting } from '../types';
import AudioRecorder from './AudioRecorder';

export default function MeetingsView() {
  const { meetings, contacts, addMeeting, updateMeeting, deleteMeeting, addCRMTask, crmTasks } = useCRM();
  const { language } = usePlanning();
  const [selectedMeeting, setSelectedMeeting] = useState<CRMMeeting | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CRMMeeting>>({});
  const [transcriptInput, setTranscriptInput] = useState('');
  const [newActionItem, setNewActionItem] = useState('');

  const sortedMeetings = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getContact = (id: string) => contacts.find(c => c.id === id);

  const handleSaveMeeting = () => {
    if (isEditing && selectedMeeting) {
      updateMeeting(selectedMeeting.id, editForm);
      setSelectedMeeting({ ...selectedMeeting, ...editForm });
    } else if (showAddModal) {
      const newMeeting: CRMMeeting = {
        id: `m${Date.now()}`,
        title: editForm.title || '',
        date: editForm.date || new Date().toISOString(),
        duration: editForm.duration || 30,
        attendeeIds: editForm.attendeeIds || [],
        actionItems: [],
        topics: [],
        status: 'scheduled',
      };
      addMeeting(newMeeting);
      setShowAddModal(false);
    }
    setIsEditing(false);
    setEditForm({});
  };

  const handleAddTranscript = () => {
    if (selectedMeeting && transcriptInput.trim()) {
      // Simple AI-like summary generation (in production, use actual AI)
      const words = transcriptInput.split(/\s+/);
      const keyPhrases = words.filter(w => w.length > 5).slice(0, 10);
      const summary = `Meeting covered: ${keyPhrases.join(', ')}`;
      const topics = keyPhrases.filter((_, i) => i < 5);

      updateMeeting(selectedMeeting.id, {
        transcript: transcriptInput,
        summary,
        topics,
        status: 'completed',
      });
      setSelectedMeeting({
        ...selectedMeeting,
        transcript: transcriptInput,
        summary,
        topics,
        status: 'completed',
      });
      setTranscriptInput('');
    }
  };

  const handleAddActionItem = () => {
    if (selectedMeeting && newActionItem.trim()) {
      const updatedItems = [...selectedMeeting.actionItems, newActionItem];
      updateMeeting(selectedMeeting.id, { actionItems: updatedItems });
      setSelectedMeeting({ ...selectedMeeting, actionItems: updatedItems });
      setNewActionItem('');
    }
  };

  const convertToTask = (actionItem: string, contactId?: string) => {
    if (selectedMeeting) {
      addCRMTask({
        id: `t${Date.now()}`,
        title: actionItem,
        meetingId: selectedMeeting.id,
        contactId,
        priority: 'medium',
        status: 'todo',
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
  };

  const meetingTasks = selectedMeeting
    ? crmTasks.filter(t => t.meetingId === selectedMeeting.id)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {language === 'de' ? 'Meetings & Transkripte' : 'Meetings & Transcripts'}
        </h1>
        <button
          onClick={() => {
            setEditForm({ attendeeIds: [] });
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {language === 'de' ? 'Meeting hinzufügen' : 'Add Meeting'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">{language === 'de' ? 'Alle Meetings' : 'All Meetings'}</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {sortedMeetings.map(meeting => (
              <button
                key={meeting.id}
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setIsEditing(false);
                }}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                  selectedMeeting?.id === meeting.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-800">{meeting.title}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    meeting.status === 'completed' ? 'bg-green-100 text-green-700' :
                    meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {meeting.status === 'completed' ? (language === 'de' ? 'Abgeschlossen' : 'Completed') :
                     meeting.status === 'scheduled' ? (language === 'de' ? 'Geplant' : 'Scheduled') :
                     (language === 'de' ? 'Abgesagt' : 'Cancelled')}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {new Date(meeting.date).toLocaleDateString()} - {meeting.duration} min
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {meeting.attendeeIds.slice(0, 3).map(id => {
                    const contact = getContact(id);
                    return contact ? (
                      <span key={id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {contact.name.split(' ')[0]}
                      </span>
                    ) : null;
                  })}
                  {meeting.attendeeIds.length > 3 && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      +{meeting.attendeeIds.length - 3}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Meeting Detail */}
        <div className="lg:col-span-2">
          {selectedMeeting ? (
            <div className="space-y-4">
              {/* Meeting Info */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedMeeting.title}</h2>
                    <p className="text-slate-600">
                      {new Date(selectedMeeting.date).toLocaleString()} - {selectedMeeting.duration} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditForm(selectedMeeting);
                      }}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                    >
                      {language === 'de' ? 'Bearbeiten' : 'Edit'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(language === 'de' ? 'Meeting löschen?' : 'Delete meeting?')) {
                          deleteMeeting(selectedMeeting.id);
                          setSelectedMeeting(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      {language === 'de' ? 'Löschen' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs text-slate-500 uppercase">{language === 'de' ? 'Teilnehmer' : 'Attendees'}</label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {selectedMeeting.attendeeIds.map(id => {
                      const contact = getContact(id);
                      return contact ? (
                        <span key={id} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          {contact.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {selectedMeeting.topics.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase">{language === 'de' ? 'Themen' : 'Topics'}</label>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {selectedMeeting.topics.map((topic, i) => (
                        <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              {selectedMeeting.summary && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-6">
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded">AI</span>
                    {language === 'de' ? 'Zusammenfassung' : 'Summary'}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{selectedMeeting.summary}</p>
                </div>
              )}

              {/* Audio Recording */}
              {!selectedMeeting.transcript && (
                <AudioRecorder
                  language={language as 'en' | 'de'}
                  onTranscriptionComplete={(data) => {
                    updateMeeting(selectedMeeting.id, {
                      transcript: data.transcript,
                      summary: data.summary,
                      actionItems: [...selectedMeeting.actionItems, ...data.actionItems],
                      topics: data.topics,
                      status: 'completed',
                    });
                    setSelectedMeeting({
                      ...selectedMeeting,
                      transcript: data.transcript,
                      summary: data.summary,
                      actionItems: [...selectedMeeting.actionItems, ...data.actionItems],
                      topics: data.topics,
                      status: 'completed',
                    });
                  }}
                />
              )}

              {/* Transcript */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-3">
                  {language === 'de' ? 'Transkript / Meeting-Notizen' : 'Transcript / Meeting Notes'}
                </h3>
                {selectedMeeting.transcript ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {selectedMeeting.transcript}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 mb-2">
                      {language === 'de' ? 'Oder manuell eingeben:' : 'Or enter manually:'}
                    </p>
                    <textarea
                      value={transcriptInput}
                      onChange={(e) => setTranscriptInput(e.target.value)}
                      placeholder={language === 'de' ? 'Meeting-Notizen oder Transkript hier einfügen...' : 'Paste meeting notes or transcript here...'}
                      className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddTranscript}
                      disabled={!transcriptInput.trim()}
                      className="px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      {language === 'de' ? 'Analysieren' : 'Analyze with AI'}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Items */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-3">
                  {language === 'de' ? 'Aktionspunkte' : 'Action Items'}
                </h3>
                <div className="space-y-2 mb-4">
                  {selectedMeeting.actionItems.map((item, i) => {
                    const existingTask = crmTasks.find(t => t.meetingId === selectedMeeting.id && t.title === item);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-700">{item}</span>
                        {existingTask ? (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            existingTask.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {existingTask.status === 'done' ? (language === 'de' ? 'Erledigt' : 'Done') : (language === 'de' ? 'Aufgabe' : 'Task')}
                          </span>
                        ) : (
                          <button
                            onClick={() => convertToTask(item, selectedMeeting.attendeeIds[0])}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            {language === 'de' ? '→ Aufgabe' : '→ Task'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActionItem}
                    onChange={(e) => setNewActionItem(e.target.value)}
                    placeholder={language === 'de' ? 'Neuer Aktionspunkt...' : 'New action item...'}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddActionItem()}
                  />
                  <button
                    onClick={handleAddActionItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Related Tasks */}
              {meetingTasks.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-800 mb-3">
                    {language === 'de' ? 'Verknüpfte Aufgaben' : 'Related Tasks'}
                  </h3>
                  <div className="space-y-2">
                    {meetingTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-800">{task.title}</div>
                          {task.dueDate && (
                            <div className="text-xs text-slate-500">
                              {language === 'de' ? 'Fällig:' : 'Due:'} {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.status === 'done' ? 'bg-green-100 text-green-700' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {task.status === 'done' ? (language === 'de' ? 'Erledigt' : 'Done') :
                           task.status === 'in_progress' ? (language === 'de' ? 'In Bearbeitung' : 'In Progress') :
                           (language === 'de' ? 'Offen' : 'Todo')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500">
                {language === 'de' ? 'Meeting auswählen, um Details anzuzeigen' : 'Select a meeting to view details'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {language === 'de' ? 'Neues Meeting' : 'New Meeting'}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Datum & Zeit' : 'Date & Time'} *</label>
                <input
                  type="datetime-local"
                  value={editForm.date?.slice(0, 16) || ''}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Dauer (Min)' : 'Duration (min)'}</label>
                <input
                  type="number"
                  value={editForm.duration || 30}
                  onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Teilnehmer' : 'Attendees'}</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contacts.map(contact => (
                    <label key={contact.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.attendeeIds?.includes(contact.id) || false}
                        onChange={(e) => {
                          const currentIds = editForm.attendeeIds || [];
                          if (e.target.checked) {
                            setEditForm({ ...editForm, attendeeIds: [...currentIds, contact.id] });
                          } else {
                            setEditForm({ ...editForm, attendeeIds: currentIds.filter(id => id !== contact.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{contact.name}</span>
                      <span className="text-xs text-slate-500">{contact.company}</span>
                    </label>
                  ))}
                </div>
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
                onClick={handleSaveMeeting}
                disabled={!editForm.title || !editForm.date}
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
