import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { calcStatus } from "../../lib/status";
import { startOfWeek, isoDate, formatDate } from "../../lib/format";

export default function WeeklyReview() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const week = startOfWeek();
  const weekIso = isoDate(week);

  useEffect(() => {
    if (!user?.teamId) return;
    Promise.all([
      api.get(`/teams/${user.teamId}/members`),
      api.get(`/metrics/team/${user.teamId}`),
    ]).then(([mems, mets]) => {
      const teamMembers = mems.filter((m) => m.role === "team_member");
      setMembers(teamMembers);
      setMetrics(mets.filter((m) => m.frequency === "weekly"));
      if (teamMembers.length > 0) setSelectedId(teamMembers[0].id);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedId || metrics.length === 0) return;
    setSaved(false);
    api.get(`/dashboards/weekly/${selectedId}/${weekIso}`).then((dash) => {
      const entries = {};
      for (const m of metrics) {
        const existing = dash?.metrics?.find((dm) => dm.metricId === m.id);
        entries[m.id] = existing ? existing.actual : "";
      }
      setForm({
        entries,
        biggestWin: dash?.biggestWin || "",
        biggestBlocker: dash?.biggestBlocker || "",
        managerReviewNotes: dash?.managerReviewNotes || "",
        submitted: !!dash?.submittedAt,
      });
    });
  }, [selectedId, metrics]);

  if (loading || !form) return <p className="text-navy/60">Loading weekly review...</p>;

  const selectedMember = members.find((m) => m.id === selectedId);

  function updateEntry(metricId, value) {
    setForm((f) => ({ ...f, entries: { ...f.entries, [metricId]: value } }));
  }

  async function handleSubmit(submitFinal) {
    const payload = {
      userId: selectedId,
      week: weekIso,
      metrics: metrics.map((m) => ({
        metricId: m.id,
        target: m.target,
        actual: Number(form.entries[m.id]) || 0,
      })),
      biggestWin: form.biggestWin,
      biggestBlocker: form.biggestBlocker,
      managerReviewNotes: form.managerReviewNotes,
      submitted: submitFinal,
    };
    await api.post("/dashboards/weekly", payload);
    setForm((f) => ({ ...f, submitted: submitFinal }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Weekly Review</h1>
        <p className="text-navy/60 text-sm">Week of {formatDate(week)}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedId(m.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedId === m.id ? "bg-primary text-white" : "bg-white border border-light text-navy"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {selectedMember && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
          <h2 className="text-lg font-semibold text-navy">{selectedMember.name}'s Metrics</h2>
          {metrics.map((m) => {
            const actual = Number(form.entries[m.id]) || 0;
            const status = calcStatus(actual, m.target, m.greenThreshold, m.yellowThreshold);
            return (
              <div key={m.id} className="flex items-center gap-3 flex-wrap">
                <label className="flex-1 min-w-[140px] text-sm font-medium text-navy">
                  {m.name} <span className="text-navy/40 font-normal">(target: {m.target} {m.unit})</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.entries[m.id]}
                  onChange={(e) => updateEntry(m.id, e.target.value)}
                  className="w-20 sm:w-28 rounded-lg border border-light px-2 py-1 text-right font-mono"
                />
                <StatusPill status={status} label={status.toUpperCase()} />
              </div>
            );
          })}

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Biggest win this week</label>
              <textarea
                value={form.biggestWin}
                onChange={(e) => setForm((f) => ({ ...f, biggestWin: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-light px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Biggest blocker</label>
              <textarea
                value={form.biggestBlocker}
                onChange={(e) => setForm((f) => ({ ...f, biggestBlocker: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-light px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Manager review notes</label>
            <textarea
              value={form.managerReviewNotes}
              onChange={(e) => setForm((f) => ({ ...f, managerReviewNotes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-light px-3 py-2"
              placeholder="e.g. Great week, keep it up! Let's talk Monday about..."
            />
          </div>

          {saved && <p className="text-sm text-statusGreen">Saved.</p>}
          {form.submitted && <p className="text-sm text-navy/50">This dashboard has been submitted for the week.</p>}

          <div className="flex gap-3">
            <button onClick={() => handleSubmit(false)} className="bg-white border border-light text-navy rounded-lg px-4 py-2 text-sm font-semibold hover:bg-light transition-colors">
              Save Draft
            </button>
            <button onClick={() => handleSubmit(true)} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
              Submit Weekly Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
