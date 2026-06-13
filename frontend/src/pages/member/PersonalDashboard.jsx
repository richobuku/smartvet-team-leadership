import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import ProgressBar from "../../components/ProgressBar";
import CelebrationFeed from "../../components/CelebrationFeed";
import { startOfWeek, isoDate, formatDate, pctToTarget } from "../../lib/format";
import { ONE_ON_ONE_TYPE_LABELS } from "../../lib/agendas";

const CONVERSION_LABELS = {
  pending: "Decision pending",
  recommend_hire: "Recommended for hire",
  extend: "Internship extended",
  end_internship: "Internship ending",
};

const SKILL_STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export default function PersonalDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [coaching, setCoaching] = useState([]);
  const [celebrations, setCelebrations] = useState([]);
  const [internship, setInternship] = useState(null);
  const [oneOnOnes, setOneOnOnes] = useState([]);
  const [growthPlan, setGrowthPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const week = isoDate(startOfWeek());
    Promise.all([
      api.get(`/dashboards/weekly/${user.id}/${week}`).catch(() => null),
      api.get(`/checkins/user/${user.id}`).catch(() => []),
      api.get(`/coaching/user/${user.id}`).catch(() => []),
      api.get(`/celebrations/team/${user.teamId}`).catch(() => []),
      user.employmentType === "intern" ? api.get("/internships").catch(() => []) : Promise.resolve([]),
      api.get("/oneonones").catch(() => []),
      api.get(`/growth-plans/user/${user.id}`).catch(() => []),
    ]).then(([dash, ci, coach, cel, internships, oneOnOnes, growthPlans]) => {
      setDashboard(dash);
      setCheckins(ci || []);
      setCoaching(coach || []);
      setCelebrations(cel || []);
      setInternship((internships || [])[0] || null);
      setOneOnOnes(oneOnOnes || []);
      setGrowthPlan((growthPlans || [])[0] || null);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <p className="text-navy/60">Loading your dashboard...</p>;

  const week = startOfWeek();
  const daysLeft = 7 - (new Date().getDay() === 0 ? 7 : new Date().getDay());
  const overallStatus = dashboard?.overallStatus || "green";
  const avgPct = dashboard?.metrics?.length
    ? Math.round(dashboard.metrics.reduce((s, m) => s + pctToTarget(m.actual, m.target), 0) / dashboard.metrics.length)
    : 0;

  const activeCoaching = coaching.filter((c) => c.outcome === "pending" || c.outcome === "in_progress");
  const recentCheckin = checkins[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{user.name}'s Dashboard</h1>
        <p className="text-navy/60 text-sm">Week of {formatDate(week)}</p>
      </div>

      {internship && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-navy">Internship</h2>
            <StatusPill
              status={internship.conversionDecision === "recommend_hire" ? "green" : internship.conversionDecision === "end_internship" ? "red" : "yellow"}
              label={CONVERSION_LABELS[internship.conversionDecision]}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-navy/70">
            <p><span className="font-semibold text-navy">Track:</span> {internship.track}</p>
            <p><span className="font-semibold text-navy">Supervisor:</span> {internship.supervisor?.name}</p>
            <p><span className="font-semibold text-navy">Start date:</span> {formatDate(internship.startDate)}</p>
            <p><span className="font-semibold text-navy">Planned end date:</span> {formatDate(internship.plannedEndDate)}</p>
          </div>
          {internship.conversionNotes && (
            <p className="mt-3 text-sm text-navy/80 italic border-t border-light pt-3">"{internship.conversionNotes}"</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-navy">This Week</h2>
          <StatusPill status={overallStatus} />
        </div>
        {dashboard ? (
          <p className="text-navy/70 text-sm">
            {avgPct}% average toward target · {daysLeft} day{daysLeft === 1 ? "" : "s"} left this week
          </p>
        ) : (
          <p className="text-navy/50 text-sm">No data submitted for this week yet. Your team leader will review your metrics during the weekly review.</p>
        )}
      </div>

      {dashboard && dashboard.metrics?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-3">My Metrics</h2>
          {dashboard.metrics.map((m) => (
            <ProgressBar
              key={m.id}
              name={m.metric.name}
              target={m.target}
              actual={m.actual}
              unit={m.metric.unit}
              status={m.status}
            />
          ))}
          {dashboard.biggestWin && <p className="text-sm text-statusGreen mt-2"><strong>Win:</strong> {dashboard.biggestWin}</p>}
          {dashboard.biggestBlocker && <p className="text-sm text-statusRed mt-1"><strong>Blocker:</strong> {dashboard.biggestBlocker}</p>}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-3">My Coach's Notes</h2>
          {dashboard?.managerReviewNotes ? (
            <p className="text-sm text-navy/80 italic">"{dashboard.managerReviewNotes}"</p>
          ) : (
            <p className="text-sm text-navy/50">No review notes yet this week.</p>
          )}
          {recentCheckin && (
            <div className="mt-4 pt-4 border-t border-light">
              <p className="text-xs font-semibold text-navy/50 mb-1">Most recent check-in ({formatDate(recentCheckin.date)})</p>
              {recentCheckin.bigWin && <p className="text-sm text-navy/70">Win: {recentCheckin.bigWin}</p>}
              {recentCheckin.blocker && <p className="text-sm text-navy/70">Blocker: {recentCheckin.blocker}</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-3">My Coaching</h2>
          {activeCoaching.length === 0 ? (
            <p className="text-sm text-navy/50">No active coaching topics right now.</p>
          ) : (
            <ul className="space-y-3">
              {activeCoaching.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="font-semibold text-navy">{c.topic}</p>
                  {c.action && <p className="text-navy/70">Action: {c.action}</p>}
                  {c.followUp && <p className="text-navy/40 text-xs">Follow-up: {formatDate(c.followUp)}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-3">My 1-on-1s</h2>
          {oneOnOnes.length === 0 ? (
            <p className="text-sm text-navy/50">No 1-on-1s scheduled yet.</p>
          ) : (
            <ul className="space-y-3">
              {oneOnOnes.slice(0, 4).map((o) => (
                <li key={o.id} className="text-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-navy">{ONE_ON_ONE_TYPE_LABELS[o.type]} 1-on-1</p>
                    <p className="text-navy/40 text-xs">{formatDate(o.scheduledAt)}</p>
                  </div>
                  <StatusPill status={o.status === "completed" ? "green" : o.status === "missed" ? "red" : "yellow"} label={o.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-3">My Growth</h2>
          {!growthPlan || !growthPlan.skills?.length ? (
            <p className="text-sm text-navy/50">No growth plan set yet.</p>
          ) : (
            <ul className="space-y-2">
              {growthPlan.skills.map((s, i) => (
                <li key={i} className="text-sm flex items-center justify-between gap-2">
                  <span className="text-navy">{s.skill}</span>
                  <StatusPill status={s.status === "completed" ? "green" : s.status === "in_progress" ? "yellow" : "red"} label={SKILL_STATUS_LABELS[s.status] || s.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Resources</h2>
        <Link to="/guides" className="text-sm font-semibold text-primary hover:underline">
          Open the Coaching Hub →
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Team Celebrations</h2>
        <CelebrationFeed celebrations={celebrations} />
      </div>
    </div>
  );
}
