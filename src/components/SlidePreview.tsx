'use client';

import { useDeckStore } from '@/stores/deckStore';
import { useSlides } from '@/hooks/useDeck';
import { getDownloadUrl } from '@/lib/api';

/** Slide preview panel - shows the selected slide */
export function SlidePreview() {
  const { deckId, selectedSlideIndex } = useDeckStore();
  const { data: slidesData, isLoading } = useSlides(deckId);

  const slides = slidesData?.slides || [];
  const selectedSlide = slides[selectedSlideIndex];

  if (!deckId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border border-gray-200">
        <div className="text-center text-gray-500">
          <p className="font-medium">No presentation yet</p>
          <p className="text-sm mt-2">Generate one to see the preview</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pwc-orange" />
      </div>
    );
  }

  if (!selectedSlide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border border-gray-200">
        <p className="text-gray-500">Select a slide to preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Slide content preview */}
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-full max-w-[800px] aspect-[16/10] bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Orange accent bar */}
          <div className="h-4 bg-pwc-orange" />

          {/* Slide content */}
          <div className="p-8">
            <h2 className="font-serif text-2xl font-bold text-black mb-2">
              {selectedSlide.content.title}
            </h2>

            {selectedSlide.content.subtitle && (
              <p className="text-lg text-pwc-gray500 mb-4">
                {selectedSlide.content.subtitle}
              </p>
            )}

            <ul className="space-y-3">
              {selectedSlide.content.body.map((point, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-pwc-orange font-bold">•</span>
                  <span className="text-black">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Slide info bar */}
      <div className="border-t border-gray-200 px-4 py-3 flex justify-between items-center bg-gray-50">
        <div>
          <span className="font-medium">
            Slide {selectedSlideIndex + 1} of {slides.length}
          </span>
          <span className="text-gray-500 ml-2">
            {selectedSlide.content.layout}
          </span>
        </div>

        {/* Download button */}
        <button
          onClick={() => window.open(getDownloadUrl(deckId), '_blank')}
          className="px-4 py-2 bg-pwc-orange text-white rounded-lg hover:bg-pwc-orange400 transition-colors"
        >
          Download PPTX
        </button>
      </div>
    </div>
  );
}