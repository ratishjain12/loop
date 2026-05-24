import { db } from '../client'
import { userQuestionLog, questions } from '../schema'
import { and, eq, desc, sql } from 'drizzle-orm'

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

export interface DueRevision {
  id: string
  title: string
  link: string
  difficulty: string
  primaryPattern: string
  secondaryPatterns: string[]
  importanceScore: number
  estimatedMinutes: number
  feedback: string
  nextReviewAt: string
}

/**
 * Returns up to 2 questions due for revision today.
 * Uses the most recent log entry per question so a question completed
 * earlier today (next_review_at now in the future) is not re-included.
 */
export async function getDueRevisions(
  clerkUserId: string,
  todayStr: string,
  limit = 2,
): Promise<DueRevision[]> {
  const rows = await db.execute<{
    id: string
    title: string
    link: string
    difficulty: string
    primary_pattern: string
    secondary_patterns: string[] | null
    importance_score: number
    estimated_minutes: number
    feedback: string
    next_review_at: string
  }>(sql`
    SELECT
      latest.id, latest.title, latest.link, latest.difficulty,
      latest.primary_pattern, latest.secondary_patterns,
      latest.importance_score, latest.estimated_minutes,
      latest.feedback, latest.next_review_at
    FROM (
      SELECT DISTINCT ON (uql.question_id)
        q.id, q.title, q.link, q.difficulty, q.primary_pattern,
        q.secondary_patterns, q.importance_score, q.estimated_minutes,
        uql.feedback, uql.next_review_at
      FROM user_question_log uql
      JOIN questions q ON q.id = uql.question_id
      WHERE uql.clerk_user_id = ${clerkUserId}
        AND q.is_active = true
      ORDER BY uql.question_id, uql.attempted_at DESC
    ) latest
    WHERE latest.next_review_at <= ${todayStr}
    ORDER BY latest.next_review_at ASC
    LIMIT ${limit}
  `)

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    link: r.link,
    difficulty: r.difficulty,
    primaryPattern: r.primary_pattern,
    secondaryPatterns: r.secondary_patterns ?? [],
    importanceScore: r.importance_score,
    estimatedMinutes: r.estimated_minutes,
    feedback: r.feedback,
    nextReviewAt: r.next_review_at,
  }))
}

export interface UpcomingRevision {
  id: string
  title: string
  difficulty: string
  primaryPattern: string
  lastFeedback: string
  nextReviewAt: string
}

/**
 * Returns all questions due in the next 7 days (inclusive of today),
 * using the most recent log entry per question.
 */
export async function getUpcomingRevisions(
  clerkUserId: string,
  todayStr: string,
  plusSevenStr: string,
): Promise<UpcomingRevision[]> {
  const rows = await db.execute<{
    id: string
    title: string
    difficulty: string
    primary_pattern: string
    feedback: string
    next_review_at: string
  }>(sql`
    SELECT
      latest.id, latest.title, latest.difficulty,
      latest.primary_pattern, latest.feedback, latest.next_review_at
    FROM (
      SELECT DISTINCT ON (uql.question_id)
        q.id, q.title, q.difficulty, q.primary_pattern,
        uql.feedback, uql.next_review_at
      FROM user_question_log uql
      JOIN questions q ON q.id = uql.question_id
      WHERE uql.clerk_user_id = ${clerkUserId}
        AND q.is_active = true
      ORDER BY uql.question_id, uql.attempted_at DESC
    ) latest
    WHERE latest.next_review_at >= ${todayStr}
      AND latest.next_review_at <= ${plusSevenStr}
    ORDER BY latest.next_review_at ASC
  `)

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    difficulty: r.difficulty,
    primaryPattern: r.primary_pattern,
    lastFeedback: r.feedback,
    nextReviewAt: r.next_review_at,
  }))
}
