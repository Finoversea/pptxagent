'use client';

import { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';

/** Full-page chat interface - the primary UI for PPTX Agent */
export function ChatBox() {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use ai-sdk's useChat hook
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
  } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="font-serif text-xl font-bold text-black">PPTX Agent</h1>
        <p className="text-sm text-gray-500">Chat-based PowerPoint generation</p>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="font-serif text-2xl font-bold text-black mb-2">
                  Create presentations with AI
                </h2>
                <p className="text-gray-600 mb-4">
                  Describe what you need and I will generate slides for you.
                </p>
                <p className="text-sm text-gray-500">
                  Example: &quot;Create a 5-slide pitch deck for a fintech startup&quot;
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
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
              <div className="bg-white shadow-sm rounded-lg px-4 py-3">
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
              <div className="bg-red-100 text-red-600 rounded-lg px-4 py-3">
                Error: {error.message}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your presentation..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
            {isLoading && (
              <button
                type="button"
                onClick={stop}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}