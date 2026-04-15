'use client';

import { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { useDeckStore } from '@/stores/deckStore';

/** Chat panel component using ai-sdk useChat hook */
export function ChatPanel() {
  const { deckId, selectedSlideIndex } = useDeckStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      body: { deckId },
    }),
  });

  const isLoading = status === 'streaming';

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    await sendMessage({ text: inputValue.trim() });
    setInputValue('');
  };

  if (!deckId) {
    return (
      <div className="flex flex-col h-full bg-gray-50 p-4">
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>Generate a presentation first to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="font-medium">Start editing your presentation</p>
            <p className="text-sm mt-2">
              Select a slide and describe what changes you want
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">
                {message.parts
                  .filter((p: any) => p.type === 'text')
                  .map((p: any) => p.text)
                  .join('\n')}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500" />
                <p className="text-gray-600">Thinking...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-600 rounded-lg px-4 py-2">
              Error: {error.message}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm text-gray-500">
            Editing slide {selectedSlideIndex + 1}
          </span>
        </div>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe what changes you want..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
          {isLoading && (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Stop
            </button>
          )}
        </form>
      </div>
    </div>
  );
}