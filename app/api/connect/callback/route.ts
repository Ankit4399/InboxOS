import { processOAuthCallback } from 'corsair/oauth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/corsair';

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

        // Redirect user back to dashboard
        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        
        // Clear the state cookie
        response.cookies.delete('oauth_state');
        
        return response;
    } catch (err: any) {
        console.error('OAuth callback failed:', err);
        return NextResponse.json({ error: err.message || 'OAuth callback failed' }, { status: 500 });
    }
}
