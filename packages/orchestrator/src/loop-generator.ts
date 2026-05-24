import type { Question, UserProfile, RecoveryConfig } from './types'

export interface GenerateLoopOptions {
  profile: UserProfile
  availableQuestions: Question[]
  revisionQuestions: Question[]
  recovery: RecoveryConfig
  today: Date
}

const MIN_QUESTIONS = 2
const MAX_QUESTIONS = 6
const MAX_PER_PATTERN = 2
const MAX_REVISION_SLOT = 2

export function generateLoop(options: GenerateLoopOptions): Question[] {
  const { profile, availableQuestions, revisionQuestions, recovery } = options

  // Hard ceiling: recovery caps take precedence, otherwise MAX_QUESTIONS
  const hardCap = recovery.isRecovery ? recovery.maxQuestions : MAX_QUESTIONS
  // In deep recovery (maxQuestions=1) don't force 2 questions
  const effectiveMin = Math.min(MIN_QUESTIONS, hardCap)

  // Revisions fill first — at most half the hard cap (ceiling), never more than 2
  const revisionSlot = Math.min(MAX_REVISION_SLOT, Math.ceil(hardCap / 2))
  const selected: Question[] = [...revisionQuestions].slice(0, revisionSlot)
  let usedMinutes = selected.reduce((sum, q) => sum + q.estimatedMinutes, 0)

  // Seed pattern diversity from revisions
  const patternCount: Record<string, number> = {}
  for (const q of selected) {
    patternCount[q.primaryPattern] = (patternCount[q.primaryPattern] ?? 0) + 1
  }

  const sorted = [...availableQuestions].sort((a, b) => b.importanceScore - a.importanceScore)

  for (const q of sorted) {
    if (selected.length >= hardCap) break
    // Stop once the time budget is met and we have the minimum question count
    if (usedMinutes >= profile.dailyTimeMinutes && selected.length >= effectiveMin) break

    const count = patternCount[q.primaryPattern] ?? 0
    if (count >= MAX_PER_PATTERN) continue

    selected.push(q)
    usedMinutes += q.estimatedMinutes
    patternCount[q.primaryPattern] = count + 1
  }

  return selected
}
