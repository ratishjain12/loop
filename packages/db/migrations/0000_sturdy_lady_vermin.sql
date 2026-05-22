CREATE TABLE "daily_loops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"date" date NOT NULL,
	"question_ids" uuid[] NOT NULL,
	"completed_ids" uuid[] DEFAULT '{}',
	"ai_ranking_used" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"difficulty" text NOT NULL,
	"primary_pattern" text NOT NULL,
	"secondary_patterns" text[] DEFAULT '{}',
	"importance_score" integer NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"daily_time_minutes" integer NOT NULL,
	"prep_months" integer NOT NULL,
	"revision_frequency" text NOT NULL,
	"custom_days" integer[],
	"focus_pattern" text,
	"adaptive_until" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_question_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"question_id" uuid,
	"attempted_at" timestamp DEFAULT now(),
	"feedback" text NOT NULL,
	"next_review_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_question_log" ADD CONSTRAINT "user_question_log_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;