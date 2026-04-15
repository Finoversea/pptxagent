/**
 * PPTX Generator - using pptxgenjs for PowerPoint generation
 */

import PptxGenJS from "pptxgenjs";

// PwC brand colors
const PWC_ORANGE = "FD5108";
const PWC_WHITE = "FFFFFF";
const PWC_BLACK = "000000";

// Style presets
const STYLES = {
  default: {
    primaryColor: "3799EB", // Blue
    titleFont: "Calibri",
    bodyFont: "Calibri",
    titleSize: 36,
    bodySize: 18,
  },
  pwc: {
    primaryColor: PWC_ORANGE,
    titleFont: "Georgia",
    bodyFont: "Arial",
    titleSize: 36,
    bodySize: 18,
  },
};

/**
 * Generate PPTX file from deck data
 */
export async function generatePptx(deckId: string, slides?: any[], style: string = "pwc"): Promise<Buffer> {
  const pptx = new PptxGenJS();
  const styleConfig = STYLES[style as keyof typeof STYLES] || STYLES.default;

  // Set presentation properties
  pptx.author = "PPTX Agent";
  pptx.company = "PwC";
  pptx.title = `Presentation ${deckId}`;

  // Add title slide
  let slide = pptx.addSlide();
  slide.background = { color: PWC_WHITE };

  // Add PwC orange accent bar at top
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.3,
    fill: { color: PWC_ORANGE },
  });

  slide.addText("Presentation Title", {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1,
    fontSize: styleConfig.titleSize,
    fontFace: styleConfig.titleFont,
    color: PWC_BLACK,
    bold: true,
  });

  // Add content slides if provided
  if (slides && slides.length > 0) {
    for (const slideData of slides) {
      slide = pptx.addSlide();
      slide.background = { color: PWC_WHITE };

      // Add accent bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.3,
        fill: { color: PWC_ORANGE },
      });

      // Add title
      slide.addText(slideData.title || "Slide Title", {
        x: 0.5,
        y: 0.8,
        w: 9,
        h: 0.8,
        fontSize: styleConfig.titleSize,
        fontFace: styleConfig.titleFont,
        color: PWC_BLACK,
        bold: true,
      });

      // Add body content
      if (slideData.body) {
        slide.addText(slideData.body, {
          x: 0.5,
          y: 2,
          w: 9,
          h: 3,
          fontSize: styleConfig.bodySize,
          fontFace: styleConfig.bodyFont,
          color: PWC_BLACK,
        });
      }
    }
  } else {
    // Add placeholder slides
    for (let i = 0; i < 5; i++) {
      slide = pptx.addSlide();
      slide.background = { color: PWC_WHITE };

      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.3,
        fill: { color: PWC_ORANGE },
      });

      slide.addText(`Slide ${i + 1}`, {
        x: 0.5,
        y: 0.8,
        w: 9,
        h: 0.8,
        fontSize: styleConfig.titleSize,
        fontFace: styleConfig.titleFont,
        color: PWC_BLACK,
        bold: true,
      });

      slide.addText("Content placeholder", {
        x: 0.5,
        y: 2,
        w: 9,
        h: 3,
        fontSize: styleConfig.bodySize,
        fontFace: styleConfig.bodyFont,
        color: PWC_BLACK,
      });
    }
  }

  // Generate buffer
  const buffer = await pptx.write({ outputType: "arraybuffer" });
  return Buffer.from(buffer as ArrayBuffer);
}