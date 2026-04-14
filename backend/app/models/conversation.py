"""Models for conversation and message handling."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal


class Message(BaseModel):
    """A single message in the conversation."""

    id: str = Field(..., description="Message ID")
    role: Literal["user", "assistant", "system"] = Field(..., description="Message role")
    content: str = Field(..., description="Message content")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Optional metadata for assistant messages
    edited_slide: int | None = Field(None, description="Slide index edited by this message")
    action: str | None = Field(None, description="Action taken (generate, edit, etc)")


class Conversation(BaseModel):
    """Full conversation history for a session."""

    id: str = Field(..., description="Conversation ID")
    deck_id: str = Field(..., description="Associated deck ID")
    messages: list[Message] = Field(default_factory=list, description="Conversation messages")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserMessage(BaseModel):
    """User message input."""

    content: str = Field(..., description="User message content")
    conversation_id: str | None = Field(None, description="Existing conversation ID")


class EditIntent(BaseModel):
    """Parsed edit intent from user message."""

    slide_index: int = Field(..., description="Target slide index")
    operation: Literal["modify", "replace", "add_content", "remove_content"] = Field(
        ..., description="Operation type"
    )
    intent: str = Field(..., description="Parsed intent description")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")