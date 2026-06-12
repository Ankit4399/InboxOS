import { processOAuthCallback } from 'corsair/oauth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/corsair';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/callback`;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // Verify the state cookie against the query param to prevent CSRF
    const cookieState = request.cookies.get('oauth_state')?.value;
    if (!cookieState || cookieState !== state) {
        return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    try {
        const { plugin, tenantId } = await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri: REDIRECT_URI,
        });

        // Query all connected integrations for this tenant to see if both are set up
        const userAccounts = await db
            .select({
                integrationName: corsairIntegrations.name,
            })
            .from(corsairAccounts)
            .innerJoin(
                corsairIntegrations,
                eq(corsairAccounts.integrationId, corsairIntegrations.id)
            )
            .where(eq(corsairAccounts.tenantId, tenantId));

        const isGmailConnected = userAccounts.some(acc => acc.integrationName === 'gmail');
        const isCalendarConnected = userAccounts.some(acc => acc.integrationName === 'googlecalendar');

        let redirectUrl = new URL('/dashboard', request.url);

        // If one of them is not connected yet, redirect back to the connect page with query param
        if (!isGmailConnected || !isCalendarConnected) {
            redirectUrl = new URL('/dashboard/connect-google', request.url);
            redirectUrl.searchParams.set('justConnected', plugin);
        }

        const response = NextResponse.redirect(redirectUrl);
        
        // Clear the state cookie
        response.cookies.delete('oauth_state');
        
        return response;
    } catch (err: any) {
        console.error('OAuth callback failed:', err);
        return NextResponse.json({ error: err.message || 'OAuth callback failed' }, { status: 500 });
    }
}
