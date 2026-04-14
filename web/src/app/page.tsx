'use client';

import { useDeckStore } from '@/stores/deckStore';
import {
  ChatPanel,
  SlidePreview,
  SlideThumbnailGrid,
  PromptInput,
} from '@/components';

/** Main page - split panel UI with chat + preview */
export default function HomePage() {
  const { deckId, error } = useDeckStore();

  // Show prompt input if no deck exists yet
  if (!deckId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        {error && (
          <div className="w-full max-w-2xl mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}
        <PromptInput />
      </main>
    );
  }

  // Show split-panel UI once deck is generated
  return (
    <main className="min-h-screen flex bg-gray-100">
      {/* Left panel: Slide thumbnails */}
      <SlideThumbnailGrid />

      {/* Center panel: Slide preview */}
      <div className="flex-1 flex flex-col">
        <SlidePreview />
      </div>

      {/* Right panel: Chat */}
      <div className="w-96 border-l border-gray-200">
        <ChatPanel />
      </div>

      {/* Error overlay */}
      {error && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 shadow-lg">
          {error}
        </div>
      )}
    </main>
  );
}