'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { usePlanning } from '../context/PlanningContext';

export default function CalendarView() {
  const { meetings, crmTasks, contacts, calendarEvents, isCalendarConnected, connectCalendar, syncCalendar } = useCRM();
  const { language, setCurrentView } = usePlanning();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Sync calendar events on mount if connected
  useEffect(() => {
    if (isCalendarConnected) {
      syncCalendar();
    }
  }, [isCalendarConnected, syncCalendar]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = language === 'de'
    ? ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = language === 'de'
    ? ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    const dayMeetings = meetings.filter(m => m.date.startsWith(dateStr));
    const dayTasks = crmTasks.filter(t => t.dueDate === dateStr && t.status !== 'done');
    const dayCalendarEvents = calendarEvents.filter(e => e.start.startsWith(dateStr));

    return { meetings: dayMeetings, tasks: dayTasks, calendarEvents: dayCalendarEvents };
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : null;

  const getContact = (id: string) => contacts.find(c => c.id === id);

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const events = getEventsForDate(date);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const hasEvents = events.meetings.length > 0 || events.tasks.length > 0 || events.calendarEvents.length > 0;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 p-2 border border-slate-100 text-left transition-colors ${
            isSelected ? 'bg-blue-100 border-blue-300' :
            isToday ? 'bg-yellow-50' : 'bg-white hover:bg-slate-50'
          }`}
        >
          <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
            {day}
          </div>
          <div className="mt-1 space-y-0.5 overflow-hidden">
            {events.meetings.slice(0, 2).map(m => (
              <div key={m.id} className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded truncate">
                {m.title}
              </div>
            ))}
            {events.calendarEvents.slice(0, 2 - events.meetings.length).map(e => (
              <div key={e.id} className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate">
                {e.title}
              </div>
            ))}
            {events.tasks.length > 0 && events.meetings.length + events.calendarEvents.length < 2 && (
              <div className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded truncate">
                {events.tasks.length} {language === 'de' ? 'Aufgabe(n)' : 'task(s)'}
              </div>
            )}
            {hasEvents && events.meetings.length + events.calendarEvents.length + (events.tasks.length > 0 ? 1 : 0) > 2 && (
              <div className="text-xs text-slate-500">+{language === 'de' ? 'mehr' : 'more'}</div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {language === 'de' ? 'Kalender' : 'Calendar'}
        </h1>
        <div className="flex items-center gap-3">
          {!isCalendarConnected && (
            <button
              onClick={connectCalendar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z"/>
              </svg>
              {language === 'de' ? 'Google Kalender verbinden' : 'Connect Google Calendar'}
            </button>
          )}
          {isCalendarConnected && (
            <button
              onClick={syncCalendar}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
            >
              {language === 'de' ? 'Synchronisieren' : 'Sync'}
            </button>
          )}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
          >
            {language === 'de' ? 'Heute' : 'Today'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 bg-slate-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1">
          {selectedDate ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">
                  {selectedDate.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h3>
              </div>
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {/* CRM Meetings */}
                {selectedDateEvents?.meetings && selectedDateEvents.meetings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 mb-2">
                      {language === 'de' ? 'CRM Meetings' : 'CRM Meetings'}
                    </h4>
                    <div className="space-y-2">
                      {selectedDateEvents.meetings.map(meeting => (
                        <div
                          key={meeting.id}
                          onClick={() => setCurrentView('crm-meetings')}
                          className="p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500 cursor-pointer hover:bg-green-100"
                        >
                          <div className="font-medium text-slate-800 text-sm">{meeting.title}</div>
                          <div className="text-xs text-slate-600">{meeting.duration} min</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {meeting.attendeeIds.slice(0, 2).map(id => {
                              const contact = getContact(id);
                              return contact ? (
                                <span key={id} className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  {contact.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Calendar Events */}
                {selectedDateEvents?.calendarEvents && selectedDateEvents.calendarEvents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z"/>
                      </svg>
                      Google Calendar
                    </h4>
                    <div className="space-y-2">
                      {selectedDateEvents.calendarEvents.map(event => (
                        <div key={event.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                          <div className="font-medium text-slate-800 text-sm">{event.title}</div>
                          <div className="text-xs text-slate-600">
                            {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks Due */}
                {selectedDateEvents?.tasks && selectedDateEvents.tasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-600 mb-2">
                      {language === 'de' ? 'Fällige Aufgaben' : 'Tasks Due'}
                    </h4>
                    <div className="space-y-2">
                      {selectedDateEvents.tasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => setCurrentView('crm-tasks')}
                          className="p-3 bg-orange-50 rounded-lg border-l-4 border-l-orange-500 cursor-pointer hover:bg-orange-100"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                            }`} />
                            <div className="font-medium text-slate-800 text-sm">{task.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!selectedDateEvents?.meetings.length && !selectedDateEvents?.calendarEvents.length && !selectedDateEvents?.tasks.length) && (
                  <p className="text-slate-500 text-center py-8">
                    {language === 'de' ? 'Keine Termine an diesem Tag' : 'No events on this day'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-500">
                {language === 'de' ? 'Tag auswählen für Details' : 'Select a day for details'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
