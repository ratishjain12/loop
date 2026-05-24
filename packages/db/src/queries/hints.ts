import { db } from '../client'
import { userHints } from '../schema'
import { and, eq, count, sql } from 'drizzle-orm'

export async function getCachedHint(clerkUserId: string, questionId: string) {
  return db.query.userHints.findFirst({
    where: and(
      eq(userHints.clerkUserId, clerkUserId),
      eq(userHints.questionId, questionId),
    ),
  })
}

export async function getDailyHintCount(clerkUserId: string, todayStr: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(userHints)
    .where(
      and(
        eq(userHints.clerkUserId, clerkUserId),
        sql`${userHints.createdAt}::date = ${todayStr}`,
      ),
    )
  return row?.value ?? 0
}

export async function insertHint(params: {
  clerkUserId: string
  questionId: string
  hintText: string
}) {
  const [hint] = await db
    .insert(userHints)
    .values(params)
    .onConflictDoNothing()
    .returning()
  return hint
}
