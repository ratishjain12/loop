# Loop PRD

## Loop

Structured DSA practice that keeps you consistent.

---

# Overview

Loop is a DSA practice platform focused on helping users stay consistent.

The main idea is simple:

Users should open the platform, complete their daily tasks, and leave without getting distracted.

Loop removes:

- decision fatigue
- question searching
- manual planning
- unmanaged revision

The platform automatically creates:

- daily question sets
- revision sessions
- topic-focused practice
- reinforcement schedules

The goal is long-term consistency, not endless grinding.

---

# Problem

Most users fail DSA prep because:

- they do not know what to solve next
- revision becomes difficult to manage
- they forget concepts quickly
- they lose momentum after missing a few days
- existing platforms feel overwhelming

Most DSA platforms optimize for:

- huge question libraries
- contests
- rankings
- browsing

Loop optimizes for:

- consistency
- retention
- structured progression
- focused daily execution

---

# Core Product Philosophy

## 1. Remove Decision Making

The user should never think:

- what should I solve today?
- what should I revise?
- which topic should I do next?

Loop decides this automatically.

---

## 2. Daily Practice Should Feel Finite

The workload should feel achievable.

Example:

- 2 new questions
- 2 revision questions
- 45 minutes total

The user should feel:
"I can finish today's Loop."

---

## 3. Revision Is Core

Loop should continuously bring back:

- important concepts
- forgotten patterns
- previously struggled questions

The system should focus on reinforcement.

---

## 4. Focus on Patterns

Questions should be organized around patterns like:

- sliding window
- two pointers
- monotonic stack
- graphs
- dynamic programming
- binary search

The goal is pattern recognition, not random question solving.

---

## 5. Never Punish Missed Days

If the user misses a few days:

- do not create massive backlogs
- do not overwhelm the user
- help them restart smoothly

The product should encourage users to return.

---

# User Flow

## Onboarding

The user provides:

- current level
- daily available time
- preparation timeline
- optional focus areas
- preferred revision frequency

Example:

- beginner
- 1 hour/day
- 6 month preparation timeline
- weekend revision

---

## Daily Loop

Every day the user gets:

- new questions
- revision questions
- reinforcement questions

The session should:

- feel focused
- have a clear end
- avoid distractions

---

## After Solving

After every question, ask the user:

"How comfortable were you with this question?"

Options:

- Easy
- Needed Hint
- Struggled
- Couldn't Solve
- Revisit Later

This feedback controls future revision scheduling.

---

## Revision Loop

Revision sessions should focus on:

- important concepts
- previously difficult problems
- reinforcement of patterns

Revision sessions can happen:

- daily
- alternate days
- weekends
- custom schedules

---

# Revision Preferences

Users should be able to configure how often they want revision sessions.

Different users prepare differently:

- some users prefer daily revision
- some prefer weekend-only revision
- some want lightweight revision during weekdays

Loop should support flexible revision frequency while still keeping the experience structured.

---

# Revision Frequency Options

Users can choose:

- Daily Revision
- Alternate Day Revision
- Weekend Revision
- Custom Revision Days

Examples:

- Saturday + Sunday revision
- Every 3 days
- Revision after every 5 solved questions

---

# Revision Session Types

## 1. Quick Revision

Lightweight revision session.

Example:

- 1 or 2 old questions
- recognition-based reinforcement
- 15–20 mins

Useful for:

- busy weekdays
- low-energy days

---

## 2. Deep Revision

Longer revision session.

Example:

- retry difficult problems
- revisit important concepts
- timed solving

Useful for:

- weekends
- dedicated revision days

---

# Focus Modes

Users should be able to temporarily focus on specific topics.

Examples:

- Dynamic Programming Focus
- Graphs Focus
- Revision Sprint
- Easy Week
- Interview Prep Week

Important:
Focus modes should bias the question selection, not completely replace the learning flow.

Example:
If the user selects DP Focus:

- more DP questions appear
- but some revision from old topics still continues

