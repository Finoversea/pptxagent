"""Conversation manager for Claude API integration."""

import json
import uuid
from datetime import datetime

import anthropic
from app.config import settings
from app.models.conversation import Conversation, EditIntent, Message
from app.models.deck import SlideContent


def extract_text_from_response(response) -> str:
    """Extract text content from API response, handling different block types."""
    for block in response.content:
        if hasattr(block, 'text'):
            return block.text
        elif hasattr(block, 'thinking'):
            # For models that return thinking blocks, use the thinking content
            return block.thinking
    # Fallback: try to get text from first block
    if response.content:
        block = response.content[0]
        if hasattr(block, 'text'):
            return block.text
        elif hasattr(block, 'thinking'):
            return block.thinking
    return ""


class ConversationManager:
    """Manage conversations with Claude API for deck generation and editing."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.conversations: dict[str, Conversation] = {}

    def create_conversation(self, deck_id: str) -> Conversation:
        """Create a new conversation for a deck."""
        conv = Conversation(
            id=str(uuid.uuid4()),
            deck_id=deck_id,
            messages=[],
        )
        self.conversations[conv.id] = conv
        return conv

    def get_conversation(self, conversation_id: str) -> Conversation | None:
        """Get an existing conversation."""
        return self.conversations.get(conversation_id)

    def list_conversations(self) -> list[Conversation]:
        """List all conversations."""
        return list(self.conversations.values())

    async def generate_deck_content(
        self, prompt: str, num_slides: int = 5
    ) -> list[SlideContent]:
        """Generate initial deck content from prompt using Claude."""
        system_prompt = """You are a presentation content expert. Generate structured slide content
in JSON format. Each slide should have:
- title: concise slide title
- subtitle: optional subtitle
- body: list of bullet points (2-4 per slide)
- layout: one of title_content, two_column, title_only, image_left, chart

Follow PwC brand guidelines:
- Bold, confident titles
- Clear, concise bullet points
- Focus on key insights and data"""

        user_message = f"""Generate a {num_slides}-slide presentation based on this prompt:
{prompt}

Return a JSON array of slides with this structure:
[
  {{
    "title": "Slide Title",
    "subtitle": "Optional Subtitle",
    "body": ["Point 1", "Point 2"],
    "layout": "title_content"
  }}
]

Focus on impactful, business-appropriate content."""

        response = self.client.messages.create(
            model=settings.claude_model,
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        # Parse response
        content = extract_text_from_response(response)
        # Extract JSON from response (handle potential markdown wrapping)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        slides_data = json.loads(content.strip())
        return [SlideContent(**slide) for slide in slides_data]

    async def parse_edit_intent(self, message: str, num_slides: int) -> EditIntent:
        """Parse user edit message to determine which slide and what operation."""
        system_prompt = """You are an edit intent parser. Analyze user messages about editing
presentations and extract:
1. Which slide they want to edit (index number, 0-based)
2. What operation: modify, replace, add_content, remove_content
3. The specific intent/instruction

Return JSON with:
{
  "slide_index": <number>,
  "operation": "<operation_type>",
  "intent": "<parsed instruction>",
  "confidence": <0.0-1.0>
}

Examples:
- "Make slide 2 focus on revenue" → {"slide_index": 1, "operation": "modify", "intent": "focus content on revenue metrics"}
- "Change the title of slide 4" → {"slide_index": 3, "operation": "modify", "intent": "update title"}
- "Add more details to slide 1" → {"slide_index": 0, "operation": "add_content", "intent": "add more content details"}"""

        user_message = f"""Parse this edit request for a {num_slides}-slide presentation:
"{message}"

Return the parsed intent as JSON."""

        response = self.client.messages.create(
            model=settings.claude_model,
            max_tokens=500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        content = extract_text_from_response(response)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        intent_data = json.loads(content.strip())
        return EditIntent(**intent_data)

    async def apply_edit(
        self, current_slide: SlideContent, edit_intent: EditIntent
    ) -> SlideContent:
        """Apply an edit to a slide content."""
        system_prompt = """You are a slide content editor. Modify slide content based on
edit instructions while maintaining PwC brand style:
- Bold, confident titles
- Clear, concise bullet points (2-4 per slide)
- Professional business language

Return the complete updated slide as JSON."""

        current_json = json.dumps(current_slide.model_dump(), indent=2)
        user_message = f"""Current slide content:
{current_json}

Edit instruction: {edit_intent.intent}

Return the updated slide content as JSON with the same structure."""

        response = self.client.messages.create(
            model=settings.claude_model,
            max_tokens=500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )

        content = extract_text_from_response(response)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        updated_data = json.loads(content.strip())
        return SlideContent(**updated_data)

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        edited_slide: int | None = None,
        action: str | None = None,
    ) -> Message:
        """Add a message to the conversation."""
        conv = self.get_conversation(conversation_id)
        if not conv:
            raise ValueError(f"Conversation {conversation_id} not found")

        message = Message(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            edited_slide=edited_slide,
            action=action,
        )
        conv.messages.append(message)
        conv.updated_at = datetime.utcnow()
        return message