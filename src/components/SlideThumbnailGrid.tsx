'use client';

import { useDeckStore } from '@/stores/deckStore';
import { useSlides } from '@/hooks/useDeck';

/** Slide thumbnail grid - shows all slides for selection */
export function SlideThumbnailGrid() {
  const { deckId, selectedSlideIndex, setSelectedSlideIndex } = useDeckStore();
  const { data: slidesData, isLoading } = useSlides(deckId);

  const slides = slidesData?.slides || [];

  if (!deckId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-100 border-r border-gray-200 p-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pwc-orange" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="font-medium text-sm text-gray-600 mb-3">Slides</h3>

        <div className="space-y-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setSelectedSlideIndex(index)}
              className={`w-full aspect-[16/10] bg-white shadow-sm rounded-lg overflow-hidden transition-all ${
                index === selectedSlideIndex
                  ? 'slide-thumbnail-selected ring-2 ring-pwc-orange'
                  : 'slide-thumbnail hover:shadow-md'
              }`}
            >
              {/* Mini preview */}
              <div className="h-2 bg-pwc-orange" />
              <div className="p-2">
                <p className="font-medium text-xs truncate">{slide.content.title}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {slide.content.body[0] || ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}