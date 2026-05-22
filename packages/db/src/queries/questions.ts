import { db } from '../client'
import { questions, userQuestionLog } from '../schema'
import { eq, and, notInArray } from 'drizzle-orm'

const DIFFICULTY_BY_LEVEL: Record<string, string[]> = {
  beginner:     ['easy', 'medium'],
  intermediate: ['easy', 'medium', 'hard'],
  advanced:     ['medium', 'hard'],
}

export async function getAttemptedQuestionIds(clerkUserId: string): Promise<string[]> {
  const logs = await db
    .select({ questionId: userQuestionLog.questionId })
    .from(userQuestionLog)
    .where(eq(userQuestionLog.clerkUserId, clerkUserId))
  return logs.map((l) => l.questionId).filter((id): id is string => id !== null)
}

export async function getAvailableQuestions(level: string, excludeIds: string[]) {
  const difficulties = DIFFICULTY_BY_LEVEL[level] ?? DIFFICULTY_BY_LEVEL.intermediate

  const rows = await db
    .select()
    .from(questions)
    .where(
      excludeIds.length > 0
        ? and(eq(questions.isActive, true), notInArray(questions.id, excludeIds))
        : eq(questions.isActive, true),
    )

  return rows.filter((q) => difficulties.includes(q.difficulty))
}
