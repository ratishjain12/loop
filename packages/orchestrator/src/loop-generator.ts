import type { Question, UserProfile, RecoveryConfig } from './types'

export interface GenerateLoopOptions {
  profile: UserProfile
  availableQuestions: Question[]
  revisionQuestions: Question[]
  recovery: RecoveryConfig
  today: Date
}

const MEDIAN_MINUTES = 25
const MIN_QUESTIONS = 2
const MAX_QUESTIONS = 6
const MAX_PER_PATTERN = 2

export function generateLoop(options: GenerateLoopOptions): Question[] {
  const { profile, availableQuestions, revisionQuestions, recovery } = options

  const timeBasedMax = Math.floor(profile.dailyTimeMinutes / MEDIAN_MINUTES)
  const normalMax = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, timeBasedMax))
  const cap = recovery.isRecovery
    ? Math.min(recovery.maxQuestions, normalMax)
    : normalMax

  // Revisions go first (Phase 5 will populate these)
  const selected: Question[] = [...revisionQuestions].slice(0, Math.floor(cap / 2))

  // Sort candidates by importance DESC
  const sorted = [...availableQuestions].sort(
    (a, b) => b.importanceScore - a.importanceScore,
  )

  // Seed pattern counts from pre-filled revision questions
  const patternCount: Record<string, number> = {}
  for (const q of selected) {
    patternCount[q.primaryPattern] = (patternCount[q.primaryPattern] ?? 0) + 1
  }
  for (const q of sorted) {
    if (selected.length >= cap) break
    const count = patternCount[q.primaryPattern] ?? 0
    if (count >= MAX_PER_PATTERN) continue
    selected.push(q)
    patternCount[q.primaryPattern] = count + 1
  }

  return selected
}
