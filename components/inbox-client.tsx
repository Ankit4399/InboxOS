'use client';

import { useState, useEffect, useCallback } from 'react';
import ComposeModal from './compose-modal';
import EmailViewer, { EmailDetail } from './email-viewer';

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

type Category = 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash';

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
  const [category, setCategory] = useState<Category>('inbox');
  
  // Selected email state
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Compose Modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyData, setReplyData] = useState<any>(undefined);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchEmails = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/emails?category=${category}`, { cache: 'no-store' });
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
  }, [category]);

  // Initial fetch + polling every 5 seconds for background sync
  useEffect(() => {
    fetchEmails();
    const interval = setInterval(() => fetchEmails(), 5000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  // Fetch full detail when email is selected
  useEffect(() => {
    if (!selectedEmailId) {
      setEmailDetail(null);
      return;
    }

    let active = true;
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/emails/${selectedEmailId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active) {
          setEmailDetail(data);
        }
      } catch {
        setError('Failed to load email details');
      } finally {
        if (active) setLoadingDetail(false);
      }
    };

    fetchDetail();
    return () => {
      active = false;
    };
  }, [selectedEmailId]);

  // Toggle star from list row
  const toggleStarFromList = async (e: React.MouseEvent, emailId: string, currentStarred: boolean) => {
    e.stopPropagation();
    
    // Optimistic UI update
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isStarred: !currentStarred } : email
    ));

    try {
      await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          !currentStarred
            ? { addLabelIds: ['STARRED'] }
            : { removeLabelIds: ['STARRED'] }
        )
      });
      // Refresh list to keep DB fresh
      fetchEmails();
    } catch {
      // Revert optimistic update on error
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isStarred: currentStarred } : email
      ));
    }
  };

  // Toggle read status from list row
  const toggleReadFromList = async (e: React.MouseEvent, emailId: string, currentUnread: boolean) => {
    e.stopPropagation();

    // Optimistic UI update
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isUnread: !currentUnread } : email
    ));

    try {
      await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          !currentUnread
            ? { addLabelIds: ['UNREAD'] }
            : { removeLabelIds: ['UNREAD'] }
        )
      });
      fetchEmails();
    } catch {
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isUnread: currentUnread } : email
      ));
    }
  };

  // Trash message from list row
  const trashFromList = async (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    
    // Optimistic UI update
    setEmails(prev => prev.filter(email => email.id !== emailId));
    if (selectedEmailId === emailId) {
      setSelectedEmailId(null);
    }

    try {
      await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE'
      });
      fetchEmails();
    } catch {
      fetchEmails();
    }
  };

  // Setup compose from reply click in viewer
  const handleReply = (email: EmailDetail) => {
    setReplyData({
      to: email.replyTo || email.fromEmail || email.from,
      subject: email.subject,
      threadId: email.threadId,
      inReplyTo: email.messageIdHeader || '',
      references: email.references 
        ? `${email.references} ${email.messageIdHeader}`.trim() 
        : email.messageIdHeader || '',
      quotedText: email.bodyText || email.snippet,
      fromName: email.from,
      date: email.date
    });
    setIsComposeOpen(true);
  };

  const handleComposeNew = () => {
    setReplyData(undefined);
    setIsComposeOpen(true);
  };

  // Categories metadata
  const categoriesList: { id: Category; label: string; icon: React.ReactNode }[] = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      )
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      )
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
        </svg>
      )
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      )
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      )
    }
  ];

  // Helper to count unread emails in the fetched list
  const unreadCount = emails.filter(e => e.isUnread).length;

  if (loading && emails.length === 0) {
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
    <div className="rounded-2xl border border-espresso/12 bg-paper shadow-sm overflow-hidden flex flex-col md:flex-row h-[780px]">
      
      {/* 1. Categories Sidebar */}
      <div className="w-full md:w-56 bg-cream/15 border-b md:border-b-0 md:border-r border-espresso/8 flex flex-col p-4 shrink-0">
        
        {/* Compose Button */}
        <button
          onClick={handleComposeNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-terracotta text-paper py-3 px-4 font-semibold hover:bg-rust transition-colors shadow-sm mb-5 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 113 3l-6.917 6.917a4 4 0 01-1.343.886l-3.155 1.263a.75.75 0 01-.935-.935z" />
            <path d="M15 15a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM5.586 15H4v-1.586l4.707-4.707 1.586 1.586L5.586 15z" />
          </svg>
          Compose
        </button>

        {/* Sidebar Nav */}
        <nav className="space-y-1 flex-1">
          {categoriesList.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setSelectedEmailId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-terracotta/10 text-terracotta'
                    : 'text-espresso/60 hover:bg-cream/40 hover:text-espresso/90'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
                {cat.id === 'inbox' && unreadCount > 0 && (
                  <span className="rounded-full bg-terracotta text-paper text-[10px] font-bold px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sync Status / Footer */}
        <div className="mt-auto pt-4 border-t border-espresso/6 flex items-center justify-between text-[10px] text-espresso/45">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sage"></span>
            </span>
            <span>Live Sync</span>
          </div>
          <button 
            onClick={() => fetchEmails(true)} 
            disabled={isRefreshing}
            className="hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* 2. List & Reading split pane */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        
        {/* Email List Panel */}
        <div className={`flex flex-col h-full bg-paper ${
          selectedEmailId ? 'hidden md:flex md:w-5/12 lg:w-2/5 border-r border-espresso/8' : 'w-full'
        }`}>
          {/* List Toolbar */}
          <div className="px-4 py-3 border-b border-espresso/8 bg-cream/10 flex items-center justify-between select-none">
            <span className="text-xs font-bold text-espresso/50 uppercase tracking-wider">
              {category}
            </span>
            <div className="flex items-center gap-2">
              {lastRefreshed && (
                <span className="text-[10px] text-espresso/40">
                  Refreshed {timeAgo(lastRefreshed.toISOString())}
                </span>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-espresso/6">
            {emails.length > 0 ? (
              emails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    className={`group relative p-4 cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-terracotta/5 shadow-[inset_3px_0_0_var(--terracotta)]'
                        : email.isUnread
                        ? 'bg-paper hover:bg-cream/20 shadow-[inset_3px_0_0_var(--terracotta)]'
                        : 'bg-cream/10 hover:bg-cream/20'
                    }`}
                  >
                    {/* Star Check/Toggle */}
                    <button
                      onClick={(e) => toggleStarFromList(e, email.id, email.isStarred)}
                      className="mt-0.5 shrink-0 text-espresso/25 hover:text-honey transition-colors"
                      title={email.isStarred ? 'Starred' : 'Not starred'}
                    >
                      {email.isStarred ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-honey">
                          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 hover:fill-honey/10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      )}
                    </button>

                    {/* Email Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className={`text-xs truncate ${email.isUnread ? 'font-bold text-espresso' : 'font-semibold text-espresso/70'}`}>
                          {email.from}
                        </p>
                        <span className="text-[10px] text-espresso/40 whitespace-nowrap">
                          {timeAgo(email.date)}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${email.isUnread ? 'font-semibold text-espresso/90' : 'text-espresso/60'}`}>
                        {email.subject}
                      </p>
                      <p className="text-[11px] text-espresso/40 mt-1 line-clamp-1 leading-normal">
                        {email.snippet}
                      </p>
                    </div>

                    {/* Quick Action Overlay (shows on hover) */}
                    <div className="absolute right-4 bottom-3 hidden group-hover:flex items-center gap-1.5 bg-paper px-1.5 py-1 rounded-lg border border-espresso/10 shadow-sm">
                      <button
                        onClick={(e) => toggleReadFromList(e, email.id, email.isUnread)}
                        className="p-1 text-espresso/40 hover:text-espresso rounded hover:bg-cream transition-colors"
                        title={email.isUnread ? 'Mark as read' : 'Mark as unread'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => trashFromList(e, email.id)}
                        className="p-1 text-espresso/40 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                        title="Trash"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-cream/10 border-t border-espresso/5">
                <p className="text-xs text-espresso/45">No messages in this folder.</p>
              </div>
            )}
          </div>
        </div>

        {/* Email Reading Pane */}
        {selectedEmailId && (
          <div className="flex-1 bg-paper h-full flex flex-col min-w-0">
            {loadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
                <div className="h-10 w-10 rounded-full bg-espresso/5 flex items-center justify-center mb-4">
                  <svg className="animate-spin h-5 w-5 text-espresso/40" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-xs text-espresso/40">Loading message body…</p>
              </div>
            ) : emailDetail ? (
              <EmailViewer
                email={emailDetail}
                onBack={() => setSelectedEmailId(null)}
                onReply={handleReply}
                onRefresh={fetchEmails}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-xs text-red-500">Failed to load message details.</p>
                <button
                  onClick={() => setSelectedEmailId(selectedEmailId)}
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-espresso px-3 py-1.5 text-xs text-paper"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Placeholder Pane (when no email is selected on desktop) */}
        {!selectedEmailId && (
          <div className="hidden md:flex flex-1 items-center justify-center bg-cream/5 border-l border-espresso/5 select-none p-8 text-center">
            <div>
              <div className="inline-flex h-12 w-12 rounded-full bg-cream items-center justify-center text-espresso/25 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.24-5.596-3.013a2.25 2.25 0 0 0-2.222 0L3.25 17.59M21.75 9a2.25 2.25 0 0 0-2.25-2.25H4.5A2.25 2.25 0 0 0 2.25 9m19.5 0v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V9m1.5-6h16.5a1.5 1.5 0 0 1 1.5 1.5V6H3V4.5A1.5 1.5 0 0 1 4.5 3Z" />
                </svg>
              </div>
              <p className="text-xs text-espresso/40 font-medium">Select an item to read</p>
              <p className="text-[10px] text-espresso/30 mt-0.5">Nothing is selected</p>
            </div>
          </div>
        )}

      </div>

      {/* 3. Compose Floating Modal */}
      {isComposeOpen && (
        <ComposeModal
          onClose={() => setIsComposeOpen(false)}
          onSent={() => {
            fetchEmails();
          }}
          replyTo={replyData}
        />
      )}

    </div>
  );
}
