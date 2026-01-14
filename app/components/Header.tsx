'use client';

import { useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { ViewType } from '../types';

export default function Header() {
  const { currentView, setCurrentView, language, setLanguage, t } = usePlanning();
  const [showCRMDropdown, setShowCRMDropdown] = useState(false);

  const views: { id: ViewType; label: string }[] = [
    { id: 'overview', label: t('view.overview') },
    { id: 'personal', label: t('view.personal') },
    { id: 'machine', label: t('view.machine') },
    { id: 'capacity', label: t('view.capacity') },
    { id: 'schedule', label: t('view.schedule') },
    { id: 'settings', label: t('view.settings') },
  ];

  const crmViews: { id: ViewType; label: string }[] = [
    { id: 'crm', label: 'Dashboard' },
    { id: 'crm-contacts', label: language === 'de' ? 'Kontakte' : 'Contacts' },
    { id: 'crm-meetings', label: 'Meetings' },
    { id: 'crm-tasks', label: language === 'de' ? 'Aufgaben' : 'Tasks' },
  ];

  const isCRMView = currentView.startsWith('crm');

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">{t('app.title')}</h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === view.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {view.label}
              </button>
            ))}
            {/* CRM Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCRMDropdown(!showCRMDropdown)}
                onBlur={() => setTimeout(() => setShowCRMDropdown(false), 200)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                  isCRMView
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                CRM
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCRMDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg shadow-xl py-1 min-w-40 z-50">
                  {crmViews.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => {
                        setCurrentView(view.id);
                        setShowCRMDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        currentView === view.id
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
            >
              <span className="text-lg">{language === 'de' ? '🇩🇪' : '🇬🇧'}</span>
              <span className="font-medium">{language.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex flex-wrap gap-2">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === view.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 bg-slate-800'
                }`}
              >
                {view.label}
              </button>
            ))}
            {crmViews.map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === view.id
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 bg-slate-800'
                }`}
              >
                CRM: {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
