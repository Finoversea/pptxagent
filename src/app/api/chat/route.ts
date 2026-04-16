import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { z } from 'zod';
import { formatUserContent, CONTENT_ISOLATION_INSTRUCTION } from '@/lib/inputSanitization';
import { RateLimiter } from '@/lib/rateLimiter';

// Qwen API (DashScope) - OpenAI compatible endpoint
const qwen = createOpenAICompatible({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
  name: 'qwen',
});

// Rate limiter - 60 requests per minute
const chatRateLimiter = new RateLimiter(60);

// Zod schema for request validation
// Supports both legacy { role, content } format and ai-sdk v4+ UIMessage format with parts
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(4000, 'Message content exceeds 4000 characters').optional(),
  parts: z.array(z.object({
    type: z.string(),
    text: z.string(),
  })).optional(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50, 'Too many messages in conversation'),
});

/**
 * Extract text content from a message.
 * Handles both legacy { content } format and UIMessage { parts } format.
 */
function getMessageContent(msg: z.infer<typeof MessageSchema>): string {
  if (msg.content) return msg.content;
  if (msg.parts) {
    return msg.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('\n');
  }
  return '';
}

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    await chatRateLimiter.acquire();

    // Parse and validate request body
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(i => i.message).join(', ');
      return new Response(JSON.stringify({ error: `Invalid request: ${errors}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages } = validationResult.data;

    // Sanitize user messages to prevent LLM injection attacks
    // Only sanitize 'user' role messages - assistant/system are from trusted sources
    const sanitizedMessages = messages.map(msg => {
      if (msg.role === 'user') {
        const content = getMessageContent(msg);
        return {
          role: msg.role,
          content: formatUserContent(content),
        };
      }
      // For assistant/system messages, extract content from parts or use existing content
      return {
        role: msg.role,
        content: getMessageContent(msg),
      };
    });

    // Stream chat response using ai-sdk with Qwen model
    const result = streamText({
      model: qwen('qwen3.5-plus'),
      system: `You are a helpful presentation assistant. You help users create and edit PowerPoint presentations.
When generating slides, respond with JSON format containing slide data.
Keep responses concise and professional.

${CONTENT_ISOLATION_INSTRUCTION}

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
      messages: sanitizedMessages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    // Generic error message - no internal details leaked
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}