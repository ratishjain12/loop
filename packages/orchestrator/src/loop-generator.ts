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
const FALLBACK_POOL_THRESHOLD = 5

// Tighter timelines enforce a higher importance floor so critical questions
// always surface before niche ones. Falls back to full pool when the tier
// is nearly exhausted (user has earned it — they've done the important ones).
function getImportanceFloor(prepMonths: number): number {
  if (prepMonths <= 1) return 8
  if (prepMonths <= 3) return 6
  if (prepMonths <= 6) return 4
  return 1
}

function applyImportanceFloor(questions: Question[], prepMonths: number): Question[] {
  const floor = getImportanceFloor(prepMonths)
  if (floor <= 1) return questions
  const filtered = questions.filter((q) => q.importanceScore >= floor)
  // Graceful fallback: if the high-priority tier is nearly exhausted, open the full pool
  return filtered.length >= FALLBACK_POOL_THRESHOLD ? filtered : questions
}

export function generateLoop(options: GenerateLoopOptions): Question[] {
  const { profile, availableQuestions, revisionQuestions, recovery } = options

  // Hard ceiling: recovery caps take precedence, otherwise MAX_QUESTIONS
  const hardCap = recovery.isRecovery ? recovery.maxQuestions : MAX_QUESTIONS
  // In deep recovery (maxQuestions=1) don't force 2 questions
  const effectiveMin = Math.min(MIN_QUESTIONS, hardCap)

  // Revisions fill first — at most half the hard cap (ceiling), never more than dailyRevisionCap
  const revisionSlot = Math.min(profile.dailyRevisionCap, Math.ceil(hardCap / 2))
  const selected: Question[] = [...revisionQuestions].slice(0, revisionSlot)
  let usedMinutes = selected.reduce((sum, q) => sum + q.estimatedMinutes, 0)

  // Seed pattern diversity from revisions
  const patternCount: Record<string, number> = {}
  for (const q of selected) {
    patternCount[q.primaryPattern] = (patternCount[q.primaryPattern] ?? 0) + 1
  }

  const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 }

  const prioritised = applyImportanceFloor(availableQuestions, profile.prepMonths)
  const sorted = [...prioritised].sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) return b.importanceScore - a.importanceScore
    // Tiebreaker: easier questions first within the same importance tier
    return (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1)
  })

  for (const q of sorted) {
    if (selected.length >= hardCap) break

    const count = patternCount[q.primaryPattern] ?? 0
    if (count >= MAX_PER_PATTERN) continue

    // Once minimum is met, skip questions that would bust the time budget
    if (selected.length >= effectiveMin && usedMinutes + q.estimatedMinutes > profile.dailyTimeMinutes) continue

    selected.push(q)
    usedMinutes += q.estimatedMinutes
    patternCount[q.primaryPattern] = count + 1
  }

  return selected
}
