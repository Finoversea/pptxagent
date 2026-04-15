/**
 * PPTX Agent Backend - Express server with DeepAgents integration
 */

import express from "express";
import cors from "cors";
import { z } from "zod";
import { runDeckGeneration } from "./agent.js";
import { generatePptx } from "./pptx.js";

// === Zod Validation Schemas ===

/**
 * Allowed style presets - must match STYLES in pptx.ts
 */
const StyleSchema = z.enum(["default", "pwc"], {
  errorMap: () => ({ message: "Invalid style. Allowed values: 'default', 'pwc'" }),
});

/**
 * Deck generation request validation
 * - prompt: required, min 10 chars for meaningful content, max 2000 chars to prevent overflow
 * - style: optional, must be one of the allowed presets
 */
const DeckGenerateRequestSchema = z.object({
  prompt: z.string({
    required_error: "Prompt is required",
    invalid_type_error: "Prompt must be a string",
  })
    .min(10, "Prompt must be at least 10 characters")
    .max(2000, "Prompt must not exceed 2000 characters"),
  style: StyleSchema.optional().default("default"),
});

/**
 * Validate request and return parsed data or throw with formatted error
 */
function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
  return result.data;
}

const app = express();
const PORT = process.env.PORT || 8001;

// CORS middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: "0.1.0", stack: "typescript" });
});

// Generate deck endpoint
app.post("/deck/generate", async (req, res) => {
  try {
    // Validate request with Zod schema
    const validated = validateRequest(DeckGenerateRequestSchema, req.body);

    const result = await runDeckGeneration(validated.prompt, validated.style);

    res.json({
      deck_id: result.deckId,
      slides: result.slides,
      preview_url: result.previewUrl,
      errors: result.errors,
    });
  } catch (error) {
    // Handle validation errors separately for 400 response
    if (error instanceof Error && error.message.startsWith("Validation failed")) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Generation error:", error);
    res.status(500).json({ error: "Generation failed" });
  }
});

// Get deck endpoint
app.get("/deck/:deckId", async (req, res) => {
  // Placeholder - will need persistence layer
  res.json({
    id: req.params.deckId,
    status: "generated",
  });
});

// Export PPTX endpoint
app.get("/export/:deckId/pptx", async (req, res) => {
  try {
    // For now, generate a basic PPTX
    const pptxBuffer = await generatePptx(req.params.deckId);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename=presentation.pptx`);
    res.send(pptxBuffer);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Export failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`PPTX Agent Backend running on http://localhost:${PORT}`);
  console.log(`Stack: TypeScript + DeepAgents`);
});