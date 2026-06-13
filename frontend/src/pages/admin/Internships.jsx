import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { formatDate, isoDate } from "../../lib/format";

const DECISION_LABELS = {
  pending: "Pending",
  recommend_hire: "Recommend hire",
  extend: "Extend internship",
  end_internship: "End internship",
};

export default function Internships() {
  const [internships, setInternships] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: "", supervisorId: "", track: "", startDate: isoDate(new Date()), plannedEndDate: "" });
  const [error, setError] = useState("");

  function refresh() {
    api.get("/internships").then(setInternships);
    api.get("/users").then(setUsers);
  }

  useEffect(refresh, []);

  const candidates = users.filter((u) => u.role === "team_member" && u.employmentType === "staff");
  const supervisors = users.filter((u) => u.role === "team_leader");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/internships", form);
      setForm({ userId: "", supervisorId: "", track: "", startDate: isoDate(new Date()), plannedEndDate: "" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConvert(id) {
    setError("");
    try {
      await api.post(`/internships/${id}/convert`, {});
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Internships</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">New Internship</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Intern</label>
            <select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2">
              <option value="">Select staff member</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.team?.name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Supervisor</label>
            <select value={form.supervisorId} onChange={(e) => setForm((f) => ({ ...f, supervisorId: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2">
              <option value="">Select supervisor</option>
              {supervisors.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Track</label>
            <input value={form.track} onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))} required placeholder="e.g. Software Engineering" className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Planned End Date</label>
            <input type="date" value={form.plannedEndDate} onChange={(e) => setForm((f) => ({ ...f, plannedEndDate: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Create Internship
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">All Internships</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-navy/50 border-b border-light">
              <th className="py-2 pr-2">Intern</th>
              <th className="py-2 pr-2">Team</th>
              <th className="py-2 pr-2">Track</th>
              <th className="py-2 pr-2">Supervisor</th>
              <th className="py-2 pr-2">Dates</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Conversion</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {internships.map((i) => (
              <tr key={i.id} className="border-b border-light/60">
                <td className="py-2 pr-2 font-medium text-navy">
                  <Link to={`/internships/${i.id}`} className="hover:text-primary hover:underline">{i.user.name}</Link>
                </td>
                <td className="py-2 pr-2 text-navy/70">{i.user.team?.name || "—"}</td>
                <td className="py-2 pr-2 text-navy/70">{i.track}</td>
                <td className="py-2 pr-2 text-navy/70">{i.supervisor.name}</td>
                <td className="py-2 pr-2 text-navy/70">{formatDate(i.startDate)} – {formatDate(i.plannedEndDate)}</td>
                <td className="py-2 pr-2"><StatusPill status={i.status === "converted" ? "green" : i.status === "ended" ? "red" : "yellow"} label={i.status.replace("_", " ")} /></td>
                <td className="py-2 pr-2 text-navy/70">{DECISION_LABELS[i.conversionDecision]}</td>
                <td className="py-2 pr-2">
                  {i.status === "active" && (
                    <button onClick={() => handleConvert(i.id)} className="text-secondary text-xs font-semibold hover:underline">
                      Convert to Staff
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
