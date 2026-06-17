import { useEffect, useState } from "react";
import { api } from "../../api/client";

const ROLES = ["team_member", "team_leader", "executive", "admin", "hr_manager"];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "team_member", teamId: "", managerId: "", weeklyTarget: "" });
  const [error, setError] = useState("");

  function refresh() {
    api.get("/users").then(setUsers);
    api.get("/teams").then(setTeams);
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", {
        ...form,
        teamId: form.teamId || undefined,
        managerId: form.managerId || undefined,
        weeklyTarget: form.weeklyTarget ? Number(form.weeklyTarget) : undefined,
      });
      setForm({ name: "", email: "", password: "", role: "team_member", teamId: "", managerId: "", weeklyTarget: "" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResend(userId) {
    setError("");
    try {
      await api.post("/auth/resend-verification", { userId });
    } catch (err) {
      setError(err.message);
    }
  }

  const potentialManagers = users.filter((u) => u.role === "team_leader");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Users</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">New User</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Team</label>
            <select value={form.teamId} onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
              <option value="">None</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {form.role === "team_member" && (
            <>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Manager</label>
                <select value={form.managerId} onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
                  <option value="">None</option>
                  {potentialManagers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Weekly Target</label>
                <input type="number" value={form.weeklyTarget} onChange={(e) => setForm((f) => ({ ...f, weeklyTarget: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
              </div>
            </>
          )}
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Create User
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Existing Users</h2>
        <div className="overflow-x-auto">
<table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-navy/50 border-b border-light">
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Email</th>
              <th className="py-2 pr-2">Role</th>
              <th className="py-2 pr-2">Team</th>
              <th className="py-2 pr-2">Employment</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Churn Risk</th>
              <th className="py-2 pr-2">Email Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-light/60">
                <td className="py-2 pr-2 font-medium text-navy">{u.name}</td>
                <td className="py-2 pr-2 text-navy/70">{u.email}</td>
                <td className="py-2 pr-2 text-navy/70">{u.role.replace("_", " ")}</td>
                <td className="py-2 pr-2 text-navy/70">{u.team?.name || "—"}</td>
                <td className="py-2 pr-2 text-navy/70">{u.employmentType === "intern" ? "Intern" : "Staff"}</td>
                <td className="py-2 pr-2 text-navy/70">{u.status}</td>
                <td className="py-2 pr-2 text-navy/70">{u.churnRisk}</td>
                <td className="py-2 pr-2 text-navy/70">
                  {u.emailVerified ? (
                    <span className="text-statusGreen font-medium">Verified</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-statusYellow font-medium">Pending</span>
                      <button
                        type="button"
                        onClick={() => handleResend(u.id)}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Resend
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
}
