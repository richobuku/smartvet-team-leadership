import "dotenv/config";
import express from "express";
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SmartVet Performance API listening on port ${PORT}`);
});

startReminderCron();
