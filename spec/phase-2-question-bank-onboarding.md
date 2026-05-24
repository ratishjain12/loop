# Phase 2 — Question Bank + Onboarding

**Goal:** ~120 curated questions seeded into DB; new users complete onboarding and are routed to Today's Loop.

**Depends on:** Phase 1 complete (DB tables exist, Clerk auth working)

> **Clerk MCP:** Use `mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })` for up-to-date route handler and server component auth patterns.

---

## Deliverables

### 2.1 Question Seed

**Source:** NeetCode 150 as primary reference. Importance scores derived from Blind 75 overlap.

**Scoring rules:**
- Questions in Blind 75 → `importance_score` 8–10
- NeetCode-only → `importance_score` 5–7
- Estimated minutes: easy=15, medium=25, hard=40 (DP hard=50, graphs medium=30)

**File:** `packages/db/src/seed.ts`

Structure:
```ts
import { db } from './client'
import { questions } from './schema'

const QUESTIONS = [
  // Arrays & Hashing
  {
    title: 'Two Sum',
    link: 'https://leetcode.com/problems/two-sum',
    difficulty: 'easy',
    primaryPattern: 'hash_map',
    secondaryPatterns: ['arrays'],
    importanceScore: 10,
    estimatedMinutes: 15,
  },
  // ... all ~120 questions
]

async function seed() {
  await db.insert(questions).values(QUESTIONS).onConflictDoNothing()
  console.log(`Seeded ${QUESTIONS.length} questions`)
  process.exit(0)
}

seed()
```

**Patterns to cover (with approximate counts):**

| Pattern | Count | Notes |
|---|---|---|
| arrays / hash_map | 12 | Foundation — all levels |
| two_pointers | 8 | Core pattern |
| sliding_window | 6 | Core pattern |
| stack | 6 | Includes monotonic stack |
| binary_search | 6 | Trees + sorted arrays |
| linked_list | 6 | Classic interview staple |
| trees | 12 | BFS + DFS + BST |
| tries | 3 | Less common but important |
| heap / priority_queue | 6 | Useful for top-K problems |
| backtracking | 7 | Permutations, subsets, sudoku |
| graphs | 10 | BFS, DFS, topological sort, union find |
| dynamic_programming | 18 | 1D, 2D, knapsack, LCS |
| greedy | 5 | Intervals, scheduling |
| intervals | 5 | Merge, insert, meeting rooms |
| math / bit_manipulation | 4 | Bit tricks, fast power |

Total: ~114 questions. Round up to 120 with highest-importance additions.

**`package.json` script addition in `packages/db`:**
```json
{
  "scripts": {
    "seed": "tsx src/seed.ts"
  }
}
```

**Root `turbo.json` addition:**
```json
"seed": { "cache": false }
```

---

### 2.2 Onboarding Flow

**File:** `apps/web/app/(app)/onboarding/page.tsx`

This is a client component (`'use client'`). Uses local state to track current step.

**Steps:**

```
Step 1: Level
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  Beginner   │  │ Intermediate│  │  Advanced   │
  │             │  │             │  │             │
  │ Just started│  │ Know basics,│  │ Solved 100+ │
  │ learning DSA│  │ need practice│  │ problems    │
  └─────────────┘  └─────────────┘  └─────────────┘

Step 2: Daily time
  How much time can you spend each day?
  [ 15 min ] [ 30 min ] [ 45 min ] [ 60 min ] [ 90 min ]

Step 3: Prep timeline
  When is your target interview date?
  [ 1 month ] [ 3 months ] [ 6 months ] [ 12 months ]

Step 4: Revisions per session
  How many revision questions per session?
  [ 1 — light touch ] [ 2 — balanced ] [ 3 — intensive ]
  Due revisions surface every day; this caps how many blend into each loop.

Step 5: Summary + CTA
  "You're all set"
  Level: Beginner
  Daily time: 45 min
  Revisions per session: 2
  [ Start My Loop → ]
```

**State shape:**
```ts
{
  step: number                // 1–5
  level: string | null
  dailyTimeMinutes: number | null
  prepMonths: number | null
  dailyRevisionCap: number | null  // 1 | 2 | 3
}
```

**Submit handler:**
```ts
async function handleSubmit() {
  const res = await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, dailyTimeMinutes, prepMonths, dailyRevisionCap }),
  })
  if (res.ok) router.push('/today')
}
```

---

### 2.3 `POST /api/onboarding`

**File:** `apps/web/app/api/onboarding/route.ts`

```ts
import { auth } from '@clerk/nextjs/server'
import { db } from '@loop/db'
import { userProfiles } from '@loop/db/schema'

export async function POST(req: Request) {
  const { userId } = await auth()  // auth() is async in latest Clerk — always await
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // validate: level, dailyTimeMinutes, prepMonths, revisionFrequency present

  await db.insert(userProfiles).values({
    clerkUserId: userId,
    level: body.level,
    dailyTimeMinutes: body.dailyTimeMinutes,
    prepMonths: body.prepMonths,
    dailyRevisionCap: body.dailyRevisionCap ?? 2,
  }).onConflictDoUpdate({
    target: userProfiles.clerkUserId,
    set: { level: body.level, dailyTimeMinutes: body.dailyTimeMinutes, ... }
  })

  return Response.json({ success: true })
}
```

---

### 2.4 New User Gate

**File:** `apps/web/app/(app)/layout.tsx`

```ts
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@loop/db'
import { userProfiles } from '@loop/db/schema'
import { eq } from 'drizzle-orm'

export default async function AppLayout({ children }) {
  const { userId } = await auth()  // async in latest Clerk
  if (!userId) redirect('/sign-in')

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.clerkUserId, userId)
  })

  // Allow onboarding page to load even without profile
  // Redirect to onboarding if on any other (app) page without a profile
  // This is handled per-page to avoid redirect loops
  
  return <>{children}</>
}
```

Per-page check in `app/(app)/today/page.tsx`, `revision/page.tsx`, `progress/page.tsx`:
```ts
const profile = await getOrRedirectToOnboarding(userId)
// helper: fetches profile, calls redirect('/onboarding') if null
```

---

## Acceptance Criteria

- [ ] `pnpm --filter @loop/db seed` inserts ~120 questions into Supabase; re-running does not duplicate
- [ ] Supabase `questions` table has correct count of rows
- [ ] New user signs up → Clerk redirects to `/onboarding`
- [ ] Completing all 5 onboarding steps → `user_profiles` row created in DB
- [ ] Revisiting `/onboarding` after profile exists → redirected to `/today`
- [ ] Visiting `/today` without a profile → redirected to `/onboarding`
- [ ] All onboarding steps are navigable (back button works, no data loss on step change)
- [ ] `daily_revision_cap` stored correctly in `user_profiles` (1, 2, or 3)
