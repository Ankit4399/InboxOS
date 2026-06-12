import { generateOAuthUrl } from 'corsair/oauth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/corsair';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/callback`;

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    
    const tenantId = session?.user?.id;
    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plugin = new URL(request.url).searchParams.get('plugin');
    if (!plugin) {
        return NextResponse.json({ error: 'Missing plugin param' }, { status: 400 });
    }

    const { url, state } = await generateOAuthUrl(corsair, plugin, {
        tenantId,
        redirectUri: REDIRECT_URI,
    });

    const response = NextResponse.redirect(url);
    response.cookies.set('oauth_state', state, {
        httpOnly: true,   // not readable by JavaScript
        sameSite: 'lax',  // safe for provider redirects
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        maxAge: 60 * 10,  // expires in 10 minutes
    });
    return response;
}