import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@loop/db'
import { userProfiles } from '@loop/db/schema'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { level, dailyTimeMinutes, prepMonths, dailyRevisionCap, targetDate } = body

  // Optional interview date — accept a YYYY-MM-DD string or null
  const target = typeof targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : null

  await db
    .insert(userProfiles)
    .values({
      clerkUserId: userId,
      level,
      dailyTimeMinutes,
      prepMonths,
      dailyRevisionCap: dailyRevisionCap ?? 2,
      targetDate: target,
    })
    .onConflictDoUpdate({
      target: userProfiles.clerkUserId,
      set: { level, dailyTimeMinutes, prepMonths, dailyRevisionCap: dailyRevisionCap ?? 2, targetDate: target },
    })

  return NextResponse.json({ success: true })
}
