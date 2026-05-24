import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db, questions } from '@loop/db'
import { getCachedHint, getDailyHintCount, insertHint } from '@loop/db/queries/hints'
import { generateHint } from '@loop/ai'
import { formatLocalDate } from '@/lib/date'

const DAILY_HINT_LIMIT = 5

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { questionId } = await req.json() as { questionId: string }
  if (!questionId) return new Response('Missing questionId', { status: 400 })

  // Return cached hint immediately — no OpenAI call, no limit check needed
  const cached = await getCachedHint(userId, questionId)
  if (cached) {
    return new Response(cached.hintText, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // Check daily cap before calling OpenAI
  const today = formatLocalDate(new Date())
  const dailyCount = await getDailyHintCount(userId, today)
  if (dailyCount >= DAILY_HINT_LIMIT) {
    return new Response('Daily hint limit reached', { status: 429 })
  }

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })
  if (!question) return new Response('Not found', { status: 404 })

  const result = generateHint({
    title: question.title,
    primaryPattern: question.primaryPattern,
    difficulty: question.difficulty,
  })

  // Cache the hint after stream completes — best effort, does not block response
  result.text.then((text) =>
    insertHint({ clerkUserId: userId, questionId, hintText: text }),
  ).catch(() => {})

  return result.toTextStreamResponse()
}
