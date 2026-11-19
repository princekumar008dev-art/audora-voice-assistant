import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are Echo, a smart, friendly, concise AI voice assistant similar to Amazon Echo / Alexa.
Provide a direct, natural response under 2-3 sentences suitable for speech synthesis.
User Query: "${prompt}"`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidateText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (candidateText) {
            return NextResponse.json({
              response: candidateText,
              speech: candidateText,
            });
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to smart responder', err);
      }
    }

    // Default intelligent conversational response
    const defaultReplies: { [key: string]: string } = {
      default: `I understood: "${prompt}". Feel free to ask me to set a reminder, take a note, or check the weather.`,
    };

    return NextResponse.json({
      response: defaultReplies.default,
      speech: defaultReplies.default,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process chat query' }, { status: 500 });
  }
}
