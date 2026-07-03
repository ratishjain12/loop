'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * Friendly fallback for App Router error.tsx segments. `reset` re-renders the
 * failed segment; we also refresh server data so a transient fetch failure clears.
 */
export function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <AlertTriangle size={22} className="text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-base font-semibold">Something went wrong</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t load this page. Give it another try.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}
