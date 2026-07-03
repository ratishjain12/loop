import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db, userProfiles } from '@loop/db'
import { SettingsForm } from '@/components/settings-form'

export const metadata: Metadata = { title: 'Settings | Loop' }

type Level = 'beginner' | 'intermediate' | 'advanced'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.clerkUserId, userId),
  })
  if (!profile) redirect('/onboarding')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Adjust your plan any time. Changes apply to your next daily loop.
        </p>
      </div>

      <SettingsForm
        initial={{
          level: (['beginner', 'intermediate', 'advanced'].includes(profile.level)
            ? profile.level
            : 'intermediate') as Level,
          dailyTimeMinutes: profile.dailyTimeMinutes,
          prepMonths: profile.prepMonths,
          dailyRevisionCap: profile.dailyRevisionCap ?? 2,
          targetDate: profile.targetDate ?? null,
        }}
      />
    </div>
  )
}
