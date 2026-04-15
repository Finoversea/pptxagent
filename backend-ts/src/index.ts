/**
 * PPTX Agent Backend - Express server with DeepAgents integration
 */

import express from "express";
import cors from "cors";
import { runDeckGeneration } from "./agent.js";
import { generatePptx } from "./pptx.js";

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
    const { prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const result = await runDeckGeneration(prompt, style || "default");

    res.json({
      deck_id: result.deckId,
      slides: result.slides,
      preview_url: result.previewUrl,
      errors: result.errors,
    });
  } catch (error) {
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