import { NextRequest, NextResponse } from 'next/server';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export async function GET(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }

  try {
    // Get events from the next 30 days
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
    });

    const response = await fetch(
      `${CALENDAR_API}/calendars/primary/events?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message || 'Calendar API error' }, { status: response.status });
    }

    const data = await response.json();

    // Transform to our CalendarEvent format
    const events = (data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendees: (event.attendees || []).map((a: any) => a.email),
      description: event.description,
      meetLink: event.hangoutLink,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}

// Create a calendar event
export async function POST(request: NextRequest) {
  const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'No access token' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const event = {
      summary: body.title,
      description: body.description,
      start: {
        dateTime: body.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: body.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: body.attendees?.map((email: string) => ({ email })),
      conferenceData: body.addMeet ? {
        createRequest: { requestId: `meet-${Date.now()}` }
      } : undefined,
    };

    const response = await fetch(
      `${CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message }, { status: response.status });
    }

    const createdEvent = await response.json();
    return NextResponse.json({
      id: createdEvent.id,
      title: createdEvent.summary,
      start: createdEvent.start?.dateTime,
      end: createdEvent.end?.dateTime,
      meetLink: createdEvent.hangoutLink,
    });
  } catch (error) {
    console.error('Calendar create error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
