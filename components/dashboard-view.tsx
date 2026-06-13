'use client';

import { useState } from 'react';
import InboxClient from './inbox-client';
import CalendarClient from './calendar-client';

type DashboardViewProps = {
  isGmailConnected: boolean;
  isCalendarConnected: boolean;
};

export default function DashboardView({
  isGmailConnected,
  isCalendarConnected,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'mail' | 'calendar' | 'split'>('mail');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-espresso/8 pb-px gap-2">
        <button
          onClick={() => setActiveTab('mail')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px rounded-t-lg ${
            activeTab === 'mail'
              ? 'border-terracotta text-terracotta bg-paper/50'
              : 'border-transparent text-espresso/50 hover:text-espresso/80 hover:bg-cream/40'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          Mail
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px rounded-t-lg ${
            activeTab === 'calendar'
              ? 'border-sage text-sage bg-paper/50'
              : 'border-transparent text-espresso/50 hover:text-espresso/80 hover:bg-cream/40'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('split')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px rounded-t-lg ${
            activeTab === 'split'
              ? 'border-espresso text-espresso bg-paper/50'
              : 'border-transparent text-espresso/50 hover:text-espresso/80 hover:bg-cream/40'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-12-15h12a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
          </svg>
          Split View
        </button>
      </div>

      {/* View Content */}
      <div className="mt-6">
        {activeTab === 'mail' && (
          <div className="animate-fade-in-up">
            <InboxClient />
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="animate-fade-in-up">
            <CalendarClient />
          </div>
        )}
        {activeTab === 'split' && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6 animate-fade-in-up">
              <InboxClient />
            </div>
            <div className="lg:col-span-1 space-y-6 animate-fade-in-up">
              <CalendarClient />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
