# Loop — Remaining Work

Status: V1 (spec Phases 1–7) complete, plus timeline-driven engine, settings + target date, graduating-interval revision, memory decay, and the generation-logic dedup. What's left below.

## Close-in loose ends
- [ ] **Countdown banner** — `target_date` is stored and paces the engine, but nothing surfaces "58 days left." Add a nav/Today banner + an "on track / behind" signal (inputs already exist: `daysRemaining`, pacing, `patternProgress`).
- [ ] **Mastery/decay UI signal** — retirement and resurfacing happen silently. Show a "mastered" count on Progress and/or a small "you mastered X" moment on completion (`/api/loop/complete` already returns `mastered`).
- [ ] **In-app end-to-end verification** — everything so far is logic + build/typecheck verified only, never driven against real Clerk/Supabase. Walk: onboarding w/ date, settings save, tight-timeline loop skews to core, returning-user decay, mastery retirement.

## Engineering health
- [ ] **Orchestrator test suite** — pure functions are now intricate (syllabus trim/expand, decay ladder, mastery transitions, recovery tiers). Needs a tooling decision (vitest scoped to `packages/orchestrator` + a turbo `test` task); project currently uses `tsc` as the only check.
- [ ] Decide fate of `GET /api/loop/generate` — now a thin wrapper over `resolveTodayLoop` and still unused by the client. Keep as public API or remove.

## Post-V1 roadmap (from plan.md)
- [ ] **Interview Countdown Mode** — day-by-day plan + banner + on-track/behind. Partially enabled by `target_date`/pacing; needs the visible layer. Highest-retention feature per PRD.
- [ ] **Readiness Score** — 0–100 from pattern coverage + feedback distribution + revision performance + streak, with per-pattern strong/weak/not-started. All inputs now exist. The "aha" feature.
- [ ] **Company Focus Mode** — bias selection toward a company's favored patterns (Amazon→arrays/trees, Google→graphs/DP). Small given focus + syllabus machinery already exists.

## Product ideas not yet built
- [ ] **Quick vs Deep revision sessions** — currently uniform; no light-weekday vs deep-weekend distinction.
- [ ] **Richer focus modes** — spec named "Revision Sprint / Easy Week / Interview Prep Week"; only single-pattern focus exists today.

## Deliberately deferred
- [ ] **Explicit "start a new prep / reset" action** — auto-decay covers most returning-user needs non-destructively; a destructive wipe is high-regret, low-value. Revisit only if users ask for a visible fresh start.

## Suggested order
1. Countdown banner (finishes `target_date`, high value / low effort)
2. Readiness Score (differentiator; inputs ready)
3. Orchestrator test suite (before more engine changes)
4. Company Focus / Quick-vs-Deep revision (polish)
