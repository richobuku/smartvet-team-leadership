import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { startOfMonth, isoDate, formatMonth } from "../../lib/format";

const SKILL_STATUSES = ["not_started", "in_progress", "completed"];
const SKILL_STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function emptySkill() {
  return { skill: "", howToDevelop: "", byWhen: "", status: "not_started" };
}

export default function GrowthPlans() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const quarter = startOfMonth();
  const quarterIso = isoDate(quarter);

  useEffect(() => {
    if (!user?.teamId) return;
    api.get(`/teams/${user.teamId}/members`).then((mems) => {
      const teamMembers = mems.filter((m) => m.role === "team_member");
      setMembers(teamMembers);
      if (!userId && teamMembers.length > 0) setUserId(teamMembers[0].id);
    });
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    setSaved(false);
    api.get(`/growth-plans/user/${userId}`).then((plans) => {
      const current = plans.find((p) => isoDate(p.quarter) === quarterIso);
      const skills = current?.skills?.length
        ? current.skills.map((s) => ({ ...s, byWhen: s.byWhen ? isoDate(s.byWhen) : "" }))
        : [emptySkill()];
      setForm({
        skills,
        promotionReadiness: current?.promotionReadiness || "",
        mentorNotes: current?.mentorNotes || "",
      });
    });
  }, [userId]);

  if (!form) return <p className="text-navy/60">Loading growth plans...</p>;

  function updateSkill(index, field, value) {
    setForm((f) => ({
      ...f,
      skills: f.skills.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  function addSkill() {
    setForm((f) => ({ ...f, skills: [...f.skills, emptySkill()] }));
  }

  function removeSkill(index) {
    setForm((f) => ({ ...f, skills: f.skills.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    await api.post("/growth-plans", {
      userId,
      quarter: quarterIso,
      skills: form.skills.filter((s) => s.skill.trim()),
      promotionReadiness: form.promotionReadiness,
      mentorNotes: form.mentorNotes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Growth Plans</h1>
        <p className="text-navy/60 text-sm">{formatMonth(quarter)}</p>
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
        <h2 className="text-lg font-semibold text-navy">Skills</h2>
        {form.skills.map((skill, i) => (
          <div key={i} className="border border-light rounded-lg p-3 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Skill</label>
                <input value={skill.skill} onChange={(e) => updateSkill(i, "skill", e.target.value)} className="w-full rounded-lg border border-light px-3 py-2" placeholder="e.g. Confirmation call techniques" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">By when</label>
                <input type="date" value={skill.byWhen} onChange={(e) => updateSkill(i, "byWhen", e.target.value)} className="w-full rounded-lg border border-light px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">How to develop</label>
              <textarea value={skill.howToDevelop} onChange={(e) => updateSkill(i, "howToDevelop", e.target.value)} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-navy mb-1">Status</label>
                <select value={skill.status} onChange={(e) => updateSkill(i, "status", e.target.value)} className="w-full sm:w-48 rounded-lg border border-light px-3 py-2">
                  {SKILL_STATUSES.map((s) => (
                    <option key={s} value={s}>{SKILL_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              {form.skills.length > 1 && (
                <button onClick={() => removeSkill(i)} className="text-sm text-statusRed hover:underline">Remove</button>
              )}
            </div>
          </div>
        ))}
        <button onClick={addSkill} className="text-sm font-semibold text-primary hover:underline">+ Add skill</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">Promotion &amp; Mentor Notes</h2>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Promotion readiness</label>
          <textarea value={form.promotionReadiness} onChange={(e) => setForm((f) => ({ ...f, promotionReadiness: e.target.value }))} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Mentor notes</label>
          <textarea value={form.mentorNotes} onChange={(e) => setForm((f) => ({ ...f, mentorNotes: e.target.value }))} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>

        {saved && <p className="text-sm text-statusGreen">Saved.</p>}

        <button onClick={handleSave} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Save Growth Plan
        </button>
      </div>
    </div>
  );
}
