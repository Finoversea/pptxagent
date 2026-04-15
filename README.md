# PPTX Agent

AI-powered PowerPoint generation with unified Next.js application.

## Overview

PPTX Agent generates professional PPTX presentations from natural language prompts using LangGraph agents and Claude API.

## Architecture (Consolidated)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION (src/)                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ Chat UI       │  │ Slide Preview │  │ Thumbnails    │        │
│  │ (page.tsx)    │  │ (Visual)      │  │ (Selection)   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API ROUTES (src/app/api/)                 ││
│  │  /api/health    /api/deck/generate    /api/export/[deckId]  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    CORE LIBRARY (src/lib/)                   ││
│  │  agent.ts       pptx.ts        config.ts                    ││
│  │  rateLimiter.ts retry.ts       inputSanitization.ts         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  LLM: Claude API (Haiku)                                        │
│  Rate limiting: Token bucket (60 RPM)                           │
│  PPTX: pptxgenjs                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Agent Workflow | LangGraph (TypeScript) |
| PPTX Generation | pptxgenjs |
| API Validation | Zod |
| Styling | TailwindCSS |
| Language | TypeScript only |

## Quick Start

### Single Application Startup

```bash
# Clone the repository
git clone <repo-url>
cd pptxagent

# Install dependencies (all dependencies in one package.json)
npm install

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here

# Run development server (frontend + backend in one process)
npm run dev
```

Application will be available at **http://localhost:3000**

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Other Commands

```bash
npm run lint      # Run ESLint
npm run build     # Build Next.js application
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|--------|
| `/api/health` | GET | Health check |
| `/api/deck/generate` | POST | Create deck from prompt |
| `/api/deck/[deckId]` | GET | Get deck status |
| `/api/export/[deckId]/pptx` | GET | Download PPTX file |

### Request Validation

The `/api/deck/generate` endpoint validates requests with Zod:

```typescript
{
  prompt: string (10-2000 chars, required),
  style: "default" | "pwc" (optional)
}
```

## Project Structure

```
pptxagent/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main UI
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── api/               # API Routes (backend logic)
│   │       ├── health/route.ts
│   │       └── deck/
│   │           ├── generate/route.ts
│   │           └── [deckId]/route.ts
│   ├── lib/                   # Core library (migrated from backend-ts)
│   │   ├── agent.ts           # LangGraph agent workflow
│   │   ├── pptx.ts            # pptxgenjs renderer
│   │   ├── config.ts          # Configuration
│   │   ├── rateLimiter.ts     # Token bucket rate limiting
│   │   ├── retry.ts           # Exponential backoff retry
│   │   └── inputSanitization.ts # LLM trust boundary protection
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
├── package.json               # Unified dependencies
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
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

## Migration Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Done | Scaffold + lib migration |
| Phase 2 | ✅ Done | API routes + frontend migration |
| Phase 3 | ✅ Done | Delete legacy directories |
| Phase 4 | Pending | Testing + documentation |

**Current branch:** `develop` (all phases merged)

## License

MIT