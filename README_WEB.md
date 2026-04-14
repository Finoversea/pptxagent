# PPTX Agent Web Interface

Conversational PowerPoint editor - generate and edit presentations through natural language.

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

Backend API will be available at http://localhost:8000

### 2. Frontend (Next.js)

```bash
cd web

# Install dependencies
npm install

# Run the development server
npm run dev
```

Frontend will be available at http://localhost:3000

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ Chat Panel    │  │ Slide Preview │  │ Thumbnails    │        │
│  │ (Conversation)│  │ (Visual)      │  │ (Selection)   │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                  │
│  State: React Query + Zustand                                   │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ Conversation  │  │ Slide Engine  │  │ PPTX Renderer │        │
│  │ Manager       │  │ (JSON State)  │  │ (python-pptx) │        │
│  └───────────────┘  └───────────────┘  └───────────────┐        │
│                                                                  │
│  API: FastAPI                                                   │
│  LLM: Claude API (Sonnet 4)                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Core Wedge Feature

**Conversational slide editing:**
1. Generate deck from prompt
2. Select a slide from thumbnails
3. Type edit instruction in chat panel
4. See slide update in preview
5. Download PPTX when done

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|--------|
| `/deck/generate` | POST | Create deck from prompt |
| `/deck/{id}` | GET | Get deck JSON state |
| `/deck/{id}/slides` | GET | Get all slides |
| `/deck/{id}/slide/{idx}/edit` | PATCH | Edit slide via conversation |
| `/deck/{id}/chat` | POST | Conversational editing |
| `/deck/{id}/export` | GET | Download PPTX file |
| `/deck/{id}/preview-stream` | WebSocket | Real-time preview updates |

## Brand Style

Default style follows PwC brand guidelines:
- Orange accent (#FD5108)
- Georgia for titles, Arial for body
- Bold, confident typography
- Clean, asymmetric layouts