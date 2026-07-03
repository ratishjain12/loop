import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getTodaysLoop, markQuestionComplete } from '@loop/db/queries/loops'
import { insertQuestionLog, getLatestQuestionLog } from '@loop/db/queries/logs'
import { scheduleReview } from '@loop/orchestrator'
import type { FeedbackType } from '@loop/orchestrator'
import { formatLocalDate } from '@/lib/date'

const VALID_FEEDBACK = [
  'easy',
  'needed_hint',
  'struggled',
  'couldnt_solve',
  'revisit_later',
] as const satisfies readonly FeedbackType[]

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { questionId, feedback } = body as Record<string, unknown>

  if (typeof questionId !== 'string' || !questionId) {
    return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
  }

  if (typeof feedback !== 'string' || !(VALID_FEEDBACK as readonly string[]).includes(feedback)) {
    return NextResponse.json({ error: 'Invalid feedback value' }, { status: 400 })
  }

  const typedFeedback = feedback as FeedbackType
  const now = new Date()
  const today = formatLocalDate(now)

  const loop = await getTodaysLoop(userId, today)
  if (!loop) {
    return NextResponse.json({ error: 'No loop found for today' }, { status: 404 })
  }

  if (!loop.questionIds.includes(questionId)) {
    return NextResponse.json({ error: "Question not in today's loop" }, { status: 400 })
  }

  // markQuestionComplete is atomic — the SQL guard (NOT ANY) ensures only the
  // first concurrent request updates the row; wasFirstCompletion gates the log insert.
  const { loopComplete, wasFirstCompletion } = await markQuestionComplete(userId, today, questionId)

  // Escalate the spaced-repetition schedule from the question's prior mastery streak.
  const previous = await getLatestQuestionLog(userId, questionId)
  const { nextReviewDate, stage, mastered } = scheduleReview(typedFeedback, previous?.reviewStage ?? 0, now)
  const nextReviewAt = formatLocalDate(nextReviewDate)

  if (wasFirstCompletion) {
    await insertQuestionLog({
      clerkUserId: userId,
      questionId,
      feedback: typedFeedback,
      nextReviewAt,
      reviewStage: stage,
      mastered,
    })
  }

  return NextResponse.json({ nextReviewAt, loopComplete, mastered })
}
