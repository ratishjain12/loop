import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { TodayLoop } from '@/components/today-loop'
import { resolveTodayLoop } from '@/lib/today-loop'

export const metadata: Metadata = { title: "Today's Loop | Loop" }

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default async function TodayPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const now = new Date()
  const result = await resolveTodayLoop(userId, now)

  if (result.status === 'no_profile') redirect('/onboarding')

  if (result.status === 'all_done' || !result.loop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Trophy size={22} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold">All caught up</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You&apos;ve attempted every question in the bank. More coming soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <TodayLoop
      loop={result.loop}
      questions={result.questions}
      revisionIds={result.revisionIds}
      recovery={result.recovery}
      formattedDate={formatDate(now)}
    />
  )
}
