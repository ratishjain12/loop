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

  // Adaptive window: a 7+ day gap earlier set adaptive_until into the future.
  // While it lasts, load is capped (2/day) regardless of recent activity — this
  // takes precedence over the missed-day tiers so momentum rebuilds gently.
  if (adaptiveUntil) {
    const until = new Date(adaptiveUntil)
    until.setHours(0, 0, 0, 0)
    if (todayNorm <= until) {
      return { isRecovery: false, missedDays: 0, maxQuestions: 2, isAdaptive: true }
    }
  }

  const lastNorm = new Date(lastLoopDate)
  lastNorm.setHours(0, 0, 0, 0)

  // diffDays=1 means yesterday — no missed days
  const diffDays = Math.round(
    (todayNorm.getTime() - lastNorm.getTime()) / (1000 * 60 * 60 * 24),
  )
  const missedDays = Math.max(0, diffDays - 1)

  if (missedDays <= 1) {
    return { isRecovery: false, missedDays, maxQuestions: Infinity, isAdaptive: false }
  }
  if (missedDays <= 3) {
    return { isRecovery: true, missedDays, maxQuestions: 2, isAdaptive: false }
  }
  if (missedDays <= 6) {
    return { isRecovery: true, missedDays, maxQuestions: 1, isAdaptive: false }
  }
  // 7+ days missed: deep recovery, and trigger the adaptive window going forward
  return { isRecovery: true, missedDays, maxQuestions: 1, isAdaptive: true }
}
