-- CreateEnum
CREATE TYPE "Role" AS ENUM ('team_member', 'team_leader', 'executive', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'probation', 'on_leave', 'departed');

-- CreateEnum
CREATE TYPE "ChurnRisk" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('green', 'yellow', 'red');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('team', 'company');

-- CreateEnum
CREATE TYPE "CoachingOutcome" AS ENUM ('pending', 'implemented', 'in_progress', 'blocked');

-- CreateEnum
CREATE TYPE "GoNoGo" AS ENUM ('on_track', 'slightly_off', 'significantly_off');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "teamId" TEXT,
    "managerId" TEXT,
    "weeklyTarget" DOUBLE PRECISION,
    "promotionTrack" TEXT,
    "churnRisk" "ChurnRisk" NOT NULL DEFAULT 'low',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "calculation" TEXT,
    "greenThreshold" DOUBLE PRECISION NOT NULL DEFAULT 95,
    "yellowThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "dataSource" TEXT NOT NULL DEFAULT 'manual_entry',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDatapoint" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricDatapoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bigWin" TEXT,
    "blocker" TEXT,
    "needsHelp" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyDashboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "week" TIMESTAMP(3) NOT NULL,
    "overallStatus" "Status" NOT NULL DEFAULT 'green',
    "biggestWin" TEXT,
    "biggestBlocker" TEXT,
    "managerReviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyDashboardMetric" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL,
    "status" "Status" NOT NULL,

    CONSTRAINT "WeeklyDashboardMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyScorecard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "wins" TEXT[],
    "blockers" TEXT[],
    "pivots" TEXT[],
    "nextMonthStrategy" TEXT,
    "managerFeedback" TEXT,
    "selfReflection" TEXT,
    "goNoGo" "GoNoGo",
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScorecardKpi" (
    "id" TEXT NOT NULL,
    "scorecardId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION NOT NULL,
    "status" "Status" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ScorecardKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topic" TEXT NOT NULL,
    "notes" TEXT,
    "action" TEXT,
    "followUp" TIMESTAMP(3),
    "outcome" "CoachingOutcome" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CelebrationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievement" TEXT NOT NULL,
    "impact" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'team',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CelebrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationFramework" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "description" TEXT,
    "kpis" JSONB NOT NULL,
    "trafficLightLogic" TEXT,
    "goNoGoGates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationFramework_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyDashboard_userId_week_key" ON "WeeklyDashboard"("userId", "week");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyScorecard_userId_month_key" ON "MonthlyScorecard"("userId", "month");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDatapoint" ADD CONSTRAINT "MetricDatapoint_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDatapoint" ADD CONSTRAINT "MetricDatapoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDatapoint" ADD CONSTRAINT "MetricDatapoint_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyDashboard" ADD CONSTRAINT "WeeklyDashboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyDashboard" ADD CONSTRAINT "WeeklyDashboard_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyDashboardMetric" ADD CONSTRAINT "WeeklyDashboardMetric_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "WeeklyDashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyDashboardMetric" ADD CONSTRAINT "WeeklyDashboardMetric_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyScorecard" ADD CONSTRAINT "MonthlyScorecard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyScorecard" ADD CONSTRAINT "MonthlyScorecard_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScorecardKpi" ADD CONSTRAINT "ScorecardKpi_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "MonthlyScorecard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScorecardKpi" ADD CONSTRAINT "ScorecardKpi_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingLog" ADD CONSTRAINT "CoachingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingLog" ADD CONSTRAINT "CoachingLog_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebrationLog" ADD CONSTRAINT "CelebrationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CelebrationLog" ADD CONSTRAINT "CelebrationLog_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationFramework" ADD CONSTRAINT "EvaluationFramework_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
