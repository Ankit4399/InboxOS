import { corsair } from '@/corsair';
import crypto from 'node:crypto';

// Helper to retrieve integration credentials and account refresh tokens from Corsair,
// then exchange them for a fresh Google API access token.
async function getGoogleAccessToken(userId: string, pluginName: 'gmail' | 'googlecalendar') {
    // 1. Get client credentials (integration-level)
    const getClientId = corsair.keys[pluginName].get_client_id;
    const getClientSecret = corsair.keys[pluginName].get_client_secret;
    
    // 2. Get user refresh token (account-level)
    const getRefreshToken = corsair.withTenant(userId)[pluginName].keys.get_refresh_token;

    const [clientId, clientSecret, refreshToken] = await Promise.all([
        getClientId(),
        getClientSecret(),
        getRefreshToken(),
    ]);

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(`Missing Google OAuth credentials for tenant ${userId} in plugin ${pluginName}`);
    }

    // 3. Request fresh access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`Google token refresh failed for ${pluginName}: ${err}`);
    }

    const data = (await tokenRes.json()) as { access_token: string };
    return data.access_token;
}

/**
 * Registers / Renews Gmail Watch Channel via Google Cloud Pub/Sub.
 *
 * IMPORTANT: Gmail watches expire after 7 days. You must re-run this periodically (e.g. daily cron).
 *
 * @param userId - The session user id (Corsair tenantId)
 * @param topicName - Fully qualified GCP Pub/Sub Topic (e.g. "projects/YOUR_PROJECT_ID/topics/YOUR_TOPIC")
 */
export async function registerGmailWatch(userId: string, topicName: string) {
    const accessToken = await getGoogleAccessToken(userId, 'gmail');

    const watchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            topicName,
            labelIds: ['INBOX'], // Watch specific label(s)
        }),
    });

    if (!watchRes.ok) {
        const err = await watchRes.text();
        throw new Error(`Gmail watch subscription failed: ${err}`);
    }

    const data = (await watchRes.json()) as { historyId: string; expiration: string };
    return {
        historyId: data.historyId,
        expiration: new Date(Number(data.expiration)).toISOString(),
    };
}

/**
 * Registers / Renews a Google Calendar Webhook Watch Channel.
 *
 * IMPORTANT: Calendar watches typically expire after 30 days. You must re-run this before expiration.
 *
 * @param userId - The session user id (Corsair tenantId)
 * @param webhookBaseUrl - The public HTTPS base URL of your app (e.g., "https://example.com" or ngrok URL)
 * @param calendarId - The calendar to watch (defaults to "primary")
 */
export async function registerCalendarWatch(userId: string, webhookBaseUrl: string, calendarId: string = 'primary') {
    const accessToken = await getGoogleAccessToken(userId, 'googlecalendar');
    const channelId = crypto.randomUUID();

    const watchRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: channelId,
                type: 'web_hook',
                address: `${webhookBaseUrl}/api/webhooks?tenantId=${encodeURIComponent(userId)}`,
            }),
        }
    );

    if (!watchRes.ok) {
        const err = await watchRes.text();
        throw new Error(`Google Calendar watch subscription failed: ${err}`);
    }

    const data = (await watchRes.json()) as { id: string; resourceId: string; expiration: string };
    return {
        channelId: data.id,
        resourceId: data.resourceId,
        expiration: new Date(Number(data.expiration)).toISOString(),
    };
}
