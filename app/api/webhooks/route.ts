import { NextResponse } from 'next/server';
import { corsair } from '@/corsair';
import { processWebhook } from 'corsair';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const tenantId = url.searchParams.get('tenantId') || 'default';
        
        // Read the raw body text. Google Calendar notifications have an empty body
        // but headers that specify resource uri, whereas Gmail Pub/Sub sends JSON.
        const rawBody = await req.text();
        
        // Convert Next.js headers to a plain object
        const headersRecord: Record<string, string> = {};
        req.headers.forEach((value, key) => {
            headersRecord[key] = value;
        });

        // Delegate parsing and execution to Corsair's internal webhooks engine.
        // It will match the headers/payload against the Gmail or Google Calendar plugins,
        // sync the entity (email/event) changes to the database, and return the response.
        const result = await processWebhook(corsair, headersRecord, rawBody, {
            tenantId,
        });

        if (result.plugin) {
            console.log(`[Webhook] Handled by plugin "${result.plugin}" with action "${result.action}"`);
            
            // Set any plugin-specific response headers (e.g. handshakes)
            const responseHeaders = result.responseHeaders || {};
            return new NextResponse(JSON.stringify(result.response || { success: true }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...responseHeaders,
                },
            });
        }

        console.warn('[Webhook] No matching plugin found for incoming payload headers:', headersRecord);
        return NextResponse.json({ message: 'No plugin matched the webhook payload' }, { status: 400 });
    } catch (error: any) {
        console.error('[Webhook Error]', error);
        return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
    }
}
