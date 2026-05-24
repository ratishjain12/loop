# Phase 6 — AI Integration

**Goal:** Users can request hints and pattern explanations that stream inline.

**Depends on:** Phase 5 complete (loop + revision working end-to-end)

> **Clerk MCP:** Use `mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })` for route handler auth patterns.

---

## Stack

- `ai` — Vercel AI SDK core (`streamText`)
- `@ai-sdk/openai` — OpenAI provider (direct named export, no factory function)
- `@ai-sdk/react` — client-side hooks (`useCompletion`) — **not** `ai/react` (moved package)
- Model: `gpt-4o-mini` for hints and explanations
- All AI calls are server-side (Route Handlers). No API key exposed to browser.
- `toDataStreamResponse()` on `streamText` result — used for non-chat streaming (hint, explain)

---

## Deliverables

### 6.1 `packages/ai/src/client.ts`

The current `@ai-sdk/openai` API uses a direct named export — no factory function needed. The `OPENAI_API_KEY` env var is picked up automatically.

```ts
import { openai } from '@ai-sdk/openai'

// Pre-configured model instances used across hint.ts, explain.ts, loop-ranker.ts
export const fastModel = openai('gpt-4o-mini')  // hints, explanations
export const smartModel = openai('gpt-4o')       // loop ranking
```

---

### 6.2 `packages/ai/src/hint.ts`

```ts
import { streamText } from 'ai'
import { fastModel } from './client'

interface HintInput {
  title: string
  primaryPattern: string
  difficulty: string
}

export function generateHint(question: HintInput) {
  return streamText({
    model: fastModel,
    system: `You are a DSA coach. Your job is to give short, helpful hints that guide the user
toward the right approach — without revealing the solution or writing any code.
Keep hints to 2–3 sentences. Focus on the key insight or pattern observation.`,
    prompt: `Give a hint for: "${question.title}"
Difficulty: ${question.difficulty}
Pattern: ${question.primaryPattern}`,
  })
}
```

---

### 6.3 `packages/ai/src/explain.ts`

```ts
import { streamText } from 'ai'
import { fastModel } from './client'

interface ExplainInput {
  title: string
  primaryPattern: string
  secondaryPatterns: string[]
}

export function generateExplanation(question: ExplainInput) {
  const patterns = [question.primaryPattern, ...question.secondaryPatterns].join(', ')
  return streamText({
    model: fastModel,
    system: `You are a DSA coach explaining patterns after a problem attempt.
Be concise (under 150 words). Cover:
1. The core insight that makes this pattern work here
2. Why this pattern fits better than alternatives
3. One thing to remember for next time`,
    prompt: `Explain the pattern for: "${question.title}"
Patterns used: ${patterns}`,
  })
}
```

---

### 6.4 `POST /api/ai/hint`

**File:** `apps/web/app/api/ai/hint/route.ts`

```ts
import { auth } from '@clerk/nextjs/server'
import { generateHint } from '@loop/ai'
import { db } from '@loop/db'
import { questions } from '@loop/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const { userId } = await auth()  // async in latest Clerk
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { questionId } = await req.json()

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })
  if (!question) return new Response('Not found', { status: 404 })

  const result = generateHint({
    title: question.title,
    primaryPattern: question.primaryPattern,
    difficulty: question.difficulty,
  })

  return result.toDataStreamResponse()
}
```

---

### 6.5 `POST /api/ai/explain`

**File:** `apps/web/app/api/ai/explain/route.ts`

Same structure as hint route. Calls `generateExplanation()` instead.

---

### 6.6 UI — Hint Button

**File:** `apps/web/components/question-card.tsx` (update)

Add a "Give me a hint" text button below the Open Question button. Subtle — small font, muted color, no prominent styling (we don't want to encourage over-reliance on hints).

```tsx
import { useCompletion } from '@ai-sdk/react'  // NOT 'ai/react' — package moved

// Inside question card:
const { completion, complete, isLoading } = useCompletion({
  api: '/api/ai/hint',
})

function handleHint() {
  complete('', { body: { questionId: question.id } })
}
```

Display:
```
┌───────────────────────────────────────┐
│ Two Sum                         Easy  │
│ Hash Map · 15 min                     │
│                        [Open Question]│
│ Give me a hint                        │
│ ┌─────────────────────────────────┐   │
│ │ Think about storing values     │   │ ← streams in
│ │ you've seen before in a map... │   │
│ └─────────────────────────────────┘   │
└───────────────────────────────────────┘
```

- Hint area hidden until "Give me a hint" is clicked
- Shows loading indicator while streaming (`isLoading = true`)
- Once shown, hint persists until card is completed

---

### 6.10 UI — Pattern Explanation

**File:** `apps/web/components/feedback-modal.tsx` (update)

After feedback is submitted successfully, show an "Understand the pattern →" expandable section below the feedback confirmation.

```tsx
import { useCompletion } from '@ai-sdk/react'  // NOT 'ai/react'

const { completion, complete, isLoading } = useCompletion({
  api: '/api/ai/explain',
})

// After feedback submit success:
<div>
  <p>Feedback recorded.</p>
  <button onClick={() => complete('', { body: { questionId } })}>
    Understand the pattern →
  </button>
  {completion && (
    <div className="mt-3 text-sm text-muted-foreground">
      {completion}
    </div>
  )}
</div>
```

---

## Error Handling

- If AI calls fail (network error, rate limit, OpenAI down): fail silently — show "Hint unavailable right now" message
- Never block the core loop experience on AI failures

---

## Acceptance Criteria

- [ ] "Give me a hint" button appears on each question card (below Open Question)
- [ ] Clicking hint → text streams progressively in the card (not all at once)
- [ ] Hint does not contain the solution or code
- [ ] "Understand the pattern" button appears after feedback is submitted
- [ ] Explanation streams inline in the feedback modal
- [ ] If OpenAI is unreachable: hint shows "Hint unavailable right now", loop generation is unaffected
- [ ] No OpenAI API key exposed in any client-side code or network response
