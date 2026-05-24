import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUpcomingRevisions } from '@loop/db/queries/logs'
import { formatLocalDate } from '@/lib/date'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const todayStr = formatLocalDate(now)

  const plusSeven = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  const plusSevenStr = formatLocalDate(plusSeven)

  const revisions = await getUpcomingRevisions(userId, todayStr, plusSevenStr)

  return NextResponse.json({ revisions, todayStr })
}
