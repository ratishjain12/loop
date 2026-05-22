# Phase 3 — Daily Loop Generation

**Goal:** `/today` shows a finite, personalized question set. User can open each question on LeetCode. Loop is idempotent — same questions shown all day.

**Depends on:** Phase 2 complete (questions seeded, user has a profile)

> **Clerk MCP:** Use `mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })` for the latest `await auth()` patterns in route handlers.

---

## Deliverables

### 3.1 `packages/orchestrator/src/recovery-mode.ts`

**Purpose:** Detect how many days were missed and return a config that limits today's workload.

```ts
export interface RecoveryConfig {
  isRecovery: boolean
  missedDays: number
  maxQuestions: number
}

export function detectRecovery(lastLoopDate: Date | null, today: Date): RecoveryConfig {
  if (!lastLoopDate) return { isRecovery: false, missedDays: 0, maxQuestions: Infinity }

  const diffMs = today.getTime() - lastLoopDate.getTime()
  const missedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) - 1 // subtract 1 (yesterday = 0 missed)

  if (missedDays <= 1) return { isRecovery: false, missedDays, maxQuestions: Infinity }
  if (missedDays <= 3) return { isRecovery: true, missedDays, maxQuestions: 2 }
  return { isRecovery: true, missedDays, maxQuestions: 1 }
}
```

Note: Phase 7 extends this with deeper recovery tiers (4–6 days, 7+ days).

---

### 3.2 `packages/orchestrator/src/loop-generator.ts`

**Purpose:** Given a pool of available questions and user preferences, return today's ordered question list.

```ts
import { Question, UserProfile, RecoveryConfig } from './types'

interface GenerateLoopOptions {
  profile: UserProfile
  availableQuestions: Question[]  // not yet attempted (or due for revision — added in Phase 5)
  revisionQuestions: Question[]   // due for revision today (empty until Phase 5)
  recovery: RecoveryConfig
  today: Date
}

export function generateLoop(options: GenerateLoopOptions): Question[] {
  const { profile, availableQuestions, revisionQuestions, recovery } = options

  // 1. Determine max new questions
  const avgTime = 25 // median estimated time across question pool
  const normalMax = Math.min(6, Math.max(2, Math.floor(profile.dailyTimeMinutes / avgTime)))
  const maxNew = recovery.isRecovery
    ? Math.max(0, recovery.maxQuestions - revisionQuestions.length)
    : normalMax

  // 2. Filter by level
  const levelMap = { beginner: ['easy'], intermediate: ['easy', 'medium'], advanced: ['easy', 'medium', 'hard'] }
  const allowedDifficulties = levelMap[profile.level]
  let pool = availableQuestions.filter(q => allowedDifficulties.includes(q.difficulty))

  // 3. Focus mode (Phase 7 — no-op until then)
  if (profile.focusPattern) {
    const focused = pool.filter(q => q.primaryPattern === profile.focusPattern)
    const others = pool.filter(q => q.primaryPattern !== profile.focusPattern)
    pool = [...focused, ...others] // focused questions first in the sorted pool
  }

  // 4. Sort by importance DESC
  pool.sort((a, b) => b.importanceScore - a.importanceScore)

  // 5. Enforce pattern diversity — max 2 from same primary pattern
  const selected: Question[] = []
  const patternCounts: Record<string, number> = {}

  for (const q of pool) {
    if (selected.length >= maxNew) break
    const count = patternCounts[q.primaryPattern] ?? 0
    if (count < 2) {
      selected.push(q)
      patternCounts[q.primaryPattern] = count + 1
    }
  }

  // 6. Revisions go first (Phase 5 will populate revisionQuestions)
  return [...revisionQuestions, ...selected]
}
```

---

### 3.3 `GET /api/loop/generate`

**File:** `apps/web/app/api/loop/generate/route.ts`