This prevents users from forgetting previous concepts.

---

# Question Curation

Questions should be curated based on:

- pattern importance
- interview relevance
- progressive difficulty
- reinforcement relationships

Avoid:

- obscure competitive programming problems
- random hard questions
- low-value trick questions

The platform should prioritize:

- foundational interview concepts
- reusable patterns
- high learning value questions

---

# Question Metadata

Each question should have:

- title
- link
- difficulty
- primary pattern
- secondary patterns
- importance score
- estimated solve time

Example:

```json
{
  "title": "Daily Temperatures",
  "difficulty": "medium",
  "primary_pattern": "monotonic_stack",
  "secondary_patterns": ["array"],
  "importance_score": 9,
  "estimated_time": 25
}
```

---

# Revision Scheduling Logic

Revision frequency depends on:

- question importance
- user feedback
- time since last attempt

Examples:

- Easy → revisit later
- Struggled → revisit sooner
- Couldn't Solve → revisit very soon

The user controls:

- revision frequency
- revision intensity

Loop controls:

- revision content
- reinforcement sequencing

---

# Missed Day Handling

Loop should never punish users for missing days.

The goal is helping users return smoothly, not creating guilt.

---

# If User Misses One Day

Do not:

- double the workload
- stack all missed questions

Instead:

- merge important tasks into the next session
- drop low-priority tasks if needed
- slightly compress revision scheduling

The next session should still feel achievable.

---

# If User Misses Multiple Days

Loop should automatically switch into a recovery mode.

Example:

- lighter workload
- easier reinforcement questions
- more revision, less new learning

The goal is rebuilding momentum quickly.

---

# Recovery Mode

Recovery mode helps users restart consistency without feeling overwhelmed.

Example recovery session:

- 1 revision question
- 1 easy reinforcement question
- 20–30 mins total

The system should prioritize:

- momentum
- confidence rebuilding
- habit continuation

Not aggressive catch-up.

---

# Adaptive Loop Size

If users consistently miss sessions:

- automatically reduce daily workload temporarily

Example:

- from 4 questions/day → 2 questions/day

Once consistency improves:

- gradually increase workload again

This helps prevent burnout.

---

# Main Screens

## 1. Today's Loop

Shows:

- today's questions
- estimated total time
- completion progress

---

## 2. Revision

Shows:

- scheduled revisions
- important concepts to revisit

---

## 3. Progress

Shows:

- consistency streak
- completed loops
- solved history

Keep this minimal.

---

# V1 Scope

## Included

- onboarding flow
- daily loop generation
- revision scheduling
- revision preferences
- focus modes
- question metadata system
- progress tracking
- external question links
- recovery mode handling

Questions can initially link to:

- LeetCode
- NeetCode
- curated sheets

Loop does not need its own coding platform in V1.

---

## Excluded From V1

- online code editor
- compiler/judge
- contests
- discussion forums
- social features
- AI tutoring
- AI-generated questions

---

# Technical Direction

The most important system is the learning orchestration engine.

Core responsibilities:

- generate daily loops
- schedule revisions
- manage concept reinforcement
- maintain progression pacing
- handle recovery flows

The main product value is orchestration, not hosting questions.

---

# Success Metrics

Primary metrics:

- daily consistency
- weekly retention
- completed daily loops
- users returning after missed days

The goal is:
help users sustain DSA preparation for long periods.

---

# UX Philosophy

The platform should feel:

- calm
- minimal
- focused
- intentional

Avoid:

- infinite feeds
- excessive gamification
- overwhelming dashboards
- endless browsing

The ideal experience:

- open app
- complete today's Loop
- leave

---

# Long-Term Vision

Loop can eventually evolve into:

- interview readiness systems
- adaptive learning engines
- system design preparation
- backend engineering tracks
- personalized concept mastery systems

But the foundation remains:

Structured learning through consistency and reinforcement.

---

# Brand

## Loop

Structured DSA practice that keeps you consistent.

Open.
Solve.
Improve.
Repeat.
