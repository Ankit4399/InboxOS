'use client';

import { useState, useEffect, useCallback } from 'react';

type CalendarEvent = {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location: string;
  htmlLink: string;
  status: string;
  organizer: string;
};

function formatEventTime(startStr: string, isAllDay: boolean): string {
  if (isAllDay) return 'All Day';
  const date = new Date(startStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
}

function isEventNow(start: string, end: string): boolean {
  const now = new Date();
  return new Date(start) <= now && now <= new Date(end);
}

export default function CalendarClient() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/calendar-events', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch events');
        setConnected(data.connected ?? false);
        return;
      }

      setEvents(data.events || []);
      setConnected(data.connected);
      setError(null);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch + polling every 3 seconds for near-instant real-time updates
  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => fetchEvents(), 3000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-espresso/12 bg-paper p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-espresso/8 pb-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Calendar</h2>
            <p className="text-xs text-espresso/50 mt-0.5">Loading events…</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-xl bg-cream/20 border border-espresso/5 animate-pulse">
              <div className="h-3 bg-espresso/10 rounded w-2/3 mb-3" />
              <div className="h-2.5 bg-espresso/8 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (connected === false) {
    return (
      <div className="rounded-2xl border border-espresso/12 bg-paper p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-espresso/8 pb-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Calendar</h2>
            <p className="text-xs text-espresso/50 mt-0.5">Your upcoming events</p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-espresso/15 bg-cream/10 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-sage/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-sage">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-espresso/60 mb-4">
            Connect Google Calendar to sync your schedule.
          </p>
          <a
            href="/dashboard/connect-google"
            className="inline-flex w-full items-center justify-center rounded-lg bg-espresso px-3 py-2 text-xs font-semibold text-paper hover:bg-sage transition-colors shadow-sm"
          >
            Connect Calendar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-espresso/12 bg-paper p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-espresso/8 pb-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold">Calendar</h2>
          <p className="text-xs text-espresso/50 mt-0.5">
            {error ? (
              <span className="text-terracotta">{error}</span>
            ) : (
              <>Your upcoming events</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchEvents(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-md hover:bg-cream transition-colors disabled:opacity-50"
            title="Refresh events"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-3.5 h-3.5 text-espresso/50 ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Sync Active" />
        </div>
      </div>

      {/* Events List */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map(event => {
            const happeningNow = !event.isAllDay && isEventNow(event.start, event.end);
            return (
              <a
                key={event.id}
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                  happeningNow
                    ? 'bg-sage/5 border-sage/25 shadow-sm ring-1 ring-sage/10'
                    : 'bg-cream/20 border-espresso/5 hover:bg-cream/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-espresso">{event.summary}</p>
                  {happeningNow && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-bold text-sage whitespace-nowrap shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-sage animate-pulse" />
                      NOW
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-espresso/60">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                  <span>{formatEventTime(event.start, event.isAllDay)}</span>
                </div>
                {event.location && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-espresso/55">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
                {event.organizer && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-espresso/45">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span className="truncate">{event.organizer}</span>
                  </div>
                )}
              </a>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-espresso/15 bg-cream/10 p-6 text-center">
          <p className="text-xs text-espresso/60">No upcoming events this week.</p>
        </div>
      )}
    </div>
  );
}