Logic:
1. Get `userId` from `await auth()` (Clerk — async)
2. Check `daily_loops` for `(clerkUserId, today)` → return if exists (idempotent)
3. Fetch `user_profiles` for the user
4. Fetch last completed loop date (most recent `daily_loops` row with `status = 'complete'`)
5. Run `detectRecovery(lastDate, today)`
6. Fetch all questions the user has never attempted (LEFT JOIN `user_question_log`, filter nulls)
7. Run `generateLoop({ profile, availableQuestions, revisionQuestions: [], recovery, today })`
8. Insert new `daily_loops` row with the question IDs
9. Return full loop with question metadata

**Response shape:**
```ts
{
  id: string
  date: string
  status: 'pending' | 'complete'
  isRecovery: boolean
  questions: {
    id: string
    title: string
    link: string
    difficulty: 'easy' | 'medium' | 'hard'
    primaryPattern: string
    estimatedMinutes: number
    isCompleted: boolean  // based on completedIds
    isRevision: boolean   // false until Phase 5
  }[]
  totalEstimatedMinutes: number
  completedCount: number
}
```

---

### 3.4 DB Query Helpers

**File:** `packages/db/src/queries/loops.ts`

```ts
export async function getTodayLoop(clerkUserId: string, today: string)
export async function createLoop(clerkUserId: string, date: string, questionIds: string[])
export async function getLastCompletedLoopDate(clerkUserId: string): Promise<Date | null>
```

**File:** `packages/db/src/queries/questions.ts`

```ts
export async function getUnseenQuestions(clerkUserId: string): Promise<Question[]>
// SELECT q.* FROM questions q
// WHERE q.is_active = true
// AND q.id NOT IN (
//   SELECT question_id FROM user_question_log WHERE clerk_user_id = $1
// )
```

---

### 3.5 Today's Loop UI

**File:** `apps/web/app/(app)/today/page.tsx`

Server component — fetches the loop on render by calling `/api/loop/generate` internally (or directly calling the DB query function, since it's server-side).

Layout:
```
┌─────────────────────────────────────────────┐
│  Today's Loop          Thu, May 22          │
│  ─────────────────────────────────────────  │
│  ████████████░░░░░░░░  2 of 4 complete      │
│  Est. 85 min total                          │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │ [Revision] Two Sum               Easy │  │
│  │ Hash Map · 15 min                     │  │
│  │                        [Open Question]│  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ Best Time to Buy and Sell Stock  Easy │  │
│  │ Sliding Window · 15 min               │  │
│  │                        [Open Question]│  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Components:**

`components/question-card.tsx` (client component — manages open/done state):
- Props: `question`, `isCompleted`, `isRevision`
- State: `hasOpened` (becomes true when "Open Question" is clicked)
- "Open Question" button: `target="_blank"`, sets `hasOpened = true` on click
- "Mark Done" button: appears when `hasOpened = true` and `!isCompleted`
- Completion state: checkmark icon + feedback label
- Calls `onComplete(questionId, feedback)` passed from parent

`components/loop-progress.tsx`:
- Props: `total`, `completed`
- shadcn `<Progress>` bar + "X of N complete" label

**Recovery banner** (shown when `isRecovery = true`):
```
┌─────────────────────────────────────────────┐
│  Welcome back. Taking it easy today.        │
└─────────────────────────────────────────────┘
```
Subtle, warm. No mention of missed days.

**Loop complete state:**
```
┌─────────────────────────────────────────────┐
│           Loop Complete                     │
│    You're done for today. See you           │
│    tomorrow.                                │
└─────────────────────────────────────────────┘
```

---

## Acceptance Criteria

- [ ] `/today` shows questions on first load without any user action
- [ ] Refreshing `/today` returns the exact same questions (loop is idempotent)
- [ ] "Open Question" opens LeetCode link in a new tab
- [ ] "Mark Done" button appears only after clicking "Open Question"
- [ ] Feedback modal opens after clicking "Mark Done" (full modal from Phase 4)
- [ ] Loop progress bar shows correct completed count
- [ ] Recovery banner appears after simulating 3+ missed days (manually set last loop date)
- [ ] Pattern diversity: no loop has 3 or more questions from the same primary pattern
- [ ] Beginner user: loop contains only easy questions
- [ ] Total estimated time displayed matches sum of question estimated_minutes
