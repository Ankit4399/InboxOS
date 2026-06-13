'use client';

import { useState, useRef, useEffect } from 'react';

export type EmailDetail = {
    id: string;
    threadId: string;
    from: string;
    fromEmail: string;
    to: string;
    cc: string;
    bcc: string;
    replyTo: string;
    messageIdHeader: string;
    references: string;
    subject: string;
    snippet: string;
    bodyHtml: string;
    bodyText: string;
    date: string;
    labelIds: string[];
    isUnread: boolean;
    isStarred: boolean;
    attachments?: { id: string; filename: string; mimeType: string; size: number }[];
};

type EmailViewerProps = {
    email: EmailDetail;
    onBack: () => void;
    onReply: (email: EmailDetail) => void;
    onRefresh: () => void;
};

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function EmailViewer({
    email,
    onBack,
    onReply,
    onRefresh,
}: EmailViewerProps) {
    const [isStarred, setIsStarred] = useState(email.isStarred);
    const [isUnread, setIsUnread] = useState(email.isUnread);
    const [showDetails, setShowDetails] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Auto-mark as read when viewing
    useEffect(() => {
        if (email.isUnread) {
            fetch(`/api/emails/${email.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
            }).then(() => {
                setIsUnread(false);
                onRefresh();
            }).catch(() => {});
        }
    }, [email.id, email.isUnread, onRefresh]);

    // Write HTML content to sandboxed iframe
    useEffect(() => {
        if (iframeRef.current && email.bodyHtml) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                font-size: 14px;
                                line-height: 1.6;
                                color: #2a1f1a;
                                margin: 0;
                                padding: 16px;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                            }
                            img { max-width: 100%; height: auto; }
                            a { color: #c24e2c; }
                            blockquote {
                                border-left: 3px solid #e8d5c4;
                                margin: 8px 0;
                                padding: 4px 12px;
                                color: #666;
                            }
                            table { max-width: 100%; }
                        </style>
                    </head>
                    <body>${email.bodyHtml}</body>
                    </html>
                `);
                doc.close();

                // Auto-resize iframe to content height
                const resizeObserver = new ResizeObserver(() => {
                    if (iframeRef.current && doc.body) {
                        iframeRef.current.style.height =
                            Math.max(200, doc.body.scrollHeight + 32) + 'px';
                    }
                });
                if (doc.body) resizeObserver.observe(doc.body);

                return () => resizeObserver.disconnect();
            }
        }
    }, [email.bodyHtml]);

    const toggleStar = async () => {
        const newStarred = !isStarred;
        setIsStarred(newStarred);

        await fetch(`/api/emails/${email.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                newStarred
                    ? { addLabelIds: ['STARRED'] }
                    : { removeLabelIds: ['STARRED'] }
            ),
        });
        onRefresh();
    };

    const toggleRead = async () => {
        const newUnread = !isUnread;
        setIsUnread(newUnread);

        await fetch(`/api/emails/${email.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                newUnread
                    ? { addLabelIds: ['UNREAD'] }
                    : { removeLabelIds: ['UNREAD'] }
            ),
        });
        onRefresh();
    };

    const handleTrash = async () => {
        await fetch(`/api/emails/${email.id}`, { method: 'DELETE' });
        onRefresh();
        onBack();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-espresso/8 bg-paper/50 shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-cream transition-colors"
                        title="Back to inbox"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-espresso/70">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>

                    <button onClick={toggleStar} className="p-2 rounded-lg hover:bg-cream transition-colors" title={isStarred ? 'Unstar' : 'Star'}>
                        {isStarred ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-honey">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-espresso/40">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        )}
                    </button>

                    <button onClick={toggleRead} className="p-2 rounded-lg hover:bg-cream transition-colors" title={isUnread ? 'Mark as read' : 'Mark as unread'}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${isUnread ? 'text-terracotta' : 'text-espresso/40'}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </button>

                    <button onClick={handleTrash} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Move to trash">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-espresso/40 hover:text-red-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onReply(email)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/20 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                        Reply
                    </button>
                </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-5">
                    {/* Subject */}
                    <h1 className="text-xl font-semibold text-espresso mb-4 leading-snug">
                        {email.subject}
                    </h1>

                    {/* Sender Info */}
                    <div className="flex items-start gap-3 mb-5">
                        <div className="h-10 w-10 rounded-full bg-terracotta/15 flex items-center justify-center text-sm font-bold text-terracotta shrink-0">
                            {email.from.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-espresso">
                                    {email.from}
                                </span>
                                <span className="text-xs text-espresso/40">
                                    &lt;{email.fromEmail}&gt;
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-espresso/50">
                                    to{' '}
                                    {email.to
                                        .split(',')
                                        .map((e: string) => e.trim().split('<')[0].trim())
                                        .join(', ') || 'me'}
                                </span>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-xs text-espresso/30 hover:text-espresso/50"
                                >
                                    {showDetails ? '▲' : '▼'}
                                </button>
                            </div>

                            {/* Expanded details */}
                            {showDetails && (
                                <div className="mt-2 p-3 rounded-lg bg-cream/40 text-xs text-espresso/60 space-y-1">
                                    <p>
                                        <span className="font-medium text-espresso/70">From:</span>{' '}
                                        {email.from} &lt;{email.fromEmail}&gt;
                                    </p>
                                    <p>
                                        <span className="font-medium text-espresso/70">To:</span>{' '}
                                        {email.to}
                                    </p>
                                    {email.cc && (
                                        <p>
                                            <span className="font-medium text-espresso/70">Cc:</span>{' '}
                                            {email.cc}
                                        </p>
                                    )}
                                    <p>
                                        <span className="font-medium text-espresso/70">Date:</span>{' '}
                                        {formatDate(email.date)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-espresso/40 whitespace-nowrap shrink-0">
                            {formatDate(email.date)}
                        </span>
                    </div>

                    {/* Email Body */}
                    <div className="border-t border-espresso/8 pt-5">
                        {email.bodyHtml ? (
                            <iframe
                                ref={iframeRef}
                                className="w-full border-0 min-h-[200px]"
                                sandbox="allow-same-origin"
                                title="Email content"
                            />
                        ) : email.bodyText ? (
                            <pre className="text-sm text-espresso/80 whitespace-pre-wrap font-sans leading-relaxed">
                                {email.bodyText}
                            </pre>
                        ) : (
                            <p className="text-sm text-espresso/50 italic">
                                {email.snippet || 'No content available'}
                            </p>
                        )}
                    </div>

                    {/* Attachments */}
                    {email.attachments && email.attachments.length > 0 && (
                        <div className="mt-6 border-t border-espresso/8 pt-4">
                            <p className="text-xs font-semibold text-espresso/60 mb-2">
                                {email.attachments.length} Attachment{email.attachments.length > 1 ? 's' : ''}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {email.attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="flex items-center gap-2 rounded-lg border border-espresso/10 bg-cream/30 px-3 py-2 text-xs"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-espresso/40">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                        </svg>
                                        <span className="font-medium text-espresso/70 max-w-32 truncate">
                                            {att.filename}
                                        </span>
                                        <span className="text-espresso/40">
                                            {formatSize(att.size)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reply footer */}
                    <div className="mt-8 border-t border-espresso/8 pt-4">
                        <button
                            onClick={() => onReply(email)}
                            className="inline-flex items-center gap-2 rounded-xl border border-espresso/12 px-5 py-2.5 text-sm font-medium text-espresso/70 hover:bg-cream/50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
