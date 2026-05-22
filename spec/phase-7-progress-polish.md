# Phase 7 — Progress + Polish

**Goal:** Progress screen is complete. Recovery logic handles all missed-day scenarios. Focus modes bias the loop. The product is V1-shippable.

**Depends on:** Phases 1–6 complete.

---

## Deliverables

### 7.1 Progress Screen

**File:** `apps/web/app/(app)/progress/page.tsx`

Server component — fetches all stats directly from DB.

Layout:
```
┌─────────────────────────────────────────────┐
│  Progress                                   │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  7 🔥    │  │  23      │  │  89      │  │
│  │  streak  │  │  loops   │  │  solved  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────┤
│  Pattern Breakdown                          │
│                                             │
│  Dynamic Programming  ████████████  18      │
│  Trees                █████████     14      │
│  Graphs               ███████       11      │
│  Two Pointers         ██████        9       │
│  Sliding Window       █████         8       │
│  ...                                        │
├─────────────────────────────────────────────┤
│  Last 14 days                               │
│  ● ● ○ ● ● ● ○ ● ● ● ● ○ ● ●              │
│  ● = complete  ○ = missed                  │
└─────────────────────────────────────────────┘
```

**Stats queries (`packages/db/src/queries/loops.ts`):**

```ts
export async function getStreak(clerkUserId: string): Promise<number>
// Counts consecutive completed days ending today (backward from today)

export async function getTotalCompletedLoops(clerkUserId: string): Promise<number>
// COUNT(*) WHERE status = 'complete'

export async function getLast14DaysActivity(clerkUserId: string): Promise<{ date: string; completed: boolean }[]>
// Returns array of last 14 dates with loop completion status
```

**Pattern breakdown query (`packages/db/src/queries/logs.ts`):**

```ts
export async function getSolvedByPattern(clerkUserId: string): Promise<{ pattern: string; count: number }[]>
// SELECT q.primary_pattern, COUNT(*) as count
// FROM user_question_log uql
// JOIN questions q ON q.id = uql.question_id
// WHERE uql.clerk_user_id = $1
// GROUP BY q.primary_pattern
// ORDER BY count DESC
```

**Streak logic:**
- Query `daily_loops` rows where `status = 'complete'`, ordered by date DESC
- Walk backward from today: increment streak while consecutive days are complete
- Stop when a gap is found
- Today counts if loop is complete

---

### 7.2 Streak Badge in Nav

**File:** `apps/web/components/nav.tsx`

- Show current streak next to "Progress" nav item: `Progress  7🔥`
- If streak = 0: no badge shown
- Fetch streak server-side in the app layout, pass as prop to nav

---

### 7.3 Full Recovery Mode Logic

**File:** `packages/orchestrator/src/recovery-mode.ts` (extension of Phase 3 version)

```ts
export interface RecoveryConfig {
  isRecovery: boolean
  missedDays: number
  maxQuestions: number
  isAdaptive: boolean  // 7+ day gap triggered adaptive reduction
}

export function detectRecovery(
  lastLoopDate: Date | null,
  today: Date,
  adaptiveUntil: Date | null  // from user_profiles
): RecoveryConfig {
  // Adaptive mode check: if adaptiveUntil is in the future, reduce load
  if (adaptiveUntil && adaptiveUntil > today) {
    return { isRecovery: false, missedDays: 0, maxQuestions: 2, isAdaptive: true }
  }

  if (!lastLoopDate) return { isRecovery: false, missedDays: 0, maxQuestions: Infinity, isAdaptive: false }

  const diffDays = daysBetween(lastLoopDate, today) - 1  // days missed (not counting last active day)

  if (diffDays <= 1) return { isRecovery: false, missedDays: diffDays, maxQuestions: Infinity, isAdaptive: false }
  if (diffDays <= 3) return { isRecovery: true, missedDays: diffDays, maxQuestions: 2, isAdaptive: false }
  if (diffDays <= 6) return { isRecovery: true, missedDays: diffDays, maxQuestions: 1, isAdaptive: false }
  
  // 7+ days missed: deep recovery + set adaptive mode
  return { isRecovery: true, missedDays: diffDays, maxQuestions: 1, isAdaptive: true }
}
```

**Setting adaptive mode:**

In `GET /api/loop/generate`, after calling `detectRecovery`:
- If `isAdaptive = true` and `user_profiles.adaptive_until` is null or in the past:
  - Set `adaptive_until = today + 5 days` in `user_profiles`
  - For the next 5 days, `maxQuestions = 2` (regardless of daily_time_minutes)

This is handled by the `adaptiveUntil` check in `detectRecovery` above.

---

### 7.4 Recovery UI Messaging

**File:** `apps/web/app/(app)/today/page.tsx` / `components/today-loop.tsx`

When `isRecovery = true`:
```
┌─────────────────────────────────────────────┐
│  Welcome back. Taking it easy today to      │
│  rebuild momentum.                          │
└─────────────────────────────────────────────┘
```

