import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, action } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream chat response using ai-sdk
    const result = streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: `You are a helpful presentation assistant. You help users create and edit PowerPoint presentations.
When generating slides, respond with JSON format containing slide data.
Keep responses concise and professional.

For deck generation, respond with:
{
  "action": "generate",
  "slides": [{"id": "slide_001", "type": "title", "title": "...", "body": "..."}]
}

For slide editing, respond with:
{
  "action": "edit",
  "slideIndex": 0,
  "slide": {"title": "...", "body": "..."}
}`,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}