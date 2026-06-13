import cron from "node-cron";
import { prisma } from "./prisma";
import { sendCalendarReminder } from "./calendarInvite";

const TYPE_LABELS: Record<string, string> = {
  weekly: "Weekly 1-on-1",
  monthly: "Monthly 1-on-1",
  quarterly: "Quarterly 1-on-1",
};

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  underperformance: "Underperformance",
  quality_issue: "Quality Issue",
  behavior: "Behavior/Attitude",
  conflict: "Conflict",
  churn_risk: "Churn Risk",
};

function tomorrowRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Sends "tomorrow" reminder emails to mentor + mentee for every
// scheduled action across 1-on-1s, coaching follow-ups, feedback
// follow-ups, and growth plan milestones.
export async function sendTomorrowReminders(): Promise<void> {
  const { start, end } = tomorrowRange();

  const [oneOnOnes, coachingLogs, feedbackConversations, growthPlans] = await Promise.all([
    prisma.oneOnOne.findMany({
      where: { scheduledAt: { gte: start, lte: end }, status: "scheduled" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.coachingLog.findMany({
      where: { followUp: { gte: start, lte: end } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.feedbackConversation.findMany({
      where: { followUpDate: { gte: start, lte: end }, status: "open" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.growthPlan.findMany(),
  ]);

  for (const o of oneOnOnes) {
    await sendCalendarReminder({
      title: `${TYPE_LABELS[o.type] || "1-on-1"}: ${o.user.name} & ${o.manager.name}`,
      start: o.scheduledAt,
      attendees: [o.user, o.manager],
    });
  }

  for (const log of coachingLogs) {
    if (!log.followUp) continue;
    await sendCalendarReminder({
      title: `Coaching Follow-up: ${log.topic}`,
      description: log.action ? `Action: ${log.action}` : undefined,
      start: log.followUp,
      attendees: [log.user, log.manager],
    });
  }

  for (const fc of feedbackConversations) {
    if (!fc.followUpDate) continue;
    await sendCalendarReminder({
      title: `Feedback Follow-up: ${FEEDBACK_TYPE_LABELS[fc.conversationType] || "Feedback"}`,
      description: fc.actionPlan ? `Action plan: ${fc.actionPlan}` : undefined,
      start: fc.followUpDate,
      attendees: [fc.user, fc.manager],
    });
  }

  for (const plan of growthPlans) {
    const skills = Array.isArray(plan.skills) ? (plan.skills as any[]) : [];
    const dueSkills = skills.filter((s) => {
      if (!s.byWhen) return false;
      const d = new Date(s.byWhen);
      return d >= start && d <= end;
    });
    if (dueSkills.length === 0) continue;

    const user = await prisma.user.findUnique({ where: { id: plan.userId }, select: { id: true, name: true, email: true, managerId: true } });
    if (!user) continue;
    const manager = user.managerId
      ? await prisma.user.findUnique({ where: { id: user.managerId }, select: { id: true, name: true, email: true } })
      : null;
    const attendees = [user, ...(manager ? [manager] : [])];

    for (const skill of dueSkills) {
      await sendCalendarReminder({
        title: `Growth Plan Check-in: ${skill.skill}`,
        description: skill.howToDevelop ? `Plan: ${skill.howToDevelop}` : undefined,
        start: new Date(skill.byWhen),
        attendees,
      });
    }
  }
}

// Runs once a day at 07:00 server time.
export function startReminderCron(): void {
  cron.schedule("0 7 * * *", () => {
    sendTomorrowReminders().catch((err) => console.error("[reminderCron] Failed:", err));
  });
}
