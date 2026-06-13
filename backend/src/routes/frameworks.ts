import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/team/:teamId", async (req, res) => {
  const frameworks = await prisma.evaluationFramework.findMany({ where: { teamId: req.params.teamId } });
  res.json(frameworks);
});

router.get("/:id", async (req, res) => {
  const framework = await prisma.evaluationFramework.findUnique({ where: { id: req.params.id } });
  if (!framework) return res.status(404).json({ error: "Not found" });
  res.json(framework);
});

router.post("/", requireRole("admin", "executive", "team_leader"), async (req, res) => {
  const { name, teamId, description, kpis, trafficLightLogic, goNoGoGates } = req.body;
  if (!name || !teamId || !kpis) return res.status(400).json({ error: "name, teamId, kpis are required" });
  const framework = await prisma.evaluationFramework.create({
    data: { name, teamId, description, kpis, trafficLightLogic, goNoGoGates },
  });
  res.status(201).json(framework);
});

router.put("/:id", requireRole("admin", "executive", "team_leader"), async (req, res) => {
  const { name, description, kpis, trafficLightLogic, goNoGoGates } = req.body;
  const framework = await prisma.evaluationFramework.update({
    where: { id: req.params.id },
    data: { name, description, kpis, trafficLightLogic, goNoGoGates },
  });
  res.json(framework);
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  await prisma.evaluationFramework.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
