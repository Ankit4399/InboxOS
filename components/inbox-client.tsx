'use client';

import { useState, useEffect, useCallback } from 'react';

type Email = {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;
  internalDate: string;
  labelIds: string[];
  isUnread: boolean;
  isStarred: boolean;
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function InboxClient() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const fetchEmails = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/emails', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch emails');
        setConnected(data.connected ?? false);
        return;
      }

      setEmails(data.emails || []);
      setConnected(data.connected);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    fetchEmails();
    const interval = setInterval(() => fetchEmails(), 30000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-espresso/12 bg-paper p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-espresso/8 pb-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Your Inbox</h2>
            <p className="text-xs text-espresso/50 mt-0.5">Loading your messages…</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-cream/20 border border-espresso/5 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-espresso/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-espresso/10 rounded w-1/3" />
                <div className="h-3 bg-espresso/8 rounded w-2/3" />
                <div className="h-3 bg-espresso/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (connected === false) {
    return (
      <div className="rounded-2xl border border-espresso/12 bg-paper p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-espresso/8 pb-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Your Inbox</h2>
            <p className="text-xs text-espresso/50 mt-0.5">Connect Gmail to view messages</p>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-espresso/15 bg-cream/10 p-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-terracotta/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-terracotta">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-espresso/60 mb-6">
            Connect your Gmail account to read and manage emails directly from InboxOS.
          </p>
          <a
            href="/dashboard/connect-google"
            className="inline-flex items-center justify-center rounded-lg bg-espresso px-4 py-2.5 text-sm font-semibold text-paper hover:bg-terracotta transition-colors shadow-sm"
          >
            Connect Gmail
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-espresso/12 bg-paper p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-espresso/8 pb-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold">Your Inbox</h2>
          <p className="text-xs text-espresso/50 mt-0.5">
            {error ? (
              <span className="text-terracotta">{error}</span>
            ) : (
              <>Live synced messages from Gmail</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[10px] text-espresso/40 hidden sm:inline">
              Updated {timeAgo(lastRefreshed.toISOString())}
            </span>
          )}
          <button
            onClick={() => fetchEmails(true)}
            disabled={isRefreshing}
            className="group flex items-center gap-1.5 rounded-lg bg-cream px-2.5 py-1.5 text-xs font-semibold text-espresso/70 hover:bg-sand/60 transition-colors disabled:opacity-50"
            title="Refresh inbox"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-3.5 h-3.5 transition-transform ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-45'}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <span className="rounded-lg bg-cream px-2.5 py-1 text-xs font-semibold text-espresso/80">
            {emails.length} Messages
          </span>
        </div>
      </div>

      {/* Live sync indicator */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sage"></span>
        </span>
        <span className="text-[11px] text-espresso/40 font-medium">Auto-refreshing every 30s</span>
      </div>

      {/* Email List */}
      {emails.length > 0 ? (
        <div className="space-y-2">
          {emails.map((email) => (
            <button
              key={email.id}
              onClick={() => setSelectedEmail(selectedEmail === email.id ? null : email.id)}
              className={`w-full text-left flex items-start justify-between p-4 rounded-xl border transition-all duration-200 ${
                selectedEmail === email.id
                  ? 'bg-terracotta/5 border-terracotta/20 shadow-sm'
                  : email.isUnread
                  ? 'bg-paper border-espresso/10 hover:bg-cream/40 hover:border-espresso/15 shadow-[inset_3px_0_0_var(--terracotta)]'
                  : 'bg-cream/20 border-espresso/5 hover:bg-cream/40'
              }`}
            >
              <div className="flex gap-3 min-w-0 flex-1">
                {/* Avatar */}
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  email.isUnread
                    ? 'bg-terracotta/15 text-terracotta'
                    : 'bg-espresso/8 text-espresso/60'
                }`}>
                  {email.from.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${email.isUnread ? 'font-bold' : 'font-semibold text-espresso/90'}`}>
                      {email.from}
                    </p>
                    {email.isStarred && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-honey shrink-0">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                      </svg>
                    )}
                    {email.isUnread && (
                      <span className="h-2 w-2 rounded-full bg-terracotta shrink-0" />
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${email.isUnread ? 'font-medium text-espresso/80' : 'text-espresso/70'}`}>
                    {email.subject}
                  </p>
                  {selectedEmail === email.id ? (
                    <p className="text-xs text-espresso/55 mt-2 leading-relaxed whitespace-pre-line">
                      {email.snippet}
                    </p>
                  ) : (
                    <p className="text-xs text-espresso/50 mt-1 line-clamp-1 leading-relaxed">
                      {email.snippet}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-espresso/40 whitespace-nowrap ml-4 mt-0.5 shrink-0">
                {timeAgo(email.date)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-espresso/15 bg-cream/10 p-8 text-center">
          <p className="text-sm text-espresso/60">
            Your inbox is empty. New messages will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
