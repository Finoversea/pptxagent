'use client';

import { useState } from 'react';
import { useGenerateDeck } from '@/hooks/useDeck';
import { useDeckStore } from '@/stores/deckStore';

/** Prompt input for initial deck generation */
export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const { setDeckId, setIsGenerating, setError, isGenerating } = useDeckStore();

  const generateMutation = useGenerateDeck();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        style: 'pwc',
      });

      setDeckId(result.deck_id);
      setPrompt('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="font-serif text-2xl font-bold text-black mb-4">
          PPTX Agent
        </h1>
        <p className="text-gray-600 mb-6">
          Describe your presentation and I&apos;ll generate slides you can edit through conversation
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a 5-slide pitch deck for a fintech startup targeting Series A investors..."
          className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pwc-orange focus:border-transparent resize-none"
          disabled={isGenerating}
        />

        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {prompt.length > 0 && `${prompt.length} characters`}
          </span>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="px-6 py-3 bg-pwc-orange text-white rounded-lg hover:bg-pwc-orange400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isGenerating ? (
              <span className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Generating...</span>
              </span>
            ) : (
              'Generate Presentation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}