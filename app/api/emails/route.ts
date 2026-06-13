import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { corsair } from '@/corsair';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import {
    cacheGmailMessageMetadata,
    getGmailHeader,
} from '@/lib/gmail-message';

export const dynamic = 'force-dynamic';

const LABEL_MAP: Record<string, string> = {
    inbox: 'INBOX',
    starred: 'STARRED',
    sent: 'SENT',
    drafts: 'DRAFT',
    trash: 'TRASH',
};

const SYNC_BATCH_SIZE = 15;

function getHeader(payload: unknown, name: string): string {
    return getGmailHeader(payload, name);
}

/** Read fields from top-level data or nested Gmail payload headers. */
function extractMessageFields(msg: Record<string, unknown>) {
    const payload = msg.payload;
    const fromRaw =
        (msg.from as string) ||
        getHeader(payload, 'From') ||
        '';
    const subject =
        (msg.subject as string) ||
        getHeader(payload, 'Subject') ||
        '';

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

    const labelIds = (msg.labelIds as string[]) || [];

    return {
        id: msg.id as string,
        threadId: msg.threadId as string,
        from: fromName || fromEmail || 'Unknown Sender',
        fromEmail,
        subject: subject || '(No Subject)',
        snippet: (msg.snippet as string) || '',
        date: dateStr,
        internalDate: msg.internalDate,
        labelIds,
        isUnread: labelIds.includes('UNREAD'),
        isStarred: labelIds.includes('STARRED'),
    };
}

function hasCompleteMetadata(data: Record<string, unknown> | undefined): boolean {
    if (!data) return false;
    const fields = extractMessageFields(data);
    return (
        fields.from !== 'Unknown Sender' &&
        fields.subject !== '(No Subject)'
    );
}

function labelSqlFilter(category: string) {
    const label = LABEL_MAP[category] || 'INBOX';
    return sql`${corsairEntities.data}->'labelIds' @> ${JSON.stringify([label])}::jsonb`;
}

type EntityRow = { entityId: string; data: unknown };

function formatEmailList(entities: EntityRow[], limit: number) {
    const seen = new Set<string>();

    return entities
        .map((entity) => extractMessageFields(entity.data as Record<string, unknown>))
        .filter((email) => {
            if (!email.id || seen.has(email.id)) return false;
            seen.add(email.id);
            return true;
        })
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
        })
        .slice(0, limit);
}

async function queryCachedEmails(accountId: string, category: string, limit: number) {
    return db
        .select({
            entityId: corsairEntities.entityId,
            data: corsairEntities.data,
        })
        .from(corsairEntities)
        .where(
            and(
                eq(corsairEntities.accountId, accountId),
                eq(corsairEntities.entityType, 'messages'),
                labelSqlFilter(category),
            ),
        )
        .orderBy(desc(sql`(${corsairEntities.data}->>'internalDate')::bigint`))
        .limit(limit);
}

async function syncMessageMetadata(
    client: ReturnType<typeof corsair.withTenant>,
    msgId: string,
) {
    await cacheGmailMessageMetadata(client, msgId);
}

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'inbox';
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
    const forceSync = url.searchParams.get('sync') === 'true';
    const labelIds = [LABEL_MAP[category] || 'INBOX'];

    const gmailAccounts = await db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .innerJoin(
            corsairIntegrations,
            eq(corsairAccounts.integrationId, corsairIntegrations.id),
        )
        .where(
            and(
                eq(corsairAccounts.tenantId, session.user.id),
                eq(corsairIntegrations.name, 'gmail'),
            ),
        );

    if (gmailAccounts.length === 0) {
        return NextResponse.json({ emails: [], connected: false });
    }

    const accountId = gmailAccounts[0].id;

    try {
        const client = corsair.withTenant(session.user.id);
        let entities = await queryCachedEmails(accountId, category, limit);
        const cacheIsEmpty = entities.length === 0;

        if (cacheIsEmpty || forceSync) {
            try {
                const messagesResponse = await client.gmail.api.messages.list({
                    maxResults: limit,
                    labelIds,
                });
                const messages = messagesResponse?.messages || [];

                if (messages.length > 0) {
                    const msgIds = messages.map((m) => m.id).filter(Boolean) as string[];
                    const existingEntities = await db
                        .select({
                            entityId: corsairEntities.entityId,
                            data: corsairEntities.data,
                        })
                        .from(corsairEntities)
                        .where(
                            and(
                                eq(corsairEntities.accountId, accountId),
                                eq(corsairEntities.entityType, 'messages'),
                                inArray(corsairEntities.entityId, msgIds),
                            ),
                        );

                    const existingMap = new Map(
                        existingEntities.map((e) => [
                            e.entityId,
                            e.data as Record<string, unknown>,
                        ]),
                    );

                    const requiredLabel = LABEL_MAP[category] || 'INBOX';

                    // Always refresh the newest messages from Gmail so new mail appears promptly
                    const toSync = messages
                        .filter((msg) => {
                            if (!msg.id) return false;
                            const existing = existingMap.get(msg.id);
                            if (!existing) return true;
                            if (!hasCompleteMetadata(existing)) return true;
                            const labels = (existing.labelIds as string[]) || [];
                            return !labels.includes(requiredLabel);
                        })
                        .slice(0, SYNC_BATCH_SIZE);

                    if (toSync.length > 0) {
                        console.log(
                            `[Gmail Sync] Refreshing ${toSync.length} messages for "${category}"`,
                        );

                        await Promise.allSettled(
                            toSync.map(async (msg) => {
                                try {
                                    await syncMessageMetadata(client, msg.id!);
                                } catch (msgErr) {
                                    console.error(
                                        `[Gmail Sync Error] message ${msg.id}:`,
                                        msgErr,
                                    );
                                }
                            }),
                        );
                    }
                }

                entities = await queryCachedEmails(accountId, category, limit);
            } catch (syncErr) {
                console.error('[Gmail Sync Error]', syncErr);
            }
        }

        return NextResponse.json({
            emails: formatEmailList(entities, limit),
            connected: true,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch emails';
        console.error('Failed to fetch Gmail messages:', error);
        return NextResponse.json(
            { error: message, emails: [], connected: true },
            { status: 500 },
        );
    }
}
