"""PPTX renderer using python-pptx."""

import os
from pathlib import Path

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RgbColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

from app.config import settings
from app.models.deck import Deck, Slide, SlideContent


# PwC brand colors
PWC_COLORS = {
    "orange": RgbColor(253, 81, 8),  # #FD5108
    "white": RgbColor(255, 255, 255),
    "black": RgbColor(0, 0, 0),
    "gray_500": RgbColor(161, 168, 179),  # #A1A8B3
    "gray_300": RgbColor(203, 209, 214),  # #CBD1D6
    "orange_400": RgbColor(254, 124, 57),  # #FE7C39
    "orange_300": RgbColor(255, 170, 114),  # #FFAA72
}


class PPTXRenderer:
    """Convert deck JSON to PPTX file."""

    def __init__(self):
        self.storage_path = Path(settings.storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def render(self, deck: Deck) -> str:
        """Render deck to PPTX file and return file path."""
        presentation = Presentation()

        # Apply PwC styling
        for slide_data in deck.slides:
            self._add_slide(presentation, slide_data.content)

        # Save file
        output_path = self.storage_path / f"{deck.id}.pptx"
        presentation.save(str(output_path))
        return str(output_path)

    def _add_slide(self, presentation: Presentation, content: SlideContent) -> None:
        """Add a slide with content to the presentation."""
        # Use blank layout for custom styling
        slide_layout = presentation.slide_layouts[6]  # Blank layout
        slide = presentation.slides.add_slide(slide_layout)

        # Apply layout based on content type
        layout_type = content.layout

        if layout_type == "title_only":
            self._render_title_only(slide, content)
        elif layout_type == "two_column":
            self._render_two_column(slide, content)
        else:
            self._render_title_content(slide, content)

    def _render_title_content(self, slide, content: SlideContent) -> None:
        """Render standard title + content layout."""
        # Title
        title_shape = slide.shapes.add_textbox(
            Inches(0.5), Inches(0.5), Inches(9), Inches(1)
        )
        title_frame = title_shape.text_frame
        title_para = title_frame.paragraphs[0]
        title_para.text = content.title
        title_para.font.size = Pt(32)
        title_para.font.bold = True
        title_para.font.color.rgb = PWC_COLORS["black"]
        title_para.font.name = "Arial"

        # Subtitle if present
        if content.subtitle:
            subtitle_shape = slide.shapes.add_textbox(
                Inches(0.5), Inches(1.4), Inches(9), Inches(0.5)
            )
            subtitle_frame = subtitle_shape.text_frame
            subtitle_para = subtitle_frame.paragraphs[0]
            subtitle_para.text = content.subtitle
            subtitle_para.font.size = Pt(18)
            subtitle_para.font.color.rgb = PWC_COLORS["gray_500"]
            subtitle_para.font.name = "Arial"

        # Body content
        body_top = Inches(2.2) if content.subtitle else Inches(1.8)
        body_shape = slide.shapes.add_textbox(
            Inches(0.5), body_top, Inches(9), Inches(5)
        )
        body_frame = body_shape.text_frame
        body_frame.word_wrap = True

        for i, point in enumerate(content.body):
            if i == 0:
                para = body_frame.paragraphs[0]
            else:
                para = body_frame.add_paragraph()
            para.text = point
            para.font.size = Pt(16)
            para.font.color.rgb = PWC_COLORS["black"]
            para.font.name = "Arial"
            para.level = 0

        # Add orange accent bar at top
        accent_bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(0), Inches(0), Inches(10), Inches(0.15)
        )
        accent_bar.fill.solid()
        accent_bar.fill.fore_color.rgb = PWC_COLORS["orange"]
        accent_bar.line.fill.background()

    def _render_title_only(self, slide, content: SlideContent) -> None:
        """Render title-only slide (section divider)."""
        # Large centered title
        title_shape = slide.shapes.add_textbox(
            Inches(0.5), Inches(3), Inches(9), Inches(2)
        )
        title_frame = title_shape.text_frame
        title_para = title_frame.paragraphs[0]
        title_para.text = content.title
        title_para.font.size = Pt(44)
        title_para.font.bold = True
        title_para.font.color.rgb = PWC_COLORS["black"]
        title_para.font.name = "Arial"
        title_para.alignment = PP_ALIGN.CENTER

        # Orange accent line below title
        accent_line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(3.5), Inches(5.2), Inches(3), Inches(0.1)
        )
        accent_line.fill.solid()
        accent_line.fill.fore_color.rgb = PWC_COLORS["orange"]
        accent_line.line.fill.background()

    def _render_two_column(self, slide, content: SlideContent) -> None:
        """Render two-column layout."""
        # Title
        title_shape = slide.shapes.add_textbox(
            Inches(0.5), Inches(0.5), Inches(9), Inches(1)
        )
        title_frame = title_shape.text_frame
        title_para = title_frame.paragraphs[0]
        title_para.text = content.title
        title_para.font.size = Pt(32)
        title_para.font.bold = True
        title_para.font.color.rgb = PWC_COLORS["black"]
        title_para.font.name = "Arial"

        # Left column
        left_shape = slide.shapes.add_textbox(
            Inches(0.5), Inches(2), Inches(4.5), Inches(5)
        )
        left_frame = left_shape.text_frame
        left_frame.word_wrap = True

        # Right column
        right_shape = slide.shapes.add_textbox(
            Inches(5.5), Inches(2), Inches(4), Inches(5)
        )
        right_frame = right_shape.text_frame
        right_frame.word_wrap = True

        # Split body points into columns
        mid = len(content.body) // 2
        for i, point in enumerate(content.body[:mid]):
            if i == 0:
                para = left_frame.paragraphs[0]
            else:
                para = left_frame.add_paragraph()
            para.text = point
            para.font.size = Pt(16)
            para.font.color.rgb = PWC_COLORS["black"]
            para.font.name = "Arial"

        for i, point in enumerate(content.body[mid:]):
            if i == 0:
                para = right_frame.paragraphs[0]
            else:
                para = right_frame.add_paragraph()
            para.text = point
            para.font.size = Pt(16)
            para.font.color.rgb = PWC_COLORS["black"]
            para.font.name = "Arial"

        # Orange accent bar
        accent_bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(0), Inches(0), Inches(10), Inches(0.15)
        )
        accent_bar.fill.solid()
        accent_bar.fill.fore_color.rgb = PWC_COLORS["orange"]
        accent_bar.line.fill.background()

    def render_slide_preview(self, slide: Slide) -> str:
        """Render a single slide and return image path (for preview)."""
        # Create a minimal presentation with just this slide
        presentation = Presentation()
        self._add_slide(presentation, slide.content)

        # Save to temp file
        temp_path = self.storage_path / f"preview_{slide.id}.pptx"
        presentation.save(str(temp_path))
        return str(temp_path)

    def get_export_path(self, deck_id: str) -> str | None:
        """Get the export file path for a deck."""
        path = self.storage_path / f"{deck_id}.pptx"
        return str(path) if path.exists() else None