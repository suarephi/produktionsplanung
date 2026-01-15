import { NextRequest, NextResponse } from 'next/server';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  const searchParams = request.nextUrl.searchParams;
  const contactEmail = searchParams.get('contact');
  const maxResults = searchParams.get('maxResults') || '20';

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }

  try {
    // Build search query
    let query = '';
    if (contactEmail) {
      query = `from:${contactEmail} OR to:${contactEmail}`;
    }

    const params = new URLSearchParams({
      maxResults,
      ...(query && { q: query }),
    });

    // Get message list
    const listResponse = await fetch(
      `${GMAIL_API}/messages?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listResponse.ok) {
      const error = await listResponse.json();
      return NextResponse.json({ error: error.error?.message }, { status: listResponse.status });
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];

    // Fetch details for each message (batch up to 10)
    const detailedMessages = await Promise.all(
      messages.slice(0, 10).map(async (msg: { id: string }) => {
        const msgResponse = await fetch(
          `${GMAIL_API}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!msgResponse.ok) return null;

        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];

        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        return {
          id: msgData.id,
          threadId: msgData.threadId,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          to: getHeader('To'),
          date: getHeader('Date'),
          snippet: msgData.snippet,
          labelIds: msgData.labelIds || [],
        };
      })
    );

    // Filter out nulls and transform
    const emails = detailedMessages
      .filter(Boolean)
      .map((msg: any) => ({
        id: msg.id,
        threadId: msg.threadId,
        subject: msg.subject,
        fromEmail: extractEmail(msg.from),
        fromName: extractName(msg.from),
        toEmail: extractEmail(msg.to),
        snippet: msg.snippet,
        date: msg.date,
        isSent: msg.labelIds.includes('SENT'),
      }));

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Gmail fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

// Send an email
export async function POST(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, subject, message, threadId } = body;

    // Create RFC 2822 formatted email
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      message,
    ];

    const rawEmail = Buffer.from(emailLines.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendBody: any = { raw: rawEmail };
    if (threadId) sendBody.threadId = threadId;

    const response = await fetch(`${GMAIL_API}/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendBody),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message }, { status: response.status });
    }

    const sent = await response.json();
    return NextResponse.json({ id: sent.id, threadId: sent.threadId });
  } catch (error) {
    console.error('Gmail send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

// Helper functions
function extractEmail(header: string): string {
  const match = header.match(/<([^>]+)>/);
  return match ? match[1] : header;
}

function extractName(header: string): string {
  const match = header.match(/^([^<]+)</);
  return match ? match[1].trim().replace(/"/g, '') : '';
}
