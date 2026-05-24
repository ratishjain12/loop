import type { FeedbackType, RevisionFrequency } from './types'

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

export function shouldIncludeRevisionToday(
  revisionFrequency: RevisionFrequency,
  customDays: number[] | null,
  today: Date,
): boolean {
  const dow = today.getDay() // 0=Sun … 6=Sat
  switch (revisionFrequency) {
    case 'daily':
      return true
    case 'alternate': {
      const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24))
      return daysSinceEpoch % 2 === 0
    }
    case 'weekend':
      return dow === 0 || dow === 6
    case 'custom':
      return customDays?.includes(dow) ?? false
  }
}
