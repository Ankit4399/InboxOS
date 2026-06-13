import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { corsair } from '@/corsair';
import { processWebhook } from 'corsair';
import { db } from '@/db/index';
import { user } from '@/db/schema';

export const dynamic = 'force-dynamic';

/** Gmail Pub/Sub pushes JSON without tenantId — resolve from the Gmail address in the payload. */
async function resolveTenantId(
    queryTenantId: string | null,
    rawBody: string,
): Promise<string> {
    if (queryTenantId && queryTenantId !== 'default') {
        return queryTenantId;
    }

    try {
        const payload = JSON.parse(rawBody) as {
            message?: { data?: string };
        };
        const encoded = payload.message?.data;
        if (!encoded) return queryTenantId || 'default';

        const decoded = JSON.parse(
            Buffer.from(encoded, 'base64').toString('utf-8'),
        ) as { emailAddress?: string };

        if (!decoded.emailAddress) return queryTenantId || 'default';

        const [matchedUser] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, decoded.emailAddress))
            .limit(1);

        if (matchedUser) {
            console.log(
                `[Webhook] Resolved tenant ${matchedUser.id} from Gmail address ${decoded.emailAddress}`,
            );
            return matchedUser.id;
        }
    } catch {
        // Not a Pub/Sub payload — fall through
    }

    return queryTenantId || 'default';
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const rawBody = await req.text();
        const tenantId = await resolveTenantId(
            url.searchParams.get('tenantId'),
            rawBody,
        );

        const headersRecord: Record<string, string> = {};
        req.headers.forEach((value, key) => {
            headersRecord[key] = value;
        });

        const result = await processWebhook(corsair, headersRecord, rawBody, {
            tenantId,
        });

        if (result.plugin) {
            console.log(
                `[Webhook] Handled by plugin "${result.plugin}" with action "${result.action}" (tenant: ${tenantId})`,
            );

            const responseHeaders = result.responseHeaders || {};
            return new NextResponse(JSON.stringify(result.response || { success: true }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...responseHeaders,
                },
            });
        }

        console.warn('[Webhook] No matching plugin for payload');
        return NextResponse.json({ message: 'No plugin matched the webhook payload' }, { status: 400 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Webhook processing failed';
        console.error('[Webhook Error]', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
