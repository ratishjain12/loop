import { pgTable, text, integer, boolean, uuid, timestamp, date } from 'drizzle-orm/pg-core'

export const userProfiles = pgTable('user_profiles', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  level: text('level').notNull(),
  dailyTimeMinutes: integer('daily_time_minutes').notNull(),
  prepMonths: integer('prep_months').notNull(),
  revisionFrequency: text('revision_frequency').notNull(),
  customDays: integer('custom_days').array(),
  focusPattern: text('focus_pattern'),
  adaptiveUntil: date('adaptive_until'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  link: text('link').notNull(),
  difficulty: text('difficulty').notNull(),
  primaryPattern: text('primary_pattern').notNull(),
  secondaryPatterns: text('secondary_patterns').array().default([]),
  importanceScore: integer('importance_score').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const userQuestionLog = pgTable('user_question_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  questionId: uuid('question_id').references(() => questions.id),
  attemptedAt: timestamp('attempted_at').defaultNow(),
  feedback: text('feedback').notNull(),
  nextReviewAt: date('next_review_at').notNull(),
})

export const dailyLoops = pgTable('daily_loops', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  date: date('date').notNull(),
  questionIds: uuid('question_ids').array().notNull(),
  completedIds: uuid('completed_ids').array().default([]),
  aiRankingUsed: boolean('ai_ranking_used').default(false),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
})
