import { PrismaClient, Frequency, Status } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calcStatus } from "../src/lib/status";

const prisma = new PrismaClient();

const PASSWORD = "password123";

function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  console.log("Seeding database...");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // --- Admin & Executive ---
  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@smartvet.africa", passwordHash, role: "admin" },
  });
  const exec = await prisma.user.create({
    data: { name: "Richard Otieno", email: "richard.ceo@smartvet.africa", passwordHash, role: "executive" },
  });

  // --- Teams ---
  const farmerSuccess = await prisma.team.create({
    data: { name: "Farmer Success Team", description: "Trains and supports farmers across the network." },
  });
  const paravetRecruitment = await prisma.team.create({
    data: { name: "Paravet Recruitment Team", description: "Recruits and onboards paravets into the network." },
  });
  const vetSupplies = await prisma.team.create({
    data: { name: "Veterinary Supplies Sales Team", description: "Drives revenue through veterinary supply sales." },
  });
  const complianceQuality = await prisma.team.create({
    data: { name: "Compliance/Quality Team", description: "Ensures quality standards and regulatory compliance." },
  });
  const techTeam = await prisma.team.create({
    data: { name: "Tech Team", description: "Builds and maintains Smartvet's internal tools and apps." },
  });

  // --- Team Leaders ---
  const amara = await prisma.user.create({
    data: { name: "Amara Chukwu", email: "amara@smartvet.africa", passwordHash, role: "team_leader", teamId: farmerSuccess.id },
  });
  const brian = await prisma.user.create({
    data: { name: "Brian Kiprotich", email: "brian@smartvet.africa", passwordHash, role: "team_leader", teamId: paravetRecruitment.id },
  });
  const david = await prisma.user.create({
    data: { name: "David Mensah", email: "david@smartvet.africa", passwordHash, role: "team_leader", teamId: vetSupplies.id },
  });
  const esther = await prisma.user.create({
    data: { name: "Esther Wanjiru", email: "esther@smartvet.africa", passwordHash, role: "team_leader", teamId: complianceQuality.id },
  });
  const tom = await prisma.user.create({
    data: { name: "Tom Wekesa", email: "tom@smartvet.africa", passwordHash, role: "team_leader", teamId: techTeam.id },
  });

  await prisma.team.update({ where: { id: farmerSuccess.id }, data: { leaderId: amara.id } });
  await prisma.team.update({ where: { id: paravetRecruitment.id }, data: { leaderId: brian.id } });
  await prisma.team.update({ where: { id: vetSupplies.id }, data: { leaderId: david.id } });
  await prisma.team.update({ where: { id: complianceQuality.id }, data: { leaderId: esther.id } });
  await prisma.team.update({ where: { id: techTeam.id }, data: { leaderId: tom.id } });

  // --- Members ---
  const john = await prisma.user.create({
    data: { name: "John Ouma", email: "john@smartvet.africa", passwordHash, role: "team_member", teamId: farmerSuccess.id, managerId: amara.id, weeklyTarget: 250, promotionTrack: "senior_ic" },
  });
  const grace = await prisma.user.create({
    data: { name: "Grace Adhiambo", email: "grace@smartvet.africa", passwordHash, role: "team_member", teamId: farmerSuccess.id, managerId: amara.id, weeklyTarget: 250 },
  });
  const moses = await prisma.user.create({
    data: { name: "Moses Kamau", email: "moses@smartvet.africa", passwordHash, role: "team_member", teamId: farmerSuccess.id, managerId: amara.id, weeklyTarget: 250 },
  });

  const michael = await prisma.user.create({
    data: { name: "Michael Njoroge", email: "michael@smartvet.africa", passwordHash, role: "team_member", teamId: paravetRecruitment.id, managerId: brian.id, weeklyTarget: 6 },
  });
  const linda = await prisma.user.create({
    data: { name: "Linda Achieng", email: "linda@smartvet.africa", passwordHash, role: "team_member", teamId: paravetRecruitment.id, managerId: brian.id, weeklyTarget: 6 },
  });

  const kwame = await prisma.user.create({
    data: { name: "Kwame Asante", email: "kwame@smartvet.africa", passwordHash, role: "team_member", teamId: vetSupplies.id, managerId: david.id, weeklyTarget: 5 },
  });
  const asha = await prisma.user.create({
    data: { name: "Asha Mwangi", email: "asha@smartvet.africa", passwordHash, role: "team_member", teamId: vetSupplies.id, managerId: david.id, weeklyTarget: 5 },
  });

  const peter = await prisma.user.create({
    data: { name: "Peter Omondi", email: "peter@smartvet.africa", passwordHash, role: "team_member", teamId: complianceQuality.id, managerId: esther.id, weeklyTarget: 3 },
  });
  const joyce = await prisma.user.create({
    data: { name: "Joyce Nakato", email: "joyce@smartvet.africa", passwordHash, role: "team_member", teamId: complianceQuality.id, managerId: esther.id, weeklyTarget: 3 },
  });

  // --- Interns ---
  const faith = await prisma.user.create({
    data: { name: "Faith Wambui", email: "faith@smartvet.africa", passwordHash, role: "team_member", teamId: techTeam.id, managerId: tom.id, weeklyTarget: 10, employmentType: "intern" },
  });
  const samuel = await prisma.user.create({
    data: { name: "Samuel Kiptoo", email: "samuel@smartvet.africa", passwordHash, role: "team_member", teamId: paravetRecruitment.id, managerId: brian.id, weeklyTarget: 30, employmentType: "intern" },
  });
  const mercy = await prisma.user.create({
    data: { name: "Mercy Atieno", email: "mercy@smartvet.africa", passwordHash, role: "team_member", teamId: farmerSuccess.id, managerId: amara.id, weeklyTarget: 150, employmentType: "intern" },
  });

  // --- Metrics ---
  const farmersTrained = await prisma.metric.create({
    data: { name: "Farmers Trained", description: "Number of farmers trained this week", teamId: farmerSuccess.id, frequency: Frequency.weekly, target: 250, unit: "farmers", greenThreshold: 95, yellowThreshold: 80 },
  });
  const confirmationRate = await prisma.metric.create({
    data: { name: "Pre-Notification Confirmation Rate", teamId: farmerSuccess.id, frequency: Frequency.weekly, target: 75, unit: "%", greenThreshold: 95, yellowThreshold: 85 },
  });
  const deliveryCompletion = await prisma.metric.create({
    data: { name: "Delivery Completion Rate", teamId: farmerSuccess.id, frequency: Frequency.weekly, target: 80, unit: "%", greenThreshold: 95, yellowThreshold: 85 },
  });
  const satisfaction = await prisma.metric.create({
    data: { name: "Farmer Satisfaction Rating", teamId: farmerSuccess.id, frequency: Frequency.weekly, target: 4.0, unit: "stars", greenThreshold: 95, yellowThreshold: 85 },
  });
  const monthlyRetention = await prisma.metric.create({
    data: { name: "Monthly Retention", teamId: farmerSuccess.id, frequency: Frequency.monthly, target: 95, unit: "%", greenThreshold: 98, yellowThreshold: 90 },
  });

  const callsCompleted = await prisma.metric.create({
    data: { name: "Calls Completed", teamId: paravetRecruitment.id, frequency: Frequency.weekly, target: 60, unit: "calls", greenThreshold: 95, yellowThreshold: 80 },
  });
  const interviewsScheduled = await prisma.metric.create({
    data: { name: "Interviews Scheduled", teamId: paravetRecruitment.id, frequency: Frequency.weekly, target: 12, unit: "interviews", greenThreshold: 95, yellowThreshold: 80 },
  });
  const offersSent = await prisma.metric.create({
    data: { name: "Offers Sent", teamId: paravetRecruitment.id, frequency: Frequency.weekly, target: 8, unit: "offers", greenThreshold: 95, yellowThreshold: 80 },
  });
  const paravetsSigned = await prisma.metric.create({
    data: { name: "Paravets Signed", teamId: paravetRecruitment.id, frequency: Frequency.weekly, target: 6, unit: "paravets", greenThreshold: 95, yellowThreshold: 80 },
  });
  const paravetsRecruited = await prisma.metric.create({
    data: { name: "Paravets Recruited", teamId: paravetRecruitment.id, frequency: Frequency.monthly, target: 25, unit: "paravets", greenThreshold: 95, yellowThreshold: 80 },
  });

  const pipelineValue = await prisma.metric.create({
    data: { name: "Sales Pipeline Value", teamId: vetSupplies.id, frequency: Frequency.weekly, target: 25000, unit: "USD", greenThreshold: 95, yellowThreshold: 80 },
  });
  const newAccounts = await prisma.metric.create({
    data: { name: "New Accounts", teamId: vetSupplies.id, frequency: Frequency.weekly, target: 5, unit: "accounts", greenThreshold: 95, yellowThreshold: 80 },
  });
  const revenue = await prisma.metric.create({
    data: { name: "Revenue", teamId: vetSupplies.id, frequency: Frequency.monthly, target: 50000, unit: "USD", greenThreshold: 95, yellowThreshold: 80 },
  });
  const customerRetention = await prisma.metric.create({
    data: { name: "Customer Retention", teamId: vetSupplies.id, frequency: Frequency.monthly, target: 90, unit: "%", greenThreshold: 98, yellowThreshold: 90 },
  });

  const auditsCompleted = await prisma.metric.create({
    data: { name: "Audits Completed", teamId: complianceQuality.id, frequency: Frequency.weekly, target: 3, unit: "audits", greenThreshold: 95, yellowThreshold: 80 },
  });
  const complianceScore = await prisma.metric.create({
    data: { name: "Compliance Score", teamId: complianceQuality.id, frequency: Frequency.weekly, target: 95, unit: "%", greenThreshold: 98, yellowThreshold: 90 },
  });

  const tasksCompleted = await prisma.metric.create({
    data: { name: "Tasks Completed", teamId: techTeam.id, frequency: Frequency.weekly, target: 10, unit: "tasks", greenThreshold: 95, yellowThreshold: 80 },
  });
  const codeReviews = await prisma.metric.create({
    data: { name: "Code Reviews Done", teamId: techTeam.id, frequency: Frequency.weekly, target: 5, unit: "reviews", greenThreshold: 95, yellowThreshold: 80 },
  });

  // --- Evaluation Frameworks ---
  await prisma.evaluationFramework.create({
    data: {
      name: "Farmer Success Manager Framework",
      teamId: farmerSuccess.id,
      description: "Train, confirm, deliver, and retain farmers across the network.",
      kpis: [
        { name: "Farmers Trained", target: 1000, frequency: "monthly" },
        { name: "Pre-Notification Confirmation", target: 75, frequency: "weekly" },
        { name: "Delivery Completion", target: 80, frequency: "weekly" },
        { name: "Farmer Satisfaction", target: 4.0, frequency: "weekly" },
        { name: "Monthly Retention", target: 95, frequency: "monthly" },
      ],
      trafficLightLogic: "GREEN if all KPIs >=95% of target, YELLOW if >=80%, RED if below 80%",
      goNoGoGates: [
        { gate: 1, month: 1, criteria: "1,000 farmers trained, 60% confirmation" },
        { gate: 2, month: 2, criteria: "2,500 cumulative, 70% confirmation" },
        { gate: 3, month: 3, criteria: "5,000 cumulative, 75% confirmation" },
      ],
    },
  });

  await prisma.evaluationFramework.create({
    data: {
      name: "Paravet Recruitment Lead Framework",
      teamId: paravetRecruitment.id,
      description: "Recruit 150 new paravets (450 -> 600) from July-December 2026 with 95%+ retention.",
      kpis: [
        { name: "Calls Completed", target: 60, frequency: "weekly" },
        { name: "Interviews Scheduled", target: 12, frequency: "weekly" },
        { name: "Offers Sent", target: 8, frequency: "weekly" },
        { name: "Paravets Signed", target: 6, frequency: "weekly" },
        { name: "Paravets Recruited", target: 25, frequency: "monthly" },
      ],
      trafficLightLogic: "GREEN 95-100% of target, YELLOW 80-95%, RED below 80%",
      goNoGoGates: [
        { gate: 1, month: 1, criteria: "25 paravets recruited" },
        { gate: 2, month: 2, criteria: "50 cumulative recruited" },
        { gate: 3, month: 3, criteria: "150 cumulative, network reaches 600" },
      ],
    },
  });

  await prisma.evaluationFramework.create({
    data: {
      name: "Veterinary Supplies Sales Rep Framework",
      teamId: vetSupplies.id,
      description: "Drive revenue and account growth across the veterinary supplies network.",
      kpis: [
        { name: "Sales Pipeline Value", target: 25000, frequency: "weekly" },
        { name: "New Accounts", target: 5, frequency: "weekly" },
        { name: "Revenue", target: 50000, frequency: "monthly" },
        { name: "Customer Retention", target: 90, frequency: "monthly" },
      ],
      trafficLightLogic: "GREEN 95-100% of target, YELLOW 80-95%, RED below 80%",
      goNoGoGates: [
        { gate: 1, month: 1, criteria: "$50K revenue, 20 new accounts" },
        { gate: 2, month: 2, criteria: "$100K cumulative revenue" },
      ],
    },
  });

  await prisma.evaluationFramework.create({
    data: {
      name: "Compliance/Quality Officer Framework",
      teamId: complianceQuality.id,
      description: "Maintain quality standards and regulatory compliance across operations.",
      kpis: [
        { name: "Audits Completed", target: 3, frequency: "weekly" },
        { name: "Compliance Score", target: 95, frequency: "weekly" },
      ],
      trafficLightLogic: "GREEN 95-100% of target, YELLOW 80-95%, RED below 80%",
      goNoGoGates: [{ gate: 1, month: 1, criteria: "12 audits completed, 95%+ compliance score" }],
    },
  });

  await prisma.evaluationFramework.create({
    data: {
      name: "Software Engineering Intern Framework",
      teamId: techTeam.id,
      description: "Build real features, learn the codebase, and demonstrate readiness for a full-time engineering role.",
      kpis: [
        { name: "Tasks Completed", target: 10, frequency: "weekly" },
        { name: "Code Reviews Done", target: 5, frequency: "weekly" },
      ],
      trafficLightLogic: "GREEN 95-100% of target, YELLOW 80-95%, RED below 80%",
      goNoGoGates: [
        { gate: 1, month: 1, criteria: "Onboarded, shipping small tasks independently" },
        { gate: 2, month: 2, criteria: "Owning medium-sized features end-to-end" },
        { gate: 3, month: 3, criteria: "Conversion review: recommend hire / extend / end" },
      ],
    },
  });

  // --- Sample weekly dashboards (this week and last week) for each member ---
  const thisWeek = startOfWeek();
  const lastWeek = addDays(thisWeek, -7);
  const twoWeeksAgo = addDays(thisWeek, -14);

  type WeeklyEntry = { metricId: string; target: number; actual: number };
  type MemberWeeklyData = {
    user: typeof john;
    weeks: { week: Date; entries: WeeklyEntry[]; biggestWin?: string; biggestBlocker?: string; managerNotes?: string; submitted: boolean }[];
  };

  const memberData: MemberWeeklyData[] = [
    {
      user: john,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: farmersTrained.id, target: 250, actual: 240 },
          { metricId: confirmationRate.id, target: 75, actual: 70 },
          { metricId: deliveryCompletion.id, target: 80, actual: 78 },
          { metricId: satisfaction.id, target: 4.0, actual: 3.9 },
        ], biggestWin: "Trained 240 farmers across 3 villages.", biggestBlocker: "Confirmation calls delayed due to network issues.", managerNotes: "Great effort John, confirmations are close to target. One more push next week.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: farmersTrained.id, target: 250, actual: 170 },
          { metricId: confirmationRate.id, target: 75, actual: 73 },
          { metricId: deliveryCompletion.id, target: 80, actual: 78 },
          { metricId: satisfaction.id, target: 4.0, actual: 3.9 },
        ], biggestWin: "Confirmation rate trending up.", biggestBlocker: "Behind on farmer training count, 2 days left.", submitted: false },
      ],
    },
    {
      user: grace,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: farmersTrained.id, target: 250, actual: 270 },
          { metricId: confirmationRate.id, target: 75, actual: 80 },
          { metricId: deliveryCompletion.id, target: 80, actual: 85 },
          { metricId: satisfaction.id, target: 4.0, actual: 4.2 },
        ], biggestWin: "100% retention across her cohort this month!", managerNotes: "Outstanding work Grace, keep it up!", submitted: true },
        { week: thisWeek, entries: [
          { metricId: farmersTrained.id, target: 250, actual: 260 },
          { metricId: confirmationRate.id, target: 75, actual: 82 },
          { metricId: deliveryCompletion.id, target: 80, actual: 88 },
          { metricId: satisfaction.id, target: 4.0, actual: 4.3 },
        ], biggestWin: "Another strong week, on pace to exceed target.", submitted: false },
      ],
    },
    {
      user: moses,
      weeks: [
        { week: twoWeeksAgo, entries: [
          { metricId: farmersTrained.id, target: 250, actual: 150 },
          { metricId: confirmationRate.id, target: 75, actual: 55 },
          { metricId: deliveryCompletion.id, target: 80, actual: 60 },
          { metricId: satisfaction.id, target: 4.0, actual: 3.5 },
        ], biggestBlocker: "Vehicle breakdown limited village visits.", managerNotes: "Tough week, let's get the vehicle issue resolved.", submitted: true },
        { week: lastWeek, entries: [
          { metricId: farmersTrained.id, target: 250, actual: 140 },
          { metricId: confirmationRate.id, target: 75, actual: 58 },
          { metricId: deliveryCompletion.id, target: 80, actual: 62 },
          { metricId: satisfaction.id, target: 4.0, actual: 3.6 },
        ], biggestBlocker: "Still catching up after the vehicle issue.", managerNotes: "Two weeks behind now - scheduling daily check-ins and a coaching session.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: farmersTrained.id, target: 250, actual: 95 },
          { metricId: confirmationRate.id, target: 75, actual: 60 },
          { metricId: deliveryCompletion.id, target: 80, actual: 65 },
          { metricId: satisfaction.id, target: 4.0, actual: 3.7 },
        ], biggestBlocker: "Working through the backlog with extra support.", submitted: false },
      ],
    },
    {
      user: michael,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: callsCompleted.id, target: 60, actual: 58 },
          { metricId: interviewsScheduled.id, target: 12, actual: 11 },
          { metricId: offersSent.id, target: 8, actual: 7 },
          { metricId: paravetsSigned.id, target: 6, actual: 6 },
        ], biggestWin: "Hit recruitment target for the week!", managerNotes: "Solid week, keep the pipeline full.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: callsCompleted.id, target: 60, actual: 45 },
          { metricId: interviewsScheduled.id, target: 12, actual: 9 },
          { metricId: offersSent.id, target: 8, actual: 5 },
          { metricId: paravetsSigned.id, target: 6, actual: 4 },
        ], biggestBlocker: "Several scheduled interviews rescheduled by candidates.", submitted: false },
      ],
    },
    {
      user: linda,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: callsCompleted.id, target: 60, actual: 65 },
          { metricId: interviewsScheduled.id, target: 12, actual: 14 },
          { metricId: offersSent.id, target: 8, actual: 9 },
          { metricId: paravetsSigned.id, target: 6, actual: 7 },
        ], biggestWin: "Exceeded paravet signing target!", managerNotes: "Excellent work Linda, great channel diversification.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: callsCompleted.id, target: 60, actual: 50 },
          { metricId: interviewsScheduled.id, target: 12, actual: 10 },
          { metricId: offersSent.id, target: 8, actual: 7 },
          { metricId: paravetsSigned.id, target: 6, actual: 5 },
        ], biggestWin: "On pace for another good week.", submitted: false },
      ],
    },
    {
      user: kwame,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: pipelineValue.id, target: 25000, actual: 24000 },
          { metricId: newAccounts.id, target: 5, actual: 4 },
        ], biggestWin: "Closed a major deal with a new agro-vet shop.", managerNotes: "Good momentum, let's push for 5 new accounts this week.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: pipelineValue.id, target: 25000, actual: 18000 },
          { metricId: newAccounts.id, target: 5, actual: 3 },
        ], biggestBlocker: "Two prospects delayed procurement decisions.", submitted: false },
      ],
    },
    {
      user: asha,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: pipelineValue.id, target: 25000, actual: 27000 },
          { metricId: newAccounts.id, target: 5, actual: 6 },
        ], biggestWin: "Best pipeline week this quarter.", managerNotes: "Fantastic work Asha!", submitted: true },
        { week: thisWeek, entries: [
          { metricId: pipelineValue.id, target: 25000, actual: 26000 },
          { metricId: newAccounts.id, target: 5, actual: 5 },
        ], biggestWin: "Already at target with 2 days to go.", submitted: false },
      ],
    },
    {
      user: peter,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: auditsCompleted.id, target: 3, actual: 3 },
          { metricId: complianceScore.id, target: 95, actual: 96 },
        ], biggestWin: "All audits completed on schedule.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: auditsCompleted.id, target: 3, actual: 2 },
          { metricId: complianceScore.id, target: 95, actual: 94 },
        ], biggestBlocker: "One audit pushed to next week due to site access.", submitted: false },
      ],
    },
    {
      user: joyce,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: auditsCompleted.id, target: 3, actual: 3 },
          { metricId: complianceScore.id, target: 95, actual: 97 },
        ], biggestWin: "Identified and resolved 2 compliance gaps proactively.", managerNotes: "Great proactive catch on those gaps.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: auditsCompleted.id, target: 3, actual: 3 },
          { metricId: complianceScore.id, target: 95, actual: 98 },
        ], biggestWin: "Another clean week.", submitted: false },
      ],
    },
    {
      user: faith,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: tasksCompleted.id, target: 10, actual: 9 },
          { metricId: codeReviews.id, target: 5, actual: 5 },
        ], biggestWin: "Shipped the first standalone feature (celebration feed UI).", managerNotes: "Great progress, code quality is improving fast.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: tasksCompleted.id, target: 10, actual: 10 },
          { metricId: codeReviews.id, target: 5, actual: 6 },
        ], biggestWin: "Hit task target and helped review a teammate's PR.", submitted: false },
      ],
    },
    {
      user: samuel,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: callsCompleted.id, target: 60, actual: 40 },
          { metricId: interviewsScheduled.id, target: 12, actual: 6 },
        ], biggestWin: "Completed onboarding and shadowed 5 candidate calls.", managerNotes: "Good first week, ramping up call volume next.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: callsCompleted.id, target: 60, actual: 48 },
          { metricId: interviewsScheduled.id, target: 12, actual: 8 },
        ], biggestWin: "Booked first 3 interviews independently.", submitted: false },
      ],
    },
    {
      user: mercy,
      weeks: [
        { week: lastWeek, entries: [
          { metricId: farmersTrained.id, target: 150, actual: 145 },
          { metricId: confirmationRate.id, target: 75, actual: 76 },
        ], biggestWin: "Trained 145 farmers in first solo week.", managerNotes: "Excellent start, almost at full target already.", submitted: true },
        { week: thisWeek, entries: [
          { metricId: farmersTrained.id, target: 150, actual: 152 },
          { metricId: confirmationRate.id, target: 75, actual: 79 },
        ], biggestWin: "Exceeded target for the first time.", submitted: false },
      ],
    },
  ];

  for (const md of memberData) {
    for (const w of md.weeks) {
      const computed = w.entries.map((e) => {
        const metric = [
          farmersTrained, confirmationRate, deliveryCompletion, satisfaction, monthlyRetention,
          callsCompleted, interviewsScheduled, offersSent, paravetsSigned, paravetsRecruited,
          pipelineValue, newAccounts, revenue, customerRetention,
          auditsCompleted, complianceScore, tasksCompleted, codeReviews,
        ].find((m) => m.id === e.metricId)!;
        return {
          metricId: e.metricId,
          target: e.target,
          actual: e.actual,
          status: calcStatus(e.actual, e.target, metric.greenThreshold, metric.yellowThreshold) as Status,
        };
      });
      const overall = computed.some((c) => c.status === "red")
        ? Status.red
        : computed.some((c) => c.status === "yellow")
        ? Status.yellow
        : Status.green;

      await prisma.weeklyDashboard.create({
        data: {
          userId: md.user.id,
          managerId: md.user.managerId!,
          week: w.week,
          overallStatus: overall,
          biggestWin: w.biggestWin,
          biggestBlocker: w.biggestBlocker,
          managerReviewNotes: w.managerNotes,
          submittedAt: w.submitted ? w.week : null,
          metrics: { create: computed },
        },
      });

      // Also record raw metric datapoints
      for (const e of w.entries) {
        await prisma.metricDatapoint.create({
          data: { metricId: e.metricId, userId: md.user.id, date: w.week, value: e.actual, submittedById: md.user.managerId! },
        });
      }
    }
  }

  // Moses has been RED for 2 consecutive weeks -> mark high churn risk
  await prisma.user.update({ where: { id: moses.id }, data: { churnRisk: "high" } });

  // --- Daily check-ins (today) ---
  await prisma.dailyCheckIn.create({
    data: { userId: john.id, managerId: amara.id, bigWin: "Confirmed 50 farmers via phone today.", blocker: "Network connectivity in the field is patchy.", needsHelp: false, notes: "Trying a new call script." },
  });
  await prisma.dailyCheckIn.create({
    data: { userId: moses.id, managerId: amara.id, bigWin: "Vehicle is back in service.", blocker: "Still behind on weekly farmer count.", needsHelp: true, notes: "Could use an extra day of support from another FSM." },
  });
  await prisma.dailyCheckIn.create({
    data: { userId: michael.id, managerId: brian.id, bigWin: "Rescheduled 3 of the 4 cancelled interviews.", blocker: "One candidate dropped out entirely.", needsHelp: false },
  });

  // --- Coaching logs ---
  const mosesCoachingLog = await prisma.coachingLog.create({
    data: {
      userId: moses.id, managerId: amara.id,
      topic: "Recovering from operational setbacks",
      notes: "Discussed the vehicle breakdown's impact on weekly numbers. Agreed on a recovery plan: prioritize nearby villages this week and request support from Grace for 2 days.\n\nRoot cause: Vehicle breakdown limited village access for two consecutive weeks, compounding a backlog.",
      action: "Moses will focus on 3 nearby villages and track daily farmer counts.",
      followUp: addDays(new Date(), 3),
      outcome: "in_progress",
    },
  });
  await prisma.coachingLog.create({
    data: {
      userId: john.id, managerId: amara.id,
      topic: "Improving farmer confirmations",
      notes: "John mentioned confirmation calls 3 days before delivery have low pickup rates.",
      action: "Try calling farmers 2 hours before delivery instead of 3 days before.",
      followUp: addDays(new Date(), 7),
      outcome: "implemented",
    },
  });
  await prisma.coachingLog.create({
    data: {
      userId: michael.id, managerId: brian.id,
      topic: "Handling candidate drop-offs",
      notes: "Michael discouraged after a strong candidate dropped out post-offer. Discussed normalizing this and building a stronger pipeline buffer.",
      action: "Maintain at least 2x target candidates in late-stage pipeline.",
      followUp: addDays(new Date(), 5),
      outcome: "pending",
    },
  });

  // --- Celebrations ---
  await prisma.celebrationLog.create({
    data: { userId: grace.id, managerId: amara.id, achievement: "100% farmer retention this month!", impact: "Demonstrates the strength of her follow-up process - a model for the team.", visibility: "company" },
  });
  await prisma.celebrationLog.create({
    data: { userId: linda.id, managerId: brian.id, achievement: "Exceeded paravet signing target by 17% last week.", impact: "Strong channel diversification is paying off.", visibility: "team" },
  });
  await prisma.celebrationLog.create({
    data: { userId: asha.id, managerId: david.id, achievement: "Best sales pipeline week this quarter.", impact: "On track to exceed monthly revenue target.", visibility: "company" },
  });
  await prisma.celebrationLog.create({
    data: { userId: joyce.id, managerId: esther.id, achievement: "Proactively identified and resolved 2 compliance gaps.", impact: "Reduces audit risk for the whole network.", visibility: "team" },
  });

  // --- Internships ---
  await prisma.internship.create({
    data: {
      userId: faith.id,
      supervisorId: tom.id,
      track: "Software Engineering Intern",
      startDate: addDays(thisWeek, -56),
      plannedEndDate: addDays(thisWeek, 28),
      status: "active",
      conversionDecision: "recommend_hire",
      conversionNotes: "Consistently exceeding task targets and contributing high-quality code reviews. Recommend converting to full-time engineer at end of internship.",
      decidedAt: addDays(thisWeek, -7),
    },
  });
  await prisma.internship.create({
    data: {
      userId: samuel.id,
      supervisorId: brian.id,
      track: "Paravet Recruitment Intern",
      startDate: addDays(thisWeek, -14),
      plannedEndDate: addDays(thisWeek, 70),
      status: "active",
      conversionDecision: "pending",
    },
  });
  await prisma.internship.create({
    data: {
      userId: mercy.id,
      supervisorId: amara.id,
      track: "Farmer Success Intern",
      startDate: addDays(thisWeek, -7),
      plannedEndDate: addDays(thisWeek, 77),
      status: "active",
      conversionDecision: "pending",
    },
  });

  // --- Coaching check-ins (follow-up on Moses's coaching log) ---
  await prisma.coachingCheckIn.create({
    data: {
      coachingLogId: mosesCoachingLog.id,
      type: "day3",
      date: addDays(new Date(), -2),
      notes: "Moses reports the vehicle is back and he's caught up on 2 of the 3 priority villages.",
      decision: "improving",
    },
  });

  // --- 1-on-1s ---
  await prisma.oneOnOne.create({
    data: {
      userId: john.id, managerId: amara.id,
      type: "weekly",
      scheduledAt: addDays(thisWeek, 1),
      status: "scheduled",
    },
  });
  await prisma.oneOnOne.create({
    data: {
      userId: grace.id, managerId: amara.id,
      type: "weekly",
      scheduledAt: addDays(lastWeek, 2),
      status: "completed",
      completedAt: addDays(lastWeek, 2),
      notes: "Grace continues to lead the team on retention. Discussed mentoring Mercy informally.",
      actionItems: ["Pair Grace with Mercy for shadowing next week", "Share Grace's confirmation call script with the team"],
      recapNotes: "Great week. Grace will start informally mentoring Mercy.",
    },
  });
  await prisma.oneOnOne.create({
    data: {
      userId: moses.id, managerId: amara.id,
      type: "weekly",
      scheduledAt: addDays(thisWeek, 2),
      status: "scheduled",
    },
  });
  await prisma.oneOnOne.create({
    data: {
      userId: faith.id, managerId: tom.id,
      type: "monthly",
      scheduledAt: addDays(lastWeek, 3),
      status: "completed",
      completedAt: addDays(lastWeek, 3),
      notes: "Reviewed Faith's progress on the celebration feed feature. She's ready for more ownership.",
      actionItems: ["Assign Faith the next dashboard feature with less guidance", "Check in on conversion timeline next month"],
      recapNotes: "Strong month. On track for conversion recommendation.",
    },
  });
  await prisma.oneOnOne.create({
    data: {
      userId: michael.id, managerId: brian.id,
      type: "weekly",
      scheduledAt: addDays(thisWeek, 1),
      status: "scheduled",
    },
  });

  // --- Feedback conversations ---
  await prisma.feedbackConversation.create({
    data: {
      userId: moses.id, managerId: amara.id,
      conversationType: "underperformance",
      date: addDays(new Date(), -1),
      behavior: "Farmer training numbers have been below target for two consecutive weeks (140 and then 95 vs. a target of 250).",
      rootCause: "A vehicle breakdown limited village access, and the backlog compounded week over week.",
      impact: "Team's monthly training total is now at risk, and Moses seems discouraged.",
      actionPlan: "Focus on 3 nearby villages this week, daily check-ins with Amara, and temporary support from Grace for 2 days.",
      followUpDate: addDays(new Date(), 3),
      status: "open",
    },
  });
  await prisma.feedbackConversation.create({
    data: {
      userId: linda.id, managerId: brian.id,
      conversationType: "behavior",
      date: addDays(new Date(), -10),
      behavior: "Linda was sharing her outreach scripts and call techniques openly with teammates during a busy recruitment push.",
      rootCause: "She noticed teammates struggling and proactively offered to help.",
      impact: "Team-wide call quality and conversion improved noticeably the following week.",
      actionPlan: "Recognize this in the team celebration feed and ask Linda to run a short session on her scripts.",
      followUpDate: addDays(new Date(), -3),
      status: "closed",
    },
  });

  // --- Growth plans ---
  await prisma.growthPlan.create({
    data: {
      userId: john.id,
      quarter: startOfMonth(),
      skills: [
        { skill: "Confirmation call techniques", howToDevelop: "Shadow Grace on 5 confirmation calls and adopt her script.", byWhen: addDays(thisWeek, 21).toISOString(), status: "in_progress" },
        { skill: "Route planning for village visits", howToDevelop: "Work with logistics to optimize weekly village routes.", byWhen: addDays(thisWeek, 35).toISOString(), status: "not_started" },
      ],
      promotionReadiness: "On track for senior IC if confirmation rate reaches 75%+ for 3 consecutive weeks.",
      mentorNotes: "John is coachable and responds well to direct feedback. Keep reinforcing the new call script.",
    },
  });
  await prisma.growthPlan.create({
    data: {
      userId: faith.id,
      quarter: startOfMonth(),
      skills: [
        { skill: "End-to-end feature ownership", howToDevelop: "Lead the next dashboard feature from design to deployment with light review.", byWhen: addDays(thisWeek, 28).toISOString(), status: "in_progress" },
        { skill: "Code review skills", howToDevelop: "Review at least 2 teammate PRs per week with substantive feedback.", byWhen: addDays(thisWeek, 14).toISOString(), status: "completed" },
        { skill: "System design basics", howToDevelop: "Pair with Tom on designing the mentorship suite data model.", byWhen: addDays(thisWeek, 42).toISOString(), status: "not_started" },
      ],
      promotionReadiness: "Strong candidate for full-time conversion at end of internship; recommend hire.",
      mentorNotes: "Faith has exceeded expectations every month. Give her stretch assignments.",
    },
  });

  // --- Mentorship guides ---
  await prisma.mentorshipGuide.create({
    data: {
      role: "master",
      title: "Master Mentorship & Coaching Guide",
      content: `# Master Mentorship & Coaching Guide

## The 7-Step Feedback & Coaching Framework
1. **Schedule privately** - Never give critical feedback in front of others. Find a quiet moment.
2. **Open with empathy** - Start by acknowledging the person's effort and checking in on how they're doing.
3. **Describe the specific behavior** - Be concrete and factual, not vague or character-based ("I noticed..." not "You always...").
4. **Explore the root cause** - Ask open questions to understand what's really going on before jumping to solutions.
5. **Share your perspective and the impact** - Explain how the behavior affects the team, the metrics, or the mission.
6. **Partner on a solution** - Co-create an action plan rather than dictating one.
7. **Follow up and hold accountable** - Schedule a check-in (3-day, 1-week, or 2-week) and track the decision: improving, flat, or declining.

## Traffic-Light Coaching
- **GREEN**: Performing at or above target. Focus on growth, stretch goals, and recognition.
- **YELLOW**: Below target but recoverable. Increase check-in frequency, identify blockers, set a short recovery plan.
- **RED**: Significantly below target or declining for 2+ weeks. Schedule a feedback conversation using this framework, set a recovery plan with daily check-ins, and escalate to leadership if no improvement after one week.

## Escalation Path
- Team leaders handle first-line coaching and feedback conversations.
- If a team member is RED for 2+ consecutive weeks despite a coaching plan, the team leader should loop in the executive team.
- Churn risk flags (high) should trigger a feedback conversation within 48 hours.

## Celebration Framework
- Celebrate wins publicly (company-wide) when they reflect company values or have cross-team impact.
- Celebrate wins privately (team-only) for steady, consistent performance that may not be "headline" news but matters.
- Aim for at least one celebration per team per week.`,
    },
  });
  await prisma.mentorshipGuide.create({
    data: {
      role: "team_leader",
      title: "Team Leader Coaching Playbook",
      content: `# Team Leader Coaching Playbook

## Running Effective 1-on-1s
- **Weekly 1-on-1s**: Review this week's numbers, blockers, and one growth topic. Keep it to 30 minutes.
- **Monthly 1-on-1s**: Step back from weekly metrics - discuss growth plan progress, career goals, and any recurring patterns.
- **Quarterly 1-on-1s**: Tie directly into the quarterly review - discuss promotion readiness, skill development, and set goals for the next quarter.

## Using the Feedback Framework
When you notice underperformance, a quality issue, a behavior concern, conflict, or churn risk signals, use the 7-step framework (see the Master Guide) to structure the conversation. Pick the conversation type that matches the situation - each has slightly different emphasis:
- **Underperformance**: Focus on root cause and a concrete recovery plan with milestones.
- **Quality issue**: Be specific about the standard expected vs. what was delivered.
- **Behavior/attitude**: Separate the behavior from the person; focus on impact on the team.
- **Conflict**: Get both perspectives before forming a view; focus on a path forward both parties can commit to.
- **Churn risk**: Lead with empathy and curiosity - find out what's really going on before proposing anything.

## Coaching Logs & Check-ins
After any coaching conversation, log it with the topic, notes, root cause (if applicable), and an action plan. Schedule follow-up check-ins at 3 days, 1 week, and/or 2 weeks, and record whether the person is improving, flat, or declining at each check-in. If declining after 2 check-ins, escalate.

## Growth Plans
Maintain a growth plan for each team member with 1-3 active skills, how they'll develop each one, a target date, and status. Review and update during monthly/quarterly 1-on-1s.`,
    },
  });
  await prisma.mentorshipGuide.create({
    data: {
      role: "team_member",
      title: "Your Guide to 1-on-1s & Growth",
      content: `# Your Guide to 1-on-1s & Growth

## Getting the Most from 1-on-1s
Come prepared! Bring your wins, blockers, and any questions. Weekly 1-on-1s are a great place to flag issues early - don't wait until they become bigger problems.

## Feedback Conversations
If your manager schedules a feedback conversation, know that it's a two-way conversation, not a lecture. You'll be asked for your perspective on the root cause and you'll partner on the action plan together. Follow-up check-ins (3-day, 1-week, 2-week) are there to support you, not to catch you out.

## Growth Plans
Your growth plan tracks 1-3 skills you're actively developing, how you're developing them, and a target date. Check in on your status (not started / in progress / completed) regularly and discuss progress with your manager during 1-on-1s. This is also where promotion readiness is tracked.

## Celebrations
Don't be shy about sharing wins with your manager - big or small. Consistent solid work deserves recognition too, not just headline achievements.`,
    },
  });

  console.log("Seed complete.");
  console.log("\nLogin credentials (all passwords: password123):");
  console.log("  Admin:      admin@smartvet.africa");
  console.log("  Executive:  richard.ceo@smartvet.africa");
  console.log("  Team Leader (Farmer Success): amara@smartvet.africa");
  console.log("  Team Leader (Recruitment):    brian@smartvet.africa");
  console.log("  Team Leader (Sales):          david@smartvet.africa");
  console.log("  Team Leader (Compliance):     esther@smartvet.africa");
  console.log("  Team Leader (Tech):           tom@smartvet.africa");
  console.log("  Team Member (GREEN/YELLOW):   grace@smartvet.africa");
  console.log("  Team Member (RED/churn risk): moses@smartvet.africa");
  console.log("  Intern (recommend hire):      faith@smartvet.africa");
  console.log("  Intern (pending decision):    samuel@smartvet.africa");
  console.log("  Intern (pending decision):    mercy@smartvet.africa");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
