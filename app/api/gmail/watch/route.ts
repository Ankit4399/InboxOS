import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { registerGmailWatch } from '@/lib/google-watch';

export const dynamic = 'force-dynamic';

/** Register or renew the Gmail Pub/Sub watch for the current user. */
export async function POST() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topicName = process.env.GMAIL_PUB_SUB_TOPIC;
    if (!topicName) {
        return NextResponse.json(
            { error: 'GMAIL_PUB_SUB_TOPIC is not configured' },
            { status: 503 },
        );
    }

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
        return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
    }

    try {
        const result = await registerGmailWatch(session.user.id, topicName);
        return NextResponse.json({
            success: true,
            historyId: result.historyId,
            expiration: result.expiration,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to register Gmail watch';
        console.error('[Gmail Watch]', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
