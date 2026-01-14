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
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CRMContact>>({});

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleSendEmail = async () => {
    if (!selectedContact || !emailSubject.trim() || !emailBody.trim()) return;
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
      setEmailError(language === 'de' ? 'Bitte Google-Konto verbinden' : 'Please connect Google account');
      return;
    }
    setSendingEmail(true);
    setEmailError(null);
    try {
      const response = await fetch('/api/google/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ to: selectedContact.email, subject: emailSubject, message: emailBody }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to send');
      addInteraction({ id: `i${Date.now()}`, contactId: selectedContact.id, type: 'email', date: new Date().toISOString(), summary: `Sent: ${emailSubject}` });
      setEmailSuccess(true);
      setTimeout(() => { setShowComposeModal(false); setEmailSubject(''); setEmailBody(''); setEmailSuccess(false); }, 1500);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const contactInteractions = selectedContact ? interactions.filter(i => i.contactId === selectedContact.id) : [];
  const contactMeetings = selectedContact ? meetings.filter(m => m.attendeeIds.includes(selectedContact.id)) : [];

  useEffect(() => {
    const fetchEmails = async () => {
      if (!selectedContact || !isCalendarConnected) { setEmails([]); return; }
      const accessToken = localStorage.getItem('google_access_token');
      if (!accessToken) return;
      setLoadingEmails(true);
      try {
        const response = await fetch(`/api/google/gmail?contact=${encodeURIComponent(selectedContact.email)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (response.ok) setEmails((await response.json()).emails || []);
      } catch {} finally { setLoadingEmails(false); }
    };
    fetchEmails();
  }, [selectedContact, isCalendarConnected]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{language === 'de' ? 'Kontakte' : 'Contacts'}</h1>
          <p className="mt-1 text-slate-500">{contacts.length} {language === 'de' ? 'Personen' : 'people'}</p>
        </div>
        <button onClick={() => { setEditForm({}); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {language === 'de' ? 'Neuer Kontakt' : 'Add Contact'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder={language === 'de' ? 'Suchen...' : 'Search...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" />
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filteredContacts.map(contact => (
              <button key={contact.id} onClick={() => { setSelectedContact(contact); setIsEditing(false); }} className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${selectedContact?.id === contact.id ? 'bg-slate-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-medium text-slate-600 flex-shrink-0">{getInitials(contact.name)}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                    <p className="text-sm text-slate-500 truncate">{contact.company || contact.email}</p>
                  </div>
                </div>
              </button>
            ))}
            {filteredContacts.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">{language === 'de' ? 'Keine Kontakte gefunden' : 'No contacts found'}</div>}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedContact ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xl font-semibold text-slate-600">{getInitials(selectedContact.name)}</div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{selectedContact.name}</h2>
                      <p className="text-slate-500">{selectedContact.role} {selectedContact.company && `at ${selectedContact.company}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <button onClick={() => { setIsEditing(true); setEditForm(selectedContact); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => { if (confirm(language === 'de' ? 'Kontakt löschen?' : 'Delete contact?')) { deleteContact(selectedContact.id); setSelectedContact(null); } }} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {isCalendarConnected && (
                    <button onClick={() => { setEmailSubject(''); setEmailBody(''); setEmailError(null); setShowComposeModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Email
                    </button>
                  )}
                  {selectedContact.phone && (
                    <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {language === 'de' ? 'Anrufen' : 'Call'}
                    </a>
                  )}
                  {isTelegramConnected && (
                    <button onClick={() => { const msg = prompt(language === 'de' ? 'Nachricht:' : 'Message:'); if (msg) sendTelegramMessage(`<b>${selectedContact.name}</b>\n${msg}`); }} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
                      Telegram
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 border-b border-slate-100">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Email</p>
                    {isEditing ? <input type="email" value={editForm.email ?? selectedContact.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /> : <p className="text-slate-900">{selectedContact.email}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{language === 'de' ? 'Telefon' : 'Phone'}</p>
                    {isEditing ? <input type="tel" value={editForm.phone ?? selectedContact.phone ?? ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /> : <p className="text-slate-900">{selectedContact.phone || '—'}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{language === 'de' ? 'Unternehmen' : 'Company'}</p>
                    {isEditing ? <input type="text" value={editForm.company ?? selectedContact.company ?? ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /> : <p className="text-slate-900">{selectedContact.company || '—'}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{language === 'de' ? 'Rolle' : 'Role'}</p>
                    {isEditing ? <input type="text" value={editForm.role ?? selectedContact.role ?? ''} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /> : <p className="text-slate-900">{selectedContact.role || '—'}</p>}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={handleSaveContact} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">{language === 'de' ? 'Speichern' : 'Save'}</button>
                    <button onClick={() => { setIsEditing(false); setEditForm({}); }} className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm">{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
                  </div>
                )}
              </div>

              <div className="p-6 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{language === 'de' ? 'Notizen' : 'Notes'}</p>
                <p className="text-slate-600 text-sm mb-4">{selectedContact.notes || (language === 'de' ? 'Keine Notizen' : 'No notes yet')}</p>
                <div className="flex gap-2">
                  <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder={language === 'de' ? 'Notiz hinzufügen...' : 'Add a note...'} className="flex-1 px-3 py-2 bg-slate-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" onKeyPress={(e) => e.key === 'Enter' && handleAddNote()} />
                  <button onClick={handleAddNote} disabled={!newNote.trim()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">+</button>
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">{language === 'de' ? 'Aktivität' : 'Activity'}</p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {contactMeetings.map(meeting => (
                    <div key={meeting.id} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0"><svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                      <div><p className="font-medium text-slate-900 text-sm">{meeting.title}</p><p className="text-xs text-slate-500">{new Date(meeting.date).toLocaleDateString()}</p></div>
                    </div>
                  ))}
                  {contactInteractions.slice().reverse().map(interaction => (
                    <div key={interaction.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg></div>
                      <div><p className="text-sm text-slate-700">{interaction.summary}</p><p className="text-xs text-slate-400">{new Date(interaction.date).toLocaleDateString()}</p></div>
                    </div>
                  ))}
                  {emails.slice(0, 5).map(email => (
                    <div key={email.id} className={`flex items-start gap-3 p-3 rounded-xl ${email.isSent ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${email.isSent ? 'bg-blue-100' : 'bg-slate-100'}`}><svg className={`w-4 h-4 ${email.isSent ? 'text-blue-600' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                      <div className="min-w-0"><p className="font-medium text-slate-900 text-sm truncate">{email.subject || '(No subject)'}</p><p className="text-xs text-slate-500 truncate">{email.snippet}</p></div>
                    </div>
                  ))}
                  {contactMeetings.length === 0 && contactInteractions.length === 0 && emails.length === 0 && <p className="text-center text-slate-400 text-sm py-4">{language === 'de' ? 'Keine Aktivität' : 'No activity yet'}</p>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
              <p className="text-slate-500">{language === 'de' ? 'Wählen Sie einen Kontakt' : 'Select a contact to view details'}</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100"><h2 className="text-xl font-semibold text-slate-900">{language === 'de' ? 'Neuer Kontakt' : 'New Contact'}</h2></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{language === 'de' ? 'Name' : 'Name'} *</label><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label><input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{language === 'de' ? 'Telefon' : 'Phone'}</label><input type="tel" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{language === 'de' ? 'Unternehmen' : 'Company'}</label><input type="text" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" /></div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setShowAddModal(false); setEditForm({}); }} className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium">{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
              <button onClick={handleSaveContact} disabled={!editForm.name || !editForm.email} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{language === 'de' ? 'Erstellen' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showComposeModal && selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{language === 'de' ? 'E-Mail verfassen' : 'Compose Email'}</h2>
              <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{language === 'de' ? 'An' : 'To'}</label><div className="px-3 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-600">{selectedContact.name} &lt;{selectedContact.email}&gt;</div></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{language === 'de' ? 'Betreff' : 'Subject'}</label><input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{language === 'de' ? 'Nachricht' : 'Message'}</label><textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={6} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none" /></div>
              {emailError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{emailError}</div>}
              {emailSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-center gap-2"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>{language === 'de' ? 'Gesendet!' : 'Sent!'}</div>}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowComposeModal(false)} className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium">{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
              <button onClick={handleSendEmail} disabled={!emailSubject.trim() || !emailBody.trim() || sendingEmail} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                {sendingEmail ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{language === 'de' ? 'Senden...' : 'Sending...'}</> : <>{language === 'de' ? 'Senden' : 'Send'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
