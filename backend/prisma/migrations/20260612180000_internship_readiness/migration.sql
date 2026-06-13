-- CreateEnum
CREATE TYPE "InternshipReadiness" AS ENUM ('on_track', 'exceeding', 'at_risk');

-- AlterTable
ALTER TABLE "Internship"
  ADD COLUMN "readiness" "InternshipReadiness" NOT NULL DEFAULT 'on_track',
  ADD COLUMN "overallAssessment" TEXT,
  ADD COLUMN "assessmentUpdatedAt" TIMESTAMP(3);
