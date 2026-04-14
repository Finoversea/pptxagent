"""Preview generator for slide images."""

import io
import os
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.util import Inches

from app.config import settings
from app.models.deck import Slide


class PreviewGenerator:
    """Generate preview images for slides."""

    def __init__(self):
        self.storage_path = Path(settings.storage_path)
        self.preview_path = self.storage_path / "previews"
        self.preview_path.mkdir(parents=True, exist_ok=True)

    async def generate_slide_preview(self, slide: Slide, width: int = 800) -> str:
        """Generate a preview image for a single slide.

        Returns base64 encoded image for WebSocket transmission.
        """
        # Import renderer to create the slide
        from app.services.pptx_renderer import PPTXRenderer

        renderer = PPTXRenderer()

        # Create a presentation with just this slide
        presentation = Presentation()
        renderer._add_slide(presentation, slide.content)

        # Save to memory
        pptx_bytes = io.BytesIO()
        presentation.save(pptx_bytes)
        pptx_bytes.seek(0)

        # For now, we'll generate a placeholder preview
        # Real implementation would use LibreOffice/unoconv or similar
        # to convert PPTX to image

        # Create a placeholder image with slide info
        img = Image.new("RGB", (width, 600), color=(255, 255, 255))
        from PIL import ImageDraw, ImageFont

        draw = ImageDraw.Draw(img)

        # Draw orange accent bar at top
        draw.rectangle([0, 0, width, 20], fill=(253, 81, 8))

        # Draw title
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 36)
            body_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 18)
        except OSError:
            # Fallback to default font
            title_font = ImageFont.load_default()
            body_font = ImageFont.load_default()

        draw.text((40, 60), slide.content.title, fill=(0, 0, 0), font=title_font)

        # Draw subtitle if present
        y_offset = 120
        if slide.content.subtitle:
            draw.text((40, y_offset), slide.content.subtitle, fill=(161, 168, 179), font=body_font)
            y_offset += 40

        # Draw body points
        for point in slide.content.body:
            # Truncate long points
            display_text = point if len(point) <= 60 else point[:57] + "..."
            draw.text((40, y_offset), display_text, fill=(0, 0, 0), font=body_font)
            y_offset += 35

        # Convert to base64
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        img_buffer.seek(0)

        import base64
        return base64.b64encode(img_buffer.read()).decode("utf-8")

    async def generate_deck_previews(self, slides: list[Slide]) -> list[str]:
        """Generate preview images for all slides."""
        previews = []
        for slide in slides:
            preview = await self.generate_slide_preview(slide)
            previews.append(preview)
        return previews

    def get_preview_cache_path(self, slide_id: str) -> Path:
        """Get the cache path for a slide preview."""
        return self.preview_path / f"{slide_id}.png"

    def clear_preview_cache(self, slide_id: str) -> None:
        """Clear cached preview for a slide."""
        cache_path = self.get_preview_cache_path(slide_id)
        if cache_path.exists():
            cache_path.unlink()