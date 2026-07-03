'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Level = 'beginner' | 'intermediate' | 'advanced'

interface FormState {
  level: Level | null
  dailyTimeMinutes: number | null
  prepMonths: number | null
  dailyRevisionCap: number | null
  targetDate: string | null
}

const LEVEL_OPTIONS: { value: Level; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to DSA or returning after a break' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics, building fluency' },
  { value: 'advanced', label: 'Advanced', description: 'Solid foundations, targeting hard problems' },
]

const TIME_OPTIONS = [15, 30, 45, 60, 90]

const PREP_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
]

const REVISION_CAP_OPTIONS: { value: number; label: string; description: string }[] = [
  { value: 1, label: '1 per session', description: 'Light touch — one revision question mixed in' },
  { value: 2, label: '2 per session', description: 'Balanced — keeps review moving without overload' },
  { value: 3, label: '3 per session', description: 'Intensive — great when cramming or catching up' },
]

const STEP_LABELS = ['Level', 'Time', 'Timeline', 'Revision', 'Review']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    level: null,
    dailyTimeMinutes: null,
    prepMonths: null,
    dailyRevisionCap: null,
    targetDate: null,
  })

  const canAdvance = () => {
    if (step === 1) return form.level !== null
    if (step === 2) return form.dailyTimeMinutes !== null
    if (step === 3) return form.prepMonths !== null
    if (step === 4) return form.dailyRevisionCap !== null
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: form.level,
          dailyTimeMinutes: form.dailyTimeMinutes,
          prepMonths: form.prepMonths,
          dailyRevisionCap: form.dailyRevisionCap,
          targetDate: form.targetDate,
        }),
      })
      router.push('/today')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col max-w-lg">

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1
          const isActive = num === step
          const isDone = num < step
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all',
                    isActive && 'bg-primary text-primary-foreground',
                    isDone && 'bg-muted text-muted-foreground',
                    !isActive && !isDone && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? '✓' : num}
                </div>
                <span
                  className={cn(
                    'text-xs hidden sm:block transition-colors',
                    isActive ? 'text-foreground font-medium' : 'text-neutral-400',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={cn('h-px w-6 transition-colors', isDone ? 'bg-neutral-300' : 'bg-neutral-100')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1 — Experience Level */}
      {step === 1 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">What&apos;s your level?</h1>
          <p className="text-sm text-neutral-500 mb-8">This shapes which questions appear in your daily loop.</p>
          <div className="flex flex-col gap-3">
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, level: opt.value }))}
                className={cn(
                  'text-left px-5 py-4 rounded-lg border transition-all',
                  form.level === opt.value
                    ? 'border-neutral-900 bg-primary text-primary-foreground'
                    : 'border-border hover:border-muted-foreground hover:bg-accent',
                )}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className={cn('text-xs mt-0.5', form.level === opt.value ? 'text-neutral-400' : 'text-neutral-500')}>
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Daily Time */}
      {step === 2 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">How much time each day?</h1>
          <p className="text-sm text-neutral-500 mb-8">Loop will fit your question set inside this window.</p>
          <div className="flex flex-wrap gap-3">
            {TIME_OPTIONS.map((mins) => (
              <button
                key={mins}
                onClick={() => setForm((f) => ({ ...f, dailyTimeMinutes: mins }))}
                className={cn(
                  'px-6 py-3 rounded-full border text-sm font-medium transition-all',
                  form.dailyTimeMinutes === mins
                    ? 'border-neutral-900 bg-primary text-primary-foreground'
                    : 'border-border hover:border-muted-foreground hover:bg-accent',
                )}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Prep Timeline */}
      {step === 3 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">When&apos;s your target?</h1>
          <p className="text-sm text-neutral-500 mb-8">Sets the pace — tighter timelines prioritise high-importance questions.</p>
          <div className="grid grid-cols-2 gap-3">
            {PREP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, prepMonths: opt.value }))}
                className={cn(
                  'px-5 py-5 rounded-lg border text-left transition-all',
                  form.prepMonths === opt.value
                    ? 'border-neutral-900 bg-primary text-primary-foreground'
                    : 'border-border hover:border-muted-foreground hover:bg-accent',
                )}
              >
                <div className="text-xl font-semibold tracking-tight">{opt.value}</div>
                <div className={cn('text-xs mt-0.5', form.prepMonths === opt.value ? 'text-neutral-400' : 'text-neutral-500')}>
                  {opt.value === 1 ? 'month' : 'months'}
                </div>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <label className="text-xs text-neutral-500">
              Have a specific interview date? (optional — sets a precise pace)
            </label>
            <input
              type="date"
              value={form.targetDate ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value || null }))}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm w-fit"
            />
          </div>
        </div>
      )}

      {/* Step 4 — Daily Revision Cap */}
      {step === 4 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">How many revisions per session?</h1>
          <p className="text-sm text-neutral-500 mb-8">Due revisions appear every day — this controls how many blend into your loop at once.</p>
          <div className="flex flex-col gap-3">
            {REVISION_CAP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, dailyRevisionCap: opt.value }))}
                className={cn(
                  'text-left px-5 py-4 rounded-lg border transition-all',
                  form.dailyRevisionCap === opt.value
                    ? 'border-neutral-900 bg-primary text-primary-foreground'
                    : 'border-border hover:border-muted-foreground hover:bg-accent',
                )}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className={cn('text-xs mt-0.5', form.dailyRevisionCap === opt.value ? 'text-neutral-400' : 'text-neutral-500')}>
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5 — Summary */}
      {step === 5 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Your Loop, set up.</h1>
          <p className="text-sm text-neutral-500 mb-8">Here&apos;s what we&apos;ve configured — you can change these later.</p>
          <div className="border border-border rounded-lg divide-y divide-border mb-8">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-neutral-500">Level</span>
              <span className="text-sm font-medium capitalize">{form.level}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-neutral-500">Daily time</span>
              <span className="text-sm font-medium">{form.dailyTimeMinutes} min</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-neutral-500">Prep target</span>
              <span className="text-sm font-medium">
                {form.prepMonths} {form.prepMonths === 1 ? 'month' : 'months'}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-neutral-500">Revisions per session</span>
              <span className="text-sm font-medium">
                {form.dailyRevisionCap ?? '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8 mt-auto border-t border-border">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-neutral-500 hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className={cn(
              'px-5 py-2 rounded-md text-sm font-medium transition-all',
              canAdvance()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              'px-5 py-2 rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90',
              loading && 'opacity-60 cursor-not-allowed',
            )}
          >
            {loading ? 'Setting up…' : 'Start My Loop →'}
          </button>
        )}
      </div>
    </div>
  )
}
