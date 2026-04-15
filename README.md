# PPTX Agent

AI-powered PowerPoint generation with TypeScript agent framework.

## Overview

PPTX Agent generates professional PPTX presentations from natural language prompts using LangGraph agents and Claude API.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND (web/)                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ Chat Panel    │  │ Slide Preview │  │ Thumbnails    │        │
│  │ (ai-sdk.dev)  │  │ (Visual)      │  │ (Selection)   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
│  State: React Query + Zustand                                   │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND (backend-ts/)                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ LangGraph     │  │ Slide Engine  │  │ PPTX Renderer │        │
│  │ Agent         │  │ (JSON State)  │  │ (pptxgenjs)   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
│  API: Express + Zod validation                                  │
│  LLM: Claude API (Haiku)                                        │
│  Rate limiting: Token bucket (60 RPM)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend Agent | LangGraph (TypeScript) |
| Frontend Chat | ai-sdk.dev (Vercel AI SDK) |
| PPTX Generation | pptxgenjs |
| API Validation | Zod |
| Language | TypeScript only |

## Quick Start

### 1. Backend (TypeScript)

```bash
cd backend-ts

# Install dependencies
npm install

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here

# Run the server
npm run dev
```

Backend API will be available at http://localhost:8001

### 2. Frontend (Next.js)

```bash
cd web

# Install dependencies
npm install

# Run the development server
npm run dev
```

Frontend will be available at http://localhost:3000

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|--------|
| `/health` | GET | Health check |
| `/deck/generate` | POST | Create deck from prompt |
| `/deck/:deckId` | GET | Get deck status |
| `/export/:deckId/pptx` | GET | Download PPTX file |

### Request Validation

The `/deck/generate` endpoint validates requests with Zod:

```typescript
{
  prompt: string (10-2000 chars, required),
  style: "default" | "pwc" (optional)
}
```

## Project Structure

```
pptxagent/
├── backend-ts/          # TypeScript Express backend
│   ├── src/
│   │   ├── index.ts     # Express server + Zod validation
│   │   ├── agent.ts     # LangGraph agent workflow
│   │   ├── pptx.ts      # pptxgenjs renderer
│   │   └── config.ts    # Configuration
│   └── tests/
│       └── agent.test.ts # Vitest tests
├── web/                  # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── stores/       # Zustand stores
│   │   └── types/        # TypeScript types
│   └── package.json
├── backend/              # Python backend (deprecated, will be removed)
├── docs/
└── plans/
```

## Brand Style

Default style follows PwC brand guidelines:
- Orange accent (#FD5108)
- Georgia for titles, Arial for body
- Bold, confident typography

## Security Features

- Zod schema validation for all API inputs
- Rate limiting (60 RPM token bucket)
- Input sanitization with unicode homoglyph normalization
- Semantic injection pattern detection
- Content isolation with XML tags

## License

MIT