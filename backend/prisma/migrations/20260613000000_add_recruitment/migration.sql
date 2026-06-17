-- Add hr_manager role
ALTER TYPE "Role" ADD VALUE 'hr_manager';

-- CreateEnum
CREATE TYPE "ApplicantStage" AS ENUM ('received', 'shortlisted', 'interview_1', 'interview_2', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "ApplicantActivityType" AS ENUM ('note', 'stage_change', 'email');

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "source" TEXT,
    "resumeUrl" TEXT,
    "notes" TEXT,
    "stage" "ApplicantStage" NOT NULL DEFAULT 'received',
    "appliedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,
    "createdById" TEXT NOT NULL,
    "hiredUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantActivity" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "type" "ApplicantActivityType" NOT NULL,
    "content" TEXT,
    "fromStage" "ApplicantStage",
    "toStage" "ApplicantStage",
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicantActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_hiredUserId_key" ON "Applicant"("hiredUserId");

-- CreateIndex
CREATE INDEX "Applicant_stage_idx" ON "Applicant"("stage");

-- CreateIndex
CREATE INDEX "Applicant_teamId_idx" ON "Applicant"("teamId");

-- CreateIndex
CREATE INDEX "ApplicantActivity_applicantId_createdAt_idx" ON "ApplicantActivity"("applicantId", "createdAt");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_hiredUserId_fkey" FOREIGN KEY ("hiredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantActivity" ADD CONSTRAINT "ApplicantActivity_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantActivity" ADD CONSTRAINT "ApplicantActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
