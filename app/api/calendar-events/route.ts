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

    // Check if the user has a Google Calendar integration
    const calendarAccounts = await db
        .select({ id: corsairAccounts.id })
        .from(corsairAccounts)
        .innerJoin(
            corsairIntegrations,
            eq(corsairAccounts.integrationId, corsairIntegrations.id)
        )
        .where(
            and(
                eq(corsairAccounts.tenantId, session.user.id),
                eq(corsairIntegrations.name, 'googlecalendar')
            )
        );

    if (calendarAccounts.length === 0) {
        return NextResponse.json({ events: [], connected: false });
    }

    try {
        const client = corsair.withTenant(session.user.id);

        // Fetch events for the next 7 days
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const eventsResponse = await client.googlecalendar.api.events.getMany({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: nextWeek.toISOString(),
            maxResults: 15,
            orderBy: 'startTime',
            singleEvents: true,
        });

        const events = (eventsResponse?.items || []).map((event: any) => {
            const startStr = event.start?.dateTime || event.start?.date;
            const endStr = event.end?.dateTime || event.end?.date;

            return {
                id: event.id,
                summary: event.summary || 'Untitled Event',
                description: event.description || '',
                start: startStr,
                end: endStr,
                isAllDay: !event.start?.dateTime,
                location: event.location || '',
                htmlLink: event.htmlLink || '',
                status: event.status || 'confirmed',
                organizer: event.organizer?.displayName || event.organizer?.email || '',
            };
        });

        return NextResponse.json({ events, connected: true });
    } catch (error: any) {
        console.error('Failed to fetch calendar events:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch calendar events', events: [], connected: true },
            { status: 500 }
        );
    }
}
