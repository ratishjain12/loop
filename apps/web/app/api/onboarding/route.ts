import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@loop/db'
import { userProfiles } from '@loop/db/schema'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { level, dailyTimeMinutes, prepMonths, revisionFrequency, customDays } = body

  await db
    .insert(userProfiles)
    .values({
      clerkUserId: userId,
      level,
      dailyTimeMinutes,
      prepMonths,
      revisionFrequency,
      customDays: customDays ?? null,
    })
    .onConflictDoUpdate({
      target: userProfiles.clerkUserId,
      set: { level, dailyTimeMinutes, prepMonths, revisionFrequency, customDays: customDays ?? null },
    })

  return NextResponse.json({ success: true })
}
