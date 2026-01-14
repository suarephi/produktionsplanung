'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { CRMContact, CRMMeeting, CRMTask, CRMInteraction, AIRecommendation, CalendarEvent } from '../types';

interface CRMContextType {
  // Contacts
  contacts: CRMContact[];
  addContact: (contact: CRMContact) => void;
  updateContact: (id: string, updates: Partial<CRMContact>) => void;
  deleteContact: (id: string) => void;

  // Meetings
  meetings: CRMMeeting[];
  addMeeting: (meeting: CRMMeeting) => void;
  updateMeeting: (id: string, updates: Partial<CRMMeeting>) => void;
  deleteMeeting: (id: string) => void;

  // Tasks
  crmTasks: CRMTask[];
  addCRMTask: (task: CRMTask) => void;
  updateCRMTask: (id: string, updates: Partial<CRMTask>) => void;
  deleteCRMTask: (id: string) => void;

  // Interactions
  interactions: CRMInteraction[];
  addInteraction: (interaction: CRMInteraction) => void;

  // AI Recommendations
  recommendations: AIRecommendation[];
  refreshRecommendations: () => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  syncCalendar: () => Promise<void>;
  isCalendarConnected: boolean;
  connectCalendar: () => void;
  disconnectCalendar: () => void;

  // Search
  searchContacts: (query: string) => CRMContact[];

  // Telegram
  sendTelegramMessage: (message: string) => Promise<boolean>;
  isTelegramConnected: boolean;
  checkTelegramStatus: () => Promise<void>;
}

const CRM_STORAGE_KEYS = {
  contacts: 'crm_contacts',
  meetings: 'crm_meetings',
  tasks: 'crm_tasks',
  interactions: 'crm_interactions',
  calendarConnected: 'crm_calendar_connected',
};

// Sample data
const sampleContacts: CRMContact[] = [
  {
    id: 'c1',
    name: 'Anna Schmidt',
    email: 'anna.schmidt@techcorp.de',
    phone: '+49 170 1234567',
    company: 'TechCorp GmbH',
    role: 'Product Manager',
    tags: ['priority', 'tech'],
    notes: 'Key decision maker for Q1 project',
    createdAt: '2024-01-15',
    lastInteraction: '2024-07-20',
  },
  {
    id: 'c2',
    name: 'Max Weber',
    email: 'max.weber@industrial.com',
    phone: '+49 171 9876543',
    company: 'Industrial Solutions',
    role: 'CEO',
    tags: ['executive', 'manufacturing'],
    notes: 'Interested in automation solutions',
    createdAt: '2024-02-10',
    lastInteraction: '2024-06-15',
  },
  {
    id: 'c3',
    name: 'Lisa Müller',
    email: 'lisa.mueller@startup.io',
    company: 'StartUp.io',
    role: 'CTO',
    tags: ['tech', 'startup'],
    notes: 'Met at conference, follow up on API discussion',
    createdAt: '2024-03-05',
    lastInteraction: '2024-08-01',
  },
];

const sampleMeetings: CRMMeeting[] = [
  {
    id: 'm1',
    title: 'Q1 Planning Review',
    date: '2024-08-15T10:00:00',
    duration: 60,
    attendeeIds: ['c1', 'c3'],
    transcript: 'Discussed product roadmap and integration timeline. Anna mentioned budget approval pending. Lisa raised concerns about API compatibility.',
    summary: 'Reviewed Q1 plans, budget pending, API concerns raised',
    actionItems: ['Send API documentation to Lisa', 'Follow up on budget approval'],
    topics: ['roadmap', 'budget', 'API', 'integration'],
    status: 'completed',
  },
  {
    id: 'm2',
    title: 'Partnership Discussion',
    date: '2024-08-20T14:00:00',
    duration: 45,
    attendeeIds: ['c2'],
    summary: 'Initial partnership exploration',
    actionItems: ['Prepare proposal document'],
    topics: ['partnership', 'automation', 'manufacturing'],
    status: 'scheduled',
  },
];

