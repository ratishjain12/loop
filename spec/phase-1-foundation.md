# Phase 1 — Foundation

**Goal:** Turborepo monorepo running, DB connected, Clerk auth protecting routes, blank app shell with nav visible.

---

## Clerk MCP

A Clerk MCP server is connected. **During implementation, always use it** to get the latest accurate code snippets instead of guessing.

```
// List all available snippets
mcp__clerk__list_clerk_sdk_snippets

// Fetch a specific snippet — use these slugs for Loop:
mcp__clerk__clerk_sdk_snippet({ slug: "server-auth-nextjs" })  // route handlers + server components
mcp__clerk__clerk_sdk_snippet({ slug: "auth-basics" })         // useUser, useAuth hooks
mcp__clerk__clerk_sdk_snippet({ slug: "user-button" })         // <UserButton /> component
```

**Critical Clerk API distinction (verified from MCP):**

| Context | Pattern |
|---|---|
| `clerkMiddleware` callback | `await auth.protect()` — `auth` is an object, NOT a function |
| Route Handlers / Server Components | `const { userId } = await auth()` — `auth` IS a function, must be called and awaited |

---

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Framework | Next.js 15 (App Router) in `apps/web` |
| Language | TypeScript end-to-end |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) via Drizzle ORM |
| Auth | Clerk (`@clerk/nextjs`) |

---

## Deliverables

### 1.1 Monorepo scaffold

Files to create:
- `pnpm-workspace.yaml` — declares `apps/*` and `packages/*` as workspaces
- `turbo.json` — pipeline: `build` (depends on upstream), `dev` (parallel), `lint`
- `package.json` (root) — `turbo` as dev dependency, scripts: `dev`, `build`, `lint`
- `.gitignore` — node_modules, .next, .env, dist

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "persistent": true, "cache": false },
    "lint": {}
  }
}
```

---

### 1.2 `packages/tsconfig`

- `packages/tsconfig/package.json` — name: `@loop/tsconfig`
- `packages/tsconfig/base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

---

### 1.3 `packages/db`

Package name: `@loop/db`

Files:
- `package.json` — dependencies: `drizzle-orm`, `postgres`; devDependencies: `drizzle-kit`
- `tsconfig.json` — extends `@loop/tsconfig/base.json`
- `drizzle.config.ts` — points to `DATABASE_URL`, outputs to `./migrations`
- `src/schema.ts` — all 4 tables (see Data Model below)
- `src/client.ts` — exports `db` (Drizzle instance)
- `src/index.ts` — re-exports schema and client

**Schema (`src/schema.ts`):**

```ts
import { pgTable, text, integer, boolean, uuid, timestamp, date } from 'drizzle-orm/pg-core'

export const userProfiles = pgTable('user_profiles', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  level: text('level').notNull(),                         // 'beginner' | 'intermediate' | 'advanced'
  dailyTimeMinutes: integer('daily_time_minutes').notNull(),
  prepMonths: integer('prep_months').notNull(),
  revisionFrequency: text('revision_frequency').notNull(), // 'daily' | 'alternate' | 'weekend' | 'custom'
  customDays: integer('custom_days').array(),              // [1,3,5] = Mon/Wed/Fri
  focusPattern: text('focus_pattern'),                    // nullable, set in Phase 7
  adaptiveUntil: date('adaptive_until'),                  // nullable, set in Phase 7
  createdAt: timestamp('created_at').defaultNow(),
})

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  link: text('link').notNull(),
  difficulty: text('difficulty').notNull(),               // 'easy' | 'medium' | 'hard'
  primaryPattern: text('primary_pattern').notNull(),
  secondaryPatterns: text('secondary_patterns').array().default([]),
  importanceScore: integer('importance_score').notNull(), // 1–10
  estimatedMinutes: integer('estimated_minutes').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const userQuestionLog = pgTable('user_question_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  questionId: uuid('question_id').references(() => questions.id),
  attemptedAt: timestamp('attempted_at').defaultNow(),
  feedback: text('feedback').notNull(), // 'easy'|'needed_hint'|'struggled'|'couldnt_solve'|'revisit_later'
  nextReviewAt: date('next_review_at').notNull(),
})

export const dailyLoops = pgTable('daily_loops', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  date: date('date').notNull(),
  questionIds: uuid('question_ids').array().notNull(),
  completedIds: uuid('completed_ids').array().default([]),
  aiRankingUsed: boolean('ai_ranking_used').default(false),
  status: text('status').default('pending'),              // 'pending' | 'complete'
  createdAt: timestamp('created_at').defaultNow(),
})
```

**`drizzle.config.ts` (at `packages/db/drizzle.config.ts`):**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL!, // direct connection, port 5432 — NOT the pooler
  },
})
```

Note: migrations use the **direct connection** URL (port 5432). The app uses the **transaction pooler** URL (port 6543). Two separate env vars.

**Client (`src/client.ts`):**

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// prepare: false required for Supabase transaction pooler (port 6543)
// Serverless functions (Vercel) must use the pooler to avoid connection exhaustion
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle(client, { schema })
```

---

### 1.4 `packages/orchestrator`

Package name: `@loop/orchestrator`

