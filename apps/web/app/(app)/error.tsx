'use client'

import { useRouter } from 'next/navigation'
import { ErrorBoundary } from '@/components/error-boundary'

// Segment-level boundary covering Today, Revision, and Progress.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter()
  return (
    <ErrorBoundary
      reset={() => {
        router.refresh()
        reset()
      }}
    />
  )
}
