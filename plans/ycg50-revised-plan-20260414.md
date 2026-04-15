# Design: Agent Framework Integration for PPTX Agent

**REVISED** based on board directives on 2026-04-14
Issue: YCG-50
Status: IN_REVIEW
Mode: CEO Product Review

---

## Board Technology Directives

The board has provided explicit technology requirements:

| Directive | Technology |
|-----------|------------|
| Backend Agent Framework | **DeepAgents** (LangGraph for TypeScript) |
| Frontend Chat | **ai-sdk.dev** (Vercel AI SDK) |
| Language Stack | **TypeScript/JavaScript only** (NO Python) |
| Interaction Mode | **Chat-based PPT generation/editing** |

---

## Product Analysis

### What Problem Are We Solving?

**User Goal:** Generate and edit PowerPoint presentations through natural conversation, with page-by-page output and dynamic modification.

**10-Star Feature:** Conversational per-slide editing — chat to modify each slide, see live preview.

### Technology Stack (Board-Directed)

```
NextJS Frontend (ai-sdk.dev Chat) → TypeScript Backend → DeepAgents Agent → Claude API
                                            ↓
                                     Websearch Skill
                                     Planning Skill
                                     PPTX Generation Tool
```

---

## Framework Analysis (Updated)

### DeepAgents (TypeScript LangGraph)

**Package:** `deepagents@1.9.0`
**Source:** LangChain team, github.com/langchain-ai/deepagentsjs
**Dependencies:** @langchain/langgraph, langchain, zod

**Capabilities:**
- Graph-based agent orchestration (same as Python LangGraph)
- Tool calling, state management
- TypeScript-native, integrates with NextJS
- Checkpointing, memory, human-in-the-loop

**Why chosen:** Board directive + TypeScript-only stack requirement.

---

### ai-sdk.dev (Vercel AI SDK)

**Purpose:** Frontend chat interaction for PPT generation.

**Capabilities:**
- `useChat` hook for React/NextJS
- Streaming responses, tool call visualization
- Built-in message history, loading states
- Seamless integration with Claude API

**Why chosen:** Board directive + best fit for chat-based UI.

---

## Architecture Design

### Full Stack (TypeScript-only)

```typescript
// Frontend: NextJS + ai-sdk.dev
import { useChat } from 'ai-sdk/react';

// Chat-based PPT generation
const { messages, input, handleSubmit } = useChat({
  api: '/api/agent',
  onToolCall: (toolCall) => {
    // Handle slide generation events
    if (toolCall.name === 'generate_slide') {
      setSlides(prev => [...prev, toolCall.args.slide]);
    }
  }
});

// Backend: DeepAgents Agent
import { Agent, StateGraph } from 'deepagents';

const deckAgent = new Agent({
  name: 'pptx-generator',
  tools: [websearchTool, planningTool, pptxTool],
  graph: deckGraph
});

// Graph workflow
const deckGraph = new StateGraph<DeckState>()
  .addNode('research', researchNode)
  .addNode('plan', planNode)
  .addNode('generate', generateNode)
  .addNode('edit', editNode);
```

### Agent Graph Workflow

```
[START] → [Research] → [Plan Outline] → [Generate Slides] → [User Review] → [Edit] → [END]
              ↓              ↓                  ↓              ↓
         WebsearchTool   PlanningTool      SlideGenTool    EditTool
```

### Tool Definitions

```typescript
// Websearch Tool
const websearchTool = tool({
  name: 'websearch',
  description: 'Search web for presentation research',
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    // Tavily/SerpAPI integration
    return searchResults;
  }
});

// Planning Tool
const planningTool = tool({
  name: 'plan_deck',
  description: 'Structure deck outline',
  parameters: z.object({ topic: z.string(), research: z.array(z.string()) }),
  execute: async ({ topic, research }) => {
    return deckOutline;
  }
});

// PPTX Generation Tool
const pptxTool = tool({
  name: 'generate_slide',
  description: 'Generate single slide content',
  parameters: z.object({
    index: z.number(),
    title: z.string(),
    content: z.array(z.string())
  }),
  execute: async ({ index, title, content }) => {
    // Return slide for frontend preview
    return { index, title, content, preview: generateHTMLPreview() };
  }
});
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

| Task | Description |
|------|-------------|
| Install DeepAgents | `npm install deepagents @langchain/langgraph` |
| Install ai-sdk.dev | `npm install ai-sdk @ai-sdk/anthropic` |
| Create agent scaffold | Basic DeepAgents graph with tools |
| Setup chat endpoint | NextJS API route with ai-sdk |

**Milestone:** Chat → Agent → Response flow working.

---

### Phase 2: Websearch + Planning (Week 2)

| Task | Description |
|------|-------------|
| Websearch tool | Tavily API integration |
| Planning tool | Deck outline generation |
| Tool streaming | Emit slide-by-slide updates to frontend |

**Milestone:** Research-backed deck outlines with chat UI.

---

### Phase 3: PPTX Generation (Week 3)

| Task | Description |
|------|-------------|
| PPTX tool | pptxgenjs library for TypeScript |
| Preview rendering | HTML preview per slide |
| Export endpoint | Download .pptx file |

**Milestone:** Full PPTX output from chat conversation.

---

### Phase 4: Editing (Week 4)

| Task | Description |
|------|-------------|
| Edit tool | Per-slide modification via chat |
| Human-in-the-loop | Interrupt for user review |
| State persistence | Resume conversations |

**Milestone:** Conversational editing works in agent flow.

---

### Phase 5: Polish (Week 5)

| Task | Description |
|------|-------------|
| Error handling | Graceful failures, retries |
| Performance | <10s full generation |
| UI polish | Slide preview, thumbnails |

**Milestone:** Production-ready.

---

## Key Decisions

| Decision | Choice | Reason (Board Directive) |
|----------|--------|--------------------------|
| Backend Framework | DeepAgents | "利用deepagent 框架来实现" |
| Frontend Chat | ai-sdk.dev | "前端交互使用 ai-sdk 实现" |
| Language | TypeScript only | "不要使用Python" |
| Interaction | Chat-based | "聊天对话的形式进行PPT渲染" |

---

## PPTX Generation in TypeScript

**Library:** `pptxgenjs`

```typescript
import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();

// Generate slide
const slide = pptx.addSlide();
slide.addText(title, { x: 0.5, y: 0.5, fontSize: 36 });
slide.addText(content, { x: 0.5, y: 1.5, bullet: true });

// Export
pptx.writeFile({ fileName: 'deck.pptx' });
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Chat-to-PPTX | Generate deck via conversation |
| Page-by-page | Emit slides incrementally |
| Dynamic editing | Modify slides via chat |
| Generation time | <10s for 5-slide deck |
| Research quality | Websearch-backed content |

---

## Risk Analysis

| Risk | Mitigation |
|------|-----------|
| DeepAgents maturity | Use latest 1.9.0, monitor updates |
| PPTX fidelity | pptxgenjs has good coverage |
| Tool streaming | ai-sdk.dev handles tool events |
| State persistence | DeepAgents checkpointing |

---

## CEO Verdict

**Product Direction:** NEW IMPLEMENTATION (not enhancement) — TypeScript-only stack with DeepAgents + ai-sdk.dev.

**Framework:** DeepAgents (TypeScript LangGraph) + ai-sdk.dev frontend.

**Priority:** Foundation first — get chat → agent → PPTX flow working.

**Board Alignment:** Plan fully aligns with explicit technology directives.

**Handoff:** Ready for CTO architecture review and Staff Engineer implementation.