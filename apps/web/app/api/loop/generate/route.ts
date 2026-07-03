import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { resolveTodayLoop } from '@/lib/today-loop'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await resolveTodayLoop(userId, new Date())

  if (result.status === 'no_profile') {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }
  if (result.status === 'all_done') {
    return NextResponse.json({ loop: null, questions: [], allDone: true, recovery: result.recovery })
  }

  return NextResponse.json({
    loop: result.loop,
    questions: result.questions,
    recovery: result.recovery,
    revisionIds: result.revisionIds,
  })
}
