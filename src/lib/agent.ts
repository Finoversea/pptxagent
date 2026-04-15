/**
 * Deck Agent - Workflow for PPTX generation
 *
 * M1: Basic async pipeline
 * M2: Websearch skill integration
 */

import Anthropic from "@anthropic-ai/sdk";
import z from "zod";
import { config, getRetryConfig } from "./config.js";
import { RateLimiter } from "./rateLimiter.js";
import { withRetry, isRetryableError, getErrorSummary } from "./retry.js";
import { sanitizeUserInput, formatUserContent, CONTENT_ISOLATION_INSTRUCTION } from "./inputSanitization.js";

// === Zod Schemas ===

const SlideSchema = z.object({
  id: z.string(),
  type: z.string(),
  layout: z.string(),
  title: z.string().max(100),
  body: z.string().optional(),
});

const DeckResponseSchema = z.object({
  slides: z.array(SlideSchema),
  deck_id: z.string(),
  preview_url: z.string().optional(),
  errors: z.array(z.string()).default([]),
});

// State interface (derived from Zod)
export interface DeckState {
  prompt: string;
  deckId?: string;
  researchData?: Record<string, unknown>;
  researchSummary?: string;
  outline?: Array<{ type: string; layout: string }>;
  outlineRationale?: string;
  slides: Array<{ id: string; type: string; layout: string; title: string; body?: string }>;
  editRequest?: string;
  editedSlide?: { id: string; type: string; layout: string; title: string; body?: string };
  previewUrl?: string;
  pptxUrl?: string;
  errors: string[];
  retryCount: number;
  stylePreset: string;
  createdAt: string;
}

// Anthropic client (with validation)
const client = config.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY })
  : null;

// Create rate limiter instance
const retryConfig = getRetryConfig(config);
const rateLimiter = new RateLimiter(retryConfig.rateLimitRpm);

/**
 * Safely extract text from Anthropic message content
 * Handles empty arrays, null content, and non-text content blocks
 *
 * @param message - Anthropic message response
 * @returns Extracted text or empty string
 */
function extractTextFromMessage(message: Anthropic.Message): string {
  // Check if content array exists and has elements
  if (!message.content || message.content.length === 0) {
    return "";
  }

  // Get first content block
  const firstBlock = message.content[0];

  // Check if it's a text block and has text property
  if (firstBlock?.type === "text" && typeof firstBlock.text === "string") {
    return firstBlock.text;
  }

  // Fallback for non-text content
  return "";
}

// === Websearch Skill (M2) ===

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Websearch skill - search for research-backed content
 * Uses a simple search approach. Can be enhanced with Tavily API.
 */
async function websearch(query: string): Promise<SearchResult[]> {
  // Check if client is available
  if (!client) {
    return [{
      title: "Research unavailable",
      url: "",
      snippet: "API key not configured. Using fallback content.",
    }];
  }

  // For M2, we use Claude's knowledge for research
  // In production, integrate Tavily/Google Search API
  try {
    // Use content isolation to prevent prompt injection
    const safeQuery = formatUserContent(query);

    // Apply rate limiting and retry with exponential backoff
    await rateLimiter.acquire();

    const message = await withRetry(
      async () => {
        return await client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1024,
          system: `You are a research assistant. Provide factual, verifiable information about the topic.
  Return 3-5 key facts with brief citations where possible.
  Format as bullet points.
  ${CONTENT_ISOLATION_INSTRUCTION}`,
          messages: [{ role: "user", content: safeQuery }],
        });
      },
      retryConfig,
      isRetryableError
    );

    const content = extractTextFromMessage(message);

    // Parse results
    return [{
      title: "Research Summary",
      url: "claude://research",
      snippet: content.slice(0, 500),
    }];
  } catch (error) {
    console.warn(`websearch failed after retries: ${getErrorSummary(error)}`);
    return [{
      title: "Research unavailable",
      url: "",
      snippet: "Websearch temporarily unavailable. Using fallback content.",
    }];
  }
}

