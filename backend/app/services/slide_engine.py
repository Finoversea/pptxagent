"""Slide engine for deck state management."""

import uuid
from datetime import datetime
from typing import Any

from app.models.deck import Deck, Slide, SlideContent


class SlideEngine:
    """Manage deck JSON state and slide operations."""

    def __init__(self):
        self.decks: dict[str, Deck] = {}

    def create_deck(
        self, prompt: str, slides_content: list[SlideContent], style: str = "pwc"
    ) -> Deck:
        """Create a new deck from generated content."""
        deck_id = str(uuid.uuid4())
        slides = []
        for i, content in enumerate(slides_content):
            slide = Slide(
                id=str(uuid.uuid4()),
                index=i,
                content=content,
            )
            slides.append(slide)

        deck = Deck(
            id=deck_id,
            title=slides_content[0].title if slides_content else "Untitled",
            slides=slides,
            prompt=prompt,
            style=style,
        )
        self.decks[deck_id] = deck
        return deck

    def get_deck(self, deck_id: str) -> Deck | None:
        """Get a deck by ID."""
        return self.decks.get(deck_id)

    def update_slide(self, deck_id: str, slide_index: int, new_content: SlideContent) -> Slide:
        """Update a slide's content."""
        deck = self.get_deck(deck_id)
        if not deck:
            raise ValueError(f"Deck {deck_id} not found")

        if slide_index >= len(deck.slides):
            raise ValueError(f"Slide index {slide_index} out of bounds")

        slide = deck.slides[slide_index]
        slide.content = new_content
        slide.updated_at = datetime.utcnow()
        deck.updated_at = datetime.utcnow()
        return slide

    def add_slide(self, deck_id: str, content: SlideContent, position: int | None = None) -> Slide:
        """Add a new slide to the deck."""
        deck = self.get_deck(deck_id)
        if not deck:
            raise ValueError(f"Deck {deck_id} not found")

        if position is None:
            position = len(deck.slides)

        slide = Slide(
            id=str(uuid.uuid4()),
            index=position,
            content=content,
        )

        # Insert and reindex
        deck.slides.insert(position, slide)
        for i, s in enumerate(deck.slides):
            s.index = i

        deck.updated_at = datetime.utcnow()
        return slide

    def remove_slide(self, deck_id: str, slide_index: int) -> None:
        """Remove a slide from the deck."""
        deck = self.get_deck(deck_id)
        if not deck:
            raise ValueError(f"Deck {deck_id} not found")

        if slide_index >= len(deck.slides):
            raise ValueError(f"Slide index {slide_index} out of bounds")

        deck.slides.pop(slide_index)
        for i, s in enumerate(deck.slides):
            s.index = i

        deck.updated_at = datetime.utcnow()

    def reorder_slide(self, deck_id: str, from_index: int, to_index: int) -> None:
        """Reorder a slide in the deck."""
        deck = self.get_deck(deck_id)
        if not deck:
            raise ValueError(f"Deck {deck_id} not found")

        if from_index >= len(deck.slides) or to_index >= len(deck.slides):
            raise ValueError("Slide index out of bounds")

        slide = deck.slides.pop(from_index)
        deck.slides.insert(to_index, slide)
        for i, s in enumerate(deck.slides):
            s.index = i

        deck.updated_at = datetime.utcnow()

    def get_deck_json(self, deck_id: str) -> dict[str, Any]:
        """Get deck as JSON-serializable dict."""
        deck = self.get_deck(deck_id)
        if not deck:
            return {}
        return deck.model_dump()

    def list_decks(self) -> list[Deck]:
        """List all decks."""
        return list(self.decks.values())