# Phase 5 — Revision System

**Goal:** Questions due for revision are blended into the daily loop based on user's revision frequency. The Revision screen shows the upcoming revision queue.

**Depends on:** Phase 4 complete (feedback recorded, `next_review_at` being set in DB)

> **Clerk MCP:** Use `mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })` for route handler auth patterns.

---

## Deliverables

### 5.1 Due Revision Query

**File:** `packages/db/src/queries/logs.ts` (addition)

```ts
export async function getDueRevisions(clerkUserId: string, today: Date): Promise<Question[]> {
  // SELECT q.* FROM user_question_log uql
  // JOIN questions q ON q.id = uql.question_id
  // WHERE uql.clerk_user_id = $1
  //   AND uql.next_review_at <= $2
  //   AND q.is_active = true
  // ORDER BY uql.next_review_at ASC
  // LIMIT 2  -- max 2 revisions per day
}
```

Returns at most 2 questions (revision count cap enforced here, not in orchestrator).

---

### 5.2 Revision Frequency Check

**File:** `packages/orchestrator/src/revision-scheduler.ts` (addition)

```ts
export function shouldIncludeRevisionToday(
  revisionFrequency: RevisionFrequency,
  customDays: number[] | null,
  today: Date
): boolean {
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

  switch (revisionFrequency) {
    case 'daily':
      return true
    case 'alternate': {
      // Count days since epoch; include revision on even days
      const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24))
      return daysSinceEpoch % 2 === 0
    }
    case 'weekend':
      return dayOfWeek === 0 || dayOfWeek === 6
    case 'custom':
      return customDays?.includes(dayOfWeek) ?? false
  }
}
```

---

### 5.3 Loop Generator Update

**File:** `packages/orchestrator/src/loop-generator.ts`

The `revisionQuestions` parameter was already typed in Phase 3. Now it gets populated.

In `GET /api/loop/generate`:
1. Check `shouldIncludeRevisionToday(profile.revisionFrequency, profile.customDays, today)`
2. If true → call `getDueRevisions(userId, today)` → pass result as `revisionQuestions`
3. If false → pass `[]`

Revision questions are prepended to the final question list (appear first in the loop).

The total question count respects the daily time cap: if 2 revisions are included, reduce new questions by 2 to keep total within `dailyTimeMinutes`.

---

### 5.4 `GET /api/revision`

**File:** `apps/web/app/api/revision/route.ts`

Returns the user's upcoming revision queue for the next 7 days.

**Logic:**
1. `await auth()` → get `userId`
2. Query `user_question_log` for rows where `next_review_at` is between today and today+7
3. Join with `questions` table for metadata
4. Group by `next_review_at` date
5. Return sorted by date ASC

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
function getDateLabel(date: Date, today: Date): string {
  const diff = differenceInDays(date, today)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 6) return `In ${diff} days`
  return format(date, 'MMM d')
}
```

---

### 5.5 Revision Screen

**File:** `apps/web/app/(app)/revision/page.tsx`

Server component — calls `/api/revision` (or the DB query directly).

Layout:
```
┌─────────────────────────────────────────────┐
│  Upcoming Revisions                         │
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
│                                             │
│  In 3 days                                  │
│  ┌───────────────────────────────────────┐  │
│  │ Binary Search                  Medium │  │
│  │ Binary Search                   [Easy]│  │
│  └───────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  ┌ Empty state ──────────────────────────┐  │
│  │  No revisions scheduled               │  │
│  │  You're up to date                    │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

- Each question card shows: title, difficulty badge, pattern, last feedback badge
- Feedback badge colors: green (easy), yellow (needed_hint), orange (struggled), red (couldnt_solve), gray (revisit_later)
- No "Mark Done" on revision screen — revisions are handled within Today's Loop

---

### 5.6 Visual Distinction in Today's Loop

**File:** `apps/web/components/question-card.tsx`

When `isRevision = true`:
- Show a small "Revision" badge in the top-right of the card
- Card background: very subtle tint (e.g. `bg-blue-50/50`) to distinguish from new questions
- Revision cards always appear first in the list (handled by loop generator ordering)

---

## Acceptance Criteria

- [ ] A question marked `struggled` yesterday appears in today's loop as a revision card (with "Revision" badge)
- [ ] A question marked `easy` does not reappear for 7 days
- [ ] User with `weekend` revision frequency: revision questions do NOT appear on weekdays
- [ ] User with `daily` revision frequency: revision questions appear every day (if due)
- [ ] Revision screen shows grouped upcoming revisions with correct date labels
- [ ] Revision screen shows empty state when no revisions are scheduled
- [ ] Max 2 revision questions per daily loop (even if 5 are due, only 2 shown)
- [ ] Loop generates correctly when no revisions are due (no errors, just new questions)
- [ ] Last feedback badge shown on revision cards (e.g. "Struggled", "Easy")
- [ ] Total estimated time on Today's Loop includes revision question times
