ALTER TABLE "user_question_log" ADD COLUMN "review_stage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_question_log" ADD COLUMN "mastered" boolean DEFAULT false NOT NULL;