import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { Flame, CheckCircle2, ListChecks } from 'lucide-react'
import { db, userProfiles } from '@loop/db'
import {
  getStreak,
  getTotalCompletedLoops,
  getLast14DaysActivity,
} from '@loop/db/queries/loops'
import { getSolvedByPattern } from '@loop/db/queries/logs'
import { getAllPatterns } from '@loop/db/queries/questions'
import { FocusModeCard } from '@/components/focus-mode-card'
import { formatLocalDate } from '@/lib/date'

export const metadata: Metadata = { title: 'Progress | Loop' }

function formatPattern(pattern: string): string {
  return pattern
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default async function ProgressPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const todayStr = formatLocalDate(new Date())

  const [profile, streak, totalLoops, activity, byPattern, allPatterns] = await Promise.all([
    db.query.userProfiles.findFirst({ where: eq(userProfiles.clerkUserId, userId) }),
    getStreak(userId, todayStr),
    getTotalCompletedLoops(userId),
    getLast14DaysActivity(userId, todayStr),
    getSolvedByPattern(userId),
    getAllPatterns(),
  ])
  if (!profile) redirect('/onboarding')

  const totalSolved = byPattern.reduce((sum, p) => sum + p.count, 0)
  const maxPatternCount = byPattern.length > 0 ? byPattern[0].count : 0

  const stats = [
    { label: 'day streak', value: streak, icon: Flame, accent: '#f59e0b' },
    { label: 'loops completed', value: totalLoops, icon: CheckCircle2, accent: '#22c55e' },
    { label: 'questions solved', value: totalSolved, icon: ListChecks, accent: '#6366f1' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground">Your consistency at a glance.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
            <Icon size={15} strokeWidth={2} style={{ color: accent }} />
            <div className="flex flex-col">
              <span className="text-2xl font-semibold tabular-nums leading-none">{value}</span>
              <span className="text-[11px] text-muted-foreground mt-1.5 leading-tight">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern breakdown */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Pattern Breakdown</h2>
        {byPattern.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions solved yet. Complete your first loop to see your patterns here.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {byPattern.map(({ pattern, count }) => (
              <div key={pattern} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-muted-foreground">
                  {formatPattern(pattern)}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-foreground/80"
                    style={{ width: `${maxPatternCount > 0 ? (count / maxPatternCount) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last 14 days */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Last 14 days</h2>
        <div className="flex flex-wrap gap-1.5">
          {activity.map(({ date, completed }) => (
            <div
              key={date}
              title={date}
              className={`h-6 w-6 rounded-md ${completed ? 'bg-foreground/80' : 'bg-muted'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-foreground/80" /> complete
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-muted" /> missed
          </span>
        </div>
      </div>

      {/* Focus mode */}
      <FocusModeCard patterns={allPatterns} currentFocus={profile.focusPattern} />
    </div>
  )
}
