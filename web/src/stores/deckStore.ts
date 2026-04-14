/** Zustand store for local UI state */

import { create } from 'zustand';

interface DeckState {
  // Current deck ID
  deckId: string | null;
  setDeckId: (id: string | null) => void;

  // Selected slide index for editing
  selectedSlideIndex: number;
  setSelectedSlideIndex: (index: number) => void;

  // Loading states
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;

  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useDeckStore = create<DeckState>((set) => ({
  deckId: null,
  setDeckId: (id) => set({ deckId: id }),

  selectedSlideIndex: 0,
  setSelectedSlideIndex: (index) => set({ selectedSlideIndex: index }),

  isGenerating: false,
  setIsGenerating: (loading) => set({ isGenerating: loading }),

  isEditing: false,
  setIsEditing: (editing) => set({ isEditing: editing }),

  error: null,
  setError: (error) => set({ error }),
}));