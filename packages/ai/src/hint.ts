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
    system: `You are a DSA coach giving a directional hint. Your hint must NOT reveal the solution,
name the specific algorithm, describe what data structure to use, or explain any implementation steps.
Instead, point the user toward a general way of thinking about the problem — a trade-off to consider,
a property of the input to notice, or a question to ask themselves. 2 sentences max. No code.`,
    prompt: `Give a hint for: "${question.title}"
Difficulty: ${question.difficulty}
Pattern: ${question.primaryPattern}`,
  })
}
