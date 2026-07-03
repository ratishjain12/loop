'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatPattern(pattern: string): string {
  return pattern
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface FocusModeCardProps {
  patterns: string[]
  currentFocus: string | null
}

export function FocusModeCard({ patterns, currentFocus }: FocusModeCardProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(currentFocus)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)

  function choose(pattern: string | null) {
    if (pattern === selected || pending) return
    const previous = selected
    setSelected(pattern) // optimistic
    setError(false)

    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/focus', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ focusPattern: pattern }),
        })
        if (!res.ok) throw new Error('failed')
        router.refresh()
      } catch {
        setSelected(previous) // roll back on failure
        setError(true)
      }
    })
  }

  const options: { value: string | null; label: string }[] = [
    { value: null, label: 'None' },
    ...patterns.map((p) => ({ value: p, label: formatPattern(p) })),
  ]

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex items-start gap-2.5">
        <Target size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold tracking-tight">Focus Mode</h2>
          <p className="text-xs text-muted-foreground">
            Bias your daily loop toward one pattern while keeping some variety.
            Takes effect on tomorrow&apos;s loop.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === selected
          return (
            <button
              key={opt.value ?? '__none__'}
              onClick={() => choose(opt.value)}
              disabled={pending}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-60',
                active
                  ? 'border-transparent bg-foreground text-background font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              {active && <Check size={11} strokeWidth={2.5} />}
              {opt.label}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
          Couldn&apos;t update focus. Try again.
        </p>
      )}
    </div>
  )
}
