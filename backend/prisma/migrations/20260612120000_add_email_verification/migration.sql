-- Add email verification fields to User
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationTokenExpiry" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- Mark existing users as already verified so current logins keep working
UPDATE "User" SET "emailVerified" = true;
