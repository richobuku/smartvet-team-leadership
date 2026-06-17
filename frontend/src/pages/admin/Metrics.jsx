import { useEffect, useState } from "react";
import { api } from "../../api/client";

const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"];

export default function Metrics() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", frequency: "weekly", target: "", unit: "", greenThreshold: 95, yellowThreshold: 80 });
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/teams").then((ts) => {
      setTeams(ts);
      if (ts.length > 0) setTeamId(ts[0].id);
    });
  }, []);

  useEffect(() => {
    if (!teamId) return;
    refresh();
  }, [teamId]);

  function refresh() {
    api.get(`/metrics/team/${teamId}`).then(setMetrics);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/metrics", {
        ...form,
        teamId,
        target: Number(form.target),
        greenThreshold: Number(form.greenThreshold),
        yellowThreshold: Number(form.yellowThreshold),
      });
      setForm({ name: "", description: "", frequency: "weekly", target: "", unit: "", greenThreshold: 95, yellowThreshold: 80 });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Metrics</h1>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Team</label>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full sm:w-72 rounded-lg border border-light px-3 py-2">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">New Metric</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Frequency</label>
            <select value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Unit</label>
            <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} required placeholder="e.g. farmers, %, USD" className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Target</label>
            <input type="number" step="0.01" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Green threshold (%)</label>
            <input type="number" value={form.greenThreshold} onChange={(e) => setForm((f) => ({ ...f, greenThreshold: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Yellow threshold (%)</label>
            <input type="number" value={form.yellowThreshold} onChange={(e) => setForm((f) => ({ ...f, yellowThreshold: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Description</label>
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Add Metric
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Existing Metrics</h2>
        <div className="overflow-x-auto">
<table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-navy/50 border-b border-light">
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Frequency</th>
              <th className="py-2 pr-2">Target</th>
              <th className="py-2 pr-2">Unit</th>
              <th className="py-2 pr-2">Green / Yellow</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.id} className="border-b border-light/60">
                <td className="py-2 pr-2 font-medium text-navy">{m.name}</td>
                <td className="py-2 pr-2 text-navy/70">{m.frequency}</td>
                <td className="py-2 pr-2 text-navy/70">{m.target}</td>
                <td className="py-2 pr-2 text-navy/70">{m.unit}</td>
                <td className="py-2 pr-2 text-navy/70">{m.greenThreshold}% / {m.yellowThreshold}%</td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
}
