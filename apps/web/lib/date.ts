/**
 * Format a Date as a YYYY-MM-DD string using local calendar components,
 * avoiding UTC-shift issues that toISOString().split('T')[0] causes in
 * non-UTC timezones.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Days until the user's interview target, for timeline-driven pacing.
 * Uses the explicit target date when set (YYYY-MM-DD), otherwise falls back to
 * the coarse prep-months estimate. Always at least 1.
 */
export function daysRemaining(targetDate: string | null, prepMonths: number, today: Date): number {
  if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    const [y, m, d] = targetDate.split('-').map(Number)
    const target = new Date(y, m - 1, d)
    const base = new Date(today)
    base.setHours(0, 0, 0, 0)
    const diff = Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff)
  }
  return Math.max(1, prepMonths * 30)
}
