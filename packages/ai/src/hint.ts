import { streamText } from 'ai'
import { fastModel } from './client'

interface HintInput {
  title: string
  primaryPattern: string
  difficulty: string
}

export function generateHint(question: HintInput) {
  return streamText({
    model: fastModel,
    system: `You are a DSA coach. Give a short hint (2–3 sentences) that nudges the user
toward the right approach without revealing the solution. Do not write any code.
Focus on the key insight or pattern observation.`,
    prompt: `Give a hint for: "${question.title}"
Difficulty: ${question.difficulty}
Pattern: ${question.primaryPattern}`,
  })
}
