import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { calcStatus } from "../../lib/status";
import { startOfMonth, isoDate, formatMonth } from "../../lib/format";

const GO_NO_GO_OPTIONS = [
  { value: "on_track", label: "On Track" },
  { value: "slightly_off", label: "Slightly Off" },
  { value: "significantly_off", label: "Significantly Off" },
];

function listToText(list) {
  return (list || []).join("\n");
}
function textToList(text) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function MonthlyScorecard() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const month = startOfMonth();
  const monthIso = isoDate(month);

  useEffect(() => {
    if (!user?.teamId) return;
    Promise.all([
      api.get(`/teams/${user.teamId}/members`),
      api.get(`/metrics/team/${user.teamId}`),
    ]).then(([mems, mets]) => {
      const teamMembers = mems.filter((m) => m.role === "team_member");
      setMembers(teamMembers);
      setMetrics(mets);
      if (teamMembers.length > 0) setUserId(teamMembers[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!userId || metrics.length === 0) return;
    setSaved(false);
    api.get(`/scorecards/monthly/${userId}/${monthIso}`).then((sc) => {
      const entries = {};
      for (const m of metrics) {
        const existing = sc?.kpis?.find((k) => k.metricId === m.id);
        entries[m.id] = existing ? existing.actual : "";
      }
      setForm({
        entries,
        wins: listToText(sc?.wins),
        blockers: listToText(sc?.blockers),
        pivots: listToText(sc?.pivots),
        nextMonthStrategy: sc?.nextMonthStrategy || "",
        managerFeedback: sc?.managerFeedback || "",
        selfReflection: sc?.selfReflection || "",
        goNoGo: sc?.goNoGo || "",
        submitted: !!sc?.submittedAt,
      });
    });
  }, [userId, metrics]);

  if (!form) return <p className="text-navy/60">Loading scorecards...</p>;

  async function handleSave(submit) {
    const payload = {
      userId,
      month: monthIso,
      kpis: metrics.map((m) => ({
        metricId: m.id,
        target: m.target,
        actual: Number(form.entries[m.id]) || 0,
      })),
      wins: textToList(form.wins),
      blockers: textToList(form.blockers),
      pivots: textToList(form.pivots),
      nextMonthStrategy: form.nextMonthStrategy,
      managerFeedback: form.managerFeedback,
      selfReflection: form.selfReflection,
      goNoGo: form.goNoGo || undefined,
      submitted: submit,
    };
    await api.post("/scorecards/monthly", payload);
    setForm((f) => ({ ...f, submitted: submit }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Monthly Scorecard</h1>
        <p className="text-navy/60 text-sm">{formatMonth(month)}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setUserId(m.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              userId === m.id ? "bg-primary text-white" : "bg-white border border-light text-navy"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">KPIs</h2>
        {metrics.map((m) => {
          const actual = Number(form.entries[m.id]) || 0;
          const status = calcStatus(actual, m.target, m.greenThreshold, m.yellowThreshold);
          return (
            <div key={m.id} className="flex items-center gap-3">
              <label className="flex-1 text-sm font-medium text-navy">
                {m.name} <span className="text-navy/40 font-normal">(target: {m.target} {m.unit}, {m.frequency})</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={form.entries[m.id]}
                onChange={(e) => setForm((f) => ({ ...f, entries: { ...f.entries, [m.id]: e.target.value } }))}
                className="w-28 rounded-lg border border-light px-2 py-1 text-right font-mono"
              />
              <StatusPill status={status} label={status.toUpperCase()} />
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">Reflection</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Wins (one per line)</label>
            <textarea value={form.wins} onChange={(e) => setForm((f) => ({ ...f, wins: e.target.value }))} rows={4} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Blockers (one per line)</label>
            <textarea value={form.blockers} onChange={(e) => setForm((f) => ({ ...f, blockers: e.target.value }))} rows={4} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Pivots (one per line)</label>
            <textarea value={form.pivots} onChange={(e) => setForm((f) => ({ ...f, pivots: e.target.value }))} rows={4} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Next month strategy</label>
          <textarea value={form.nextMonthStrategy} onChange={(e) => setForm((f) => ({ ...f, nextMonthStrategy: e.target.value }))} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Self-reflection (team member input)</label>
          <textarea value={form.selfReflection} onChange={(e) => setForm((f) => ({ ...f, selfReflection: e.target.value }))} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Manager feedback</label>
          <textarea value={form.managerFeedback} onChange={(e) => setForm((f) => ({ ...f, managerFeedback: e.target.value }))} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Go / No-Go assessment</label>
          <select value={form.goNoGo} onChange={(e) => setForm((f) => ({ ...f, goNoGo: e.target.value }))} className="w-full sm:w-64 rounded-lg border border-light px-3 py-2">
            <option value="">Select...</option>
            {GO_NO_GO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {saved && <p className="text-sm text-statusGreen">Saved.</p>}
        {form.submitted && <p className="text-sm text-navy/50">This scorecard has been submitted and archived.</p>}

        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} className="bg-white border border-light text-navy rounded-lg px-4 py-2 text-sm font-semibold hover:bg-light transition-colors">
            Save Draft
          </button>
          <button onClick={() => handleSave(true)} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
            Submit Scorecard
          </button>
        </div>
      </div>
    </div>
  );
}
