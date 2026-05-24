ALTER TABLE "user_profiles" ADD COLUMN "daily_revision_cap" integer NOT NULL DEFAULT 2;--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "revision_frequency";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "custom_days";
