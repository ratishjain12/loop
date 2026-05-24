'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCompletion } from '@ai-sdk/react'
import type { FeedbackType } from '@loop/orchestrator'

interface FeedbackOption {
  value: FeedbackType
  label: string
  sublabel: string
}

const OPTIONS: FeedbackOption[] = [
  { value: 'easy',          label: 'Easy',           sublabel: 'Got it, no issues' },
  { value: 'needed_hint',   label: 'Needed a Hint',  sublabel: 'Required a nudge to get going' },
  { value: 'struggled',     label: 'Struggled',      sublabel: 'Took much longer than expected' },
  { value: 'couldnt_solve', label: "Couldn't Solve", sublabel: "Didn't get it this time" },
  { value: 'revisit_later', label: 'Revisit Later',  sublabel: 'Skip revision for now' },
]

interface FeedbackModalProps {
  open: boolean
  questionId: string
  questionTitle: string
  onSubmit: (feedback: FeedbackType) => Promise<void>
  onClose: () => void
}

export function FeedbackModal({ open, questionId, questionTitle, onSubmit, onClose }: FeedbackModalProps) {
  const [selected, setSelected] = useState<FeedbackType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    completion: explanation,
    complete: fetchExplanation,
    isLoading: explanationLoading,
  } = useCompletion({ api: '/api/ai/explain' })

  function handleClose() {
    if (submitting) return
    setSelected(null)
    setError(null)
    setSubmitted(false)
    onClose()
  }

  async function handleSubmit() {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(selected)
      setSelected(null)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-snug">
            How did it go?
          </DialogTitle>
          <DialogDescription className="truncate">{questionTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              disabled={submitting}
              className={cn(
                'w-full text-left rounded-lg border px-4 py-3 transition-colors',
                'hover:bg-accent hover:border-accent-foreground/20',
                selected === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card',
                submitting && 'opacity-50 cursor-not-allowed',
              )}
            >
              <p className={cn(
                'text-sm font-medium',
                selected === opt.value ? 'text-primary' : 'text-foreground',
              )}>
                {opt.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.sublabel}</p>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive mt-1">{error}</p>
        )}

        {submitted ? (
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Feedback recorded.</p>

            {!explanation && !explanationLoading && (
              <button
                type="button"
                onClick={() => fetchExplanation('', { body: { questionId } })}
                className="text-sm text-left text-muted-foreground hover:text-foreground transition-colors"
              >
                Understand the pattern →
              </button>
            )}

            {explanationLoading && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 size={13} className="animate-spin" />
                Loading explanation…
              </span>
            )}

            {explanation && (
              <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
            )}

            <Button variant="outline" className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <Button
            className="mt-2 w-full"
            disabled={!selected || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              'Submit'
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
