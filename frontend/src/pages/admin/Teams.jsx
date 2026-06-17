import { useEffect, useState } from "react";
import { api } from "../../api/client";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    api.get("/teams").then(setTeams);
    api.get("/users").then(setUsers);
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/teams", { name, description, leaderId: leaderId || undefined });
      setName("");
      setDescription("");
      setLeaderId("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const leaders = users.filter((u) => u.role === "team_leader" || u.role === "admin");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Teams</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">New Team</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Team Leader</label>
            <select value={leaderId} onChange={(e) => setLeaderId(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2">
              <option value="">None</option>
              {leaders.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Create Team
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Existing Teams</h2>
        <div className="overflow-x-auto">
<table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-navy/50 border-b border-light">
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Leader</th>
              <th className="py-2 pr-2">Members</th>
              <th className="py-2 pr-2">Metrics</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-b border-light/60">
                <td className="py-2 pr-2 font-medium text-navy">{t.name}</td>
                <td className="py-2 pr-2 text-navy/70">{t.leader?.name || "—"}</td>
                <td className="py-2 pr-2 text-navy/70">{t.members.length}</td>
                <td className="py-2 pr-2 text-navy/70">{t.metrics.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
}
