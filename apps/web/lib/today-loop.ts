import { eq, inArray } from 'drizzle-orm'
import { db, userProfiles, questions as questionsTable } from '@loop/db'
import { dailyLoops } from '@loop/db/schema'
import { getTodaysLoop, getLastLoopDate, insertDailyLoop } from '@loop/db/queries/loops'
import { getAttemptedQuestionIds, getAvailableQuestions } from '@loop/db/queries/questions'
import { getDueRevisions, getSolvedByPattern, applyMemoryDecay } from '@loop/db/queries/logs'
import { detectRecovery, generateLoop, masteryDecaySteps } from '@loop/orchestrator'
import type { RecoveryConfig } from '@loop/orchestrator'
import { formatLocalDate, daysRemaining } from './date'

const VALID_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'] as const
type Level = (typeof VALID_LEVELS)[number]
type Difficulty = (typeof VALID_DIFFICULTIES)[number]

type DailyLoop = typeof dailyLoops.$inferSelect

export interface LoopQuestion {
  id: string
  title: string
  link: string
  difficulty: Difficulty
  primaryPattern: string
  estimatedMinutes: number
  importanceScore: number
}

export interface TodayLoopResult {
  status: 'ready' | 'all_done' | 'no_profile'
  loop: DailyLoop | null
  questions: LoopQuestion[]
  revisionIds: string[]
  recovery: RecoveryConfig | null
}

function orderQuestions(ids: string[], rows: (typeof questionsTable.$inferSelect)[]): LoopQuestion[] {
  return ids
    .map((id) => rows.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => q !== undefined)
    .filter((q) => (VALID_DIFFICULTIES as readonly string[]).includes(q.difficulty))
    .map((q) => ({
      id: q.id,
      title: q.title,
      link: q.link,
      difficulty: q.difficulty as Difficulty,
      primaryPattern: q.primaryPattern,
      estimatedMinutes: q.estimatedMinutes,
      importanceScore: q.importanceScore,
    }))
}

async function reuseExisting(
  loop: DailyLoop,
  userId: string,
  today: string,
  recovery: RecoveryConfig | null,
): Promise<TodayLoopResult> {
  const [rows, dueRevisions] = await Promise.all([
    loop.questionIds.length
      ? db.select().from(questionsTable).where(inArray(questionsTable.id, loop.questionIds))
      : Promise.resolve([]),
    getDueRevisions(userId, today, 3),
  ])
  return {
    status: 'ready',
    loop,
    questions: orderQuestions(loop.questionIds, rows),
    revisionIds: dueRevisions.map((r) => r.id),
    recovery,
  }
}

// Single source of truth for "what is today's loop" — used by both the Today
// page (server render) and GET /api/loop/generate. Idempotent per day.
export async function resolveTodayLoop(userId: string, now: Date): Promise<TodayLoopResult> {
  const today = formatLocalDate(now)

  const existing = await getTodaysLoop(userId, today)
  if (existing) return reuseExisting(existing, userId, today, null)

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.clerkUserId, userId),
  })
  if (!profile) {
    return { status: 'no_profile', loop: null, questions: [], revisionIds: [], recovery: null }
  }

  const lastLoopDate = await getLastLoopDate(userId)
  const recovery = detectRecovery(
    lastLoopDate,
    now,
    profile.adaptiveUntil ? new Date(profile.adaptiveUntil) : null,
  )

  // Fresh 7+ day gap → cap load for the next 5 days (guarded so it isn't re-extended daily).
  if (recovery.isAdaptive && (!profile.adaptiveUntil || profile.adaptiveUntil < today)) {
    const adaptiveEnd = new Date(now)
    adaptiveEnd.setDate(adaptiveEnd.getDate() + 5)
    await db
      .update(userProfiles)
      .set({ adaptiveUntil: formatLocalDate(adaptiveEnd) })
      .where(eq(userProfiles.clerkUserId, userId))
  }

  // Decay mastery after a long absence so forgotten material resurfaces.
  await applyMemoryDecay(userId, today, masteryDecaySteps(recovery.missedDays))

  const level: Level = (VALID_LEVELS as readonly string[]).includes(profile.level)
    ? (profile.level as Level)
    : 'intermediate'

  const dueRevisions = await getDueRevisions(userId, today, profile.dailyRevisionCap ?? 2)
  const attemptedIds = await getAttemptedQuestionIds(userId)
  const candidates = await getAvailableQuestions(profile.level, attemptedIds)
  const solvedByPattern = await getSolvedByPattern(userId)
  const patternProgress = Object.fromEntries(solvedByPattern.map((p) => [p.pattern, p.count]))
  const remaining = daysRemaining(profile.targetDate ?? null, profile.prepMonths, now)

  const selected = generateLoop({
    profile: {
      clerkUserId: profile.clerkUserId,
      level,
      dailyTimeMinutes: profile.dailyTimeMinutes,
      dailyRevisionCap: profile.dailyRevisionCap ?? 2,
      prepMonths: profile.prepMonths,
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
    patternProgress,
    daysRemaining: remaining,
  })

  if (selected.length === 0) {
    return { status: 'all_done', loop: null, questions: [], revisionIds: [], recovery }
  }

  const loop = await insertDailyLoop({
    clerkUserId: userId,
    date: today,
    questionIds: selected.map((q) => q.id),
  })

  // Lost an insert race — reuse whatever landed.
  if (!loop) {
    const created = await getTodaysLoop(userId, today)
    if (created) return reuseExisting(created, userId, today, recovery)
    return { status: 'all_done', loop: null, questions: [], revisionIds: [], recovery }
  }

  return {
    status: 'ready',
    loop,
    questions: selected.map((q) => ({
      id: q.id,
      title: q.title,
      link: q.link,
      difficulty: q.difficulty,
      primaryPattern: q.primaryPattern,
      estimatedMinutes: q.estimatedMinutes,
      importanceScore: q.importanceScore,
    })),
    revisionIds: dueRevisions.map((r) => r.id),
    recovery,
  }
}
