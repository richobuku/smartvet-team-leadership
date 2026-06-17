import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { formatDate } from "../../lib/format";

const STAGES = ["received", "shortlisted", "interview_1", "interview_2", "hired", "rejected"];
const STAGE_LABELS = {
  received: "Received",
  shortlisted: "Shortlisted",
  interview_1: "1st Interview",
  interview_2: "2nd Interview",
  hired: "Hired",
  rejected: "Rejected",
};

const NEXT_STAGE = {
  received: "shortlisted",
  shortlisted: "interview_1",
  interview_1: "interview_2",
  interview_2: "hired",
};

export default function Recruitment() {
  const [applicants, setApplicants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "", source: "", resumeUrl: "", notes: "", teamId: "" });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    api.get("/recruitment").then(setApplicants).catch((err) => setError(err.message));
    api.get("/teams").then(setTeams).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/recruitment", { ...form, teamId: form.teamId || undefined });
      setForm({ name: "", email: "", phone: "", position: "", source: "", resumeUrl: "", notes: "", teamId: "" });
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function advanceStage(applicant) {
    setError("");
    const next = NEXT_STAGE[applicant.stage];
    if (!next) return;
    if (next === "hired") {
      window.location.assign(`/hr/recruitment/${applicant.id}`);
      return;
    }
    try {
      await api.post(`/recruitment/${applicant.id}/stage`, { stage: next });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function rejectApplicant(applicant) {
    setError("");
    try {
      await api.post(`/recruitment/${applicant.id}/stage`, { stage: "rejected" });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy">Recruitment Pipeline</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Applicant"}
        </button>
      </div>

      {error && <p className="text-sm text-statusRed">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
          <h2 className="text-lg font-semibold text-navy">New Applicant</h2>
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
              <label className="block text-sm font-medium text-navy mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Position</label>
              <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} required className="w-full rounded-lg border border-light px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Source</label>
              <input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="e.g. LinkedIn, referral" className="w-full rounded-lg border border-light px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Resume URL</label>
              <input value={form.resumeUrl} onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Target Team</label>
              <select value={form.teamId} onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
                <option value="">None</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-navy mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
            </div>
          </div>
          <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
            Add Applicant
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-light/60 rounded-xl p-3 space-y-2 min-h-[120px]">
            <h3 className="text-sm font-semibold text-navy/70 flex items-center justify-between">
              {STAGE_LABELS[stage]}
              <span className="text-xs bg-white rounded-full px-2 py-0.5 text-navy/50">
                {applicants.filter((a) => a.stage === stage).length}
              </span>
            </h3>
            <div className="space-y-2">
              {applicants.filter((a) => a.stage === stage).map((a) => (
                <div key={a.id} className="bg-white rounded-lg shadow-sm border border-light p-3 space-y-1.5">
                  <Link to={`/hr/recruitment/${a.id}`} className="block">
                    <p className="font-semibold text-navy text-sm">{a.name}</p>
                    <p className="text-xs text-navy/50">{a.position}</p>
                    <p className="text-xs text-navy/40 mt-1">{formatDate(a.appliedDate)}</p>
                  </Link>
                  {stage !== "hired" && stage !== "rejected" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => advanceStage(a)}
                        className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2.5 py-1 transition-colors break-words text-left"
                      >
                        {NEXT_STAGE[stage] === "hired" ? "Review for hire →" : `Move to ${STAGE_LABELS[NEXT_STAGE[stage]]} →`}
                      </button>
                      <button
                        onClick={() => rejectApplicant(a)}
                        className="text-xs font-semibold text-statusRed bg-statusRed/10 hover:bg-statusRed/20 rounded-full px-2.5 py-1 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {applicants.filter((a) => a.stage === stage).length === 0 && (
                <p className="text-xs text-navy/30 italic">No applicants</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
