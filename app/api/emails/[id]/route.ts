import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { corsair } from '@/corsair';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Recursively extract HTML and plain text from Gmail MIME payload */
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
        if (mime === 'text/html' && !html) html = decoded;
        else if (mime === 'text/plain' && !text) text = decoded;
    }

    return { html, text };
}

function getHeader(payload: any, name: string): string {
    const hdrs = payload?.headers || [];
    return (
        hdrs.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || ''
    );
}

/** Verify user has Gmail connected, return account ID */
async function verifyGmail(userId: string) {
    const gmailAccounts = await db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .innerJoin(
            corsairIntegrations,
            eq(corsairAccounts.integrationId, corsairIntegrations.id)
        )
        .where(
            and(
                eq(corsairAccounts.tenantId, userId),
                eq(corsairIntegrations.name, 'gmail')
            )
        );

    if (gmailAccounts.length === 0) return null;
    return gmailAccounts[0].id;
}

// ── GET /api/emails/[id] — Fetch full email detail ──────────────────

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const accountId = await verifyGmail(session.user.id);
    if (!accountId) {
        return NextResponse.json(
            { error: 'Gmail not connected' },
            { status: 400 }
        );
    }

    try {
        const client = corsair.withTenant(session.user.id);
        const detail = await client.gmail.api.messages.get({
            id,
            format: 'full',
        });

        const payload = detail.payload;
        const { html, text } = payload
            ? extractBodies(payload)
            : { html: '', text: '' };

        const fromRaw = getHeader(payload, 'From');
        const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);

        // Collect attachment info from payload
        const attachments: any[] = [];
        function collectAttachments(part: any) {
            if (
                part.filename &&
                part.body?.attachmentId
            ) {
                attachments.push({
                    id: part.body.attachmentId,
                    filename: part.filename,
                    mimeType: part.mimeType,
                    size: part.body.size || 0,
                });
            }
            if (part.parts) {
                for (const child of part.parts) {
                    collectAttachments(child);
                }
            }
        }
        if (payload) collectAttachments(payload);

        return NextResponse.json({
            id: detail.id,
            threadId: detail.threadId,
            from: fromMatch
                ? fromMatch[1].replace(/"/g, '').trim()
                : fromRaw,
            fromEmail: fromMatch ? fromMatch[2] : fromRaw,
            to: getHeader(payload, 'To'),
            cc: getHeader(payload, 'Cc'),
            bcc: getHeader(payload, 'Bcc'),
            replyTo: getHeader(payload, 'Reply-To'),
            messageIdHeader: getHeader(payload, 'Message-ID'),
            references: getHeader(payload, 'References'),
            subject: getHeader(payload, 'Subject') || '(No Subject)',
            snippet: detail.snippet || '',
            bodyHtml: html,
            bodyText: text,
            date: detail.internalDate
                ? new Date(
                      (detail.internalDate as any) instanceof Date
                          ? (detail.internalDate as any).getTime()
                          : Number(detail.internalDate)
                  ).toISOString()
                : '',
            internalDate: detail.internalDate,
            labelIds: detail.labelIds || [],
            isUnread: (detail.labelIds || []).includes('UNREAD'),
            isStarred: (detail.labelIds || []).includes('STARRED'),
            sizeEstimate: detail.sizeEstimate || 0,
            attachments,
        });
    } catch (error: any) {
        console.error(`[Gmail] Failed to get message ${id}:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch email' },
            { status: 500 }
        );
    }
}

// ── PATCH /api/emails/[id] — Modify labels (star, read/unread) ──────

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const accountId = await verifyGmail(session.user.id);
    if (!accountId) {
        return NextResponse.json(
            { error: 'Gmail not connected' },
            { status: 400 }
        );
    }

    const body = await req.json();
    const { addLabelIds, removeLabelIds } = body;

    if (!addLabelIds && !removeLabelIds) {
        return NextResponse.json(
            { error: 'Provide addLabelIds or removeLabelIds' },
            { status: 400 }
        );
    }

    try {
        const client = corsair.withTenant(session.user.id);
        const result = await client.gmail.api.messages.modify({
            id,
            addLabelIds: addLabelIds || undefined,
            removeLabelIds: removeLabelIds || undefined,
        });

        // Update cached entity
        try {
            const existing =
                await client.gmail.db.messages.findByEntityId(id);
            if (existing) {
                await client.gmail.db.messages.upsertByEntityId(id, {
                    ...(existing.data as any),
                    labelIds: result.labelIds,
                } as any);
            }
        } catch {
            // Cache update is best-effort
        }

        return NextResponse.json({
            success: true,
            id: result.id,
            labelIds: result.labelIds,
        });
    } catch (error: any) {
        console.error(`[Gmail] Failed to modify message ${id}:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to modify email' },
            { status: 500 }
        );
    }
}

// ── DELETE /api/emails/[id] — Trash an email ─────────────────────────

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const accountId = await verifyGmail(session.user.id);
    if (!accountId) {
        return NextResponse.json(
            { error: 'Gmail not connected' },
            { status: 400 }
        );
    }

    try {
        const client = corsair.withTenant(session.user.id);
        await client.gmail.api.messages.trash({ id });

        // Update cached entity
        try {
            const existing =
                await client.gmail.db.messages.findByEntityId(id);
            if (existing) {
                const data = existing.data as any;
                const updatedLabels = [
                    ...(data.labelIds || []).filter(
                        (l: string) => l !== 'INBOX'
                    ),
                    'TRASH',
                ];
                await client.gmail.db.messages.upsertByEntityId(id, {
                    ...data,
                    labelIds: updatedLabels,
                } as any);
            }
        } catch {
            // Cache update is best-effort
        }

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error(`[Gmail] Failed to trash message ${id}:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to trash email' },
            { status: 500 }
        );
    }
}
