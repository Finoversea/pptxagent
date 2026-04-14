"""Pydantic models for deck and slide structures."""

from typing import Any
from pydantic import BaseModel, Field
from datetime import datetime


class SlideContent(BaseModel):
    """Content for a single slide."""

    title: str = Field(..., description="Slide title")
    subtitle: str | None = Field(None, description="Optional subtitle")
    body: list[str] = Field(default_factory=list, description="Body text points")
    layout: str = Field(default="title_content", description="Slide layout type")
    notes: str | None = Field(None, description="Speaker notes")
    # Optional structured content
    chart: dict[str, Any] | None = Field(None, description="Chart data if applicable")
    table: list[list[str]] | None = Field(None, description="Table data if applicable")
    image_url: str | None = Field(None, description="Image URL if applicable")


class Slide(BaseModel):
    """A complete slide with metadata."""

    id: str = Field(..., description="Unique slide ID")
    index: int = Field(..., description="Slide position in deck")
    content: SlideContent
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Deck(BaseModel):
    """A presentation deck with multiple slides."""

    id: str = Field(..., description="Unique deck ID")
    title: str = Field(..., description="Deck title")
    slides: list[Slide] = Field(default_factory=list, description="Deck slides")
    prompt: str = Field(..., description="Original generation prompt")
    style: str = Field(default="pwc", description="Visual style template")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DeckCreate(BaseModel):
    """Request to create a new deck."""

    prompt: str = Field(..., description="Prompt for deck generation")
    style: str = Field(default="pwc", description="Visual style template")
    title: str | None = Field(None, description="Optional title override")


class SlideEdit(BaseModel):
    """Request to edit a specific slide."""

    prompt: str = Field(..., description="Edit instruction prompt")
    slide_index: int = Field(..., description="Target slide index")


class DeckResponse(BaseModel):
    """Response for deck operations."""

    deck_id: str
    status: str
    message: str | None = None
    preview_url: str | None = None