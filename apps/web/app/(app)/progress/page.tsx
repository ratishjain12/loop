import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Progress | Loop' }

export default function ProgressPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
      <p className="text-neutral-500 mt-1 text-sm">Coming in Phase 7.</p>
    </div>
  )
}
