import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@loop/db'
import { userProfiles } from '@loop/db/schema'
import { getStreak } from '@loop/db/queries/loops'
import { eq } from 'drizzle-orm'
import { Nav } from '@/components/nav'
import { formatLocalDate } from '@/lib/date'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.clerkUserId, userId),
  })
  if (!profile) redirect('/onboarding')

  const streak = await getStreak(userId, formatLocalDate(new Date()))

  return (
    <div className="flex min-h-screen">
      <Nav streak={streak} />
      <div className="flex-1 md:pl-56">
        <main className="max-w-2xl px-8 py-10 pb-24 md:pb-10">
          {children}
        </main>
      </div>
    </div>
  )
}
