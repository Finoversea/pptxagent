/** React Query hooks for deck operations */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  generateDeck,
  getDeck,
  getSlides,
  editSlide,
  chatWithDeck,
  getConversation,
} from '@/lib/api';
import type { DeckCreate, SlideEdit } from '@/types';

/** Generate a new deck */
export function useGenerateDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateDeck,
    onSuccess: (data) => {
      // Invalidate queries to fetch new deck data
      queryClient.invalidateQueries({ queryKey: ['deck', data.deck_id] });
      queryClient.invalidateQueries({ queryKey: ['slides', data.deck_id] });
    },
  });
}

/** Get deck state */
export function useDeck(deckId: string | null) {
  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => getDeck(deckId!),
    enabled: deckId !== null,
  });
}

/** Get slides for a deck */
export function useSlides(deckId: string | null) {
  return useQuery({
    queryKey: ['slides', deckId],
    queryFn: () => getSlides(deckId!),
    enabled: deckId !== null,
    refetchInterval: 2000, // Poll for updates during editing
  });
}

/** Edit a slide */
export function useEditSlide(deckId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { slideIndex: number; request: SlideEdit }) =>
      editSlide(deckId!, params.slideIndex, params.request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', deckId] });
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    },
  });
}

/** Chat with deck */
export function useChatWithDeck(deckId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => chatWithDeck(deckId!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slides', deckId] });
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', deckId] });
    },
  });
}

/** Get conversation history */
export function useConversation(deckId: string | null) {
  return useQuery({
    queryKey: ['conversation', deckId],
    queryFn: () => getConversation(deckId!),
    enabled: deckId !== null,
    refetchInterval: 1000, // Poll for new messages
  });
}