import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq, inArray } from 'drizzle-orm'
import { Trophy, AlertTriangle, Clock, Zap } from 'lucide-react'
import { db, userProfiles, questions as questionsTable } from '@loop/db'
import { getTodaysLoop, getLastLoopDate, insertDailyLoop } from '@loop/db/queries/loops'
import { getAttemptedQuestionIds, getAvailableQuestions } from '@loop/db/queries/questions'
import { detectRecovery, generateLoop } from '@loop/orchestrator'
import { Progress } from '@/components/ui/progress'
import { QuestionCard } from '@/components/question-card'

export const metadata: Metadata = { title: "Today's Loop | Loop" }

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

type QuestionRow = {
  id: string
  title: string
  link: string
  difficulty: string
  primaryPattern: string
  estimatedMinutes: number
  importanceScore: number
}

export default async function TodayPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const today = new Date().toISOString().split('T')[0]

  let loop: Awaited<ReturnType<typeof getTodaysLoop>> | Awaited<ReturnType<typeof insertDailyLoop>> | undefined
  let questions: QuestionRow[] = []
  let recovery: ReturnType<typeof detectRecovery> | null = null
  let allDone = false

  // ── Return existing loop or generate a new one ───────
  const existing = await getTodaysLoop(userId, today)
  if (existing) {
    loop = existing
    if (existing.questionIds.length > 0) {
      const rows = await db
        .select()
        .from(questionsTable)
        .where(inArray(questionsTable.id, existing.questionIds))
      // Preserve original order
      questions = existing.questionIds
        .map((id) => rows.find((q) => q.id === id))
        .filter((q): q is NonNullable<typeof q> => q !== undefined)
    }
  } else {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.clerkUserId, userId),
    })
    if (!profile) redirect('/onboarding')

    const lastLoopDate = await getLastLoopDate(userId)
    recovery = detectRecovery(
      lastLoopDate,
      new Date(),
      profile.adaptiveUntil ? new Date(profile.adaptiveUntil) : null,
    )

    const attemptedIds = await getAttemptedQuestionIds(userId)
    const candidates = await getAvailableQuestions(profile.level, attemptedIds)

    const selected = generateLoop({
      profile: {
        clerkUserId: profile.clerkUserId,
        level: profile.level as 'beginner' | 'intermediate' | 'advanced',
        dailyTimeMinutes: profile.dailyTimeMinutes,
        revisionFrequency: profile.revisionFrequency as 'daily' | 'alternate' | 'weekend' | 'custom',
        customDays: profile.customDays,
        focusPattern: profile.focusPattern,
      },
      availableQuestions: candidates.map((q) => ({
        id: q.id, title: q.title, link: q.link,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        primaryPattern: q.primaryPattern,
        secondaryPatterns: q.secondaryPatterns ?? [],
        importanceScore: q.importanceScore,
        estimatedMinutes: q.estimatedMinutes,
      })),
      revisionQuestions: [],
      recovery,
      today: new Date(),
    })

    if (selected.length === 0) {
      allDone = true
    } else {
      loop = await insertDailyLoop({
        clerkUserId: userId,
        date: today,
        questionIds: selected.map((q) => q.id),
      })
      questions = selected
    }
  }

  const completedIds = new Set(loop && 'completedIds' in loop ? (loop.completedIds ?? []) : [])
  const completedCount = completedIds.size
  const totalCount = questions.length
  const totalMinutes = questions.reduce((sum, q) => sum + q.estimatedMinutes, 0)
  const isLoopComplete = loop && 'status' in loop && loop.status === 'complete'
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // ── All questions exhausted ───────────────────────────
  if (allDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Trophy size={22} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold">All caught up</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;ve attempted every question in the bank. More coming soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Recovery banner */}
      {recovery?.isRecovery && (
        <div
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-sm" style={{ color: '#f59e0b' }}>
            Welcome back — keeping it light today to rebuild momentum.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Today&apos;s Loop</h1>
          {isLoopComplete && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
            >
              <Zap size={11} fill="currentColor" /> Complete
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
      </div>

      {/* Stats + progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            ~{totalMinutes} min
          </span>
          <span>{completedCount} of {totalCount} done</span>
        </div>
        <Progress value={progressPct} className="h-1" />
      </div>

      {/* Loop complete banner */}
      {isLoopComplete && (
        <div
          className="flex items-center gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}
        >
          <Trophy size={15} className="shrink-0" style={{ color: '#22c55e' }} />
          <p className="text-sm" style={{ color: '#22c55e' }}>
            Loop complete — great work. See you tomorrow.
          </p>
        </div>
      )}

      {/* Question list */}
      <div className="flex flex-col gap-2">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={{
              id: q.id,
              title: q.title,
              link: q.link,
              difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
              primaryPattern: q.primaryPattern,
              estimatedMinutes: q.estimatedMinutes,
              importanceScore: q.importanceScore,
            }}
            isCompleted={completedIds.has(q.id)}
          />
        ))}
      </div>
    </div>
  )
}
