import type { Question, UserProfile, RecoveryConfig } from './types'
import { buildPlan } from './syllabus'

export interface GenerateLoopOptions {
  profile: UserProfile
  availableQuestions: Question[] // unseen, already level-filtered
  revisionQuestions: Question[] // due for revision today
  recovery: RecoveryConfig
  today: Date
  patternProgress?: Record<string, number> // distinct questions already solved, per primary pattern
  daysRemaining?: number // from target_date if set, else prep_months × 30
}

const MIN_QUESTIONS = 2
const MAX_QUESTIONS = 6
const AVG_Q_MINUTES = 25
const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 }

// Progressive order: easier first (build the schema), higher importance to break ties.
function progressive(a: Question, b: Question): number {
  const d = (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1)
  if (d !== 0) return d
  return b.importanceScore - a.importanceScore
}

/**
 * Timeline-driven daily loop.
 *
 * Shape: due revisions first (interleaved old patterns — retention), then new
 * questions drawn from the *earliest unfinished pattern in the curriculum spine*
 * (blocked within a pattern for a few days — low-load learning of something new).
 *
 * The timeline (daysRemaining) shapes the curriculum via buildPlan: tight
 * timelines trim to the high-value core; generous ones expand toward the full
 * bank. Each loop then fills to the comfortable time-based capacity.
 */
export function generateLoop(options: GenerateLoopOptions): Question[] {
  const {
    profile,
    availableQuestions,
    revisionQuestions,
    recovery,
    patternProgress = {},
    daysRemaining,
  } = options

  // Hard ceiling: recovery / adaptive window impose a finite cap, else MAX_QUESTIONS.
  const hardCap = recovery.isRecovery || recovery.isAdaptive ? recovery.maxQuestions : MAX_QUESTIONS
  const effectiveMin = Math.min(MIN_QUESTIONS, hardCap)

  // Revisions fill first, capped by dailyRevisionCap and half the hard cap.
  const revisionSlot = Math.min(profile.dailyRevisionCap, Math.ceil(hardCap / 2))
  const selected: Question[] = [...revisionQuestions].slice(0, revisionSlot)
  const used = new Set(selected.map((q) => q.id))
  let usedMinutes = selected.reduce((sum, q) => sum + q.estimatedMinutes, 0)

  const revisionsAdded = selected.length
  const newSlots = hardCap - revisionsAdded
  if (newSlots <= 0) return selected

  // Comfortable, time-based capacity for new questions (keeps loop size stable).
  const timeCapacity = Math.max(1, Math.floor(profile.dailyTimeMinutes / AVG_Q_MINUTES))
  const dailyNewCapacity = Math.min(newSlots, timeCapacity)

  // Group unseen questions by pattern, each in progressive (easy→hard) order.
  const availableByPattern: Record<string, Question[]> = {}
  for (const q of availableQuestions) {
    ;(availableByPattern[q.primaryPattern] ??= []).push(q)
  }
  for (const p in availableByPattern) availableByPattern[p].sort(progressive)

  // Questions that exist per pattern for this user = already-solved + still-unseen.
  const totalByPattern: Record<string, number> = {}
  for (const p in patternProgress) totalByPattern[p] = patternProgress[p]
  for (const p in availableByPattern) {
    totalByPattern[p] = (patternProgress[p] ?? 0) + availableByPattern[p].length
  }

  const effectiveDays =
    daysRemaining && daysRemaining > 0 ? daysRemaining : Math.max(1, profile.prepMonths * 30)
  const plan = buildPlan({ totalByPattern, daysRemaining: effectiveDays, dailyNewCapacity })

  const newTarget = dailyNewCapacity
  const perPatternTaken: Record<string, number> = {}
  const newCount = () => selected.length - revisionsAdded

  // Add a question if there's room, budget allows, and it's not already picked.
  function take(q: Question): boolean {
    if (used.has(q.id)) return false
    if (newCount() >= newTarget) return false
    // Once the minimum loop is met, don't bust the daily time budget.
    if (selected.length >= effectiveMin && usedMinutes + q.estimatedMinutes > profile.dailyTimeMinutes) {
      return false
    }
    selected.push(q)
    used.add(q.id)
    usedMinutes += q.estimatedMinutes
    perPatternTaken[q.primaryPattern] = (perPatternTaken[q.primaryPattern] ?? 0) + 1
    return true
  }

  // Focus mode: intentionally over-index on the chosen pattern (~70% of new),
  // beyond its normal depth target. The remaining slots come from the plan below.
  if (profile.focusPattern && availableByPattern[profile.focusPattern]) {
    const focusQuota = Math.ceil(newTarget * 0.7)
    for (const q of availableByPattern[profile.focusPattern]) {
      if (newCount() >= focusQuota) break
      take(q)
    }
  }

  // Walk the curriculum in order, filling from the earliest pattern not yet at its
  // depth target. This keeps the user on a pattern for a few days, then advances.
  for (const entry of plan.entries) {
    if (newCount() >= newTarget) break
    const solved = patternProgress[entry.pattern] ?? 0
    const candidates = availableByPattern[entry.pattern] ?? []
    for (const q of candidates) {
      if (newCount() >= newTarget) break
      if (solved + (perPatternTaken[entry.pattern] ?? 0) >= entry.depthTarget) break
      take(q)
    }
  }

  return selected
}
