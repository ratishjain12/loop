import { db } from '../client'
import { dailyLoops } from '../schema'
import { eq, and, desc } from 'drizzle-orm'

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
  return loop ? new Date(loop.date) : null
}

export async function insertDailyLoop(data: {
  clerkUserId: string
  date: string
  questionIds: string[]
}) {
  const [loop] = await db
    .insert(dailyLoops)
    .values({
      clerkUserId: data.clerkUserId,
      date: data.date,
      questionIds: data.questionIds,
      completedIds: [],
      status: 'pending',
    })
    .returning()
  return loop
}
