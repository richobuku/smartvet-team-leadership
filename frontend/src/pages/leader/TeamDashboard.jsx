import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import StatusCard from "../../components/StatusCard";
import StatusPill from "../../components/StatusPill";
import CoachingQueueTable from "../../components/CoachingQueueTable";
import CelebrationFeed from "../../components/CelebrationFeed";
import { pctToTarget, formatDate } from "../../lib/format";
import { ONE_ON_ONE_TYPE_LABELS } from "../../lib/agendas";

const MENTORSHIP_TOOLS = [
  { value: "oneonones", label: "1-on-1s", path: "/leader/oneonones" },
  { value: "feedback", label: "Feedback Conversations", path: "/leader/feedback" },
  { value: "coaching", label: "Coaching Log", path: "/leader/coaching" },
  { value: "growth-plans", label: "Growth Plans", path: "/leader/growth-plans" },
];

export default function TeamDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [celebrations, setCelebrations] = useState([]);
  const [oneOnOnes, setOneOnOnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetingTool, setMeetingTool] = useState(MENTORSHIP_TOOLS[0].value);
  const [meetingMember, setMeetingMember] = useState("");

  useEffect(() => {
    if (!user?.teamId) return;
    Promise.all([
      api.get(`/analytics/team/${user.teamId}`),
      api.get(`/celebrations/team/${user.teamId}`).catch(() => []),
      api.get(`/oneonones`).catch(() => []),
    ]).then(([analytics, cel, oo]) => {
      setTeam(analytics);
      setCelebrations(cel || []);
      setOneOnOnes(oo || []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <p className="text-navy/60">Loading team dashboard...</p>;

  const members = team.members.map((m) => ({
    ...m,
    avgPct: m.metrics.length
      ? Math.round(m.metrics.reduce((s, mm) => s + pctToTarget(mm.actual, mm.target), 0) / m.metrics.length)
      : null,
  }));

  const reviewedCount = members.filter((m) => m.submitted).length;
  const selectedMember = meetingMember || members[0]?.id || "";

  function goToMentorshipTool() {
    if (!selectedMember) return;
    const tool = MENTORSHIP_TOOLS.find((t) => t.value === meetingTool) || MENTORSHIP_TOOLS[0];
    navigate(`${tool.path}?userId=${selectedMember}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-navy">{team.team.name}</h1>
          <p className="text-navy/60 text-sm">Team health this week</p>
        </div>
        <StatusPill status={team.status} label={`Team: ${team.status.toUpperCase()}`} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-1">Mentorship Tools</h2>
        <p className="text-sm text-navy/60 mb-3">Prepping for a 1-on-1 or weekly check-in? Pick a team member and a tool to jump straight in.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">Team member</label>
            <select
              value={selectedMember}
              onChange={(e) => setMeetingMember(e.target.value)}
              className="border border-light rounded-lg px-3 py-2 text-sm"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-navy/60 mb-1">Tool</label>
            <select
              value={meetingTool}
              onChange={(e) => setMeetingTool(e.target.value)}
              className="border border-light rounded-lg px-3 py-2 text-sm"
            >
              {MENTORSHIP_TOOLS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={goToMentorshipTool}
            disabled={!selectedMember}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Go
          </button>
          <Link to="/guides" className="text-sm font-semibold text-primary hover:underline ml-auto">Coaching Hub →</Link>
        </div>

        <div className="mt-4 border-t border-light pt-3">
          <p className="text-xs font-medium text-navy/60 mb-2">My team</p>
          <ul className="divide-y divide-light/60">
            {members.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-navy">{m.name}</span>
                <div className="flex items-center gap-3 text-xs">
                  {MENTORSHIP_TOOLS.map((t) => (
                    <Link key={t.value} to={`${t.path}?userId=${m.id}`} className="text-primary hover:underline">
                      {t.label}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <StatusCard
            key={m.id}
            name={m.name}
            role={m.employmentType === "intern" ? "Team Member · Intern" : "Team Member"}
            status={m.status || "yellow"}
            actual={m.avgPct}
            target={m.avgPct != null ? 100 : null}
            churnRisk={m.churnRisk}
            footer={!m.submitted && <p className="mt-1 text-xs text-navy/40">Not yet reviewed this week</p>}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Coaching Queue</h2>
        <CoachingQueueTable members={members} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-navy">1-on-1 Calendar</h2>
          <Link to="/leader/oneonones" className="text-sm font-semibold text-primary hover:underline">Manage 1-on-1s →</Link>
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-navy/50">No team members.</p>
        ) : (
          <ul className="divide-y divide-light/60">
            {members.map((m) => {
              const upcoming = oneOnOnes
                .filter((o) => o.user.id === m.id && o.status === "scheduled")
                .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];
              const isOverdue = upcoming && new Date(upcoming.scheduledAt) < new Date();
              return (
                <li key={m.id} className="py-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-navy">{m.name}</span>
                  {upcoming ? (
                    <span className={`text-xs ${isOverdue ? "text-statusRed font-semibold" : "text-navy/60"}`}>
                      {ONE_ON_ONE_TYPE_LABELS[upcoming.type]} · {formatDate(upcoming.scheduledAt)}{isOverdue ? " (overdue)" : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-navy/40">No 1-on-1 scheduled</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-2">Weekly Review Checklist</h2>
        <p className="text-sm text-navy/70 mb-2">{reviewedCount} of {members.length} members reviewed this week.</p>
        <Link to="/leader/review" className="inline-block bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Go to Weekly Review
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Recent Celebrations</h2>
        <CelebrationFeed celebrations={celebrations} />
        <Link to="/leader/celebrations" className="inline-block mt-3 text-secondary text-sm hover:underline">Log a celebration →</Link>
      </div>
    </div>
  );
}
