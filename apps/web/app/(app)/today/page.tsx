import type { Metadata } from 'next'

export const metadata: Metadata = { title: "Today's Loop | Loop" }

export default function TodayPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s Loop</h1>
      <p className="text-neutral-500 mt-1 text-sm">Coming in Phase 3.</p>
    </div>
  )
}
