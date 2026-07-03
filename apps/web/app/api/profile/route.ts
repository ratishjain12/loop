import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, userProfiles } from '@loop/db'
import { eq } from 'drizzle-orm'

const LEVELS = ['beginner', 'intermediate', 'advanced']
const TIME_OPTIONS = [15, 30, 45, 60, 90]
const PREP_OPTIONS = [1, 3, 6, 12]
const REVISION_CAPS = [1, 2, 3]

/**
 * Partial profile update from the settings page. Only validated fields present
 * in the body are changed. Changes take effect on the next generated loop —
 * today's already-generated loop is left intact.
 */
export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const updates: Partial<{
    level: string
    dailyTimeMinutes: number
    prepMonths: number
    dailyRevisionCap: number
    targetDate: string | null
  }> = {}

  if ('level' in body) {
    if (!LEVELS.includes(body.level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }
    updates.level = body.level
  }
  if ('dailyTimeMinutes' in body) {
    if (!TIME_OPTIONS.includes(body.dailyTimeMinutes)) {
      return NextResponse.json({ error: 'Invalid dailyTimeMinutes' }, { status: 400 })
    }
    updates.dailyTimeMinutes = body.dailyTimeMinutes
  }
  if ('prepMonths' in body) {
    if (!PREP_OPTIONS.includes(body.prepMonths)) {
      return NextResponse.json({ error: 'Invalid prepMonths' }, { status: 400 })
    }
    updates.prepMonths = body.prepMonths
  }
  if ('dailyRevisionCap' in body) {
    if (!REVISION_CAPS.includes(body.dailyRevisionCap)) {
      return NextResponse.json({ error: 'Invalid dailyRevisionCap' }, { status: 400 })
    }
    updates.dailyRevisionCap = body.dailyRevisionCap
  }
  if ('targetDate' in body) {
    const t = body.targetDate
    if (t === null || (typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t))) {
      updates.targetDate = t
    } else {
      return NextResponse.json({ error: 'Invalid targetDate' }, { status: 400 })
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const [updated] = await db
    .update(userProfiles)
    .set(updates)
    .where(eq(userProfiles.clerkUserId, userId))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
