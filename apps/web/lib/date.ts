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
