'use client';

import { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { usePlanning } from '../context/PlanningContext';
import { CRMContact } from '../types';

interface Email {
  id: string;
  threadId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  snippet: string;
  date: string;
  isSent: boolean;
}

export default function ContactsView() {
  const { contacts, addContact, updateContact, deleteContact, interactions, addInteraction, meetings, isCalendarConnected, sendTelegramMessage, isTelegramConnected } = useCRM();
  const { language } = usePlanning();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  // Email compose state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [editForm, setEditForm] = useState<Partial<CRMContact>>({});

  const handleSaveContact = () => {
    if (isEditing && selectedContact) {
      updateContact(selectedContact.id, editForm);
      setSelectedContact({ ...selectedContact, ...editForm });
    } else if (showAddModal) {
      const newContact: CRMContact = {
        id: `c${Date.now()}`,
        name: editForm.name || '',
        email: editForm.email || '',
        phone: editForm.phone,
        company: editForm.company,
        role: editForm.role,
        tags: editForm.tags || [],
        notes: editForm.notes || '',
        createdAt: new Date().toISOString().split('T')[0],
      };
      addContact(newContact);
      setShowAddModal(false);
    }
    setIsEditing(false);
    setEditForm({});
  };

  const handleAddNote = () => {
    if (selectedContact && newNote.trim()) {
      addInteraction({
        id: `i${Date.now()}`,
        contactId: selectedContact.id,
        type: 'note',
        date: new Date().toISOString(),
        summary: newNote,
      });
      setNewNote('');
    }
  };

  // Send email via Gmail API
  const handleSendEmail = async () => {
    if (!selectedContact || !emailSubject.trim() || !emailBody.trim()) return;

    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
      setEmailError(language === 'de' ? 'Bitte Google-Konto verbinden' : 'Please connect Google account');
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(false);

    try {
      const response = await fetch('/api/google/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: selectedContact.email,
          subject: emailSubject,
          message: emailBody,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send');
      }

      // Log interaction
      addInteraction({
        id: `i${Date.now()}`,
        contactId: selectedContact.id,
        type: 'email',
        date: new Date().toISOString(),
        summary: `Sent: ${emailSubject}`,
      });

      setEmailSuccess(true);
      setTimeout(() => {
        setShowComposeModal(false);
        setEmailSubject('');
        setEmailBody('');
        setEmailSuccess(false);
      }, 1500);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Send message via Telegram
  const handleSendTelegram = async (message: string) => {
    if (!selectedContact) return;

    const fullMessage = `<b>Message to ${selectedContact.name}</b>\n\n${message}`;
    const success = await sendTelegramMessage(fullMessage);

    if (success) {
      addInteraction({
        id: `i${Date.now()}`,
        contactId: selectedContact.id,
        type: 'note',
        date: new Date().toISOString(),
        summary: `Telegram: ${message.substring(0, 50)}...`,
      });
    }
    return success;
  };

  const contactInteractions = selectedContact
    ? interactions.filter(i => i.contactId === selectedContact.id)
    : [];

  const contactMeetings = selectedContact
    ? meetings.filter(m => m.attendeeIds.includes(selectedContact.id))
    : [];

  // Fetch emails when contact is selected and Gmail is connected
  useEffect(() => {
    const fetchEmails = async () => {
      if (!selectedContact || !isCalendarConnected) {
        setEmails([]);
        return;
      }

      const accessToken = localStorage.getItem('google_access_token');
      if (!accessToken) return;

      setLoadingEmails(true);
      try {
        const response = await fetch(`/api/google/gmail?contact=${encodeURIComponent(selectedContact.email)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setEmails(data.emails || []);
        }
      } catch (error) {
        console.error('Failed to fetch emails:', error);
      } finally {
        setLoadingEmails(false);
      }
    };

    fetchEmails();
  }, [selectedContact, isCalendarConnected]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {language === 'de' ? 'Kontakte' : 'Contacts'}
        </h1>
        <button
          onClick={() => {
            setEditForm({});
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + {language === 'de' ? 'Kontakt hinzufügen' : 'Add Contact'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <input
              type="text"
              placeholder={language === 'de' ? 'Suchen...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setIsEditing(false);
                }}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="font-medium text-slate-800">{contact.name}</div>
                <div className="text-sm text-slate-500">{contact.company}</div>
                <div className="text-xs text-slate-400 mt-1">{contact.email}</div>
                {contact.lastInteraction && (
                  <div className="text-xs text-slate-400 mt-1">
                    {language === 'de' ? 'Letzter Kontakt:' : 'Last contact:'} {new Date(contact.lastInteraction).toLocaleDateString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Detail */}
        <div className="lg:col-span-2">
          {selectedContact ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name ?? selectedContact.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="text-2xl font-bold text-slate-800 border-b border-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-slate-800">{selectedContact.name}</h2>
                    )}
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.role ?? selectedContact.role ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        placeholder="Role"
                        className="text-slate-600 border-b border-slate-300 focus:outline-none focus:border-blue-500 mt-1"
                      />
                    ) : (
                      <p className="text-slate-600">{selectedContact.role} {selectedContact.company && `@ ${selectedContact.company}`}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveContact}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm({});
                          }}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm"
                        >
                          {language === 'de' ? 'Abbrechen' : 'Cancel'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setEditForm(selectedContact);
                          }}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                        >
                          {language === 'de' ? 'Bearbeiten' : 'Edit'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(language === 'de' ? 'Kontakt löschen?' : 'Delete contact?')) {
                              deleteContact(selectedContact.id);
                              setSelectedContact(null);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                        >
                          {language === 'de' ? 'Löschen' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions - Send Message */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {isCalendarConnected && (
                    <button
                      onClick={() => {
                        setEmailSubject('');
                        setEmailBody('');
                        setEmailError(null);
                        setShowComposeModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      {language === 'de' ? 'E-Mail senden' : 'Send Email'}
                    </button>
                  )}
                  {isTelegramConnected && (
                    <button
                      onClick={() => {
                        const message = prompt(language === 'de' ? 'Nachricht eingeben:' : 'Enter message:');
                        if (message) handleSendTelegram(message);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                      Telegram
                    </button>
                  )}
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    {language === 'de' ? 'Anrufen' : 'Call'}
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase">{language === 'de' ? 'E-Mail' : 'Email'}</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email ?? selectedContact.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full border-b border-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-slate-800">{selectedContact.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase">{language === 'de' ? 'Telefon' : 'Phone'}</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone ?? selectedContact.phone ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full border-b border-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-slate-800">{selectedContact.phone || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase">{language === 'de' ? 'Unternehmen' : 'Company'}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.company ?? selectedContact.company ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="w-full border-b border-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-slate-800">{selectedContact.company || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase">Tags</label>
                    <div className="flex gap-1 flex-wrap">
                      {selectedContact.tags.map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3">{language === 'de' ? 'Notizen' : 'Notes'}</h3>
                {isEditing ? (
                  <textarea
                    value={editForm.notes ?? selectedContact.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full h-24 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-slate-600">{selectedContact.notes || (language === 'de' ? 'Keine Notizen' : 'No notes')}</p>
                )}
              </div>

              {/* Add Quick Note */}
              <div className="p-6 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3">{language === 'de' ? 'Schnelle Notiz hinzufügen' : 'Add Quick Note'}</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={language === 'de' ? 'Notiz eingeben...' : 'Enter note...'}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Interaction History */}
              <div className="p-6">
                <h3 className="font-semibold text-slate-800 mb-3">{language === 'de' ? 'Verlauf' : 'History'}</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {contactMeetings.map(meeting => (
                    <div key={meeting.id} className="p-3 bg-green-50 rounded-lg border-l-4 border-l-green-500">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Meeting</span>
                        <span className="text-xs text-slate-500">{new Date(meeting.date).toLocaleDateString()}</span>
                      </div>
                      <div className="font-medium text-slate-800 mt-1">{meeting.title}</div>
                      {meeting.summary && <div className="text-sm text-slate-600">{meeting.summary}</div>}
                    </div>
                  ))}
                  {contactInteractions.map(interaction => (
                    <div key={interaction.id} className="p-3 bg-slate-50 rounded-lg border-l-4 border-l-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded capitalize">{interaction.type}</span>
                        <span className="text-xs text-slate-500">{new Date(interaction.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-slate-700 mt-1">{interaction.summary}</div>
                    </div>
                  ))}
                  {contactMeetings.length === 0 && contactInteractions.length === 0 && (
                    <p className="text-slate-500 text-center py-4">
                      {language === 'de' ? 'Keine Interaktionen' : 'No interactions yet'}
                    </p>
                  )}
                </div>
              </div>

              {/* Email History */}
              {isCalendarConnected && (
                <div className="p-6 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    {language === 'de' ? 'E-Mail-Verlauf' : 'Email History'}
                  </h3>
                  {loadingEmails ? (
                    <div className="text-center py-4 text-slate-500">
                      {language === 'de' ? 'Lädt E-Mails...' : 'Loading emails...'}
                    </div>
                  ) : emails.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">
                      {language === 'de' ? 'Keine E-Mails gefunden' : 'No emails found'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {emails.map(email => (
                        <div key={email.id} className={`p-3 rounded-lg border-l-4 ${
                          email.isSent ? 'bg-blue-50 border-l-blue-500' : 'bg-slate-50 border-l-slate-400'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              email.isSent ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {email.isSent ? (language === 'de' ? 'Gesendet' : 'Sent') : (language === 'de' ? 'Empfangen' : 'Received')}
                            </span>
                            <span className="text-xs text-slate-500">{new Date(email.date).toLocaleDateString()}</span>
                          </div>
                          <div className="font-medium text-slate-800 mt-1 text-sm">{email.subject || '(No subject)'}</div>
                          <div className="text-xs text-slate-600 mt-1 line-clamp-2">{email.snippet}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="text-slate-400 text-6xl mb-4">👤</div>
              <p className="text-slate-500">
                {language === 'de' ? 'Kontakt auswählen, um Details anzuzeigen' : 'Select a contact to view details'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {language === 'de' ? 'Neuer Kontakt' : 'New Contact'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Name' : 'Name'} *</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'E-Mail' : 'Email'} *</label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Telefon' : 'Phone'}</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Unternehmen' : 'Company'}</label>
                <input
                  type="text"
                  value={editForm.company || ''}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Rolle' : 'Role'}</label>
                <input
                  type="text"
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                onClick={handleSaveContact}
                disabled={!editForm.name || !editForm.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {language === 'de' ? 'Erstellen' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {showComposeModal && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {language === 'de' ? 'E-Mail verfassen' : 'Compose Email'}
              </h2>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'An' : 'To'}</label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg text-slate-600">
                  {selectedContact.name} &lt;{selectedContact.email}&gt;
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Betreff' : 'Subject'} *</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={language === 'de' ? 'Betreff eingeben...' : 'Enter subject...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'de' ? 'Nachricht' : 'Message'} *</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder={language === 'de' ? 'Nachricht eingeben...' : 'Enter your message...'}
                  rows={8}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {emailError && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {language === 'de' ? 'E-Mail gesendet!' : 'Email sent!'}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail || emailSuccess}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {language === 'de' ? 'Senden...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                    {language === 'de' ? 'Senden' : 'Send'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
