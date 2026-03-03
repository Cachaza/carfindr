ALTER TABLE "user" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
UPDATE "user" SET "name" = COALESCE("name", split_part("email", '@', 1));
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" TYPE boolean USING "email_verified" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email_verified" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_provider_provider_account_id_pk";
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "id" varchar(255);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "account_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "provider_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "access_token_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "password" text;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
UPDATE "account" SET
  "id" = md5(random()::text || clock_timestamp()::text || coalesce("provider", '') || coalesce("provider_account_id", '')),
  "account_id" = "provider_account_id",
  "provider_id" = "provider",
  "access_token_expires_at" = CASE WHEN "expires_at" IS NULL THEN NULL ELSE to_timestamp("expires_at") END,
  "created_at" = COALESCE("created_at", CURRENT_TIMESTAMP),
  "updated_at" = COALESCE("updated_at", CURRENT_TIMESTAMP);
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "account_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "provider_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_id_pk" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "type";
--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "provider";
--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "provider_account_id";
--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "expires_at";
--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "token_type";
--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "session_state";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_account_unique" ON "account" USING btree ("provider_id","account_id");
--> statement-breakpoint

ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_session_token_pk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT IF EXISTS "session_pkey";
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "id" varchar(255);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "token" varchar(255);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ip_address" varchar(255);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_agent" text;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
UPDATE "session" SET
  "id" = md5(random()::text || clock_timestamp()::text || coalesce("session_token", '')),
  "token" = "session_token",
  "expires_at" = "expires",
  "created_at" = COALESCE("created_at", CURRENT_TIMESTAMP),
  "updated_at" = COALESCE("updated_at", CURRENT_TIMESTAMP);
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "token" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expires_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_id_pk" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN IF EXISTS "session_token";
--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN IF EXISTS "expires";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" USING btree ("token");
--> statement-breakpoint

ALTER TABLE "verification_token" RENAME TO "verification";
--> statement-breakpoint
ALTER TABLE "verification" DROP CONSTRAINT IF EXISTS "verification_token_identifier_token_pk";
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "id" varchar(255);
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "value" varchar(255);
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
--> statement-breakpoint
UPDATE "verification" SET
  "id" = md5(random()::text || clock_timestamp()::text || coalesce("identifier", '') || coalesce("token", '')),
  "value" = "token",
  "expires_at" = "expires",
  "created_at" = COALESCE("created_at", CURRENT_TIMESTAMP),
  "updated_at" = COALESCE("updated_at", CURRENT_TIMESTAMP);
--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "value" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "expires_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ADD CONSTRAINT "verification_id_pk" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN IF EXISTS "token";
--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN IF EXISTS "expires";
