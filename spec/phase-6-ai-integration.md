# Phase 6 — AI Integration

**Goal:** Users can request hints and pattern explanations that stream inline. The loop generator uses a one-time-per-day AI ranking call to personalize question order.

**Depends on:** Phase 5 complete (loop + revision working end-to-end)

> **Clerk MCP:** Use `mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })` for route handler auth patterns.

---

## Stack

- `ai` — Vercel AI SDK core (`streamText`, `generateText`)
- `@ai-sdk/openai` — OpenAI provider (direct named export, no factory function)
- `@ai-sdk/react` — client-side hooks (`useCompletion`) — **not** `ai/react` (moved package)
- Models: `gpt-4o-mini` for hints and explanations, `gpt-4o` for loop ranking
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

### 6.4 `packages/ai/src/loop-ranker.ts`

```ts
import { generateText } from 'ai'
import { smartModel } from './client'
import { Question } from '@loop/orchestrator'

interface RankInput {
  candidates: Question[]
  history: { pattern: string; feedback: string }[]  // last 20 attempts
}

export async function rankQuestions(input: RankInput): Promise<string[]> {
  const { candidates, history } = input

  const historyStr = history
    .map(h => `${h.pattern}: ${h.feedback}`)
    .join('\n')

  const candidateStr = candidates
    .map((q, i) => `${i + 1}. [${q.id}] ${q.title} (${q.primaryPattern}, importance: ${q.importanceScore})`)
    .join('\n')

  const { text } = await generateText({
    model: smartModel,
    prompt: `You are ranking DSA practice questions for a user.

User's recent attempt history (pattern: feedback):
${historyStr}

Candidate questions (in format: number. [id] title (pattern, importance)):
${candidateStr}

Rank these questions to maximize learning. Prioritize:
1. Patterns the user has struggled with recently
2. High importance score
3. Pattern diversity (avoid same pattern back-to-back)

Return ONLY a JSON array of question IDs in ranked order. Example: ["uuid1", "uuid2", "uuid3"]
Return only the array, no explanation.`,
  })

  try {
    return JSON.parse(text) as string[]
  } catch {
    // Fallback: return original order if parsing fails
    return candidates.map(q => q.id)
  }
}
```

---

### 6.5 `POST /api/ai/hint`

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

### 6.6 `POST /api/ai/explain`

**File:** `apps/web/app/api/ai/explain/route.ts`

Same structure as hint route. Calls `generateExplanation()` instead.

---

### 6.7 Loop Generate Update (AI ranking)

**File:** `apps/web/app/api/loop/generate/route.ts` (update)

After building the candidate question pool (before inserting to DB):

```ts
// Only call AI ranking if not already cached for today
if (!existingLoop) {
  const history = await getRecentFeedbackHistory(userId, 20)
  
  let rankedIds: string[]
  try {
    rankedIds = await rankQuestions({ candidates: finalQuestions, history })
    // Reorder finalQuestions by rankedIds
    finalQuestions = rankedIds
      .map(id => finalQuestions.find(q => q.id === id))
      .filter(Boolean)
  } catch {
    // If AI ranking fails, fall back to importance-score ordering (already sorted)
  }

  await createLoop(userId, today, finalQuestions.map(q => q.id), { aiRankingUsed: true })
}
```

The `ai_ranking_used = true` flag prevents re-calling `rankQuestions` on subsequent page loads. If the loop already exists in DB, the ranking step is skipped entirely.

---

### 6.8 `packages/db/src/queries/logs.ts` (addition)

```ts
export async function getRecentFeedbackHistory(
  clerkUserId: string,
  limit: number
): Promise<{ pattern: string; feedback: string }[]> {
  // SELECT q.primary_pattern, uql.feedback
  // FROM user_question_log uql
  // JOIN questions q ON q.id = uql.question_id
  // WHERE uql.clerk_user_id = $1
  // ORDER BY uql.attempted_at DESC
  // LIMIT $2
}
```

---

### 6.9 UI — Hint Button

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

- If AI calls fail (network error, rate limit, OpenAI down): fail silently on hint/explain — show "Hint unavailable right now" message
- If loop ranking fails: fall back to importance-score ordering (already handled in route)
- Never block the core loop experience on AI failures

---

## Acceptance Criteria

- [ ] "Give me a hint" button appears on each question card (below Open Question)
- [ ] Clicking hint → text streams progressively in the card (not all at once)
- [ ] Hint does not contain the solution or code
- [ ] "Understand the pattern" button appears after feedback is submitted
- [ ] Explanation streams inline in the feedback modal
- [ ] Loop generate calls `rankQuestions` on first load of the day
- [ ] `daily_loops.ai_ranking_used = true` in DB after first load
- [ ] Second load of `/today` (same day) does NOT call `rankQuestions` again
- [ ] If OpenAI is unreachable: loop still generates (falls back to importance ordering), hint shows error message
- [ ] No OpenAI API key exposed in any client-side code or network response
