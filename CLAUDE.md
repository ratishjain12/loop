# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run everything from the repo root unless told otherwise.

```bash
pnpm dev                          # start apps/web on localhost:3000
pnpm build                        # build all packages in dependency order
pnpm lint                         # lint all packages

pnpm --filter @loop/db generate   # generate Drizzle migrations (after schema changes)
pnpm --filter @loop/db migrate    # apply migrations to Supabase (uses DATABASE_MIGRATION_URL)
pnpm --filter @loop/db seed       # seed questions into DB

# type-check a single package without building
cd packages/db && npx tsc --noEmit
```

There are no tests yet. Type-checking (`tsc --noEmit`) is the verification step.

## Environment

Copy `.env.example` → `apps/web/.env.local` and fill in values. Two Supabase URLs are required:
- `DATABASE_URL` — transaction pooler, port **6543** — used by the app at runtime
- `DATABASE_MIGRATION_URL` — direct connection, port **5432** — used only by `drizzle-kit migrate`

Using the wrong URL for migrations will fail silently or error on prepared statements.

## Architecture

### Monorepo structure

| Package | Purpose |
|---|---|
| `apps/web` | Next.js 16 app (App Router) — the only deployable |
| `packages/db` | Drizzle schema, Supabase client, migrations, queries |
| `packages/orchestrator` | Pure TS business logic — loop generation, recovery detection, revision scheduling. Zero framework deps. |
| `packages/ai` | Vercel AI SDK + OpenAI wrappers — hints, explanations, loop ranking |
| `packages/tsconfig` | Shared `base.json` tsconfig — all packages extend it |

Packages are referenced via `workspace:*` in `package.json`. No build step is needed for local dev — Next.js transpiles them directly via `transpilePackages` in `next.config.ts`.

### Next.js app layout

```
app/
├── layout.tsx                 ← ClerkProvider, Geist font, global metadata
├── page.tsx                   ← redirects / → /today
├── (auth)/sign-in|sign-up/    ← Clerk-hosted auth pages (unprotected)
└── (app)/                     ← protected route group
    ├── layout.tsx             ← Nav sidebar + main wrapper
    ├── today/page.tsx
    ├── revision/page.tsx
    ├── progress/page.tsx
    └── onboarding/page.tsx
```

Route protection is in `apps/web/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`). The `(app)/*` routes are protected; `(auth)/*` and `/api/webhooks/*` are public.

### Auth pattern — critical distinction

In `proxy.ts` (clerkMiddleware), `auth` is an **object**:
```ts
await auth.protect()   // ✓ correct
```

In route handlers and server components, `auth` is a **function**:
```ts
const { userId } = await auth()   // ✓ correct
```

### Database

Four tables in `packages/db/src/schema.ts`:
- `user_profiles` — keyed by `clerk_user_id` (not a UUID), stores level/time/frequency prefs
- `questions` — static metadata only (title, link, pattern, difficulty, importance, estimated time). No problem text or solutions.
- `user_question_log` — one row per attempt; drives revision scheduling via `next_review_at`
- `daily_loops` — one row per user per day; `question_ids` is an ordered UUID array

The Drizzle client uses `{ prepare: false }` — required for Supabase's transaction pooler. Do not remove this.

### Orchestrator logic

`packages/orchestrator` is intentionally framework-free. All loop business logic lives here:
- `loop-generator.ts` — selects and orders questions given a profile + recovery config
- `recovery-mode.ts` — detects missed days and returns max question caps
- `revision-scheduler.ts` — maps feedback type → `next_review_at` offset

API routes in `apps/web/app/api/` call into the orchestrator and db packages, keeping the Next.js layer thin.

### UI conventions

- shadcn/ui components (style: `new-york`) live in `apps/web/components/ui/`
- Tailwind v4 — CSS-only config in `globals.css`, no `tailwind.config.ts`
- `cn()` helper is in `apps/web/lib/utils.ts` (clsx + tailwind-merge)
- Nav is a client component (`'use client'`) because it uses `usePathname`; all page components are server components by default

### AI (Phase 6+)

`packages/ai` uses Vercel AI SDK. Import pattern:
```ts
import { openai } from '@ai-sdk/openai'   // provider, not a factory call
import { useCompletion } from '@ai-sdk/react'  // client hooks
```

Streaming responses from API routes use `toDataStreamResponse()`.
