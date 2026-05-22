'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type Level = 'beginner' | 'intermediate' | 'advanced'
type Frequency = 'daily' | 'alternate' | 'weekend' | 'custom'

interface FormState {
  level: Level | null
  dailyTimeMinutes: number | null
  prepMonths: number | null
  revisionFrequency: Frequency | null
  customDays: number[]
}

const DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
]

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

const FREQUENCY_OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Revise something every single day' },
  { value: 'alternate', label: 'Alternate Days', description: 'Every other day keeps it manageable' },
  { value: 'weekend', label: 'Weekends', description: 'Deep-dive on Saturdays and Sundays' },
  { value: 'custom', label: 'Custom', description: 'Pick specific days of the week' },
]

const STEP_LABELS = ['Level', 'Time', 'Timeline', 'Revision', 'Review']

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  alternate: 'Alternate Days',
  weekend: 'Weekends',
  custom: 'Custom days',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    level: null,
    dailyTimeMinutes: null,
    prepMonths: null,
    revisionFrequency: null,
    customDays: [],
  })

  const canAdvance = () => {
    if (step === 1) return form.level !== null
    if (step === 2) return form.dailyTimeMinutes !== null
    if (step === 3) return form.prepMonths !== null
    if (step === 4) {
      if (form.revisionFrequency === null) return false
      if (form.revisionFrequency === 'custom') return form.customDays.length > 0
      return true
    }
    return true
  }

  const toggleCustomDay = (day: number) => {
    setForm((f) => ({
      ...f,
      customDays: f.customDays.includes(day)
        ? f.customDays.filter((d) => d !== day)
        : [...f.customDays, day],
    }))
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
          revisionFrequency: form.revisionFrequency,
          customDays: form.revisionFrequency === 'custom' ? form.customDays : null,
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
          <h1 className="text-2xl font-semibold tracking-tight mb-1">What's your level?</h1>
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
          <h1 className="text-2xl font-semibold tracking-tight mb-1">When's your target?</h1>
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
        </div>
      )}

      {/* Step 4 — Revision Frequency */}
      {step === 4 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">How often do you revise?</h1>
          <p className="text-sm text-neutral-500 mb-8">Revision questions blend into your loop on these days.</p>
          <div className="flex flex-col gap-3">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, revisionFrequency: opt.value }))}
                className={cn(
                  'text-left px-5 py-4 rounded-lg border transition-all',
                  form.revisionFrequency === opt.value
                    ? 'border-neutral-900 bg-primary text-primary-foreground'
                    : 'border-border hover:border-muted-foreground hover:bg-accent',
                )}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className={cn('text-xs mt-0.5', form.revisionFrequency === opt.value ? 'text-neutral-400' : 'text-neutral-500')}>
                  {opt.description}
                </div>
              </button>
            ))}
          </div>

          {form.revisionFrequency === 'custom' && (
            <div className="mt-5">
              <p className="text-xs text-neutral-500 mb-3">Select the days you want to revise</p>
              <div className="flex gap-2">
                {DAYS.map((day, i) => (
                  <button
                    key={`${day.label}-${i}`}
                    onClick={() => toggleCustomDay(day.value)}
                    className={cn(
                      'w-9 h-9 rounded-full text-xs font-medium border transition-all',
                      form.customDays.includes(day.value)
                        ? 'border-neutral-900 bg-primary text-primary-foreground'
                        : 'border-border hover:border-muted-foreground text-muted-foreground',
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5 — Summary */}
      {step === 5 && (
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Your Loop, set up.</h1>
          <p className="text-sm text-neutral-500 mb-8">Here's what we've configured — you can change these later.</p>
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
              <span className="text-sm text-neutral-500">Revision</span>
              <span className="text-sm font-medium">
                {form.revisionFrequency ? FREQUENCY_LABELS[form.revisionFrequency] : '—'}
                {form.revisionFrequency === 'custom' && form.customDays.length > 0 && (
                  <span className="text-neutral-400 font-normal ml-1">
                    ({form.customDays.length} days)
                  </span>
                )}
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
