import type { FeedbackType, RevisionFrequency } from './types'

// Implemented in Phase 4
export function getNextReviewDate(_feedback: FeedbackType, _today: Date): Date {
  return new Date()
}

// Implemented in Phase 5
export function shouldIncludeRevisionToday(
  _revisionFrequency: RevisionFrequency,
  _customDays: number[] | null,
  _today: Date,
): boolean {
  return false
}
