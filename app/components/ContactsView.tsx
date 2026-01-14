'use client';

import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { usePlanning } from '../context/PlanningContext';
import { CRMContact } from '../types';

export default function ContactsView() {
  const { contacts, addContact, updateContact, deleteContact, interactions, addInteraction, meetings } = useCRM();
  const { language } = usePlanning();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState('');

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

  const contactInteractions = selectedContact
    ? interactions.filter(i => i.contactId === selectedContact.id)
    : [];

  const contactMeetings = selectedContact
    ? meetings.filter(m => m.attendeeIds.includes(selectedContact.id))
    : [];

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
    </div>
  );
}
