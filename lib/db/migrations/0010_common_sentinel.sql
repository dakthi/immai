CREATE TABLE IF NOT EXISTS "DocumentLibrary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"fileName" varchar(255) NOT NULL,
	"filePath" text NOT NULL,
	"fileSize" integer NOT NULL,
	"fileType" varchar(50) NOT NULL,
	"price" numeric(10, 2) DEFAULT '0.00',
	"isFree" boolean DEFAULT true NOT NULL,
	"category" varchar(100),
	"tags" json DEFAULT '[]'::json,
	"downloadCount" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"analyzedContent" json,
	"uploadedBy" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "DownloadHistory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"documentId" uuid NOT NULL,
	"accessId" uuid NOT NULL,
	"ipAddress" varchar(45),
	"userAgent" text,
	"downloadedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"documentId" uuid,
	"paymentType" varchar NOT NULL,
	"stripePaymentIntentId" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"paymentDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserDocumentAccess" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"documentId" uuid NOT NULL,
	"paymentId" uuid,
	"accessType" varchar NOT NULL,
	"downloadCount" integer DEFAULT 0 NOT NULL,
	"lastAccessedAt" timestamp,
	"grantedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "name" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "role" varchar DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "emailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "resetToken" varchar(255);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DocumentLibrary" ADD CONSTRAINT "DocumentLibrary_uploadedBy_User_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DownloadHistory" ADD CONSTRAINT "DownloadHistory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DownloadHistory" ADD CONSTRAINT "DownloadHistory_documentId_DocumentLibrary_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentLibrary"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "DownloadHistory" ADD CONSTRAINT "DownloadHistory_accessId_UserDocumentAccess_id_fk" FOREIGN KEY ("accessId") REFERENCES "public"."UserDocumentAccess"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Payment" ADD CONSTRAINT "Payment_documentId_DocumentLibrary_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentLibrary"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserDocumentAccess" ADD CONSTRAINT "UserDocumentAccess_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserDocumentAccess" ADD CONSTRAINT "UserDocumentAccess_documentId_DocumentLibrary_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."DocumentLibrary"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserDocumentAccess" ADD CONSTRAINT "UserDocumentAccess_paymentId_Payment_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
