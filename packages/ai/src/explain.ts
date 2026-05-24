import { streamText } from 'ai'
import { fastModel } from './client'

interface ExplainInput {
  title: string
  primaryPattern: string
  secondaryPatterns: string[]
}

export function generateExplanation(question: ExplainInput) {
  const patterns = [question.primaryPattern, ...question.secondaryPatterns].join(', ')
  return streamText({
    model: fastModel,
    system: `You are a DSA coach explaining patterns after a problem attempt.
Be concise (under 150 words). Cover:
1. The core insight that makes this pattern work here
2. Why this pattern fits better than alternatives
3. One thing to watch for next time`,
    prompt: `Explain the pattern for: "${question.title}"
Patterns used: ${patterns}`,
  })
}