/**
 * Generate research-backed content using websearch results
 */
async function generateResearchBackedContent(slideType: string, prompt: string, researchContext: string): Promise<string> {
  // Fallback if no API client
  if (!client) {
    const fallbacks: Record<string, string> = {
      title: "Presentation Title",
      problem: "Key challenges facing the industry",
      solution: "Proposed innovative approach",
      market: "Market opportunity analysis",
      business_model: "Revenue and pricing strategy",
      traction: "Key metrics and growth",
      team: "Leadership team overview",
      ask: "Investment requirements",
      summary: "Key takeaways",
      content: "Slide content",
    };
    return fallbacks[slideType] || `Content for ${slideType} slide`;
  }

  // Use content isolation for both prompt and research context
  // researchContext is sanitized and moved to user message to prevent system prompt injection
  const safePrompt = formatUserContent(prompt, researchContext);

  const systemPrompt = `Generate concise, professional slide content for a ${slideType} slide.
The research context and user prompt are provided in the user message - use them to add factual, credible information.

Rules:
- Keep titles under 10 words
- Keep body text under 100 words
- Include specific facts/numbers from research when available
- Use bullet points for lists
${CONTENT_ISOLATION_INSTRUCTION}`;

  try {
    // Apply rate limiting and retry with exponential backoff
    await rateLimiter.acquire();

    const message = await withRetry(
      async () => {
        return await client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: "user", content: safePrompt }],
        });
      },
      retryConfig,
      isRetryableError
    );

    return extractTextFromMessage(message).trim() || `Content for ${slideType} slide`;
  } catch (error) {
    console.warn(`generateResearchBackedContent failed for ${slideType}: ${getErrorSummary(error)}`);
    return `Content for ${slideType} slide`;
  }
}

async function generateSlideContent(slideType: string, prompt: string): Promise<string> {
  // Fallback if no API client
  if (!client) {
    const fallbacks: Record<string, string> = {
      title: "Presentation Title",
      problem: "Key challenges facing the industry",
      solution: "Proposed innovative approach",
      market: "Market opportunity analysis",
      business_model: "Revenue and pricing strategy",
      traction: "Key metrics and growth",
      team: "Leadership team overview",
      ask: "Investment requirements",
      summary: "Key takeaways",
      content: "Slide content",
    };
    return fallbacks[slideType] || `Content for ${slideType} slide`;
  }

  // Use content isolation to prevent prompt injection
  const safePrompt = formatUserContent(prompt);

  const systemPrompt = `Generate concise, professional slide content for a ${slideType} slide.
Rules:
- Keep titles under 10 words
- Keep body text under 100 words
- Use bullet points for lists
- No formatting markup
${CONTENT_ISOLATION_INSTRUCTION}`;

  try {
    // Apply rate limiting and retry with exponential backoff
    await rateLimiter.acquire();

    const message = await withRetry(
      async () => {
        return await client.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 256,
          system: systemPrompt,
          messages: [{ role: "user", content: safePrompt }],
        });
      },
      retryConfig,
      isRetryableError
    );

    return extractTextFromMessage(message).trim() || `Content for ${slideType} slide`;
  } catch (error) {
    console.warn(`generateSlideContent failed for ${slideType}: ${getErrorSummary(error)}`);
    return `Content for ${slideType} slide`;
  }
}

// === Pipeline Functions ===

async function researchPhase(state: DeckState): Promise<Partial<DeckState>> {
  const prompt = sanitizeUserInput(state.prompt);

  // M2: Websearch for research-backed content
  const searchResults = await websearch(prompt);

  // Combine search results into research summary
  const researchSummary = searchResults
    .map(r => `${r.title}: ${r.snippet}`)
    .join("\n\n");

  return {
    researchData: { results: searchResults },
    researchSummary: researchSummary.slice(0, 1000),
  };
}

