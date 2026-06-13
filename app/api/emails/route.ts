import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { corsair } from '@/corsair';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    try {
        const client = corsair.withTenant(session.user.id);
        
        // Fetch messages list from Gmail API
        const messagesResponse = await client.gmail.api.messages.list({
            maxResults: 20,
        });

        const messages = messagesResponse?.messages || [];
        
        if (messages.length === 0) {
            return NextResponse.json({ emails: [], connected: true });
        }

        // Fetch full details for each message (with metadata format for performance)
        const emailDetails = await Promise.allSettled(
            messages.slice(0, 20).map(async (msg: any) => {
                if (!msg.id) return null;
                const detail = await client.gmail.api.messages.get({
                    id: msg.id,
                    format: 'metadata',
                    metadataHeaders: ['From', 'Subject', 'Date'],
                });
                return detail;
            })
        );

        const emails = emailDetails
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
            .map(r => {
                const msg = r.value;
                const headers = msg.payload?.headers || [];
                const getHeader = (name: string) =>
                    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

                const fromRaw = getHeader('From');
                // Parse "Name <email@example.com>" format
                const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
                const fromName = fromMatch ? fromMatch[1].replace(/"/g, '').trim() : fromRaw;
                const fromEmail = fromMatch ? fromMatch[2] : fromRaw;

                return {
                    id: msg.id,
                    threadId: msg.threadId,
                    from: fromName,
                    fromEmail: fromEmail,
                    subject: getHeader('Subject') || '(No Subject)',
                    snippet: msg.snippet || '',
                    date: getHeader('Date'),
                    internalDate: msg.internalDate,
                    labelIds: msg.labelIds || [],
                    isUnread: (msg.labelIds || []).includes('UNREAD'),
                    isStarred: (msg.labelIds || []).includes('STARRED'),
                };
            });

        return NextResponse.json({ emails, connected: true });
    } catch (error: any) {
        console.error('Failed to fetch Gmail messages:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch emails', emails: [], connected: true },
            { status: 500 }
        );
    }
}
