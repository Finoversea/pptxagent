'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useDeckStore } from '@/stores/deckStore';

/** Prompt input for initial deck generation using ai-sdk */
export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const { setDeckId, setIsGenerating, setError } = useDeckStore();

  // Use ai-sdk's useChat hook with TextStreamChatTransport
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
  } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      body: { action: 'generate' },
    }),
    onFinish: ({ message }) => {
      // Parse response to extract deck_id
      try {
        const content = message.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('\n');
        const jsonMatch = content.match(/\{[\s\S]*"action":\s*"generate"[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.deck_id) {
            setDeckId(data.deck_id);
            setIsGenerating(false);
          }
        }
      } catch {
        // Generate a deck ID for now
        setDeckId(`deck_${Date.now()}`);
        setIsGenerating(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsGenerating(false);
    },
  });

  const isLoading = status === 'streaming';
  const isGenerating = isLoading;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    await sendMessage({ text: prompt.trim() });
    setPrompt('');
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
          className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          disabled={isLoading || isGenerating}
        />

        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {prompt.length > 0 && `${prompt.length} characters`}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading || isGenerating}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {(isLoading || isGenerating) ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Generating...</span>
                </span>
              ) : (
                'Generate Presentation'
              )}
            </button>
            {isLoading && (
              <button
                onClick={stop}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 bg-red-100 text-red-600 rounded-lg px-4 py-2">
            Error: {error.message}
          </div>
        )}
      </div>
    </div>
  );
}