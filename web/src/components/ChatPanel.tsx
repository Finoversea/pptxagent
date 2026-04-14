'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Message } from '@/types';
import { useChatWithDeck, useConversation } from '@/hooks/useDeck';
import { useDeckStore } from '@/stores/deckStore';

/** Chat panel component for conversational editing */
export function ChatPanel() {
  const { deckId, selectedSlideIndex, isEditing, setIsEditing } = useDeckStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useChatWithDeck(deckId);
  const { data: conversationData } = useConversation(deckId);

  const messages: Message[] = useMemo(
    () => conversationData?.messages || [],
    [conversationData?.messages]
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !deckId) return;

    setIsEditing(true);
    try {
      await chatMutation.mutateAsync(inputValue.trim());
      setInputValue('');
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
              className={`message-bubble ${
                message.role === 'user' ? 'message-user' : 'message-assistant'
              }`}
            >
              <p>{message.content}</p>
              {message.edited_slide !== undefined && (
                <p className="text-xs mt-1 opacity-70">
                  Slide {message.edited_slide + 1} edited
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {(isEditing || chatMutation.isPending) && (
          <div className="flex justify-start">
            <div className="message-bubble message-assistant">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pwc-orange" />
                <p>Processing your edit...</p>
              </div>
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
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what changes you want..."
            className="chat-input"
            disabled={isEditing || chatMutation.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isEditing || chatMutation.isPending}
            className="px-4 py-2 bg-pwc-orange text-white rounded-lg hover:bg-pwc-orange400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}