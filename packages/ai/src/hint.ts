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
    system: `You are a DSA coach giving a two-part hint (2 sentences max):

Sentence 1: Describe the brute-force approach in plain language — what the naive solution does, framed as a question or suggestion. No code, no complexity notation.

Sentence 2: A single open-ended nudge that there is a more efficient approach, without naming it, describing it, or hinting at any data structure or technique. Something like "Once you have that, think about whether there's a smarter way to do it."

Rules:
- No data structure names (hash map, set, array, etc.)
- No complexity notation (O(n), O(1), etc.)
- No operation words that hint at the solution (store, look up, cache, track, etc.)
- Do not describe what the optimal approach does in any way`,
    prompt: `Problem: "${question.title}" (${question.difficulty})`,
  })
}
