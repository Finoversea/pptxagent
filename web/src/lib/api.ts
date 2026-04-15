/** API client for backend communication */

import type { Deck, DeckCreate, DeckResponse, Slide, SlideEdit, Message } from '@/types';

// Direct connection to backend (bypass Next.js proxy to avoid timeout issues)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// WebSocket connection
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';

/** Generate a new deck from a prompt */
export async function generateDeck(request: DeckCreate): Promise<DeckResponse> {
  const response = await fetch(`${API_BASE}/deck/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Generation failed: ${response.statusText}`);
  }

  return response.json();
}

/** Get deck JSON state */
export async function getDeck(deckId: string): Promise<Deck> {
  const response = await fetch(`${API_BASE}/deck/${deckId}`);

  if (!response.ok) {
    throw new Error(`Failed to get deck: ${response.statusText}`);
  }

  return response.json();
}

/** Get all slides for a deck */
export async function getSlides(deckId: string): Promise<{ slides: Slide[] }> {
  const response = await fetch(`${API_BASE}/deck/${deckId}/slides`);

  if (!response.ok) {
    throw new Error(`Failed to get slides: ${response.statusText}`);
  }

  return response.json();
}

/** Edit a specific slide via conversation */
export async function editSlide(
  deckId: string,
  slideIndex: number,
  request: SlideEdit
): Promise<{ status: string; slide_index: number; intent: string; confidence: number }> {
  const response = await fetch(`${API_BASE}/deck/${deckId}/slide/${slideIndex}/edit`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Edit failed: ${response.statusText}`);
  }

  return response.json();
}

/** Chat with deck for conversational editing */
export async function chatWithDeck(
  deckId: string,
  request: { content: string }
): Promise<{ status: string; slide_index?: number; intent?: string; message?: string }> {
  const response = await fetch(`${API_BASE}/deck/${deckId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }

  return response.json();
}

/** Get conversation history */
export async function getConversation(deckId: string): Promise<{ messages: Message[] }> {
  const response = await fetch(`${API_BASE}/deck/${deckId}/conversation`);

  if (!response.ok) {
    throw new Error(`Failed to get conversation: ${response.statusText}`);
  }

  return response.json();
}

/** Get PPTX download URL */
export function getDownloadUrl(deckId: string): string {
  return `${API_BASE}/deck/${deckId}/export`;
}

/** Connect to WebSocket for preview updates */
export function connectPreviewStream(deckId: string): WebSocket {
  return new WebSocket(`${WS_BASE}/deck/${deckId}/preview-stream`);
}