Files:
- `package.json`
- `tsconfig.json`
- `src/types.ts` — shared types used across packages
- `src/loop-generator.ts` — placeholder export (implemented Phase 3)
- `src/revision-scheduler.ts` — placeholder export (implemented Phase 4)
- `src/recovery-mode.ts` — placeholder export (implemented Phase 3)
- `src/index.ts` — re-exports all

**Types (`src/types.ts`):**

```ts
export type Difficulty = 'easy' | 'medium' | 'hard'
export type FeedbackType = 'easy' | 'needed_hint' | 'struggled' | 'couldnt_solve' | 'revisit_later'
export type RevisionFrequency = 'daily' | 'alternate' | 'weekend' | 'custom'

export interface Question {
  id: string
  title: string
  link: string
  difficulty: Difficulty
  primaryPattern: string
  secondaryPatterns: string[]
  importanceScore: number
  estimatedMinutes: number
}

export interface UserProfile {
  clerkUserId: string
  level: 'beginner' | 'intermediate' | 'advanced'
  dailyTimeMinutes: number
  revisionFrequency: RevisionFrequency
  customDays: number[] | null
  focusPattern: string | null
}

export interface RecoveryConfig {
  isRecovery: boolean
  missedDays: number
  maxQuestions: number
}
```

---

### 1.5 `packages/ai`

Package name: `@loop/ai`

Files:
- `package.json` — dependencies: `ai`, `@ai-sdk/openai`
- `tsconfig.json`
- `src/client.ts` — placeholder (implemented Phase 6)
- `src/index.ts`

---

### 1.6 `apps/web`

Scaffold with:
```bash
pnpm create next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Then:
- Move into `apps/web/`
- Add `@loop/db`, `@loop/orchestrator` as workspace dependencies
- Initialize shadcn/ui: `npx shadcn@latest init` — when prompted, choose style: **`new-york`** (not `default` — that style was deprecated), base color: `neutral`
- Add shadcn components: `npx shadcn@latest add button card badge progress dialog input select label`

**Clerk setup:**
- Install: `@clerk/nextjs`
- `proxy.ts` at `apps/web/proxy.ts` (**Next.js 16 renamed `middleware.ts` → `proxy.ts`**):

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher(['/today(.*)', '/revision(.*)', '/progress(.*)', '/onboarding(.*)'])

// In clerkMiddleware, `auth` is an object — call auth.protect() directly (not auth().protect())
// In route handlers / server components, auth IS a function — use: const { userId } = await auth()
export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

> **Clerk MCP available:** A Clerk MCP server is connected in this project. During implementation, use `mcp__clerk__clerk_sdk_snippet` with slugs like `server-auth-nextjs`, `user-button`, `auth-basics` to get up-to-date code patterns directly from Clerk. Use `mcp__clerk__list_clerk_sdk_snippets` to see all available snippets.

- `app/layout.tsx` — wrap with `<ClerkProvider>`
- `app/(auth)/sign-in/[[...sign-in]]/page.tsx` — `<SignIn />` centered
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — `<SignUp />` centered

**App shell (`app/(app)/layout.tsx`):**
- Left sidebar (desktop) with nav links: Today's Loop | Revision | Progress
- `<UserButton />` in bottom-left corner
- `<main>` area for page content

**Blank pages:**
- `app/(app)/today/page.tsx` — "Today's Loop" heading
- `app/(app)/revision/page.tsx` — "Revision" heading
- `app/(app)/progress/page.tsx` — "Progress" heading
- `app/(app)/onboarding/page.tsx` — "Onboarding" heading

---

### 1.7 Environment

`.env.example` at repo root:

```
# Supabase — Transaction Pooler URL (port 6543) — used by the app at runtime on Vercel
# Find in: Supabase Dashboard → Project Settings → Database → Connection Pooling → Transaction mode
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require

# Supabase — Direct Connection URL (port 5432) — used ONLY by drizzle-kit for migrations
# Find in: Supabase Dashboard → Project Settings → Database → Connection string → URI
DATABASE_MIGRATION_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres?sslmode=require

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/today
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

Why two URLs: Vercel serverless functions need the **transaction pooler** (port 6543) to avoid exhausting Postgres connections. Drizzle migrations use prepared statements internally and must use the **direct connection** (port 5432) — the pooler disallows prepared statements, which is why `{ prepare: false }` is set in `client.ts`.

---

## Data Model (all 4 tables)

See `packages/db/src/schema.ts` above.

Tables:
- `user_profiles` — user preferences and state
- `questions` — curated question bank
- `user_question_log` — attempt history and feedback
- `daily_loops` — one row per user per day

---

## Acceptance Criteria

- [ ] `pnpm dev` starts `apps/web` on localhost:3000
- [ ] Visiting `/today` unauthenticated → redirected to `/sign-in`
- [ ] Clerk sign-in works → `/today` loads (blank page, nav visible)
- [ ] `pnpm --filter @loop/db db:migrate` runs without error against Supabase
- [ ] All 4 tables exist in Supabase dashboard
- [ ] `pnpm --filter @loop/orchestrator build` succeeds with no web dependencies
- [ ] TypeScript compiles with no errors across all packages
