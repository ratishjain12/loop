'use client'

import { useState } from 'react'
import { ExternalLink, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FeedbackModal } from '@/components/feedback-modal'
import type { FeedbackType } from '@loop/orchestrator'

interface Question {
  id: string
  title: string
  link: string
  difficulty: 'easy' | 'medium' | 'hard'
  primaryPattern: string
  estimatedMinutes: number
  importanceScore: number
}

interface QuestionCardProps {
  question: Question
  isCompleted: boolean
  isRevision?: boolean
  completedFeedback?: FeedbackType | null
  onLoopComplete?: (loopComplete: boolean) => void
}

const DIFFICULTY_COLORS = {
  easy:   { border: '#22c55e', text: '#22c55e', bg: 'rgba(34,197,94,0.08)'  },
  medium: { border: '#f59e0b', text: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  hard:   { border: '#ef4444', text: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
}

const FEEDBACK_LABELS: Record<FeedbackType, string> = {
  easy:          'Easy',
  needed_hint:   'Needed hint',
  struggled:     'Struggled',
  couldnt_solve: "Couldn't solve",
  revisit_later: 'Revisit later',
}

function formatPattern(pattern: string): string {
  return pattern
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function QuestionCard({
  question,
  isCompleted: serverCompleted,
  isRevision = false,
  completedFeedback,
  onLoopComplete,
}: QuestionCardProps) {
  const color = DIFFICULTY_COLORS[question.difficulty]

  const [hasOpened, setHasOpened] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [localCompleted, setLocalCompleted] = useState(false)
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackType | null>(
    completedFeedback ?? null,
  )

  const [hint, setHint] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [hintError, setHintError] = useState<string | null>(null)

  const isCompleted = serverCompleted || localCompleted

  async function fetchHint() {
    setHintLoading(true)
    setHintError(null)
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id }),
      })
      if (res.status === 429) {
        setHintError("You've used all 5 hints for today. Come back tomorrow.")
        return
      }
      if (!res.ok || !res.body) throw new Error()
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setHint(text)
      }
    } catch {
      setHintError('Hint unavailable right now.')
    } finally {
      setHintLoading(false)
    }
  }

  function handleOpen() {
    window.open(question.link, '_blank', 'noopener,noreferrer')
    setHasOpened(true)
  }

  function handleMarkDone() {
    setShowFeedbackModal(true)
  }

  async function handleFeedbackSubmit(feedback: FeedbackType) {
    const res = await fetch('/api/loop/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, feedback }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error ?? 'Failed to save feedback')
    }

    const data = (await res.json()) as { nextReviewAt: string; loopComplete: boolean }
    setLocalCompleted(true)
    setSubmittedFeedback(feedback)
    // Keep modal open so user sees "Feedback recorded + Understand the pattern →"
    // Modal closes when user clicks the Close button inside it
    onLoopComplete?.(data.loopComplete)
  }

  return (
    <>
      {/* Outer wrapper is the visual card — hint lives inside it below the main row */}
      <div
        className={cn(
          'group relative rounded-lg border bg-card transition-opacity',
          isCompleted && 'opacity-50',
        )}
        style={{ borderLeftWidth: '3px', borderLeftColor: color.border }}
      >
        {/* Main content row — pb-2 when hint section follows, pb-4 when completed (no hint) */}
        <div className={cn('flex items-start gap-4 px-5 pt-4', isCompleted ? 'pb-4' : 'pb-2')}>

          <div className="flex flex-col gap-2.5 flex-1 min-w-0">
            <p className={cn(
              'text-sm font-medium leading-snug',
              isCompleted ? 'line-through text-muted-foreground' : 'text-foreground',
            )}>
              {question.title}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {isRevision && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
                  style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.1)' }}>
                  Revision
                </span>
              )}
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize"
                style={{ color: color.text, background: color.bg }}
              >
                {question.difficulty}
              </span>
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono bg-muted text-muted-foreground">
                {formatPattern(question.primaryPattern)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock size={11} />
                {question.estimatedMinutes}m
              </span>
              {isCompleted && submittedFeedback && (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                  {FEEDBACK_LABELS[submittedFeedback]}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCompleted && hasOpened && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleMarkDone}>
                Mark Done
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleOpen}
            >
              Open
              <ExternalLink size={12} />
            </Button>
            {isCompleted && (
              <CheckCircle2 size={15} className="shrink-0" style={{ color: color.border }} />
            )}
          </div>
        </div>

        {/* Hint section — sits flush below the main row inside the card */}
        {!isCompleted && (
          <div className="px-5 pb-3">
            {!hint && !hintLoading && (
              <button
                type="button"
                onClick={fetchHint}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                Give me a hint
              </button>
            )}
            {hintLoading && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 size={11} className="animate-spin" />
                Thinking…
              </span>
            )}
            {hint && (
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-3 border-l border-muted-foreground/20">
                {hint}
              </p>
            )}
            {hintError && (
              <p className="text-[11px] text-muted-foreground">{hintError}</p>
            )}
          </div>
        )}
      </div>

      <FeedbackModal
        open={showFeedbackModal}
        questionId={question.id}
        questionTitle={question.title}
        onSubmit={handleFeedbackSubmit}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  )
}
