/** Types for deck and slide structures */

export interface SlideContent {
  title: string;
  subtitle?: string;
  body: string[];
  layout: string;
  notes?: string;
  chart?: Record<string, unknown>;
  table?: string[][];
  image_url?: string;
}

export interface Slide {
  id: string;
  index: number;
  content: SlideContent;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: string;
  title: string;
  slides: Slide[];
  prompt: string;
  style: string;
  created_at: string;
  updated_at: string;
}

export interface DeckCreate {
  prompt: string;
  style?: string;
  title?: string;
}

export interface SlideEdit {
  prompt: string;
  slide_index: number;
}

export interface DeckResponse {
  deck_id: string;
  status: string;
  message?: string;
  preview_url?: string;
}