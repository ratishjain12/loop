import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db, questions } from '@loop/db'
import { generateExplanation } from '@loop/ai'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { questionId } = await req.json() as { questionId: string }
  if (!questionId) return new Response('Missing questionId', { status: 400 })

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })
  if (!question) return new Response('Not found', { status: 404 })

  const result = generateExplanation({
    title: question.title,
    primaryPattern: question.primaryPattern,
    secondaryPatterns: question.secondaryPatterns ?? [],
  })

  return result.toTextStreamResponse()
}
