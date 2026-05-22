# Phase 4 — Question Completion + Feedback

**Goal:** User marks each question done and selects a comfort level. Feedback is stored and drives the revision schedule. Loop marks itself complete when all questions are done.

**Depends on:** Phase 3 complete (loop generates, question cards render)

> **Clerk MCP:** Use `mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })` for route handler auth patterns.

---

## Deliverables

### 4.1 Feedback Modal

**File:** `apps/web/components/feedback-modal.tsx`

Client component. Opens as a Dialog after user clicks "Mark Done".

**Options (displayed as selectable cards, one per row):**

| Value | Label | Sublabel |
|---|---|---|
| `easy` | Easy | Got it, no issues |
| `needed_hint` | Needed a Hint | Required a nudge to get going |
| `struggled` | Struggled | Took much longer than expected |
| `couldnt_solve` | Couldn't Solve | Didn't get it this time |
| `revisit_later` | Revisit Later | Skip revision for now |

UX:
- Each option is a full-width clickable card with a radio-style selected state
- "Submit" button is disabled until an option is selected
- No cancel option — user must submit to close (encourages honest feedback)
- Appears centered on screen as a shadcn `<Dialog>`

```tsx
interface FeedbackModalProps {
  open: boolean
  questionTitle: string
  onSubmit: (feedback: FeedbackType) => Promise<void>
}
```

**Loading state:** Submit button shows spinner while API call is in flight. Disabled during submit.

---

### 4.2 `packages/orchestrator/src/revision-scheduler.ts`

**Purpose:** Map feedback to a future review date.

```ts
import { FeedbackType } from './types'

export function getNextReviewDate(feedback: FeedbackType, today: Date): Date {
  const offsets: Record<FeedbackType, number> = {
    easy: 7,
    needed_hint: 3,
    struggled: 1,
    couldnt_solve: 1,
    revisit_later: 5,
  }
  const result = new Date(today)
  result.setDate(result.getDate() + offsets[feedback])
  return result
}
```

Note: `struggled` and `couldnt_solve` both → tomorrow. The distinction matters in Phase 5 when the revision screen shows the last feedback label.

---

### 4.3 `POST /api/loop/complete`

**File:** `apps/web/app/api/loop/complete/route.ts`

**Request body:**
```ts
{
  questionId: string
  feedback: FeedbackType
}
```

**Logic:**
1. `await auth()` → get `userId`
2. Validate `questionId` and `feedback` are present and valid
3. Fetch today's `daily_loops` row for this user
4. Verify `questionId` is in `loop.questionIds` (prevent arbitrary submissions)
5. Check if already completed (idempotent — if already in `completedIds`, return current state)
6. Compute `nextReviewAt = getNextReviewDate(feedback, today)`
7. Insert into `user_question_log`
8. Update `daily_loops`: add `questionId` to `completedIds`
9. If `completedIds.length === questionIds.length` → set `status = 'complete'`
10. Return response

**Response:**
```ts
{
  nextReviewAt: string     // ISO date
  loopComplete: boolean
}
```

**Error cases:**
- 401 if no auth
- 400 if questionId not in today's loop
- 400 if invalid feedback value

---

### 4.4 DB Query Helpers

**File:** `packages/db/src/queries/logs.ts`

```ts
export async function insertQuestionLog(params: {
  clerkUserId: string
  questionId: string
  feedback: FeedbackType
  nextReviewAt: string  // ISO date string
})
```

**File:** `packages/db/src/queries/loops.ts` (additions)

```ts
export async function markQuestionComplete(
  clerkUserId: string,
  date: string,
  questionId: string
): Promise<{ loopComplete: boolean }>
// Uses array_append on completed_ids
// Checks if length matches question_ids length → sets status = 'complete'
```

---

### 4.5 Question Card State Machine

**File:** `apps/web/components/question-card.tsx`

States:
```
UNOPENED → OPENED → AWAITING_FEEDBACK → COMPLETED
```

- `UNOPENED`: "Open Question" button visible
- `OPENED`: "Open Question" still visible (stays clickable to reopen) + "Mark Done" button appears
- `AWAITING_FEEDBACK`: feedback modal open, card disabled
- `COMPLETED`: card shows ✓ icon, question title strikethrough, feedback badge (e.g. "Struggled")

State management: local React state in the card component. `isCompleted` prop comes from server (for persistence across refreshes).

**"Open Question" click:**
```ts
function handleOpen() {
  window.open(question.link, '_blank', 'noopener,noreferrer')
  setHasOpened(true)
}
```

**"Mark Done" click:**
```ts
function handleMarkDone() {
  setShowFeedbackModal(true)
}
```

**Feedback submit:**
```ts
async function handleFeedbackSubmit(feedback: FeedbackType) {
  const res = await fetch('/api/loop/complete', {
    method: 'POST',
    body: JSON.stringify({ questionId: question.id, feedback }),
  })
  const data = await res.json()
  setIsCompleted(true)
  setSubmittedFeedback(feedback)
  onLoopComplete?.(data.loopComplete)  // triggers loop complete state in parent
}
```

---

### 4.6 Loop Progress Update

**File:** `apps/web/app/(app)/today/page.tsx`

Make the today page a hybrid: server renders initial state, client handles completion state updates.

Pattern:
- Server component fetches initial loop state (which questions are completed)
- Pass initial state to a client wrapper `<TodayLoop initialLoop={loop} />`
- Client wrapper manages `completedIds` in local state
- On each completion, updates local state immediately (optimistic) before API response
- On `loopComplete = true`, transitions to "Loop Complete" view

```tsx
// today/page.tsx (server)
export default async function TodayPage() {
  const loop = await fetchTodayLoop()
  return <TodayLoop initialLoop={loop} />
}

// components/today-loop.tsx (client)
'use client'
export function TodayLoop({ initialLoop }) {
  const [completedIds, setCompletedIds] = useState(initialLoop.completedIds)
  const [loopDone, setLoopDone] = useState(initialLoop.status === 'complete')
  // ...
}
```

---

## Acceptance Criteria

- [ ] Clicking "Mark Done" opens the feedback modal
- [ ] Submit button is disabled until a feedback option is selected
- [ ] After submitting: `user_question_log` row in DB with correct `next_review_at`
- [ ] `feedback = struggled` → `next_review_at` = tomorrow
- [ ] `feedback = easy` → `next_review_at` = 7 days from today
- [ ] Card shows ✓ and feedback label after completion
- [ ] Loop progress bar increments correctly after each completion
- [ ] Completing all questions → `daily_loops.status = 'complete'` in DB
- [ ] "Loop Complete" state renders after last question marked done
- [ ] Refreshing the page after partial completion → completed cards still show completed state
- [ ] Submitting the same question twice does not create duplicate log entries
