import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { getUpcomingRevisions } from '@loop/db/queries/logs'
import { formatLocalDate } from '@/lib/date'

export const metadata: Metadata = { title: 'Revision | Loop' }

const DIFFICULTY_COLORS = {
  easy:   { text: '#22c55e', bg: 'rgba(34,197,94,0.08)'  },
  medium: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  hard:   { text: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
}

const FEEDBACK_LABELS: Record<string, string> = {
  easy:          'Easy',
  needed_hint:   'Needed hint',
  struggled:     'Struggled',
  couldnt_solve: "Couldn't solve",
  revisit_later: 'Revisit later',
}

function formatPattern(pattern: string): string {
  return pattern
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function dayLabel(dateStr: string, todayStr: string): string {
  const diff = Math.round(
    (new Date(dateStr).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff} days`
}

export default async function RevisionPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const now = new Date()
  const todayStr = formatLocalDate(now)
  const plusSeven = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  const plusSevenStr = formatLocalDate(plusSeven)

  const revisions = await getUpcomingRevisions(userId, todayStr, plusSevenStr)

  // Group by date
  const grouped = new Map<string, typeof revisions>()
  for (const r of revisions) {
    const bucket = grouped.get(r.nextReviewAt) ?? []
    bucket.push(r)
    grouped.set(r.nextReviewAt, bucket)
  }
  const sortedDates = [...grouped.keys()].sort()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Revision Queue</h1>
        <p className="text-sm text-muted-foreground">Questions scheduled for review in the next 7 days.</p>
      </div>

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <CheckCircle2 size={18} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No revisions scheduled</p>
            <p className="text-xs text-muted-foreground mt-0.5">You&apos;re up to date — keep completing daily loops to build your queue.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedDates.map((dateStr) => {
            const items = grouped.get(dateStr)!
            const label = dayLabel(dateStr, todayStr)

            return (
              <div key={dateStr} className="flex flex-col gap-2">
                {/* Day header */}
                <div className="flex items-center gap-2">
                  <CalendarClock size={13} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{dateStr}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {items.map((r) => {
                    const diff = r.difficulty as keyof typeof DIFFICULTY_COLORS
                    const color = DIFFICULTY_COLORS[diff] ?? DIFFICULTY_COLORS.medium

                    return (
                      <div
                        key={r.id}
                        className="flex items-start gap-4 rounded-lg border bg-card px-5 py-4"
                        style={{ borderLeftWidth: '3px', borderLeftColor: color.text }}
                      >
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug text-foreground">{r.title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize"
                              style={{ color: color.text, background: color.bg }}
                            >
                              {r.difficulty}
                            </span>
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono bg-muted text-muted-foreground">
                              {formatPattern(r.primaryPattern)}
                            </span>
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                              Last: {FEEDBACK_LABELS[r.lastFeedback] ?? r.lastFeedback}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
