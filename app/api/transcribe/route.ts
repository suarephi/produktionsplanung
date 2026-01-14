import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert File to the format OpenAI expects
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // or 'de' for German
      response_format: 'verbose_json',
    });

    // Also generate a summary using GPT
    let summary = '';
    let actionItems: string[] = [];
    let topics: string[] = [];

    if (transcription.text && transcription.text.length > 50) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a meeting assistant. Analyze the transcript and provide:
1. A brief summary (2-3 sentences)
2. Action items (as a JSON array of strings)
3. Key topics discussed (as a JSON array of strings)

Respond in JSON format: {"summary": "...", "actionItems": [...], "topics": [...]}`
          },
          {
            role: 'user',
            content: transcription.text
          }
        ],
        response_format: { type: 'json_object' },
      });

      try {
        const analysis = JSON.parse(completion.choices[0].message.content || '{}');
        summary = analysis.summary || '';
        actionItems = analysis.actionItems || [];
        topics = analysis.topics || [];
      } catch {
        // If parsing fails, just use the transcript
      }
    }

    return NextResponse.json({
      transcript: transcription.text,
      summary,
      actionItems,
      topics,
      duration: transcription.duration,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
