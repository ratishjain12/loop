import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, userProfiles, questions as questionsTable } from '@loop/db'
import { getTodaysLoop, getLastLoopDate, insertDailyLoop } from '@loop/db/queries/loops'
import { getAttemptedQuestionIds, getAvailableQuestions } from '@loop/db/queries/questions'
import { getDueRevisions } from '@loop/db/queries/logs'
import { detectRecovery, generateLoop } from '@loop/orchestrator'
import { eq, inArray } from 'drizzle-orm'
import { formatLocalDate } from '@/lib/date'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = formatLocalDate(new Date())

  // Return existing loop for today if already generated
  const existing = await getTodaysLoop(userId, today)
  if (existing) {
    const qs = existing.questionIds.length
      ? await db.select().from(questionsTable).where(inArray(questionsTable.id, existing.questionIds))
      : []
    // Preserve the original order
    const ordered = existing.questionIds
      .map((id) => qs.find((q) => q.id === id))
      .filter(Boolean)
    return NextResponse.json({ loop: existing, questions: ordered, recovery: null })
  }

  // Fetch profile
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.clerkUserId, userId),
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Recovery detection
  const lastLoopDate = await getLastLoopDate(userId)
  const recovery = detectRecovery(
    lastLoopDate,
    new Date(),
    profile.adaptiveUntil ? new Date(profile.adaptiveUntil) : null,
  )

  // Build candidate pool
  const attemptedIds = await getAttemptedQuestionIds(userId)
  const candidates = await getAvailableQuestions(profile.level, attemptedIds)

  const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
  const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

  type Level = typeof VALID_LEVELS[number]
  type Difficulty = typeof VALID_DIFFICULTIES[number]

  const level: Level = (VALID_LEVELS as readonly string[]).includes(profile.level)
    ? profile.level as Level
    : 'intermediate'

  // Always fetch due revisions — the cap controls how many appear, not which days
  const now = new Date()
  const dueRevisions = await getDueRevisions(userId, today, profile.dailyRevisionCap ?? 2)

  // Generate the loop
  const selected = generateLoop({
    profile: {
      clerkUserId: profile.clerkUserId,
      level,
      dailyTimeMinutes: profile.dailyTimeMinutes,
      dailyRevisionCap: profile.dailyRevisionCap ?? 2,
      prepMonths: profile.prepMonths,
      focusPattern: profile.focusPattern,
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

  if (selected.length === 0) {
    return NextResponse.json({ loop: null, questions: [], allDone: true, recovery })
  }

  const loop = await insertDailyLoop({
    clerkUserId: userId,
    date: today,
    questionIds: selected.map((q) => q.id),
  })

  if (!loop) {
    return NextResponse.json({ error: 'Failed to create loop' }, { status: 500 })
  }

  const revisionIds = dueRevisions.map((r) => r.id)
  return NextResponse.json({ loop, questions: selected, recovery, revisionIds })
}
