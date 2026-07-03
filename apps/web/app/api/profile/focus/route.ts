import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, userProfiles } from '@loop/db'
import { getAllPatterns } from '@loop/db/queries/questions'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || !('focusPattern' in body)) {
    return NextResponse.json({ error: 'focusPattern required' }, { status: 400 })
  }

  const { focusPattern } = body as { focusPattern: unknown }

  // Accept null (clear focus) or a pattern that actually exists in the bank
  let value: string | null
  if (focusPattern === null) {
    value = null
  } else if (typeof focusPattern === 'string') {
    const patterns = await getAllPatterns()
    if (!patterns.includes(focusPattern)) {
      return NextResponse.json({ error: 'Unknown pattern' }, { status: 400 })
    }
    value = focusPattern
  } else {
    return NextResponse.json({ error: 'Invalid focusPattern' }, { status: 400 })
  }

  const [updated] = await db
    .update(userProfiles)
    .set({ focusPattern: value })
    .where(eq(userProfiles.clerkUserId, userId))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
