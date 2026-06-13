import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const guides = await prisma.mentorshipGuide.findMany({ select: { id: true, role: true, title: true } });
  res.json(guides);
});

// Returns the guides relevant to the signed-in user: everyone gets the
// master guide, team leaders (and execs/admins) get the leader playbook,
// team members get "Your Guide" — and a team leader who is themselves
// mentored by someone (managerId set) gets "Your Guide" too.
router.get("/mine", async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { role: true, managerId: true },
  });

  const roles = new Set<string>(["master"]);
  if (me?.role === "team_leader" || me?.role === "executive" || me?.role === "admin") {
    roles.add("team_leader");
  }
  if (me?.role === "team_member" || me?.managerId) {
    roles.add("team_member");
  }

  const guides = await prisma.mentorshipGuide.findMany({ where: { role: { in: [...roles] } } });
  const order: Record<string, number> = { master: 0, team_leader: 1, team_member: 2 };
  guides.sort((a, b) => (order[a.role] ?? 99) - (order[b.role] ?? 99));
  res.json(guides);
});

// Per-user checklist progress + personal notes against a guide.
router.get("/:guideId/progress", async (req, res) => {
  const progress = await prisma.guideProgress.findUnique({
    where: { userId_guideId: { userId: req.user!.id, guideId: req.params.guideId } },
  });
  res.json(progress || { completedItems: [], notes: "" });
});

router.put("/:guideId/progress", async (req, res) => {
  const { completedItems, notes } = req.body;
  const progress = await prisma.guideProgress.upsert({
    where: { userId_guideId: { userId: req.user!.id, guideId: req.params.guideId } },
    update: {
      ...(completedItems !== undefined ? { completedItems } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
    create: {
      userId: req.user!.id,
      guideId: req.params.guideId,
      completedItems: completedItems || [],
      notes: notes ?? null,
    },
  });
  res.json(progress);
});

router.get("/:role", async (req, res) => {
  const guides = await prisma.mentorshipGuide.findMany({
    where: { role: { in: [req.params.role, "master"] } },
    orderBy: { role: "asc" },
  });
  res.json(guides);
});

export default router;
