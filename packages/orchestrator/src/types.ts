export type Difficulty = 'easy' | 'medium' | 'hard'
export type FeedbackType = 'easy' | 'needed_hint' | 'struggled' | 'couldnt_solve' | 'revisit_later'
export type RevisionFrequency = 'daily' | 'alternate' | 'weekend' | 'custom'

export interface Question {
  id: string
  title: string
  link: string
  difficulty: Difficulty
  primaryPattern: string
  secondaryPatterns: string[]
  importanceScore: number
  estimatedMinutes: number
}

export interface UserProfile {
  clerkUserId: string
  level: 'beginner' | 'intermediate' | 'advanced'
  dailyTimeMinutes: number
  revisionFrequency: RevisionFrequency
  customDays: number[] | null
  focusPattern: string | null
}

export interface RecoveryConfig {
  isRecovery: boolean
  missedDays: number
  maxQuestions: number
  isAdaptive: boolean
}
