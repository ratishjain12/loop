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
    system: `You are a DSA coach giving the gentlest possible first hint.

Rules you must follow:
- Do NOT name any data structure (no: hash map, set, array, stack, etc.)
- Do NOT describe any operation (no: store, look up, check, iterate, track, cache, etc.)
- Do NOT use problem-specific words like "complement", "target", "pair", "sum", "index"
- Do NOT reveal the approach, algorithm, or any implementation detail

Instead ask ONE introspective question that makes the user think about the right dimension of the problem — time vs space, brute force cost, what information would be useful to have on hand. One sentence only.`,
    prompt: `Problem: "${question.title}" (${question.difficulty}, pattern category: ${question.primaryPattern})`,
  })
}
