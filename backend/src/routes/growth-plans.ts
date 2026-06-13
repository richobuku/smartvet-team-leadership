import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { sendCalendarInvite } from "../lib/calendarInvite";

const router = Router();
router.use(requireAuth);

interface GrowthSkill {
  skill: string;
  howToDevelop?: string;
  byWhen?: string;
  status?: string;
}

// Sends a calendar invite for each skill milestone (byWhen) that's new or
// changed since the previous version of the plan, to the mentee and their
// manager (mentor).
async function notifyGrowthPlanMilestones(plan: { id: string; userId: string; skills: GrowthSkill[] }, previousSkills: GrowthSkill[]) {
  const user = await prisma.user.findUnique({ where: { id: plan.userId }, select: { id: true, name: true, email: true, managerId: true } });
  if (!user) return;
  const manager = user.managerId
    ? await prisma.user.findUnique({ where: { id: user.managerId }, select: { id: true, name: true, email: true } })
    : null;

  const attendees = [user, ...(manager ? [manager] : [])];

  for (let i = 0; i < plan.skills.length; i++) {
    const skill = plan.skills[i];
    if (!skill.byWhen) continue;
    const prev = previousSkills[i];
    if (prev?.byWhen === skill.byWhen) continue;

    sendCalendarInvite({
      uid: `growthplan-skill-${plan.id}-${i}`,
      title: `Growth Plan Check-in: ${skill.skill}`,
      description: `Target date for "${skill.skill}" for ${user.name}.${skill.howToDevelop ? `\n\nPlan: ${skill.howToDevelop}` : ""}`,
      start: new Date(skill.byWhen),
      durationMinutes: 15,
      attendees,
    }).catch(() => {});
  }
}

router.get("/user/:userId", async (req, res) => {
  const targetId = req.params.userId;
  const role = req.user!.role;
  const isSelf = req.user!.id === targetId;
  const isAdmin = role === "admin" || role === "executive";

  if (!isSelf && !isAdmin) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.managerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  }

  const plans = await prisma.growthPlan.findMany({ where: { userId: targetId }, orderBy: { quarter: "desc" } });
  res.json(plans);
});

router.post("/", async (req, res) => {
  const { userId, quarter, skills, promotionReadiness, mentorNotes } = req.body;
  if (!userId || !quarter || !skills) return res.status(400).json({ error: "userId, quarter, and skills are required" });

  const role = req.user!.role;
  const isSelf = req.user!.id === userId;
  const isAdmin = role === "admin" || role === "executive";
  if (!isSelf && !isAdmin) {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.managerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  }

  const quarterDate = new Date(quarter);
  const existing = await prisma.growthPlan.findUnique({ where: { userId_quarter: { userId, quarter: quarterDate } } });
  const plan = await prisma.growthPlan.upsert({
    where: { userId_quarter: { userId, quarter: quarterDate } },
    update: { skills, promotionReadiness, mentorNotes },
    create: { userId, quarter: quarterDate, skills, promotionReadiness, mentorNotes },
  });

  const previousSkills = Array.isArray(existing?.skills) ? (existing!.skills as unknown as GrowthSkill[]) : [];
  notifyGrowthPlanMilestones({ id: plan.id, userId: plan.userId, skills: skills as GrowthSkill[] }, previousSkills).catch(() => {});

  res.json(plan);
});

router.put("/:id/skill/:index", async (req, res) => {
  const plan = await prisma.growthPlan.findUnique({ where: { id: req.params.id } });
  if (!plan) return res.status(404).json({ error: "Not found" });

  const role = req.user!.role;
  const isSelf = req.user!.id === plan.userId;
  const isAdmin = role === "admin" || role === "executive";
  if (!isSelf && !isAdmin) {
    const target = await prisma.user.findUnique({ where: { id: plan.userId } });
    if (!target || target.managerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  }

  const skills = Array.isArray(plan.skills) ? [...(plan.skills as any[])] : [];
  const index = Number(req.params.index);
  if (index < 0 || index >= skills.length) return res.status(400).json({ error: "Invalid skill index" });

  skills[index] = { ...skills[index], status: req.body.status };
  const updated = await prisma.growthPlan.update({ where: { id: req.params.id }, data: { skills } });
  res.json(updated);
});

export default router;
