import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../apps/web/.env.local') })

const userId = process.argv[2]
if (!userId) {
  console.error('Usage: tsx src/reset-user.ts <clerk_user_id>')
  process.exit(1)
}

async function reset() {
  // Dynamic imports so DATABASE_URL is set before client.ts initialises
  const { db } = await import('./client')
  const { userProfiles, dailyLoops, userQuestionLog, userHints } = await import('./schema')
  const { eq } = await import('drizzle-orm')

  console.log(`Resetting all data for user: ${userId}`)

  const [hints, logs, loops, profile] = await Promise.all([
    db.delete(userHints).where(eq(userHints.clerkUserId, userId)).returning({ id: userHints.id }),
    db.delete(userQuestionLog).where(eq(userQuestionLog.clerkUserId, userId)).returning({ id: userQuestionLog.id }),
    db.delete(dailyLoops).where(eq(dailyLoops.clerkUserId, userId)).returning({ id: dailyLoops.id }),
    db.delete(userProfiles).where(eq(userProfiles.clerkUserId, userId)).returning({ id: userProfiles.clerkUserId }),
  ])

  console.log(`Deleted:`)
  console.log(`  ${hints.length} cached hints`)
  console.log(`  ${logs.length} question log entries`)
  console.log(`  ${loops.length} daily loops`)
  console.log(`  ${profile.length} profile`)
  console.log(`Done — user will be sent to onboarding on next visit.`)
  process.exit(0)
}

reset().catch((err) => { console.error(err); process.exit(1) })
