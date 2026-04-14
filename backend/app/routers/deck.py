"""Deck router for REST API endpoints."""

import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse

from app.models.deck import DeckCreate, DeckResponse, SlideEdit
from app.models.conversation import UserMessage
from app.services.conversation_manager import ConversationManager
from app.services.slide_engine import SlideEngine
from app.services.pptx_renderer import PPTXRenderer
from app.services.preview_generator import PreviewGenerator


router = APIRouter()

# Initialize services (singletons for simplicity)
conversation_manager = ConversationManager()
slide_engine = SlideEngine()
pptx_renderer = PPTXRenderer()
preview_generator = PreviewGenerator()


@router.post("/generate", response_model=DeckResponse)
async def generate_deck(request: DeckCreate):
    """Generate a new deck from a prompt."""
    try:
        # Generate slide content from Claude
        slides_content = await conversation_manager.generate_deck_content(
            prompt=request.prompt, num_slides=5
        )

        # Create deck in slide engine
        deck = slide_engine.create_deck(
            prompt=request.prompt,
            slides_content=slides_content,
            style=request.style,
        )

        # Create conversation for this deck
        conversation = conversation_manager.create_conversation(deck.id)

        # Add initial system message
        conversation_manager.add_message(
            conversation.id,
            role="assistant",
            content=f"Created a {len(deck.slides)}-slide presentation based on your prompt. You can now select slides and edit them using natural language.",
            action="generate",
        )

        # Render PPTX (for later download)
        pptx_renderer.render(deck)

        return DeckResponse(
            deck_id=deck.id,
            status="generated",
            message=f"Generated {len(deck.slides)} slides",
            preview_url=f"/deck/{deck.id}/preview",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/{deck_id}")
async def get_deck(deck_id: str):
    """Get deck JSON state."""
    deck = slide_engine.get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck.model_dump()


@router.get("/{deck_id}/slides")
async def get_slides(deck_id: str):
    """Get all slides for a deck."""
    deck = slide_engine.get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    slides_data = []
    for slide in deck.slides:
        slides_data.append({
            "id": slide.id,
            "index": slide.index,
            "content": slide.content.model_dump(),
            "updated_at": slide.updated_at.isoformat(),
        })
    return {"slides": slides_data}


@router.patch("/{deck_id}/slide/{slide_index}/edit")
async def edit_slide(deck_id: str, slide_index: int, request: SlideEdit):
    """Edit a specific slide via conversation."""
    deck = slide_engine.get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    if slide_index >= len(deck.slides):
        raise HTTPException(status_code=400, detail="Slide index out of bounds")

    try:
        # Parse edit intent
        edit_intent = await conversation_manager.parse_edit_intent(
            message=request.prompt, num_slides=len(deck.slides)
        )

        # Apply edit to slide content
        current_slide = deck.slides[slide_index]
        new_content = await conversation_manager.apply_edit(
            current_slide=current_slide.content, edit_intent=edit_intent
        )

        # Update slide in engine
        updated_slide = slide_engine.update_slide(deck_id, slide_index, new_content)

        # Regenerate PPTX
        pptx_renderer.render(deck)

        return {
            "status": "updated",
            "slide_index": slide_index,
            "intent": edit_intent.intent,
            "confidence": edit_intent.confidence,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")


@router.post("/{deck_id}/chat")
async def chat_with_deck(deck_id: str, request: UserMessage):
    """Handle conversational chat for deck editing."""
    deck = slide_engine.get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    # Get conversation (create if needed)
    conversations = conversation_manager.list_conversations()
    conv = None
    for c in conversations:
        if c.deck_id == deck_id:
            conv = c
            break

    if not conv:
        conv = conversation_manager.create_conversation(deck_id)

    try:
        # Add user message
        conversation_manager.add_message(conv.id, role="user", content=request.content)

        # Parse edit intent
        edit_intent = await conversation_manager.parse_edit_intent(
            message=request.content, num_slides=len(deck.slides)
        )

        # Apply edit
        if 0 <= edit_intent.slide_index < len(deck.slides):
            current_slide = deck.slides[edit_intent.slide_index]
            new_content = await conversation_manager.apply_edit(
                current_slide=current_slide.content, edit_intent=edit_intent
            )
            updated_slide = slide_engine.update_slide(deck_id, edit_intent.slide_index, new_content)
            pptx_renderer.render(deck)

            # Add assistant response
            conversation_manager.add_message(
                conv.id,
                role="assistant",
                content=f"Updated slide {edit_intent.slide_index + 1}: {edit_intent.intent}",
                edited_slide=edit_intent.slide_index,
                action="edit",
            )

            return {
                "status": "edited",
                "slide_index": edit_intent.slide_index,
                "intent": edit_intent.intent,
                "message": f"Updated slide {edit_intent.slide_index + 1}",
            }
        else:
            # Just a query, not an edit
            conversation_manager.add_message(
                conv.id,
                role="assistant",
                content="I understood your message, but couldn't identify which slide to edit. Please specify which slide number you'd like to modify.",
                action="query",
            )
            return {
                "status": "query",
                "message": "No specific slide edit detected",
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/{deck_id}/export")
async def export_deck(deck_id: str):
    """Download the PPTX file."""
    deck = slide_engine.get_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    export_path = pptx_renderer.get_export_path(deck_id)
    if not export_path:
        # Regenerate if missing
        pptx_renderer.render(deck)
        export_path = pptx_renderer.get_export_path(deck_id)

    return FileResponse(
        path=export_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=f"{deck.title}.pptx",
    )


@router.get("/{deck_id}/conversation")
async def get_conversation(deck_id: str):
    """Get conversation history for a deck."""
    conversations = conversation_manager.list_conversations()
    conv = None
    for c in conversations:
        if c.deck_id == deck_id:
            conv = c
            break

    if not conv:
        return {"messages": []}

    messages_data = []
    for msg in conv.messages:
        messages_data.append({
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "edited_slide": msg.edited_slide,
            "action": msg.action,
            "created_at": msg.created_at.isoformat(),
        })
    return {"messages": messages_data}


# WebSocket for real-time preview updates
@router.websocket("/{deck_id}/preview-stream")
async def preview_stream(websocket: WebSocket, deck_id: str):
    """WebSocket for real-time preview updates."""
    await websocket.accept()

    try:
        while True:
            # Wait for messages from client (e.g., "get_preview", "refresh")
            data = await websocket.receive_text()
            message = json.loads(data)

            deck = slide_engine.get_deck(deck_id)
            if not deck:
                await websocket.send_json({"error": "Deck not found"})
                continue

            if message.get("action") == "get_preview":
                slide_index = message.get("slide_index", 0)
                if slide_index < len(deck.slides):
                    slide = deck.slides[slide_index]
                    preview_base64 = await preview_generator.generate_slide_preview(slide)
                    await websocket.send_json({
                        "slide_index": slide_index,
                        "preview": preview_base64,
                        "title": slide.content.title,
                    })

            elif message.get("action") == "get_all_previews":
                previews = await preview_generator.generate_deck_previews(deck.slides)
                slides_data = []
                for i, preview in enumerate(previews):
                    slides_data.append({
                        "index": i,
                        "preview": preview,
                        "title": deck.slides[i].content.title,
                    })
                await websocket.send_json({"slides": slides_data})

    except WebSocketDisconnect:
        pass