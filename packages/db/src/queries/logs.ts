import { db } from '../client'
import { userQuestionLog } from '../schema'
import { and, eq, desc } from 'drizzle-orm'

export async function insertQuestionLog(params: {
  clerkUserId: string
  questionId: string
  feedback: string
  nextReviewAt: string
}) {
  const [log] = await db
    .insert(userQuestionLog)
    .values({
      clerkUserId: params.clerkUserId,
      questionId: params.questionId,
      feedback: params.feedback,
      nextReviewAt: params.nextReviewAt,
    })
    .returning()
  return log
}

export async function getLatestQuestionLog(clerkUserId: string, questionId: string) {
  return db.query.userQuestionLog.findFirst({
    where: and(
      eq(userQuestionLog.clerkUserId, clerkUserId),
      eq(userQuestionLog.questionId, questionId),
    ),
    orderBy: [desc(userQuestionLog.attemptedAt)],
  })
}
