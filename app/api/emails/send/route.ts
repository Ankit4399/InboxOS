import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { corsair } from '@/corsair';
import { db } from '@/db/index';
import { corsairAccounts, corsairIntegrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGoogleAccessToken } from '@/lib/google-watch';

export const dynamic = 'force-dynamic';

/**
 * Build an RFC 2822–compliant raw email string and base64url encode it.
 * This is what Gmail's messages.send() expects.
 */
function buildRawEmail(opts: {
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    isHtml?: boolean;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
}): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const lines: string[] = [];

    lines.push(`From: ${opts.from}`);
    lines.push(`To: ${opts.to}`);
    if (opts.cc) lines.push(`Cc: ${opts.cc}`);
    if (opts.bcc) lines.push(`Bcc: ${opts.bcc}`);
    lines.push(`Subject: ${opts.subject}`);
    lines.push(`Date: ${new Date().toUTCString()}`);
    lines.push('MIME-Version: 1.0');

    if (opts.inReplyTo) {
        lines.push(`In-Reply-To: ${opts.inReplyTo}`);
    }
    if (opts.references) {
        lines.push(`References: ${opts.references}`);
    }

    // Send as multipart/alternative so both text and html are included
    lines.push(
        `Content-Type: multipart/alternative; boundary="${boundary}"`
    );
    lines.push('');

    // Plain text part
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    // Strip HTML tags for plain text version
    const plainText = opts.body.replace(/<[^>]*>/g, '').trim();
    lines.push(plainText);
    lines.push('');

    // HTML part
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');
    if (opts.isHtml) {
        lines.push(opts.body);
    } else {
        // Convert plain text to basic HTML
        const htmlBody = opts.body
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        lines.push(`<html><body><div>${htmlBody}</div></body></html>`);
    }
    lines.push('');
    lines.push(`--${boundary}--`);

    const rawMessage = lines.join('\r\n');

    // base64url encode (Gmail API requirement)
    return Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// ── POST /api/emails/send ────────────────────────────────────────────

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
        to,
        cc,
        bcc,
        subject,
        body: emailBody,
        isHtml,
        threadId,
        inReplyTo,
        references,
    } = body;

    if (!to || !subject || !emailBody) {
        return NextResponse.json(
            { error: 'Missing required fields: to, subject, body' },
            { status: 400 }
        );
    }

    // Verify Gmail integration exists
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
        return NextResponse.json(
            { error: 'Gmail not connected' },
            { status: 400 }
        );
    }

    try {
        const client = corsair.withTenant(session.user.id);

        // Get the user's email address for the From header via direct fetch with Google token
        let fromEmail = session.user.email;
        try {
            const accessToken = await getGoogleAccessToken(session.user.id, 'gmail');
            const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (profileRes.ok) {
                const profile = await profileRes.json() as { emailAddress?: string };
                if (profile.emailAddress) {
                    fromEmail = profile.emailAddress;
                }
            }
        } catch (profileErr) {
            console.error('[Gmail Send Profile Error] Failed to fetch email address, falling back:', profileErr);
        }

        const raw = buildRawEmail({
            from: `${session.user.name} <${fromEmail}>`,
            to,
            cc,
            bcc,
            subject,
            body: emailBody,
            isHtml,
            threadId,
            inReplyTo,
            references,
        });

        const result = await client.gmail.api.messages.send({
            raw,
            threadId: threadId || undefined,
        });

        console.log(
            `[Gmail Send] Email sent successfully. ID: ${result.id}, Thread: ${result.threadId}`
        );

        return NextResponse.json({
            success: true,
            messageId: result.id,
            threadId: result.threadId,
        });
    } catch (error: any) {
        console.error('[Gmail Send Error]', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}
