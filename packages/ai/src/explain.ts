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
    system: `You are a DSA coach explaining a pattern after a problem attempt.
Respond in markdown with exactly these three sections, no other text:

**Core Insight**
1-2 sentences on the key idea that makes this pattern work for this problem.

**Why This Pattern**
1-2 sentences on why this approach is better than the naive alternative.

**Watch For**
One sentence on the most common mistake or edge case to remember.

Keep total response under 120 words. No code.`,
    prompt: `Explain the pattern for: "${question.title}"
Patterns used: ${patterns}`,
  })
}
