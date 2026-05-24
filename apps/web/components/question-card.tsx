'use client'

import { useState } from 'react'
import { ExternalLink, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  completedFeedback,
  onLoopComplete,
}: QuestionCardProps) {
  const color = DIFFICULTY_COLORS[question.difficulty]

  // Optimistic local state: once completed in this session, stay completed
  const [hasOpened, setHasOpened] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [localCompleted, setLocalCompleted] = useState(false)
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackType | null>(
    completedFeedback ?? null,
  )

  const isCompleted = serverCompleted || localCompleted

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
    setShowFeedbackModal(false)
    onLoopComplete?.(data.loopComplete)
  }

  return (
    <>
      <div
        className={cn(
          'group relative flex items-start gap-4 rounded-lg border bg-card px-5 py-4 transition-opacity',
          isCompleted && 'opacity-50',
        )}
        style={{ borderLeftWidth: '3px', borderLeftColor: color.border }}
      >
        {/* Completion check */}
        {isCompleted && (
          <CheckCircle2
            size={15}
            className="absolute right-4 top-4 shrink-0"
            style={{ color: color.border }}
          />
        )}

        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {/* Title */}
          <p className={cn(
            'text-sm font-medium leading-snug',
            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground',
          )}>
            {question.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
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

            {/* Feedback badge shown after completion */}
            {isCompleted && submittedFeedback && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
                {FEEDBACK_LABELS[submittedFeedback]}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isCompleted && hasOpened && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkDone}
            >
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
        </div>
      </div>

      <FeedbackModal
        open={showFeedbackModal}
        questionTitle={question.title}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  )
}
