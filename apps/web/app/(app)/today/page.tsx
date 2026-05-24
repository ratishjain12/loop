import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq, inArray } from 'drizzle-orm'
import { Trophy } from 'lucide-react'
import { db, userProfiles, questions as questionsTable } from '@loop/db'
import { getTodaysLoop, getLastLoopDate, insertDailyLoop } from '@loop/db/queries/loops'
import { getAttemptedQuestionIds, getAvailableQuestions } from '@loop/db/queries/questions'
import { getDueRevisions } from '@loop/db/queries/logs'
import { detectRecovery, generateLoop, shouldIncludeRevisionToday } from '@loop/orchestrator'
import { TodayLoop } from '@/components/today-loop'
import { formatLocalDate } from '@/lib/date'

export const metadata: Metadata = { title: "Today's Loop | Loop" }

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

const VALID_LEVELS       = ['beginner', 'intermediate', 'advanced'] as const
const VALID_FREQUENCIES  = ['daily', 'alternate', 'weekend', 'custom'] as const
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

type Level      = typeof VALID_LEVELS[number]
type Frequency  = typeof VALID_FREQUENCIES[number]
type Difficulty = typeof VALID_DIFFICULTIES[number]

export default async function TodayPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const now   = new Date()
  const today = formatLocalDate(now)

  // ── Return existing loop if already generated today ──
  const existing = await getTodaysLoop(userId, today)
  if (existing) {
    const [rows, existingDueRevisions] = await Promise.all([
      existing.questionIds.length
        ? db.select().from(questionsTable).where(inArray(questionsTable.id, existing.questionIds))
        : Promise.resolve([]),
      getDueRevisions(userId, today),
    ])

    const questions = existing.questionIds
      .map((id) => rows.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => q !== undefined)
      .filter((q): q is typeof q & { difficulty: Difficulty } =>
        (VALID_DIFFICULTIES as readonly string[]).includes(q.difficulty),
      )

    const existingRevisionIds = existingDueRevisions.map((r) => r.id)

    return (
      <TodayLoop
        loop={existing}
        questions={questions.map((q) => ({
          id: q.id,
          title: q.title,
          link: q.link,
          difficulty: q.difficulty,
          primaryPattern: q.primaryPattern,
          estimatedMinutes: q.estimatedMinutes,
          importanceScore: q.importanceScore,
        }))}
        revisionIds={existingRevisionIds}
        recovery={null}
        formattedDate={formatDate(now)}
      />
    )
  }

  // ── Generate a new loop ──────────────────────────────
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.clerkUserId, userId),
  })
  if (!profile) redirect('/onboarding')

  const lastLoopDate = await getLastLoopDate(userId)
  const recovery = detectRecovery(
    lastLoopDate,
    now,
    profile.adaptiveUntil ? new Date(profile.adaptiveUntil) : null,
  )

  const level: Level = (VALID_LEVELS as readonly string[]).includes(profile.level)
    ? (profile.level as Level)
    : 'intermediate'

  const revisionFrequency: Frequency = (VALID_FREQUENCIES as readonly string[]).includes(
    profile.revisionFrequency,
  )
    ? (profile.revisionFrequency as Frequency)
    : 'daily'

  // ── Pull due revisions if frequency allows ───────────
  const includeRevisions = shouldIncludeRevisionToday(
    revisionFrequency,
    profile.customDays ?? null,
    now,
  )
  const dueRevisions = includeRevisions ? await getDueRevisions(userId, today) : []

  const attemptedIds = await getAttemptedQuestionIds(userId)
  const candidates   = await getAvailableQuestions(profile.level, attemptedIds)

  const selected = generateLoop({
    profile: {
      clerkUserId: profile.clerkUserId,
      level,
      dailyTimeMinutes: profile.dailyTimeMinutes,
      revisionFrequency,
      customDays: profile.customDays ?? null,
      focusPattern: profile.focusPattern ?? null,
    },
    availableQuestions: candidates
      .filter((q) => (VALID_DIFFICULTIES as readonly string[]).includes(q.difficulty))
      .map((q) => ({
        id: q.id,
        title: q.title,
        link: q.link,
        difficulty: q.difficulty as Difficulty,
        primaryPattern: q.primaryPattern,
        secondaryPatterns: q.secondaryPatterns ?? [],
        importanceScore: q.importanceScore,
        estimatedMinutes: q.estimatedMinutes,
      })),
    revisionQuestions: dueRevisions.map((r) => ({
      id: r.id,
      title: r.title,
      link: r.link,
      difficulty: r.difficulty as Difficulty,
      primaryPattern: r.primaryPattern,
      secondaryPatterns: r.secondaryPatterns,
      importanceScore: r.importanceScore,
      estimatedMinutes: r.estimatedMinutes,
    })),
    recovery,
    today: now,
  })

  // ── All questions exhausted ──────────────────────────
  if (selected.length === 0) {
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

  const loop = await insertDailyLoop({
    clerkUserId: userId,
    date: today,
    questionIds: selected.map((q) => q.id),
  })

  if (!loop) redirect('/today')

  const revisionIds = dueRevisions.map((r) => r.id)

  return (
    <TodayLoop
      loop={loop}
      questions={selected.map((q) => ({
        id: q.id,
        title: q.title,
        link: q.link,
        difficulty: q.difficulty,
        primaryPattern: q.primaryPattern,
        estimatedMinutes: q.estimatedMinutes,
        importanceScore: q.importanceScore,
      }))}
      revisionIds={revisionIds}
      recovery={recovery}
      formattedDate={formatDate(now)}
    />
  )
}