async function planningPhase(state: DeckState): Promise<Partial<DeckState>> {
  const prompt = sanitizeUserInput(state.prompt);
  const promptLower = prompt.toLowerCase();

  let template: Array<{ type: string; layout: string }>;

  if (["pitch", "investors", "funding", "startup"].some(kw => promptLower.includes(kw))) {
    template = [
      { type: "title", layout: "title_only" },
      { type: "problem", layout: "title_content" },
      { type: "solution", layout: "title_content" },
      { type: "market", layout: "title_content" },
      { type: "business_model", layout: "title_content" },
      { type: "traction", layout: "chart" },
      { type: "team", layout: "two_column" },
      { type: "ask", layout: "title_content" },
    ];
  } else if (["report", "quarterly", "metrics"].some(kw => promptLower.includes(kw))) {
    template = [
      { type: "title", layout: "title_only" },
      { type: "summary", layout: "title_content" },
      { type: "metrics", layout: "chart" },
      { type: "insights", layout: "title_content" },
      { type: "next_steps", layout: "title_content" },
    ];
  } else {
    template = [
      { type: "title", layout: "title_only" },
      { type: "content", layout: "title_content" },
      { type: "content", layout: "title_content" },
      { type: "content", layout: "title_content" },
      { type: "summary", layout: "title_content" },
    ];
  }

  return {
    outline: template,
    outlineRationale: `Generated ${template.length} slides based on prompt analysis`,
  };
}

async function generationPhase(state: DeckState): Promise<Partial<DeckState>> {
  const outline = state.outline || [];
  const prompt = sanitizeUserInput(state.prompt);
  const researchSummary = state.researchSummary || "";
  const errors: string[] = [];

  const slides: Array<{ id: string; type: string; layout: string; title: string; body?: string }> = [];

  for (let i = 0; i < outline.length; i++) {
    const slideTemplate = outline[i];
    try {
      // M2: Use research-backed content generation
      const content = await generateResearchBackedContent(
        slideTemplate.type,
        prompt,
        researchSummary
      );
      slides.push({
        id: `slide_${i.toString().padStart(3, "0")}`,
        type: slideTemplate.type,
        layout: slideTemplate.layout,
        title: content.slice(0, 100),
        body: content,
      });
    } catch (error) {
      errors.push(`Slide ${i} generation failed: ${error}`);
      slides.push({
        id: `slide_${i.toString().padStart(3, "0")}`,
        type: slideTemplate.type,
        layout: "title_content",
        title: `Slide ${i + 1}`,
        body: "Content placeholder",
      });
    }
  }

  return {
    slides,
    deckId: `deck_${Date.now()}`,
    errors,
  };
}

async function renderPhase(state: DeckState): Promise<Partial<DeckState>> {
  const deckId = state.deckId || "unknown";

  return {
    previewUrl: `/deck/${deckId}/preview`,
    pptxUrl: `/export/${deckId}/pptx`,
  };
}

// === Main Workflow ===

/**
 * Run full deck generation workflow
 */
export async function runDeckGeneration(prompt: string, style: string = "default"): Promise<DeckState> {
  const initialState: DeckState = {
    prompt,
    slides: [],
    errors: [],
    retryCount: 0,
    stylePreset: style,
    createdAt: new Date().toISOString(),
  };

  // Run pipeline phases
  const researchResult = await researchPhase(initialState);
  const stateAfterResearch = { ...initialState, ...researchResult };

  const planningResult = await planningPhase(stateAfterResearch);
  const stateAfterPlanning = { ...stateAfterResearch, ...planningResult };

  const generationResult = await generationPhase(stateAfterPlanning);
  const stateAfterGeneration = { ...stateAfterPlanning, ...generationResult };

  const renderResult = await renderPhase(stateAfterGeneration);
  const finalState = { ...stateAfterGeneration, ...renderResult };

  return finalState;
}