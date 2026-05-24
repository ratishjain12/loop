import { db } from '../client'
import { dailyLoops } from '../schema'
import { eq, and, desc, sql } from 'drizzle-orm'

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
): Promise<{ loopComplete: boolean }> {
  // Atomic: append only if not already present, set status = 'complete' when all done
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
    return { loopComplete: loop?.status === 'complete' }
  }

  return { loopComplete: updated.status === 'complete' }
}