const sampleTasks: CRMTask[] = [
  {
    id: 't1',
    title: 'Send API documentation',
    contactId: 'c3',
    meetingId: 'm1',
    dueDate: '2024-08-18',
    priority: 'high',
    status: 'todo',
    createdAt: '2024-08-15',
  },
  {
    id: 't2',
    title: 'Follow up on budget approval',
    contactId: 'c1',
    dueDate: '2024-08-22',
    priority: 'medium',
    status: 'todo',
    createdAt: '2024-08-15',
  },
];

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<CRMContact[]>(sampleContacts);
  const [meetings, setMeetings] = useState<CRMMeeting[]>(sampleMeetings);
  const [crmTasks, setCRMTasks] = useState<CRMTask[]>(sampleTasks);
  const [interactions, setInteractions] = useState<CRMInteraction[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const loadData = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T>>, defaultValue: T) => {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setter(JSON.parse(saved) as T);
        } catch {
          setter(defaultValue);
        }
      }
    };

    loadData<CRMContact[]>(CRM_STORAGE_KEYS.contacts, setContacts, sampleContacts);
    loadData<CRMMeeting[]>(CRM_STORAGE_KEYS.meetings, setMeetings, sampleMeetings);
    loadData<CRMTask[]>(CRM_STORAGE_KEYS.tasks, setCRMTasks, sampleTasks);
    loadData<CRMInteraction[]>(CRM_STORAGE_KEYS.interactions, setInteractions, []);

    // Check for existing Google token
    const accessToken = localStorage.getItem('google_access_token');
    setIsCalendarConnected(!!accessToken);

    setIsHydrated(true);
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const hash = window.location.hash;

    // Check if this is an OAuth callback
    if (url.searchParams.get('google_auth') === 'success' && hash.includes('tokens=')) {
      try {
        const tokensBase64 = hash.split('tokens=')[1];
        const tokensJson = atob(tokensBase64);
        const tokens = JSON.parse(tokensJson);

        // Store tokens
        localStorage.setItem('google_access_token', tokens.access_token);
        if (tokens.refresh_token) {
          localStorage.setItem('google_refresh_token', tokens.refresh_token);
        }
        localStorage.setItem('google_email', tokens.email || '');

        setIsCalendarConnected(true);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to parse Google tokens:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CRM_STORAGE_KEYS.contacts, JSON.stringify(contacts));
    }
  }, [contacts, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CRM_STORAGE_KEYS.meetings, JSON.stringify(meetings));
    }
  }, [meetings, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CRM_STORAGE_KEYS.tasks, JSON.stringify(crmTasks));
    }
  }, [crmTasks, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CRM_STORAGE_KEYS.interactions, JSON.stringify(interactions));
    }
  }, [interactions, isHydrated]);

  // Contact operations
  const addContact = useCallback((contact: CRMContact) => {
    setContacts(prev => [...prev, contact]);
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<CRMContact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  // Meeting operations
  const addMeeting = useCallback((meeting: CRMMeeting) => {
    setMeetings(prev => [...prev, meeting]);
  }, []);

  const updateMeeting = useCallback((id: string, updates: Partial<CRMMeeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  }, []);

  // Task operations
  const addCRMTask = useCallback((task: CRMTask) => {
    setCRMTasks(prev => [...prev, task]);
  }, []);

  const updateCRMTask = useCallback((id: string, updates: Partial<CRMTask>) => {
    setCRMTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteCRMTask = useCallback((id: string) => {
    setCRMTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // Interaction operations
  const addInteraction = useCallback((interaction: CRMInteraction) => {
    setInteractions(prev => [...prev, interaction]);
    // Update contact's lastInteraction
    updateContact(interaction.contactId, { lastInteraction: interaction.date });
  }, [updateContact]);

  // AI Recommendations - calculates who to reach out to
  const recommendations = useMemo((): AIRecommendation[] => {
    const now = new Date();
    const recs: AIRecommendation[] = [];

    contacts.forEach(contact => {
      // Time-based recommendations
      if (contact.lastInteraction) {
        const lastDate = new Date(contact.lastInteraction);
        const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince > 30) {
          recs.push({
            contactId: contact.id,
            reason: `No contact for ${daysSince} days`,
            priority: Math.min(10, Math.floor(daysSince / 10)),
            suggestedAction: 'Schedule a catch-up call or send a check-in email',
            basedOn: 'time_gap',
          });
        }
      }

      // Task-based recommendations
      const pendingTasks = crmTasks.filter(t => t.contactId === contact.id && t.status !== 'done');
      if (pendingTasks.length > 0) {
        const overdue = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
        if (overdue.length > 0) {
          recs.push({
            contactId: contact.id,
            reason: `${overdue.length} overdue task(s)`,
            priority: 9,
            suggestedAction: `Complete: ${overdue[0].title}`,
            basedOn: 'task_pending',
          });
        }
      }
    });

    // Meeting topic-based recommendations
    meetings.forEach(meeting => {
      if (meeting.status === 'completed' && meeting.actionItems.length > 0) {
        meeting.attendeeIds.forEach(contactId => {
          const hasOpenAction = meeting.actionItems.some(action => {
            const relatedTask = crmTasks.find(t =>
              t.meetingId === meeting.id &&
              t.contactId === contactId &&
              t.status !== 'done'
            );
            return relatedTask;
          });

          if (hasOpenAction) {
            recs.push({
              contactId,
              reason: `Open action items from "${meeting.title}"`,
              priority: 7,
              suggestedAction: `Follow up on meeting action items`,
              basedOn: 'meeting_topic',
            });
          }
        });
      }
    });

    // Sort by priority descending
    return recs.sort((a, b) => b.priority - a.priority);
  }, [contacts, meetings, crmTasks]);

  const refreshRecommendations = useCallback(() => {
    // Recommendations are computed via useMemo, this is a no-op trigger
    // In a real app, this could trigger an API call
  }, []);

  // Calendar integration with real Google OAuth
  const connectCalendar = useCallback(async () => {
    try {
      // Fetch the Google OAuth URL from our API
      const response = await fetch('/api/google/auth');
      const data = await response.json();

      if (data.url) {
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        console.error('Failed to get Google auth URL');
      }
    } catch (error) {
      console.error('Google auth error:', error);
    }
  }, []);

  const disconnectCalendar = useCallback(() => {
    setIsCalendarConnected(false);
    setCalendarEvents([]);
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.setItem(CRM_STORAGE_KEYS.calendarConnected, 'false');
  }, []);

  const syncCalendar = useCallback(async () => {
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) return;

    try {
      const response = await fetch('/api/google/calendar', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, disconnect
          disconnectCalendar();
        }
        return;
      }

      const data = await response.json();
      setCalendarEvents(data.events || []);
    } catch (error) {
      console.error('Calendar sync error:', error);
    }
  }, [disconnectCalendar]);

  // Search
  const searchContacts = useCallback((query: string): CRMContact[] => {
    const lower = query.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower) ||
      c.company?.toLowerCase().includes(lower) ||
      c.tags.some(t => t.toLowerCase().includes(lower))
    );
  }, [contacts]);

  // Telegram integration
  const checkTelegramStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/telegram');
      const data = await response.json();
      setIsTelegramConnected(data.connected || false);
    } catch {
      setIsTelegramConnected(false);
    }
  }, []);

  const sendTelegramMessage = useCallback(async (message: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      return data.success || false;
    } catch {
      return false;
    }
  }, []);

  // Check Telegram status on mount
  useEffect(() => {
    checkTelegramStatus();
  }, [checkTelegramStatus]);

  return (
    <CRMContext.Provider
      value={{
        contacts,
        addContact,
        updateContact,
        deleteContact,
        meetings,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        crmTasks,
        addCRMTask,
        updateCRMTask,
        deleteCRMTask,
        interactions,
        addInteraction,
        recommendations,
        refreshRecommendations,
        calendarEvents,
        syncCalendar,
        isCalendarConnected,
        connectCalendar,
        disconnectCalendar,
        searchContacts,
        sendTelegramMessage,
        isTelegramConnected,
        checkTelegramStatus,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
