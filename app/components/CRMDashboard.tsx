'use client';

import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { usePlanning } from '../context/PlanningContext';

export default function CRMDashboard() {
  const { contacts, meetings, crmTasks, recommendations, calendarEvents, isCalendarConnected, connectCalendar, syncCalendar, sendTelegramMessage, isTelegramConnected } = useCRM();
  const { setCurrentView, language } = usePlanning();
  const [sendingTelegram, setSendingTelegram] = useState(false);

  const upcomingMeetings = meetings
    .filter(m => m.status === 'scheduled' && new Date(m.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const pendingTasks = crmTasks.filter(t => t.status !== 'done').slice(0, 5);

  const getContact = (id: string) => contacts.find(c => c.id === id);

  const sendRecommendationsToTelegram = async () => {
    if (recommendations.length === 0) return;

    setSendingTelegram(true);
    try {
      const topRecs = recommendations.slice(0, 5);
      const message = `<b>CRM Recommendations</b>\n\n` +
        topRecs.map((rec, idx) => {
          const contact = getContact(rec.contactId);
          return `${idx + 1}. <b>${contact?.name || 'Unknown'}</b>\n   ${rec.reason}\n   → ${rec.suggestedAction}`;
        }).join('\n\n');

      await sendTelegramMessage(message);
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
    } finally {
      setSendingTelegram(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {language === 'de' ? 'CRM Dashboard' : 'CRM Dashboard'}
      </h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="text-3xl font-bold text-blue-600">{contacts.length}</div>
          <div className="text-slate-600">{language === 'de' ? 'Kontakte' : 'Contacts'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="text-3xl font-bold text-green-600">{meetings.length}</div>
          <div className="text-slate-600">{language === 'de' ? 'Meetings' : 'Meetings'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="text-3xl font-bold text-orange-600">{pendingTasks.length}</div>
          <div className="text-slate-600">{language === 'de' ? 'Offene Aufgaben' : 'Open Tasks'}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="text-3xl font-bold text-purple-600">{recommendations.length}</div>
          <div className="text-slate-600">{language === 'de' ? 'Empfehlungen' : 'Recommendations'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="text-purple-500">AI</span>
              {language === 'de' ? 'Kontaktempfehlungen' : 'Reach Out Recommendations'}
            </h2>
            {isTelegramConnected && recommendations.length > 0 && (
              <button
                onClick={sendRecommendationsToTelegram}
                disabled={sendingTelegram}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm disabled:opacity-50"
                title={language === 'de' ? 'An Telegram senden' : 'Send to Telegram'}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                {sendingTelegram ? '...' : 'TG'}
              </button>
            )}
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {recommendations.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                {language === 'de' ? 'Keine Empfehlungen' : 'No recommendations'}
              </p>
            ) : (
              recommendations.slice(0, 5).map((rec, idx) => {
                const contact = getContact(rec.contactId);
                if (!contact) return null;
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      rec.priority >= 8 ? 'bg-red-500' : rec.priority >= 5 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {rec.priority}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{contact.name}</div>
                      <div className="text-sm text-slate-600">{rec.reason}</div>
                      <div className="text-xs text-slate-500 mt-1">{rec.suggestedAction}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              {language === 'de' ? 'Anstehende Meetings' : 'Upcoming Meetings'}
            </h2>
            <button
              onClick={() => setCurrentView('crm-meetings')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {language === 'de' ? 'Alle anzeigen' : 'View all'}
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {upcomingMeetings.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                {language === 'de' ? 'Keine anstehenden Meetings' : 'No upcoming meetings'}
              </p>
            ) : (
              upcomingMeetings.map(meeting => (
                <div key={meeting.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-800">{meeting.title}</div>
                  <div className="text-sm text-slate-600">
                    {new Date(meeting.date).toLocaleDateString()} - {meeting.duration}min
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {meeting.attendeeIds.map(id => {
                      const contact = getContact(id);
                      return contact ? (
                        <span key={id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {contact.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              {language === 'de' ? 'Offene Aufgaben' : 'Pending Tasks'}
            </h2>
            <button
              onClick={() => setCurrentView('crm-tasks')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {language === 'de' ? 'Alle anzeigen' : 'View all'}
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                {language === 'de' ? 'Keine offenen Aufgaben' : 'No pending tasks'}
              </p>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">{task.title}</div>
                    {task.dueDate && (
                      <div className="text-xs text-slate-500">
                        {language === 'de' ? 'Fällig:' : 'Due:'} {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar Integration */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">
              {language === 'de' ? 'Google Kalender' : 'Google Calendar'}
            </h2>
          </div>
          <div className="p-4">
            {isCalendarConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{language === 'de' ? 'Verbunden' : 'Connected'}</span>
                </div>
                <button
                  onClick={syncCalendar}
                  className="w-full py-2 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {language === 'de' ? 'Jetzt synchronisieren' : 'Sync Now'}
                </button>
                {calendarEvents.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {calendarEvents.slice(0, 3).map(event => (
                      <div key={event.id} className="text-sm p-2 bg-slate-50 rounded">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(event.start).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectCalendar}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-9 15h-3v-3h3v3zm0-4.5h-3v-3h3v3zm0-4.5h-3V6h3v3zm4.5 9h-3v-3h3v3zm0-4.5h-3v-3h3v3zm0-4.5h-3V6h3v3zm4.5 9h-3v-3h3v3zm0-4.5h-3v-3h3v3zm0-4.5h-3V6h3v3z"/>
                </svg>
                {language === 'de' ? 'Mit Google Kalender verbinden' : 'Connect Google Calendar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView('crm-contacts')}
          className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
        >
          <div className="text-lg font-semibold">{language === 'de' ? 'Kontakte verwalten' : 'Manage Contacts'}</div>
          <div className="text-sm opacity-80">{contacts.length} {language === 'de' ? 'Kontakte' : 'contacts'}</div>
        </button>
        <button
          onClick={() => setCurrentView('crm-meetings')}
          className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
        >
          <div className="text-lg font-semibold">{language === 'de' ? 'Meetings & Transkripte' : 'Meetings & Transcripts'}</div>
          <div className="text-sm opacity-80">{meetings.length} {language === 'de' ? 'Meetings' : 'meetings'}</div>
        </button>
        <button
          onClick={() => setCurrentView('crm-tasks')}
          className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
        >
          <div className="text-lg font-semibold">{language === 'de' ? 'Aufgaben' : 'Tasks'}</div>
          <div className="text-sm opacity-80">{pendingTasks.length} {language === 'de' ? 'offen' : 'pending'}</div>
        </button>
      </div>
    </div>
  );
}