When `isAdaptive = true` (first day back after 7+ day gap):
```
┌─────────────────────────────────────────────┐
│  Good to have you back. Starting with       │
│  shorter sessions for a few days.           │
└─────────────────────────────────────────────┘
```

Rules:
- Warm, encouraging tone
- Never mention number of missed days
- Never use words like "missed", "failed", "behind"
- Banners dismiss after user scrolls past them (or after loop is complete)

---

### 7.5 Focus Modes

**Schema update:** `user_profiles.focus_pattern` (nullable text) — already included in Phase 1 schema.

**API endpoint:**

`PATCH /api/profile/focus`

```ts
// Request: { focusPattern: string | null }
// Sets user_profiles.focus_pattern for the current user
// Returns: { success: true }
```

**UI:**

**File:** `apps/web/app/(app)/progress/page.tsx` (addition)

Settings card at the bottom of the Progress screen:

```
┌─────────────────────────────────────────────┐
│  Focus Mode                                 │
│                                             │
│  Bias your daily loop toward one pattern   │
│  while keeping some variety.               │
│                                             │
│  Current focus: Dynamic Programming ▼      │
│  [ None ] [ DP ] [ Graphs ] [ Trees ] ...  │
└─────────────────────────────────────────────┘
```

- Dropdown or segmented picker showing all available patterns + "None"
- Selecting a pattern → calls `PATCH /api/profile/focus`
- Change takes effect on next day's loop generation

**Loop generator update:**

**File:** `packages/orchestrator/src/loop-generator.ts` (addition from the Phase 3 placeholder)

```ts
if (profile.focusPattern) {
  const focused = pool.filter(q => q.primaryPattern === profile.focusPattern)
  const others = pool.filter(q => q.primaryPattern !== profile.focusPattern)
  
  const focusedTarget = Math.ceil(maxNew * 0.7)
  const othersTarget = maxNew - focusedTarget
  
  const selectedFocused = selectWithDiversity(focused, focusedTarget)
  const selectedOthers = selectWithDiversity(others, othersTarget)
  
  return [...revisionQuestions, ...selectedFocused, ...selectedOthers]
}
```

Focus mode does NOT affect revision questions — only new question selection.

---

### 7.6 General Polish

**Loading skeletons:**

**File:** `apps/web/components/question-card-skeleton.tsx`

```tsx
export function QuestionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="h-4 w-3/4 bg-muted rounded mb-2" />
      <div className="h-3 w-1/2 bg-muted rounded" />
    </div>
  )
}
```

Show 3 skeletons while loop is loading on Today page.

**Error boundaries:**

**File:** `apps/web/components/error-boundary.tsx`

Wrap Today's Loop, Revision, and Progress in error boundaries. On error: show friendly message + "Try again" button that calls `router.refresh()`.

**Mobile responsive layout:**

- Desktop: left sidebar nav (fixed, 200px wide)
- Mobile (< 768px): bottom tab bar with icons for Today | Revision | Progress
- Use Tailwind `md:` breakpoint to switch between layouts
- Test at 375px (iPhone SE) and 390px (iPhone 14)

**`<head>` metadata:**

**File:** `apps/web/app/layout.tsx`

```ts
export const metadata: Metadata = {
  title: 'Loop — Structured DSA Practice',
  description: 'Daily DSA practice that keeps you consistent. No decision fatigue, just focused learning.',
  openGraph: {
    title: 'Loop',
    description: 'Structured DSA practice that keeps you consistent.',
  },
}
```

Per-page titles:
- Today's Loop: `{ title: "Today's Loop | Loop" }`
- Revision: `{ title: "Revision | Loop" }`
- Progress: `{ title: "Progress | Loop" }`

---

## Acceptance Criteria

- [ ] Progress screen shows correct streak count (verified against DB)
- [ ] Completing a loop increments streak; missing a day resets it to 0
- [ ] Pattern breakdown shows solved count per pattern (sorted by count DESC)
- [ ] Last 14 days activity grid renders correctly (filled/empty dots)
- [ ] Streak badge appears in nav when streak >= 1
- [ ] Focus mode selection on Progress screen → stored in DB → next day's loop biased ~70% toward that pattern
- [ ] Setting focus mode to "None" → removes bias, loop returns to normal selection
- [ ] Recovery banner appears after simulating 3-day gap (no mention of missed days)
- [ ] Adaptive mode triggers after 7+ day gap: `adaptive_until` set in DB, max 2 questions for next 5 days
- [ ] Loading skeletons appear before loop data loads (no blank flash)
- [ ] Error boundary shows friendly message if API call fails
- [ ] Layout is usable at 375px viewport width (no horizontal overflow)
- [ ] Bottom tab bar visible on mobile, sidebar visible on desktop
- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] `pnpm --filter apps/web lint` passes with no errors
