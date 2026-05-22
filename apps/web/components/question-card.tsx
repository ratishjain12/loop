'use client'

import { ExternalLink, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
}

const DIFFICULTY_COLORS = {
  easy:   { border: '#22c55e', text: '#22c55e', bg: 'rgba(34,197,94,0.08)'   },
  medium: { border: '#f59e0b', text: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
  hard:   { border: '#ef4444', text: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
}

function formatPattern(pattern: string): string {
  return pattern
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function QuestionCard({ question, isCompleted }: QuestionCardProps) {
  const color = DIFFICULTY_COLORS[question.difficulty]

  return (
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
          {/* Difficulty */}
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium capitalize"
            style={{ color: color.text, background: color.bg }}
          >
            {question.difficulty}
          </span>

          {/* Pattern */}
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono bg-muted text-muted-foreground">
            {formatPattern(question.primaryPattern)}
          </span>

          {/* Time */}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={11} />
            {question.estimatedMinutes}m
          </span>
        </div>
      </div>

      {/* Action */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="shrink-0 h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <a href={question.link} target="_blank" rel="noopener noreferrer">
          Open
          <ExternalLink size={12} />
        </a>
      </Button>
    </div>
  )
}
