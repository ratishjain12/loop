'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  questionTitle: string
  onSubmit: (feedback: FeedbackType) => Promise<void>
}

export function FeedbackModal({ open, questionTitle, onSubmit }: FeedbackModalProps) {
  const [selected, setSelected] = useState<FeedbackType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!selected) return
    setSubmitting(true)
    try {
      await onSubmit(selected)
    } finally {
      setSubmitting(false)
      setSelected(null)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-snug">
            How did it go?
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{questionTitle}</p>
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
      </DialogContent>
    </Dialog>
  )
}
