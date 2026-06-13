import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import CelebrationFeed from "../../components/CelebrationFeed";

export default function Celebrations() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [celebrations, setCelebrations] = useState([]);
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [achievement, setAchievement] = useState("");
  const [impact, setImpact] = useState("");
  const [visibility, setVisibility] = useState("team");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.teamId) return;
    api.get(`/teams/${user.teamId}/members`).then((mems) => {
      const teamMembers = mems.filter((m) => m.role === "team_member");
      setMembers(teamMembers);
      if (!userId && teamMembers.length > 0) setUserId(teamMembers[0].id);
    });
    refresh();
  }, [user]);

  function refresh() {
    if (!user?.teamId) return;
    api.get(`/celebrations/team/${user.teamId}`).then(setCelebrations);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/celebrations", { userId, achievement, impact, visibility });
      setAchievement("");
      setImpact("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Celebrations</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">Log a Win</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Person</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2">
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2">
              <option value="team">Team</option>
              <option value="company">Company-wide</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Achievement</label>
          <input value={achievement} onChange={(e) => setAchievement(e.target.value)} required className="w-full rounded-lg border border-light px-3 py-2" placeholder="e.g. Hit 25 paravets recruited in month 1" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Why this matters</label>
          <textarea value={impact} onChange={(e) => setImpact(e.target.value)} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Celebrate 🎉
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Recent Celebrations</h2>
        <CelebrationFeed celebrations={celebrations} />
      </div>
    </div>
  );
}
