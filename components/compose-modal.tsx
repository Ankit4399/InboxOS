'use client';

import { useState, useRef, useEffect } from 'react';

type ComposeProps = {
    onClose: () => void;
    onSent: () => void;
    replyTo?: {
        to: string;
        cc?: string;
        subject: string;
        threadId: string;
        inReplyTo: string;
        references: string;
        quotedHtml?: string;
        quotedText?: string;
        fromName?: string;
        date?: string;
    };
};

export default function ComposeModal({
    onClose,
    onSent,
    replyTo,
}: ComposeProps) {
    const [to, setTo] = useState(replyTo?.to || '');
    const [cc, setCc] = useState(replyTo?.cc || '');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(
        replyTo?.subject
            ? replyTo.subject.startsWith('Re:')
                ? replyTo.subject
                : `Re: ${replyTo.subject}`
            : ''
    );
    const [body, setBody] = useState('');
    const [showCcBcc, setShowCcBcc] = useState(!!replyTo?.cc);
    const [isMinimized, setIsMinimized] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.focus();
    }, []);

    const handleSend = async () => {
        if (!to.trim() || !subject.trim() || !body.trim()) {
            setError('Please fill in To, Subject, and Body');
            return;
        }
        setSending(true);
        setError('');

        try {
            const res = await fetch('/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: to.trim(),
                    cc: cc.trim() || undefined,
                    bcc: bcc.trim() || undefined,
                    subject: subject.trim(),
                    body: body.trim(),
                    isHtml: false,
                    threadId: replyTo?.threadId || undefined,
                    inReplyTo: replyTo?.inReplyTo || undefined,
                    references: replyTo?.references || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send');

            onSent();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    if (isMinimized) {
        return (
            <div
                className="fixed bottom-0 right-6 z-[100] w-72 rounded-t-xl bg-espresso text-paper 
                           shadow-2xl cursor-pointer flex items-center justify-between px-4 py-3
                           hover:bg-espresso/90 transition-colors"
                onClick={() => setIsMinimized(false)}
            >
                <span className="text-sm font-semibold truncate">
                    {subject || 'New Message'}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(false);
                        }}
                        className="p-1 hover:bg-paper/10 rounded"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 15.75l7.5-7.5 7.5 7.5"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="p-1 hover:bg-paper/10 rounded"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 right-6 z-[100] w-[560px] max-w-[calc(100vw-48px)] rounded-t-xl bg-paper shadow-2xl border border-espresso/15 flex flex-col animate-compose-up">
            {/* Title Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-espresso text-paper rounded-t-xl">
                <span className="text-sm font-semibold">
                    {replyTo ? 'Reply' : 'New Message'}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1 hover:bg-paper/10 rounded transition-colors"
                        title="Minimize"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 12h-15"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-paper/10 rounded transition-colors"
                        title="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col border-b border-espresso/8">
                <div className="flex items-center border-b border-espresso/6 px-4">
                    <label className="text-xs text-espresso/50 font-medium w-10 shrink-0">
                        To
                    </label>
                    <input
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="flex-1 py-2 text-sm bg-transparent outline-none placeholder:text-espresso/30"
                        placeholder="recipient@email.com"
                    />
                    {!showCcBcc && (
                        <button
                            onClick={() => setShowCcBcc(true)}
                            className="text-xs text-espresso/40 hover:text-espresso/70 font-medium ml-2"
                        >
                            Cc/Bcc
                        </button>
                    )}
                </div>

                {showCcBcc && (
                    <>
                        <div className="flex items-center border-b border-espresso/6 px-4">
                            <label className="text-xs text-espresso/50 font-medium w-10 shrink-0">
                                Cc
                            </label>
                            <input
                                type="email"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                className="flex-1 py-2 text-sm bg-transparent outline-none placeholder:text-espresso/30"
                                placeholder="cc@email.com"
                            />
                        </div>
                        <div className="flex items-center border-b border-espresso/6 px-4">
                            <label className="text-xs text-espresso/50 font-medium w-10 shrink-0">
                                Bcc
                            </label>
                            <input
                                type="email"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                className="flex-1 py-2 text-sm bg-transparent outline-none placeholder:text-espresso/30"
                                placeholder="bcc@email.com"
                            />
                        </div>
                    </>
                )}

                <div className="flex items-center px-4">
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="flex-1 py-2 text-sm bg-transparent outline-none placeholder:text-espresso/30"
                        placeholder="Subject"
                    />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0">
                <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-64 px-4 py-3 text-sm bg-transparent outline-none resize-none placeholder:text-espresso/30"
                    placeholder="Write your message…"
                />

                {/* Quoted text for replies */}
                {replyTo?.quotedText && (
                    <div className="px-4 pb-3">
                        <div className="border-l-2 border-espresso/15 pl-3 text-xs text-espresso/40 max-h-32 overflow-y-auto">
                            <p className="font-medium mb-1">
                                On {replyTo.date}, {replyTo.fromName} wrote:
                            </p>
                            <p className="whitespace-pre-wrap">
                                {replyTo.quotedText}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
                    {error}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-espresso/8">
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-paper 
                             hover:bg-rust transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? (
                        <>
                            <svg
                                className="animate-spin h-4 w-4"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Sending…
                        </>
                    ) : (
                        <>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                            >
                                <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289z" />
                            </svg>
                            Send
                        </>
                    )}
                </button>

                <button
                    onClick={onClose}
                    className="text-xs text-espresso/40 hover:text-espresso/60 font-medium"
                >
                    Discard
                </button>
            </div>
        </div>
    );
}
