import type { corsair } from '@/corsair';

const METADATA_HEADERS = [
    'From',
    'To',
    'Subject',
    'Date',
    'Reply-To',
    'Message-ID',
    'References',
    'Cc',
    'Bcc',
] as const;

export function getGmailHeader(payload: unknown, name: string): string {
    const hdrs = (payload as { headers?: { name?: string; value?: string }[] })?.headers || [];
    return hdrs.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

export async function cacheGmailMessageMetadata(
    client: ReturnType<typeof corsair.withTenant>,
    msgId: string,
) {
    const detail = await client.gmail.api.messages.get({
        id: msgId,
        format: 'metadata',
        metadataHeaders: [...METADATA_HEADERS],
    });

    const payload = detail.payload;
    await client.gmail.db.messages.upsertByEntityId(msgId, {
        ...detail,
        id: msgId,
        subject: getGmailHeader(payload, 'Subject'),
        from: getGmailHeader(payload, 'From'),
        to: getGmailHeader(payload, 'To'),
        cc: getGmailHeader(payload, 'Cc'),
        bcc: getGmailHeader(payload, 'Bcc'),
        replyTo: getGmailHeader(payload, 'Reply-To'),
        messageIdHeader: getGmailHeader(payload, 'Message-ID'),
        references: getGmailHeader(payload, 'References'),
        bodyHtml: '',
        bodyText: '',
        _bodyExtracted: false,
        createdAt: new Date(),
    } as never);
}
