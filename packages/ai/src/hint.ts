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
    system: `You are a DSA coach giving a 2-sentence pattern-aware hint.

Sentence 1: Describe the brute-force approach for this specific problem in plain language (no code). Be concrete, not generic.

Sentence 2: Give a direction toward the optimal approach that is specific to the pattern category provided. You MAY use: time complexity notation (O(n), O(n²), O(1), etc.), terms like "single pass", "two pointers", "sliding window", "prefix", "suffix", "divide and conquer". Do NOT write code, reveal the exact algorithm, or give step-by-step instructions — just point at the right dimension to optimize.

The hint should feel like it came from a coach who knows exactly which pattern the user is practicing, not a generic nudge.`,
    prompt: `Problem: "${question.title}" (${question.difficulty}, pattern: ${question.primaryPattern})`,
  })
}
