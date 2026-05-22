import type { Question, UserProfile, RecoveryConfig } from './types'

export interface GenerateLoopOptions {
  profile: UserProfile
  availableQuestions: Question[]
  revisionQuestions: Question[]
  recovery: RecoveryConfig
  today: Date
}

// Implemented in Phase 3
export function generateLoop(_options: GenerateLoopOptions): Question[] {
  return []
}
