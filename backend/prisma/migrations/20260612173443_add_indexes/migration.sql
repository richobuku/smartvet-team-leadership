-- Team
CREATE INDEX "Team_leaderId_idx" ON "Team"("leaderId");

-- User
CREATE INDEX "User_teamId_idx" ON "User"("teamId");
CREATE INDEX "User_managerId_idx" ON "User"("managerId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_churnRisk_idx" ON "User"("churnRisk");

-- Metric
CREATE INDEX "Metric_teamId_idx" ON "Metric"("teamId");

-- MetricDatapoint
CREATE INDEX "MetricDatapoint_metricId_userId_idx" ON "MetricDatapoint"("metricId", "userId");
CREATE INDEX "MetricDatapoint_userId_date_idx" ON "MetricDatapoint"("userId", "date");

-- DailyCheckIn
CREATE INDEX "DailyCheckIn_userId_date_idx" ON "DailyCheckIn"("userId", "date");
CREATE INDEX "DailyCheckIn_managerId_date_idx" ON "DailyCheckIn"("managerId", "date");

-- WeeklyDashboard
CREATE INDEX "WeeklyDashboard_managerId_week_idx" ON "WeeklyDashboard"("managerId", "week");

-- WeeklyDashboardMetric
CREATE INDEX "WeeklyDashboardMetric_dashboardId_idx" ON "WeeklyDashboardMetric"("dashboardId");
CREATE INDEX "WeeklyDashboardMetric_metricId_idx" ON "WeeklyDashboardMetric"("metricId");

-- MonthlyScorecard
CREATE INDEX "MonthlyScorecard_managerId_month_idx" ON "MonthlyScorecard"("managerId", "month");

-- ScorecardKpi
CREATE INDEX "ScorecardKpi_scorecardId_idx" ON "ScorecardKpi"("scorecardId");
CREATE INDEX "ScorecardKpi_metricId_idx" ON "ScorecardKpi"("metricId");

-- CoachingLog
CREATE INDEX "CoachingLog_userId_date_idx" ON "CoachingLog"("userId", "date");
CREATE INDEX "CoachingLog_managerId_date_idx" ON "CoachingLog"("managerId", "date");

-- CoachingCheckIn
CREATE INDEX "CoachingCheckIn_coachingLogId_idx" ON "CoachingCheckIn"("coachingLogId");

-- CelebrationLog
CREATE INDEX "CelebrationLog_userId_idx" ON "CelebrationLog"("userId");
CREATE INDEX "CelebrationLog_managerId_idx" ON "CelebrationLog"("managerId");
CREATE INDEX "CelebrationLog_visibility_date_idx" ON "CelebrationLog"("visibility", "date");

-- EvaluationFramework
CREATE INDEX "EvaluationFramework_teamId_idx" ON "EvaluationFramework"("teamId");

-- Internship
CREATE INDEX "Internship_supervisorId_idx" ON "Internship"("supervisorId");
CREATE INDEX "Internship_status_idx" ON "Internship"("status");

-- OneOnOne
CREATE INDEX "OneOnOne_userId_idx" ON "OneOnOne"("userId");
CREATE INDEX "OneOnOne_managerId_scheduledAt_idx" ON "OneOnOne"("managerId", "scheduledAt");

-- FeedbackConversation
CREATE INDEX "FeedbackConversation_userId_idx" ON "FeedbackConversation"("userId");
CREATE INDEX "FeedbackConversation_managerId_status_idx" ON "FeedbackConversation"("managerId", "status");
