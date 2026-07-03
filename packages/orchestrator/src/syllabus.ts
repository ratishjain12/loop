// The curriculum spine: a canonical learning order over interview patterns,
// independent of how many questions exist in the bank. Each pattern carries an
// importance weight (drives trim decisions), a tier (core vs niche), and a base
// depth target — how many questions constitute "covered enough to recognise it
// on sight". Questions are drawn to fill this plan; the bank is not the plan.
//
// Ordering follows a foundation→advanced progression (roughly the NeetCode
// roadmap). Editorial by design — tune here, not in the generator.

export interface SyllabusEntry {
  pattern: string
  importance: number // 1–10, higher = keep longer when trimming
  tier: 'core' | 'niche'
  baseDepth: number // target # questions when timeline is generous
}

export const SYLLABUS: SyllabusEntry[] = [
  { pattern: 'arrays_hashing',   importance: 10, tier: 'core',  baseDepth: 5 },
  { pattern: 'two_pointers',     importance: 9,  tier: 'core',  baseDepth: 4 },
  { pattern: 'sliding_window',   importance: 8,  tier: 'core',  baseDepth: 4 },
  { pattern: 'stack',            importance: 7,  tier: 'core',  baseDepth: 3 },
  { pattern: 'monotonic_stack',  importance: 5,  tier: 'niche', baseDepth: 2 },
  { pattern: 'binary_search',    importance: 8,  tier: 'core',  baseDepth: 4 },
  { pattern: 'linked_list',      importance: 7,  tier: 'core',  baseDepth: 4 },
  { pattern: 'trees',            importance: 9,  tier: 'core',  baseDepth: 5 },
  { pattern: 'trie',             importance: 4,  tier: 'niche', baseDepth: 2 },
  { pattern: 'heap',             importance: 7,  tier: 'core',  baseDepth: 3 },
  { pattern: 'backtracking',     importance: 7,  tier: 'core',  baseDepth: 4 },
  { pattern: 'graphs',           importance: 9,  tier: 'core',  baseDepth: 5 },
  { pattern: 'union_find',       importance: 4,  tier: 'niche', baseDepth: 1 },
  { pattern: 'dp',               importance: 9,  tier: 'core',  baseDepth: 6 },
  { pattern: 'greedy',           importance: 6,  tier: 'core',  baseDepth: 3 },
  { pattern: 'intervals',        importance: 6,  tier: 'core',  baseDepth: 3 },
  { pattern: 'bit_manipulation', importance: 4,  tier: 'niche', baseDepth: 2 },
]

const ORDER = new Map(SYLLABUS.map((e, i) => [e.pattern, i]))

/** Learning-order index for a pattern; unknown patterns sort to the end. */
export function syllabusOrder(pattern: string): number {
  return ORDER.get(pattern) ?? SYLLABUS.length
}

export interface PlanEntry {
  pattern: string
  order: number
  importance: number
  tier: 'core' | 'niche'
  depthTarget: number // trimmed to fit the timeline + capped by available questions
}

export interface Plan {
  entries: PlanEntry[] // in learning order
  dailyNewTarget: number // how many new questions/day to stay on pace
  totalPlanned: number // sum of depth targets after trimming
}

const MIN_KEPT_DEPTH = 2 // never shave a kept core pattern below this

/**
 * Sculpt the curriculum to fit the timeline. Given how many questions actually
 * exist per pattern and how many new questions/day are realistic, trim the plan
 * so it can be completed by the deadline — dropping niche patterns first, then
 * shaving depth on the least-important kept patterns (never below MIN_KEPT_DEPTH).
 *
 * Returns the (ordered) surviving patterns with their depth targets and the
 * daily new-question pace needed to finish on time.
 */
export function buildPlan(opts: {
  totalByPattern: Record<string, number> // solved + unseen, i.e. questions that exist per pattern
  daysRemaining: number
  dailyNewCapacity: number // realistic new questions/day given time budget
}): Plan {
  const { totalByPattern, daysRemaining, dailyNewCapacity } = opts
  const days = Math.max(1, daysRemaining)
  const capacity = Math.max(1, dailyNewCapacity)

  // Start from base depths, capped by how many questions actually exist.
  const entries: PlanEntry[] = SYLLABUS.map((e, i) => ({
    pattern: e.pattern,
    order: i,
    importance: e.importance,
    tier: e.tier,
    depthTarget: Math.min(e.baseDepth, totalByPattern[e.pattern] ?? 0),
  })).filter((p) => p.depthTarget > 0)

  const budget = days * capacity // total new questions doable before the deadline
  const sum = () => entries.reduce((s, p) => s + p.depthTarget, 0)

  if (sum() > budget) {
    // Short timeline — trim to fit: niche first (lowest importance), then shave
    // depth on the least-important kept pattern (never below MIN_KEPT_DEPTH).
    while (sum() > budget) {
      const niche = entries.filter((p) => p.tier === 'niche')
      if (niche.length > 0) {
        const drop = niche.reduce((a, b) => (b.importance < a.importance ? b : a))
        entries.splice(entries.indexOf(drop), 1)
        continue
      }
      const trimmable = entries.filter((p) => p.depthTarget > MIN_KEPT_DEPTH)
      if (trimmable.length === 0) break // can't trim further; do what fits
      const shave = trimmable.reduce((a, b) => (b.importance < a.importance ? b : a))
      shave.depthTarget -= 1
    }
  } else {
    // Generous timeline — expand toward the questions that actually exist, so the
    // extra runway means deeper/broader coverage rather than idle unused questions.
    // Grow the highest-importance pattern that still has unused questions first.
    while (sum() < budget) {
      const expandable = entries.filter((p) => p.depthTarget < (totalByPattern[p.pattern] ?? 0))
      if (expandable.length === 0) break
      const grow = expandable.reduce((a, b) => (b.importance > a.importance ? b : a))
      grow.depthTarget += 1
    }
  }

  const totalPlanned = sum()
  // Informational pace to finish the plan by the deadline; the generator fills each
  // loop to the comfortable time-based capacity and treats this as a catch-up floor.
  const dailyNewTarget = Math.min(capacity, Math.max(1, Math.ceil(totalPlanned / days)))

  return { entries, dailyNewTarget, totalPlanned }
}
