import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { corsair } from '@/corsair';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations, corsairEntities } from '@/db/schema';
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

    const accountId = calendarAccounts[0].id;

    try {
        const client = corsair.withTenant(session.user.id);

        // Define background/blocking sync function
        const runSync = async () => {
            try {
                const now = new Date();
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const eventsResponse = await client.googlecalendar.api.events.getMany({
                    calendarId: 'primary',
                    timeMin: now.toISOString(),
                    timeMax: nextWeek.toISOString(),
                    maxResults: 25,
                    singleEvents: true,
                });
                const items = eventsResponse?.items || [];
                
                await Promise.allSettled(
                    items.map(async (event: any) => {
                        if (!event.id) return;
                        const existing = await client.googlecalendar.db.events.findByEntityId(event.id);
                        if (!existing) {
                            await client.googlecalendar.db.events.upsertByEntityId(event.id, {
                                ...event,
                                id: event.id,
                                calendarId: 'primary',
                                createdAt: new Date(),
                            } as any);
                        }
                    })
                );
            } catch (err) {
                console.error('[Calendar Background Sync Error]', err);
            }
        };

        // Query events from local database
        let entities = await db
            .select()
            .from(corsairEntities)
            .where(
                and(
                    eq(corsairEntities.accountId, accountId),
                    eq(corsairEntities.entityType, 'events')
                )
            );

        if (entities.length === 0) {
            console.log('[Calendar Sync] Cache empty. Performing synchronous sync...');
            await runSync();
            
            // Re-query entities after sync
            entities = await db
                .select()
                .from(corsairEntities)
                .where(
                    and(
                        eq(corsairEntities.accountId, accountId),
                        eq(corsairEntities.entityType, 'events')
                    )
                );
        } else {
            // Trigger background sync non-blockingly to keep database fresh
            runSync();
        }

        // Format, filter and sort events
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const seen = new Set<string>();

        const events = entities
            .map((entity) => {
                const event = entity.data as any;
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
            })
            // Filter events happening within the next 7 days and remove duplicates
            .filter((event) => {
                if (!event.start || !event.id || seen.has(event.id)) return false;
                const eventStart = new Date(event.start);
                const isInRange = eventStart >= now && eventStart <= nextWeek;
                if (!isInRange) return false;
                
                seen.add(event.id);
                return true;
            })
            // Sort chronologically
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        return NextResponse.json({ events, connected: true });
    } catch (error: any) {
        console.error('Failed to fetch calendar events:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch calendar events', events: [], connected: true },
            { status: 500 }
        );
    }
}
