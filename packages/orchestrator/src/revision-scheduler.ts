import type { FeedbackType } from './types'

const REVIEW_OFFSETS: Record<FeedbackType, number> = {
  easy: 7,
  needed_hint: 3,
  struggled: 1,
  couldnt_solve: 1,
  revisit_later: 5,
}

// Construct at local midnight (no UTC shift) then add offset days
export function getNextReviewDate(feedback: FeedbackType, today: Date): Date {
  const next = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  next.setDate(next.getDate() + REVIEW_OFFSETS[feedback])
  return next
}

// Consecutive 'easy' passes needed before a question retires from revision.
export const MASTERY_THRESHOLD = 4

/**
 * How much to decay a returning user's mastery after an absence — memory fades,
 * so review streaks should too. Longer gaps knock more off the streak (and, at
 * the extreme, fully un-master everything so it must be re-earned). Below a month
 * we don't decay at all — recovery mode already handles short breaks.
 */
export function masteryDecaySteps(gapDays: number): number {
  if (gapDays < 30) return 0
  if (gapDays < 90) return 1
  if (gapDays < 180) return 2
  return MASTERY_THRESHOLD // half a year away → mastery reset, relearn from scratch
}

export interface ReviewOutcome {
  nextReviewDate: Date
  stage: number // consecutive-easy streak after this review
  mastered: boolean // true once the question graduates out of the queue
}

/**
 * Graduating spaced-repetition schedule with retirement.
 *
 * A per-question "mastery streak" (stage) counts consecutive easy passes. Each
 * easy pass roughly doubles the interval (7 → 14 → 28 → 56 days), so well-known
 * questions surface less and less; after MASTERY_THRESHOLD easy passes the
 * question is mastered and stops appearing. Any struggle resets the streak to 0
 * and pulls the review back in; hint/revisit hold the streak without advancing.
 *
 * This is what stops the revision queue from growing without bound — the core
 * reason a long-running user keeps finding the daily loop meaningful.
 */
export function scheduleReview(feedback: FeedbackType, prevStage: number, today: Date): ReviewOutcome {
  const priorEasies = Math.max(0, prevStage)

  let stage: number
  switch (feedback) {
    case 'easy':
      stage = priorEasies + 1
      break
    case 'needed_hint':
    case 'revisit_later':
      stage = priorEasies // hold — no mastery progress, but don't punish
      break
    case 'struggled':
    case 'couldnt_solve':
    default:
      stage = 0 // reset the streak, bring the review back soon
      break
  }

  const mastered = feedback === 'easy' && stage >= MASTERY_THRESHOLD

  // Easy stretches the interval with each prior easy pass; everything else uses
  // its flat base offset (bringing struggled/couldnt_solve back tomorrow).
  const intervalDays =
    feedback === 'easy'
      ? REVIEW_OFFSETS.easy * Math.pow(2, priorEasies) // 7, 14, 28, 56, …
      : REVIEW_OFFSETS[feedback]

  const next = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  next.setDate(next.getDate() + intervalDays)
  return { nextReviewDate: next, stage, mastered }
}
