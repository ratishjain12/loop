import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, userProfiles, questions as questionsTable } from '@loop/db'
import { getTodaysLoop, getLastLoopDate, insertDailyLoop } from '@loop/db/queries/loops'
import { getAttemptedQuestionIds, getAvailableQuestions } from '@loop/db/queries/questions'
import { detectRecovery, generateLoop } from '@loop/orchestrator'
import { eq, inArray } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

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
  const VALID_FREQUENCIES = ['daily', 'alternate', 'weekend', 'custom'] as const
  const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const

  type Level = typeof VALID_LEVELS[number]
  type Frequency = typeof VALID_FREQUENCIES[number]
  type Difficulty = typeof VALID_DIFFICULTIES[number]

  const level: Level = (VALID_LEVELS as readonly string[]).includes(profile.level)
    ? profile.level as Level
    : 'intermediate'

  const revisionFrequency: Frequency = (VALID_FREQUENCIES as readonly string[]).includes(profile.revisionFrequency)
    ? profile.revisionFrequency as Frequency
    : 'daily'

  // Generate the loop
  const selected = generateLoop({
    profile: {
      clerkUserId: profile.clerkUserId,
      level,
      dailyTimeMinutes: profile.dailyTimeMinutes,
      revisionFrequency,
      customDays: profile.customDays,
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
    revisionQuestions: [],
    recovery,
    today: new Date(),
  })

  if (selected.length === 0) {
    return NextResponse.json({ loop: null, questions: [], allDone: true, recovery })
  }

  const loop = await insertDailyLoop({
    clerkUserId: userId,
    date: today,
    questionIds: selected.map((q) => q.id),
  })

  return NextResponse.json({ loop, questions: selected, recovery })
}
