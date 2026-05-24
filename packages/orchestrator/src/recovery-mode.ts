import type { RecoveryConfig } from './types'

export function detectRecovery(
  lastLoopDate: Date | null,
  today: Date,
  adaptiveUntil?: Date | null,
): RecoveryConfig {
  if (!lastLoopDate) {
    return { isRecovery: false, missedDays: 0, maxQuestions: Infinity, isAdaptive: false }
  }

  const todayNorm = new Date(today)
  todayNorm.setHours(0, 0, 0, 0)
  const lastNorm = new Date(lastLoopDate)
  lastNorm.setHours(0, 0, 0, 0)

  // diffDays=1 means yesterday — no missed days
  const diffDays = Math.round(
    (todayNorm.getTime() - lastNorm.getTime()) / (1000 * 60 * 60 * 24),
  )
  const missedDays = Math.max(0, diffDays - 1)

  const isAdaptive = adaptiveUntil
    ? todayNorm <= new Date(adaptiveUntil)
    : false

  if (missedDays <= 1) {
    return { isRecovery: false, missedDays, maxQuestions: Infinity, isAdaptive }
  }
  if (missedDays <= 3) {
    return { isRecovery: true, missedDays, maxQuestions: 2, isAdaptive }
  }
  return { isRecovery: true, missedDays, maxQuestions: 1, isAdaptive }
}
