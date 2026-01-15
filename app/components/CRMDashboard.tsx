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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return language === 'de' ? 'Heute' : 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return language === 'de' ? 'Morgen' : 'Tomorrow';
    }
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          {language === 'de' ? 'Dashboard' : 'Dashboard'}
        </h1>
        <p className="mt-1 text-slate-500">
          {language === 'de' ? 'Überblick über Ihre Kundenbeziehungen' : 'Overview of your customer relationships'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{language === 'de' ? 'Kontakte' : 'Contacts'}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">{contacts.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Meetings</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">{upcomingMeetings.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{language === 'de' ? 'Aufgaben' : 'Tasks'}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">{pendingTasks.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{language === 'de' ? 'Empfehlungen' : 'To Reach Out'}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">{recommendations.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-900">
                {language === 'de' ? 'Kontaktempfehlungen' : 'Recommended Actions'}
              </h2>
            </div>
            {isTelegramConnected && recommendations.length > 0 && (
              <button
                onClick={sendRecommendationsToTelegram}
                disabled={sendingTelegram}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                {sendingTelegram ? 'Sending...' : 'Send to Telegram'}
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100">
            {recommendations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-500">{language === 'de' ? 'Alle Kontakte sind aktuell' : 'All contacts are up to date'}</p>
              </div>
            ) : (
              recommendations.slice(0, 5).map((rec, idx) => {
                const contact = getContact(rec.contactId);
                if (!contact) return null;
                return (
                  <div key={idx} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{contact.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            rec.priority >= 8 ? 'bg-red-100 text-red-700' :
                            rec.priority >= 5 ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {rec.basedOn === 'time_gap' ? (language === 'de' ? 'Überfällig' : 'Overdue') :
                             rec.basedOn === 'task_pending' ? (language === 'de' ? 'Aufgabe' : 'Task') :
                             (language === 'de' ? 'Follow-up' : 'Follow-up')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{rec.reason}</p>
                        <p className="text-sm text-slate-400 mt-1">{rec.suggestedAction}</p>
                      </div>
                      <button
                        onClick={() => setCurrentView('crm-contacts')}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex-shrink-0"
                      >
                        {language === 'de' ? 'Ansehen' : 'View'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                {language === 'de' ? 'Nächste Meetings' : 'Upcoming'}
              </h2>
              <button
                onClick={() => setCurrentView('crm-meetings')}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                {language === 'de' ? 'Alle' : 'All'}
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingMeetings.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 text-sm">
                  {language === 'de' ? 'Keine anstehenden Meetings' : 'No upcoming meetings'}
                </div>
              ) : (
                upcomingMeetings.slice(0, 3).map(meeting => (
                  <div key={meeting.id} className="px-6 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-emerald-600">
                          {formatDate(meeting.date).slice(0, 3)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{meeting.title}</p>
                        <p className="text-xs text-slate-500">{meeting.duration} min</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Calendar Connection */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Google Calendar</h2>
            </div>
            <div className="p-6">
              {isCalendarConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{language === 'de' ? 'Verbunden' : 'Connected'}</span>
                  </div>
                  <button
                    onClick={syncCalendar}
                    className="w-full py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    {language === 'de' ? 'Synchronisieren' : 'Sync Now'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectCalendar}
                  className="w-full py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {language === 'de' ? 'Verbinden' : 'Connect Calendar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setCurrentView('crm-contacts')}
          className="group p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-900 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">{language === 'de' ? 'Kontakte' : 'Contacts'}</p>
              <p className="text-sm text-slate-500">{contacts.length} {language === 'de' ? 'Personen' : 'people'}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('crm-meetings')}
          className="group p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">Meetings</p>
              <p className="text-sm text-slate-500">{language === 'de' ? 'Transkripte & Notizen' : 'Transcripts & Notes'}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCurrentView('crm-tasks')}
          className="group p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-500 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">{language === 'de' ? 'Aufgaben' : 'Tasks'}</p>
              <p className="text-sm text-slate-500">{pendingTasks.length} {language === 'de' ? 'offen' : 'pending'}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
