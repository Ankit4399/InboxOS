import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { corsair } from '@/corsair';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// ── MIME body extraction helpers ──────────────────────────────────────

/** Recursively walk the MIME payload tree and collect body parts */
function extractBodies(part: any): { html: string; text: string } {
    let html = '';
    let text = '';

    if (part.parts && Array.isArray(part.parts)) {
        for (const child of part.parts) {
            const result = extractBodies(child);
            if (result.html) html = result.html;
            if (result.text) text = result.text;
        }
    }

    const mime = (part.mimeType || '').toLowerCase();
    const data = part.body?.data;
    if (data) {
        const decoded = Buffer.from(data, 'base64url').toString('utf-8');
        if (mime === 'text/html' && !html) {
            html = decoded;
        } else if (mime === 'text/plain' && !text) {
            text = decoded;
        }
    }

    return { html, text };
}

/** Pull a specific header value from a Gmail message payload */
function getHeader(payload: any, name: string): string {
    const hdrs = payload?.headers || [];
    return (
        hdrs.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || ''
    );
}

// ── GET /api/emails ──────────────────────────────────────────────────

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional query params
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'inbox'; // inbox | starred | sent | drafts | trash
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);

    // Check if the user has a Gmail integration
    const gmailAccounts = await db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .innerJoin(
            corsairIntegrations,
            eq(corsairAccounts.integrationId, corsairIntegrations.id)
        )
        .where(
            and(
                eq(corsairAccounts.tenantId, session.user.id),
                eq(corsairIntegrations.name, 'gmail')
            )
        );

    if (gmailAccounts.length === 0) {
        return NextResponse.json({ emails: [], connected: false });
    }

    const accountId = gmailAccounts[0].id;

    try {
        const client = corsair.withTenant(session.user.id);

        // Map category to Gmail label queries
        const labelMap: Record<string, string[]> = {
            inbox: ['INBOX'],
            starred: ['STARRED'],
            sent: ['SENT'],
            drafts: ['DRAFT'],
            trash: ['TRASH'],
        };
        const labelIds = labelMap[category] || ['INBOX'];

        // ── Sync: list messages from Gmail API then fetch full detail ──
        const runSync = async () => {
            try {
                const messagesResponse = await client.gmail.api.messages.list({
                    maxResults: limit,
                    labelIds,
                });
                const messages = messagesResponse?.messages || [];
                console.log(
                    `[Gmail Sync] Listing ${messages.length} messages for category "${category}"…`
                );

                for (const msg of messages) {
                    if (!msg.id) continue;
                    try {
                        const existing =
                            await client.gmail.db.messages.findByEntityId(
                                msg.id
                            );

                        // Fetch full detail if missing or body not yet extracted
                        if (
                            !existing ||
                            !(existing.data as any).subject ||
                            !(existing.data as any)._bodyExtracted
                        ) {
                            const detail =
                                await client.gmail.api.messages.get({
                                    id: msg.id,
                                    format: 'full',
                                });

                            const payload = detail.payload;
                            const subject = getHeader(payload, 'Subject');
                            const from = getHeader(payload, 'From');
                            const to = getHeader(payload, 'To');
                            const cc = getHeader(payload, 'Cc');
                            const bcc = getHeader(payload, 'Bcc');
                            const replyTo = getHeader(payload, 'Reply-To');
                            const messageIdHeader = getHeader(
                                payload,
                                'Message-ID'
                            );
                            const references = getHeader(
                                payload,
                                'References'
                            );

                            // Extract full bodies from MIME tree
                            const { html, text } = payload
                                ? extractBodies(payload)
                                : { html: '', text: '' };

                            await client.gmail.db.messages.upsertByEntityId(
                                msg.id,
                                {
                                    ...detail,
                                    id: msg.id,
                                    subject,
                                    from,
                                    to,
                                    cc,
                                    bcc,
                                    replyTo,
                                    messageIdHeader,
                                    references,
                                    bodyHtml: html,
                                    bodyText: text,
                                    _bodyExtracted: true,
                                    createdAt: new Date(),
                                } as any
                            );

                            await new Promise((r) => setTimeout(r, 100));
                        }
                    } catch (msgErr) {
                        console.error(
                            `[Gmail Sync Error] Failed to sync message ${msg.id}:`,
                            msgErr
                        );
                    }
                }
            } catch (err) {
                console.error('[Gmail Background Sync Error]', err);
            }
        };

        // ── Query cached entities ──
        let entities = await db
            .select()
            .from(corsairEntities)
            .where(
                and(
                    eq(corsairEntities.accountId, accountId),
                    eq(corsairEntities.entityType, 'messages')
                )
            );

        if (entities.length === 0) {
            console.log(
                '[Gmail Sync] Cache empty. Performing synchronous sync…'
            );
            await runSync();

            entities = await db
                .select()
                .from(corsairEntities)
                .where(
                    and(
                        eq(corsairEntities.accountId, accountId),
                        eq(corsairEntities.entityType, 'messages')
                    )
                );
        } else {
            // Background sync to keep DB fresh
            runSync();
        }

        // ── Format response ──
        const seen = new Set<string>();
        const emails = entities
            .map((entity) => {
                const msg = entity.data as any;
                const fromRaw = msg.from || '';

                // Parse "Name <email@example.com>" format
                const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
                const fromName = fromMatch
                    ? fromMatch[1].replace(/"/g, '').trim()
                    : fromRaw;
                const fromEmail = fromMatch ? fromMatch[2] : fromRaw;

                let dateStr = '';
                if (msg.internalDate) {
                    const d =
                        msg.internalDate instanceof Date
                            ? msg.internalDate
                            : new Date(Number(msg.internalDate));
                    dateStr = d.toISOString();
                }

                return {
                    id: msg.id,
                    threadId: msg.threadId,
                    from: fromName || 'Unknown Sender',
                    fromEmail,
                    to: msg.to || '',
                    cc: msg.cc || '',
                    bcc: msg.bcc || '',
                    replyTo: msg.replyTo || '',
                    messageIdHeader: msg.messageIdHeader || '',
                    references: msg.references || '',
                    subject: msg.subject || '(No Subject)',
                    snippet: msg.snippet || '',
                    bodyHtml: msg.bodyHtml || '',
                    bodyText: msg.bodyText || '',
                    date: dateStr,
                    internalDate: msg.internalDate,
                    labelIds: msg.labelIds || [],
                    isUnread: (msg.labelIds || []).includes('UNREAD'),
                    isStarred: (msg.labelIds || []).includes('STARRED'),
                    sizeEstimate: msg.sizeEstimate || 0,
                };
            })
            // Filter by category labels
            .filter((email) => {
                if (!email.id || seen.has(email.id)) return false;
                seen.add(email.id);

                // Category filtering
                const labels = email.labelIds as string[];
                if (category === 'inbox') return labels.includes('INBOX');
                if (category === 'starred') return labels.includes('STARRED');
                if (category === 'sent') return labels.includes('SENT');
                if (category === 'drafts') return labels.includes('DRAFT');
                if (category === 'trash') return labels.includes('TRASH');
                return true;
            })
            // Sort newest first
            .sort((a, b) => {
                const aTime =
                    a.internalDate instanceof Date
                        ? a.internalDate.getTime()
                        : Number(a.internalDate || 0);
                const bTime =
                    b.internalDate instanceof Date
                        ? b.internalDate.getTime()
                        : Number(b.internalDate || 0);
                return bTime - aTime;
            });

        return NextResponse.json({ emails, connected: true });
    } catch (error: any) {
        console.error('Failed to fetch Gmail messages:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to fetch emails',
                emails: [],
                connected: true,
            },
            { status: 500 }
        );
    }
}
