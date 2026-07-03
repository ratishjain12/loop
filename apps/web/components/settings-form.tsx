'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Level = 'beginner' | 'intermediate' | 'advanced'

interface SettingsFormProps {
  initial: {
    level: Level
    dailyTimeMinutes: number
    prepMonths: number
    dailyRevisionCap: number
    targetDate: string | null
  }
}

const LEVEL_OPTIONS: { value: Level; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'New to DSA or returning after a break' },
  { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics, building fluency' },
  { value: 'advanced', label: 'Advanced', description: 'Solid foundations, targeting hard problems' },
]
const TIME_OPTIONS = [15, 30, 45, 60, 90]
const PREP_OPTIONS = [1, 3, 6, 12]
const REVISION_CAP_OPTIONS: { value: number; label: string; description: string }[] = [
  { value: 1, label: '1 per session', description: 'Light touch — one revision question mixed in' },
  { value: 2, label: '2 per session', description: 'Balanced — keeps review moving without overload' },
  { value: 3, label: '3 per session', description: 'Intensive — great when cramming or catching up' },
]

export function SettingsForm({ initial }: SettingsFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const dirty =
    form.level !== initial.level ||
    form.dailyTimeMinutes !== initial.dailyTimeMinutes ||
    form.prepMonths !== initial.prepMonths ||
    form.dailyRevisionCap !== initial.dailyRevisionCap ||
    form.targetDate !== initial.targetDate

  async function handleSave() {
    setStatus('saving')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('saved')
      router.refresh() // re-fetch server data so `initial` reflects the save on next render
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Level */}
      <Section
        title="Experience level"
        hint="Shapes which difficulties appear in your daily loop."
      >
        <div className="flex flex-col gap-2.5">
          {LEVEL_OPTIONS.map((opt) => (
            <OptionRow
              key={opt.value}
              selected={form.level === opt.value}
              onClick={() => setForm((f) => ({ ...f, level: opt.value }))}
              label={opt.label}
              description={opt.description}
            />
          ))}
        </div>
      </Section>

      {/* Daily time */}
      <Section title="Daily time" hint="Loop fits your question set inside this window.">
        <div className="flex flex-wrap gap-2.5">
          {TIME_OPTIONS.map((mins) => (
            <Pill
              key={mins}
              selected={form.dailyTimeMinutes === mins}
              onClick={() => setForm((f) => ({ ...f, dailyTimeMinutes: mins }))}
            >
              {mins} min
            </Pill>
          ))}
        </div>
      </Section>

      {/* Timeline */}
      <Section title="Prep timeline" hint="Sets the pace — tighter timelines focus on the highest-value patterns.">
        <div className="grid grid-cols-4 gap-2.5">
          {PREP_OPTIONS.map((m) => (
            <Pill
              key={m}
              selected={form.prepMonths === m}
              onClick={() => setForm((f) => ({ ...f, prepMonths: m }))}
            >
              {m} {m === 1 ? 'mo' : 'mos'}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="text-xs text-muted-foreground">
            Have an interview date? (optional — overrides the month estimate)
          </label>
          <input
            type="date"
            value={form.targetDate ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value || null }))}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          />
          {form.targetDate && (
            <button
              onClick={() => setForm((f) => ({ ...f, targetDate: null }))}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </Section>

      {/* Revision cap */}
      <Section
        title="Revisions per session"
        hint="Due revisions surface every day — this caps how many blend into each loop."
      >
        <div className="flex flex-col gap-2.5">
          {REVISION_CAP_OPTIONS.map((opt) => (
            <OptionRow
              key={opt.value}
              selected={form.dailyRevisionCap === opt.value}
              onClick={() => setForm((f) => ({ ...f, dailyRevisionCap: opt.value }))}
              label={opt.label}
              description={opt.description}
            />
          ))}
        </div>
      </Section>

      {/* Save bar */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button
          onClick={handleSave}
          disabled={!dirty || status === 'saving'}
          className={cn(
            'rounded-md px-4 py-2 text-sm font-medium transition-all',
            dirty && status !== 'saving'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' && !dirty && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check size={13} /> Saved — applies to your next loop
          </span>
        )}
        {status === 'error' && (
          <span className="text-xs" style={{ color: '#ef4444' }}>
            Couldn&apos;t save. Try again.
          </span>
        )}
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  )
}

function OptionRow({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean
  onClick: () => void
  label: string
  description: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left px-5 py-3.5 rounded-lg border transition-all',
        selected
          ? 'border-neutral-900 bg-primary text-primary-foreground'
          : 'border-border hover:border-muted-foreground hover:bg-accent',
      )}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className={cn('text-xs mt-0.5', selected ? 'text-neutral-400' : 'text-neutral-500')}>
        {description}
      </div>
    </button>
  )
}

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-5 py-2.5 rounded-full border text-sm font-medium transition-all',
        selected
          ? 'border-neutral-900 bg-primary text-primary-foreground'
          : 'border-border hover:border-muted-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}
