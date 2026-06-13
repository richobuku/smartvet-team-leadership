import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { overallStatus, pctToTarget } from "../lib/status";

const router = Router();
router.use(requireAuth);

function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

router.get("/team/:teamId", async (req, res) => {
  const teamId = req.params.teamId;
  const week = startOfWeek();
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { where: { role: "team_member" } } },
  });
  if (!team) return res.status(404).json({ error: "Not found" });

  const memberIds = team.members.map((m) => m.id);
  const dashboards = await prisma.weeklyDashboard.findMany({
    where: { userId: { in: memberIds }, week },
    include: { metrics: true, user: { select: { id: true, name: true } } },
  });

  const memberSummaries = team.members.map((m) => {
    const dash = dashboards.find((d) => d.userId === m.id);
    return {
      id: m.id,
      name: m.name,
      churnRisk: m.churnRisk,
      employmentType: m.employmentType,
      status: dash?.overallStatus ?? null,
      submitted: !!dash?.submittedAt,
      metrics: dash?.metrics ?? [],
    };
  });

  const teamStatus = overallStatus(memberSummaries.filter((m) => m.status).map((m) => m.status as any));

  res.json({
    team: { id: team.id, name: team.name },
    week,
    status: teamStatus,
    members: memberSummaries,
  });
});

router.get("/company", async (req, res) => {
  const week = startOfWeek();
  const teams = await prisma.team.findMany({
    include: { members: { where: { role: "team_member" } } },
  });

  const allMemberIds = teams.flatMap((t) => t.members.map((m) => m.id));
  const dashboards = await prisma.weeklyDashboard.findMany({
    where: { userId: { in: allMemberIds }, week },
    include: { metrics: { include: { metric: true } }, user: { select: { id: true, name: true, teamId: true, churnRisk: true } } },
  });

  const teamSummaries = teams.map((team) => {
    const teamDashboards = dashboards.filter((d) => d.user.teamId === team.id);
    const status = overallStatus(teamDashboards.map((d) => d.overallStatus));
    const submittedCount = teamDashboards.filter((d) => d.submittedAt).length;
    return {
      id: team.id,
      name: team.name,
      memberCount: team.members.length,
      status: team.members.length === 0 ? "green" : status,
      onTrack: teamDashboards.filter((d) => d.overallStatus === "green").length,
      submitted: submittedCount,
    };
  });

  // Alerts: high churn risk users + red status for 2+ consecutive weeks
  const churnRiskUsers = await prisma.user.findMany({
    where: { id: { in: allMemberIds }, churnRisk: "high" },
    select: { id: true, name: true, teamId: true, team: { select: { name: true } } },
  });

  // High performers: best % to target this week, across all metrics
  const performerScores: { userId: string; name: string; teamName: string; pct: number }[] = [];
  for (const dash of dashboards) {
    if (dash.metrics.length === 0) continue;
    const avgPct =
      dash.metrics.reduce((sum, m) => sum + pctToTarget(m.actual, m.target), 0) / dash.metrics.length;
    const team = teams.find((t) => t.id === dash.user.teamId);
    performerScores.push({ userId: dash.user.id, name: dash.user.name, teamName: team?.name ?? "", pct: avgPct });
  }
  performerScores.sort((a, b) => b.pct - a.pct);

  // Go/No-Go gates from evaluation frameworks
  const frameworks = await prisma.evaluationFramework.findMany();
  const goNoGoGates = frameworks
    .filter((f) => f.goNoGoGates)
    .map((f) => ({ frameworkName: f.name, teamId: f.teamId, gates: f.goNoGoGates }));

  // Internship pipeline summary
  const internships = await prisma.internship.findMany({
    where: { status: "active" },
    include: { user: { select: { id: true, name: true, teamId: true, team: { select: { name: true } } } }, supervisor: { select: { name: true } } },
  });
  const internshipPipeline = {
    active: internships.length,
    recommendHire: internships.filter((i) => i.conversionDecision === "recommend_hire").length,
    pending: internships.filter((i) => i.conversionDecision === "pending").length,
    interns: internships.map((i) => ({
      id: i.id,
      name: i.user.name,
      team: i.user.team?.name,
      track: i.track,
      supervisor: i.supervisor.name,
      conversionDecision: i.conversionDecision,
    })),
  };

  // Team leader performance: 1-on-1 completion rate this period + open feedback conversations
  const leaders = await prisma.user.findMany({
    where: { role: "team_leader" },
    select: { id: true, name: true, team: { select: { name: true } } },
  });
  const leaderIds = leaders.map((l) => l.id);
  const allOneOnOnes = await prisma.oneOnOne.findMany({ where: { managerId: { in: leaderIds } } });
  const allFeedback = await prisma.feedbackConversation.findMany({ where: { managerId: { in: leaderIds }, status: "open" } });
  const teamLeaderPerformance = leaders.map((l) => {
    const oneOnOnes = allOneOnOnes.filter((o) => o.managerId === l.id);
    const completed = oneOnOnes.filter((o) => o.status === "completed").length;
    return {
      id: l.id,
      name: l.name,
      team: l.team?.name,
      oneOnOneCompletionRate: oneOnOnes.length === 0 ? null : Math.round((completed / oneOnOnes.length) * 100),
      openFeedbackCount: allFeedback.filter((f) => f.managerId === l.id).length,
    };
  });

  res.json({
    week,
    teams: teamSummaries,
    alerts: {
      churnRisk: churnRiskUsers.map((u) => ({ id: u.id, name: u.name, team: u.team?.name })),
    },
    highPerformers: performerScores.slice(0, 5),
    goNoGoGates,
    internshipPipeline,
    teamLeaderPerformance,
  });
});

export default router;
