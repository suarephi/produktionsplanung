import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_API = 'https://api.telegram.org/bot';

// Send a message via Telegram
export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const defaultChatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { message, chatId, parseMode } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const targetChatId = chatId || defaultChatId;
    if (!targetChatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: parseMode || 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: data.result.message_id });
  } catch (error) {
    console.error('Telegram send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// Get bot info (for verification)
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ connected: false, error: 'Bot token not configured' });
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${botToken}/getMe`);
    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({
        connected: true,
        bot: {
          username: data.result.username,
          firstName: data.result.first_name,
        },
      });
    }

    return NextResponse.json({ connected: false, error: 'Invalid token' });
  } catch (error) {
    return NextResponse.json({ connected: false, error: 'Failed to connect' });
  }
}
