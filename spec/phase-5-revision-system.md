# Phase 5 — Revision System

**Goal:** Questions due for revision are blended into every daily loop, capped by the user's `daily_revision_cap`. The Revision screen shows the upcoming queue.

**Depends on:** Phase 4 complete (feedback recorded, `next_review_at` being set in DB)

> **Clerk MCP:** Use `mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })` for route handler auth patterns.

---

## Design rationale

Revisions appear **every day** — there are no day-gating rules. The spaced repetition algorithm already decides when each question is due; blocking it to specific days of the week would delay reviews past the optimal window and break retention.

What users control is **volume**: the `daily_revision_cap` field on their profile (1, 2, or 3) caps how many due revisions blend into each session. This respects cognitive load without corrupting the timing.

---

## Deliverables

### 5.1 Due Revision Query

**File:** `packages/db/src/queries/logs.ts` (addition)

```ts
export async function getDueRevisions(clerkUserId: string, today: string): Promise<Question[]>
```

Logic:
- Use `DISTINCT ON (question_id)` subquery to get the **most recent log entry** per question
- Filter: `next_review_at <= today` AND `is_active = true`
- Exclude questions already in today's loop
- Order by `next_review_at ASC` (most overdue first)
- Return full question metadata (join with `questions` table)

No hard limit here — the orchestrator enforces the cap.

---

### 5.2 Loop Generator Update

**File:** `packages/orchestrator/src/loop-generator.ts`

`revisionQuestions` parameter was already typed in Phase 3. Now it gets populated from `getDueRevisions`.

The revision slot is: `Math.min(profile.dailyRevisionCap, Math.ceil(hardCap / 2))`

This ensures:
- In normal mode: up to `dailyRevisionCap` revisions (1–3), never more than half the loop
- In recovery mode: revision slot shrinks proportionally with the hard cap

Revision questions are prepended to the final list (appear first in the loop).

In `GET /api/loop/generate` and `app/(app)/today/page.tsx`:
```ts
// Always fetch due revisions — cap controls volume, not which days
const dueRevisions = await getDueRevisions(userId, today)
```

---

### 5.3 `GET /api/revision`

**File:** `apps/web/app/api/revision/route.ts`

Returns the user's upcoming revision queue for the next 7 days.

**Response:**
```ts
{
  upcoming: {
    date: string          // ISO date, e.g. "2026-05-22"
    label: string         // "Today" | "Tomorrow" | "In 3 days" | "May 25"
    questions: {
      id: string
      title: string
      difficulty: string
      primaryPattern: string
      lastFeedback: FeedbackType
    }[]
  }[]
}
```

**Date label logic:**
```ts
function getDateLabel(diff: number): string {
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 6) return `In ${diff} days`
  return format(date, 'MMM d')
}
```

---

### 5.4 Revision Screen

**File:** `apps/web/app/(app)/revision/page.tsx`

Server component — calls `getDueRevisions` and the 7-day lookahead query directly.

Layout:
```
┌─────────────────────────────────────────────┐
│  Revision Queue                             │
│  Questions scheduled for review             │
├─────────────────────────────────────────────┤
│  Today                                      │
│  ┌───────────────────────────────────────┐  │
│  │ Two Sum                          Easy │  │
│  │ Hash Map                  [Struggled] │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Tomorrow                                   │
│  ┌───────────────────────────────────────┐  │
│  │ Valid Parentheses                Easy │  │
│  │ Stack                   [Needed Hint] │  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ┌ Empty state ──────────────────────────┐  │
│  │  No revisions scheduled               │  │
│  │  You're up to date                    │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

- Each question card: title, difficulty badge, pattern, last feedback badge
- No "Mark Done" — revisions are completed within Today's Loop

---

### 5.5 Visual Distinction in Today's Loop

**File:** `apps/web/components/question-card.tsx`

When `isRevision = true`:
- Show a small purple "Revision" badge in the metadata row
- Revision cards always appear first in the list (loop generator ordering)

---

## Acceptance Criteria

- [ ] A question marked `struggled` yesterday appears in today's loop as a revision card
- [ ] A question marked `easy` does not reappear for 7 days
- [ ] Revisions appear every day regardless of day of week
- [ ] User with `dailyRevisionCap = 1` sees at most 1 revision per session
- [ ] User with `dailyRevisionCap = 3` sees at most 3 revisions per session (or half the hard cap, whichever is lower)
- [ ] Revision screen shows grouped upcoming revisions with correct date labels
- [ ] Revision screen shows empty state when no revisions are scheduled
- [ ] Loop generates correctly when no revisions are due (no errors, just new questions)
- [ ] Total estimated time on Today's Loop includes revision question times
