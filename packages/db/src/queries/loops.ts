import { db } from '../client'
import { dailyLoops } from '../schema'
import { eq, and, desc, sql } from 'drizzle-orm'

// Local YYYY-MM-DD formatter — mirrors apps/web lib/date.ts. Kept here so the
// db package stays free of app imports. Used for walking the streak/activity
// windows day-by-day without UTC-shift bugs.
function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function getTodaysLoop(clerkUserId: string, today: string) {
  return db.query.dailyLoops.findFirst({
    where: and(eq(dailyLoops.clerkUserId, clerkUserId), eq(dailyLoops.date, today)),
  })
}

export async function getLastLoopDate(clerkUserId: string): Promise<Date | null> {
  const loop = await db.query.dailyLoops.findFirst({
    where: eq(dailyLoops.clerkUserId, clerkUserId),
    orderBy: [desc(dailyLoops.date)],
  })
  if (!loop) return null
  // Parse as local midnight to match detectRecovery's setHours(0,0,0,0) normalization
  const [year, month, day] = loop.date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export async function insertDailyLoop(data: {
  clerkUserId: string
  date: string
  questionIds: string[]
}) {
  await db
    .insert(dailyLoops)
    .values({
      clerkUserId: data.clerkUserId,
      date: data.date,
      questionIds: data.questionIds,
      completedIds: [],
      status: 'pending',
    })
    .onConflictDoNothing()
  return db.query.dailyLoops.findFirst({
    where: and(eq(dailyLoops.clerkUserId, data.clerkUserId), eq(dailyLoops.date, data.date)),
  })
}

export async function markQuestionComplete(
  clerkUserId: string,
  date: string,
  questionId: string,
): Promise<{ loopComplete: boolean; wasFirstCompletion: boolean }> {
  // Atomic: append only if not already present, set status = 'complete' when all done.
  // The NOT ANY guard means the UPDATE affects a row only on the first completion —
  // wasFirstCompletion tells callers whether to proceed with side effects (e.g. log insert).
  const [updated] = await db
    .update(dailyLoops)
    .set({
      completedIds: sql`array_append(completed_ids, ${questionId}::uuid)`,
      status: sql`CASE
        WHEN cardinality(array_append(completed_ids, ${questionId}::uuid)) >= cardinality(question_ids)
        THEN 'complete'
        ELSE status
      END`,
    })
    .where(
      and(
        eq(dailyLoops.clerkUserId, clerkUserId),
        eq(dailyLoops.date, date),
        sql`NOT (${questionId}::uuid = ANY(completed_ids))`,
      ),
    )
    .returning()

  if (!updated) {
    // Already completed — return current loop status
    const loop = await db.query.dailyLoops.findFirst({
      where: and(eq(dailyLoops.clerkUserId, clerkUserId), eq(dailyLoops.date, date)),
    })
    return { loopComplete: (loop?.status ?? '') === 'complete', wasFirstCompletion: false }
  }

  return { loopComplete: updated.status === 'complete', wasFirstCompletion: true }
}

/**
 * Current consecutive-day streak of completed loops, ending today.
 * Today not yet being complete does NOT break the streak (the day isn't over) —
 * counting simply starts from the most recent completed day. A gap resets it.
 */
export async function getStreak(clerkUserId: string, todayStr: string): Promise<number> {
  const rows = await db
    .select({ date: dailyLoops.date })
    .from(dailyLoops)
    .where(and(eq(dailyLoops.clerkUserId, clerkUserId), eq(dailyLoops.status, 'complete')))
  const completed = new Set(rows.map((r) => r.date))

  const [y, m, d] = todayStr.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  // If today's loop isn't complete yet, begin the walk from yesterday
  if (!completed.has(todayStr)) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (completed.has(toDateStr(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Total number of loops the user has fully completed. */
export async function getTotalCompletedLoops(clerkUserId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dailyLoops)
    .where(and(eq(dailyLoops.clerkUserId, clerkUserId), eq(dailyLoops.status, 'complete')))
  return row?.count ?? 0
}

/**
 * Completion status for each of the last 14 calendar days (oldest first),
 * for the activity grid. Days with no loop, or an incomplete one, are false.
 */
export async function getLast14DaysActivity(
  clerkUserId: string,
  todayStr: string,
): Promise<{ date: string; completed: boolean }[]> {
  const rows = await db
    .select({ date: dailyLoops.date, status: dailyLoops.status })
    .from(dailyLoops)
    .where(eq(dailyLoops.clerkUserId, clerkUserId))
  const statusByDate = new Map(rows.map((r) => [r.date, r.status]))

  const [y, m, d] = todayStr.split('-').map(Number)
  const cursor = new Date(y, m - 1, d)
  cursor.setDate(cursor.getDate() - 13) // 13 days back → 14 days inclusive of today

  const result: { date: string; completed: boolean }[] = []
  for (let i = 0; i < 14; i++) {
    const ds = toDateStr(cursor)
    result.push({ date: ds, completed: statusByDate.get(ds) === 'complete' })
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}
