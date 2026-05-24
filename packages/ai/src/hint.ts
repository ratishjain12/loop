import { streamText } from 'ai'
import { fastModel } from './client'

interface HintInput {
  title: string
  primaryPattern: string
  difficulty: string
}

// Maps pattern → optimization direction WITHOUT naming the data structure.
// The model gets told what dimension to optimize, not how.
const PATTERN_DIRECTIONS: Record<string, string> = {
  arrays_hashing:    'reduce the time complexity — what would you need to answer each step in O(1) instead of rescanning?',
  two_pointers:      'eliminate the nested loop — can two indices moving through the data replace the inner loop?',
  sliding_window:    'avoid recomputing from scratch on each step — what stays the same as the window moves?',
  binary_search:     'exploit the sorted property — can you eliminate half the remaining candidates at each step?',
  dp:                'avoid recomputing the same subproblems — what are the repeated sub-questions hidden in the recursion?',
  graphs:            'think about traversal order — does the problem need shortest path, or just reachability?',
  backtracking:      'think about pruning — at what point can you tell a branch will never reach a valid solution?',
  heap:              'think about maintaining a running sorted subset without re-sorting everything each time',
  trie:              'think about what prefix structure lets you share work across strings',
  intervals:         'sort first — what does the relative order of intervals tell you about when they overlap?',
  greedy:            'think about what local choice at each step is provably safe for the global answer',
  linked_list:       'think about pointer manipulation — can you solve it in-place without extra space?',
  trees:             'think recursively — what information does a node need from its children, or pass to them?',
  bit_manipulation:  'think about what bitwise property of the numbers you can exploit directly',
  monotonic_stack:   'think about what information becomes useless as you move forward and can be discarded',
  union_find:        'think about grouping — how do you efficiently check if two elements are already in the same group?',
}

export function generateHint(question: HintInput) {
  const direction = PATTERN_DIRECTIONS[question.primaryPattern]
    ?? 'think about whether the brute-force approach has any redundant work you could skip'

  return streamText({
    model: fastModel,
    system: `You are a DSA coach giving a 2-sentence hint.

Sentence 1: Describe the brute-force approach for this specific problem concretely (no code). Include its time complexity.

Sentence 2: Use the optimization direction provided below to nudge toward a better approach. Do NOT name any specific data structure, algorithm, or implementation. Just point at the right dimension.

Optimization direction: ${direction}`,
    prompt: `Problem: "${question.title}" (${question.difficulty})`,
  })
}
