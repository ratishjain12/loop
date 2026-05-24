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
