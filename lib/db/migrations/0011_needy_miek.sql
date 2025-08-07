ALTER TABLE "User" ADD COLUMN "stripeCustomerId" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" varchar;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "subscriptionId" varchar(255);