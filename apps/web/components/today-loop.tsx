'use client'

import { useState } from 'react'
import { Trophy, AlertTriangle, Clock, Zap } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { QuestionCard } from '@/components/question-card'
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

interface Loop {
  id: string
  completedIds: string[] | null
  questionIds: string[]
  status: string | null
}

interface RecoveryConfig {
  isRecovery: boolean
  missedDays: number
  maxQuestions: number
  isAdaptive: boolean
}

interface TodayLoopProps {
  loop: Loop
  questions: Question[]
  revisionIds: string[]
  recovery: RecoveryConfig | null
  formattedDate: string
}

export function TodayLoop({ loop, questions, revisionIds, recovery, formattedDate }: TodayLoopProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(loop.completedIds ?? []),
  )
  const [isLoopComplete, setIsLoopComplete] = useState(loop.status === 'complete')

  const completedCount = completedIds.size
  const totalCount = questions.length
  const totalMinutes = questions.reduce((sum, q) => sum + q.estimatedMinutes, 0)
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  function handleLoopComplete(loopComplete: boolean) {
    // Optimistically reflect the newly completed question via re-render from QuestionCard
    if (loopComplete) setIsLoopComplete(true)
  }

  function handleQuestionComplete(questionId: string, loopComplete: boolean) {
    setCompletedIds((prev) => new Set([...prev, questionId]))
    if (loopComplete) setIsLoopComplete(true)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Recovery / adaptive banner — adaptive takes precedence (it implies a longer break) */}
      {recovery?.isAdaptive ? (
        <div
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-sm" style={{ color: '#f59e0b' }}>
            Good to have you back. Starting with shorter sessions for a few days.
          </p>
        </div>
      ) : recovery?.isRecovery ? (
        <div
          className="flex items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-sm" style={{ color: '#f59e0b' }}>
            Welcome back — keeping it light today to rebuild momentum.
          </p>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">Today&apos;s Loop</h1>
          {isLoopComplete && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
            >
              <Zap size={11} fill="currentColor" /> Complete
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Stats + progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            ~{totalMinutes} min
          </span>
          <span>{completedCount} of {totalCount} done</span>
        </div>
        <Progress value={progressPct} className="h-1" />
      </div>

      {/* Loop complete banner */}
      {isLoopComplete && (
        <div
          className="flex items-center gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}
        >
          <Trophy size={15} className="shrink-0" style={{ color: '#22c55e' }} />
          <p className="text-sm" style={{ color: '#22c55e' }}>
            Loop complete — great work. See you tomorrow.
          </p>
        </div>
      )}

      {/* Question list */}
      <div className="flex flex-col gap-2">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            isCompleted={completedIds.has(q.id)}
            isRevision={revisionIds.includes(q.id)}
            onLoopComplete={(loopComplete) => handleQuestionComplete(q.id, loopComplete)}
          />
        ))}
      </div>
    </div>
  )
}
