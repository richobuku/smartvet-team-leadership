import "dotenv/config";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import teamRoutes from "./routes/teams";
import metricRoutes from "./routes/metrics";
import checkinRoutes from "./routes/checkins";
import dashboardRoutes from "./routes/dashboards";
import scorecardRoutes from "./routes/scorecards";
import coachingRoutes from "./routes/coaching";
import celebrationRoutes from "./routes/celebrations";
import frameworkRoutes from "./routes/frameworks";
import analyticsRoutes from "./routes/analytics";
import internshipRoutes from "./routes/internships";
import oneOnOneRoutes from "./routes/oneonones";
import feedbackRoutes from "./routes/feedback";
import growthPlanRoutes from "./routes/growth-plans";
import guideRoutes from "./routes/guides";
import recruitmentRoutes from "./routes/recruitment";
import panelRoutes from "./routes/panels";
import binderRoutes from "./routes/binders";
import pushRoutes from "./routes/push";
import { startReminderCron } from "./lib/reminderCron";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);
app.use("/metrics", metricRoutes);
app.use("/checkins", checkinRoutes);
app.use("/dashboards", dashboardRoutes);
app.use("/scorecards", scorecardRoutes);
app.use("/coaching", coachingRoutes);
app.use("/celebrations", celebrationRoutes);
app.use("/frameworks", frameworkRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/internships", internshipRoutes);
app.use("/oneonones", oneOnOneRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/growth-plans", growthPlanRoutes);
app.use("/guides", guideRoutes);
app.use("/recruitment", recruitmentRoutes);
app.use("/panels", panelRoutes);
app.use("/binders", binderRoutes);
app.use("/push", pushRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (err?.code === "P2025") return res.status(404).json({ error: "Not found" });
  if (err?.code === "P2002") return res.status(409).json({ error: "Conflict: record already exists" });
  if (err?.code === "P2003") return res.status(400).json({ error: "Invalid reference to a related record" });
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SmartVet Performance API listening on port ${PORT}`);
});

startReminderCron();
