-- CreateEnum
CREATE TYPE "OneOnOneType" AS ENUM ('weekly', 'monthly', 'quarterly');

-- CreateEnum
CREATE TYPE "OneOnOneStatus" AS ENUM ('scheduled', 'completed', 'missed');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('underperformance', 'quality_issue', 'behavior', 'conflict', 'churn_risk');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "CoachingDecision" AS ENUM ('pending', 'improving', 'flat', 'declining');

-- CreateEnum
CREATE TYPE "CheckInType" AS ENUM ('day3', 'week1', 'week2');

-- CreateTable
CREATE TABLE "CoachingCheckIn" (
    "id" TEXT NOT NULL,
    "coachingLogId" TEXT NOT NULL,
    "type" "CheckInType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "decision" "CoachingDecision" NOT NULL DEFAULT 'pending',

    CONSTRAINT "CoachingCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OneOnOne" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "type" "OneOnOneType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "OneOnOneStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "actionItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recapNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OneOnOne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "conversationType" "FeedbackType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "behavior" TEXT,
    "rootCause" TEXT,
    "impact" TEXT,
    "actionPlan" TEXT,
    "followUpDate" TIMESTAMP(3),
    "status" "FeedbackStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quarter" TIMESTAMP(3) NOT NULL,
    "skills" JSONB NOT NULL,
    "promotionReadiness" TEXT,
    "mentorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipGuide" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipGuide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrowthPlan_userId_quarter_key" ON "GrowthPlan"("userId", "quarter");

-- AddForeignKey
ALTER TABLE "CoachingCheckIn" ADD CONSTRAINT "CoachingCheckIn_coachingLogId_fkey" FOREIGN KEY ("coachingLogId") REFERENCES "CoachingLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOnOne" ADD CONSTRAINT "OneOnOne_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOnOne" ADD CONSTRAINT "OneOnOne_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackConversation" ADD CONSTRAINT "FeedbackConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackConversation" ADD CONSTRAINT "FeedbackConversation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthPlan" ADD CONSTRAINT "GrowthPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
