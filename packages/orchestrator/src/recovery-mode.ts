import type { RecoveryConfig } from './types'

// Implemented in Phase 3
export function detectRecovery(
  _lastLoopDate: Date | null,
  _today: Date,
  _adaptiveUntil?: Date | null,
): RecoveryConfig {
  return { isRecovery: false, missedDays: 0, maxQuestions: Infinity, isAdaptive: false }
}
