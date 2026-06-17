import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { formatDate } from "../../lib/format";
import { STANDARD_LABELS, PANEL_DECISION_LABELS, PANEL_STATUS_LABELS, INTERVIEW_CRITERIA, BINDER_STATUS_LABELS } from "../../lib/interviewStandards";

const STAGES = ["received", "shortlisted", "interview_1", "interview_2", "hired", "rejected"];
const STAGE_LABELS = {
  received: "Received",
  shortlisted: "Shortlisted",
  interview_1: "1st Interview",
  interview_2: "2nd Interview",
  hired: "Hired",
  rejected: "Rejected",
};
const STAGE_PILL = {
  received: "yellow",
  shortlisted: "yellow",
  interview_1: "yellow",
  interview_2: "yellow",
  hired: "green",
  rejected: "red",
};

const ROLES = ["team_member", "team_leader", "executive", "admin", "hr_manager"];

const ACTIVITY_ICON = { note: "📝", stage_change: "➡️", email: "✉️" };

export default function ApplicantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState(null);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [hireForm, setHireForm] = useState({ teamId: "", managerId: "", role: "team_member", weeklyTarget: "" });
  const [error, setError] = useState("");
  const [showHireForm, setShowHireForm] = useState(false);
  const [resent, setResent] = useState("");
  const [panelForm, setPanelForm] = useState({ standard: "ey", scheduledAt: "", panelistIds: [] });
  const [showPanelForm, setShowPanelForm] = useState(false);
  const [binderReviewerIds, setBinderReviewerIds] = useState([]);
  const [showBinderForm, setShowBinderForm] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState(null);
  const [editPanelForm, setEditPanelForm] = useState({ standard: "ey", scheduledAt: "", panelistIds: [] });

  function refresh() {
    api.get(`/recruitment/${id}`).then((data) => {
      setApplicant(data);
      setHireForm((f) => ({ ...f, teamId: data.teamId || "" }));
    }).catch((err) => setError(err.message));
    api.get("/teams").then(setTeams).catch(() => {});
    api.get("/users").then(setUsers).catch(() => {});
  }

  useEffect(refresh, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-statusRed">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary hover:underline">← Back</button>
      </div>
    );
  }

  if (!applicant) return <p className="text-navy/60 text-sm">Loading...</p>;

  async function handleStageChange(stage) {
    setError("");
    if (stage === "hired") {
      setShowHireForm(true);
      return;
    }
    try {
      await api.post(`/recruitment/${id}/stage`, { stage });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    setError("");
    try {
      await api.post(`/recruitment/${id}/notes`, { content: noteDraft });
      setNoteDraft("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleHire(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/recruitment/${id}/hire`, {
        teamId: hireForm.teamId || undefined,
        managerId: hireForm.managerId || undefined,
        role: hireForm.role,
        weeklyTarget: hireForm.weeklyTarget ? Number(hireForm.weeklyTarget) : undefined,
      });
      setShowHireForm(false);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResendEmail(stage) {
    setError("");
    setResent("");
    try {
      await api.post(`/recruitment/${id}/resend-email`, { stage });
      setResent(stage);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreatePanel(e) {
    e.preventDefault();
    setError("");
    if (panelForm.panelistIds.length === 0) {
      setError("Select at least one panelist");
      return;
    }
    try {
      await api.post(`/recruitment/${id}/panels`, {
        standard: panelForm.standard,
        scheduledAt: panelForm.scheduledAt || undefined,
        panelistIds: panelForm.panelistIds,
      });
      setShowPanelForm(false);
      setPanelForm({ standard: "ey", scheduledAt: "", panelistIds: [] });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function togglePanelist(userId) {
    setPanelForm((f) => ({
      ...f,
      panelistIds: f.panelistIds.includes(userId)
        ? f.panelistIds.filter((id2) => id2 !== userId)
        : [...f.panelistIds, userId],
    }));
  }

  function toDatetimeLocal(value) {
    if (!value) return "";
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function startEditPanel(panel) {
    setEditingPanelId(panel.id);
    setEditPanelForm({
      standard: panel.standard,
      scheduledAt: toDatetimeLocal(panel.scheduledAt),
      panelistIds: panel.members.map((m) => m.user.id),
    });
  }

  function toggleEditPanelist(userId) {
    setEditPanelForm((f) => ({
      ...f,
      panelistIds: f.panelistIds.includes(userId)
        ? f.panelistIds.filter((id2) => id2 !== userId)
        : [...f.panelistIds, userId],
    }));
  }

  async function handleUpdatePanel(e, panelId) {
    e.preventDefault();
    setError("");
    if (editPanelForm.panelistIds.length === 0) {
      setError("Select at least one panelist");
      return;
    }
    try {
      await api.put(`/panels/${panelId}`, {
        standard: editPanelForm.standard,
        scheduledAt: editPanelForm.scheduledAt || null,
        panelistIds: editPanelForm.panelistIds,
      });
      setEditingPanelId(null);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateBinder(e) {
    e.preventDefault();
    setError("");
    if (binderReviewerIds.length === 0) {
      setError("Select at least one reviewer");
      return;
    }
    try {
      await api.post(`/recruitment/${id}/binder`, { reviewerIds: binderReviewerIds });
      setShowBinderForm(false);
      setBinderReviewerIds([]);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleReviewer(userId) {
    setBinderReviewerIds((ids) =>
      ids.includes(userId) ? ids.filter((id2) => id2 !== userId) : [...ids, userId]
    );
  }

  const potentialManagers = users.filter((u) => u.role === "team_leader");
  const isInterviewStage = ["interview_1", "interview_2"].includes(applicant.stage);
  const isOpenStage = !["hired", "rejected"].includes(applicant.stage);

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary hover:underline mb-2">← Back to Pipeline</button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">{applicant.name}</h1>
            <p className="text-sm text-navy/60">{applicant.position} {applicant.team ? `· Target team: ${applicant.team.name}` : ""}</p>
            <p className="text-xs text-navy/40 mt-0.5">{applicant.email} {applicant.phone ? `· ${applicant.phone}` : ""}</p>
            <p className="text-xs text-navy/40">Applied {formatDate(applicant.appliedDate)} {applicant.source ? `via ${applicant.source}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={STAGE_PILL[applicant.stage]} label={STAGE_LABELS[applicant.stage]} />
            <button
              onClick={() => handleResendEmail(applicant.stage)}
              className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2.5 py-1 transition-colors"
            >
              ✉️ Resend email
            </button>
            {resent === applicant.stage && <span className="text-xs text-statusGreen">Sent!</span>}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-statusRed">{error}</p>}

      {applicant.hiredUser && (
        <div className="bg-statusGreen/10 border border-statusGreen/30 rounded-xl p-4 text-sm text-navy">
          Hired! This applicant now has a team account: <strong>{applicant.hiredUser.name}</strong> ({applicant.hiredUser.email}).
        </div>
      )}

      {applicant.resumeUrl && (
        <a href={applicant.resumeUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold text-primary hover:underline">
          View resume →
        </a>
      )}

      {isOpenStage && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
          <h2 className="text-lg font-semibold text-navy">Move Stage</h2>
          <div className="flex flex-wrap gap-2">
            {STAGES.filter((s) => s !== applicant.stage).map((s) => (
              <button
                key={s}
                onClick={() => handleStageChange(s)}
                className={`text-sm font-semibold rounded-full px-3 py-1.5 transition-colors ${
                  s === "rejected" ? "text-statusRed bg-statusRed/10 hover:bg-statusRed/20" :
                  s === "hired" ? "text-statusGreen bg-statusGreen/10 hover:bg-statusGreen/20" :
                  "text-primary bg-primary/10 hover:bg-primary/20"
                }`}
              >
                {s === "hired" ? "Hire →" : STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {showHireForm && (
        <form onSubmit={handleHire} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
          <h2 className="text-lg font-semibold text-navy">Hire — Create Team Account</h2>
          <p className="text-xs text-navy/40">This creates a user account, sends login credentials and a verification email, and moves this applicant into team management.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Role</label>
              <select value={hireForm.role} onChange={(e) => setHireForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Team</label>
              <select value={hireForm.teamId} onChange={(e) => setHireForm((f) => ({ ...f, teamId: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
                <option value="">None</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {hireForm.role === "team_member" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Manager</label>
                  <select value={hireForm.managerId} onChange={(e) => setHireForm((f) => ({ ...f, managerId: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2">
                    <option value="">None</option>
                    {potentialManagers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Weekly Target</label>
                  <input type="number" value={hireForm.weeklyTarget} onChange={(e) => setHireForm((f) => ({ ...f, weeklyTarget: e.target.value }))} className="w-full rounded-lg border border-light px-3 py-2" />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="bg-statusGreen text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-statusGreen/90 transition-colors">
              Confirm Hire
            </button>
            <button type="button" onClick={() => setShowHireForm(false)} className="text-sm font-semibold text-navy/60 hover:underline">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-navy">Candidate Binder — Review Team</h2>
          {isOpenStage && !showBinderForm && (
            <button
              onClick={() => setShowBinderForm(true)}
              className="text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-3 py-1.5 transition-colors"
            >
              + Assign Review Team
            </button>
          )}
        </div>
        <p className="text-xs text-navy/40">
          A small team reviews this candidate's application ahead of the interview and submits a summary, strengths/concerns, and suggested probing questions — compiled into a binder for the interview panel.
        </p>

        {showBinderForm && (
          <form onSubmit={handleCreateBinder} className="border border-light rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Reviewers</label>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className={`text-sm rounded-full px-3 py-1.5 cursor-pointer border transition-colors ${
                      binderReviewerIds.includes(u.id)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-navy border-light hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={binderReviewerIds.includes(u.id)}
                      onChange={() => toggleReviewer(u.id)}
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
                Create Binder & Notify Reviewers
              </button>
              <button type="button" onClick={() => setShowBinderForm(false)} className="text-sm font-semibold text-navy/60 hover:underline">
                Cancel
              </button>
            </div>
          </form>
        )}

        {applicant.binders?.length === 0 ? (
          <p className="text-sm text-navy/50">No candidate binder yet.</p>
        ) : (
          <div className="space-y-3">
            {applicant.binders?.map((binder) => (
              <div key={binder.id} className="border border-light rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold text-navy">{STAGE_LABELS[binder.stage]} review</p>
                  <StatusPill status={binder.status === "completed" ? "green" : "yellow"} label={BINDER_STATUS_LABELS[binder.status]} />
                </div>
                <div className="space-y-2">
                  {binder.contributions.map((c) => (
                    <div key={c.id} className="bg-bg rounded-lg px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm text-navy font-medium">{c.user.name}</p>
                        {c.submittedAt ? (
                          <StatusPill status="green" label="Submitted" />
                        ) : (
                          <StatusPill status="yellow" label="Awaiting response" />
                        )}
                      </div>
                      {c.submittedAt && (
                        <div className="space-y-1 text-xs text-navy/70">
                          {c.summary && <p><span className="font-semibold text-navy/50">Summary: </span>{c.summary}</p>}
                          {c.strengths && <p><span className="font-semibold text-navy/50">Strengths: </span>{c.strengths}</p>}
                          {c.concerns && <p><span className="font-semibold text-navy/50">Concerns: </span>{c.concerns}</p>}
                          {Array.isArray(c.probingQuestions) && c.probingQuestions.length > 0 && (
                            <div>
                              <span className="font-semibold text-navy/50">Probing questions:</span>
                              <ul className="list-disc list-inside mt-0.5">
                                {c.probingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-navy">Interview Panels</h2>
          {isInterviewStage && !showPanelForm && (
            <button
              onClick={() => setShowPanelForm(true)}
              className="text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-3 py-1.5 transition-colors"
            >
              + Create Panel
            </button>
          )}
        </div>

        {showPanelForm && (
          <form onSubmit={handleCreatePanel} className="border border-light rounded-lg p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Interview Standard</label>
                <select
                  value={panelForm.standard}
                  onChange={(e) => setPanelForm((f) => ({ ...f, standard: e.target.value }))}
                  className="w-full rounded-lg border border-light px-3 py-2"
                >
                  {Object.entries(STANDARD_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Scheduled At (optional)</label>
                <input
                  type="datetime-local"
                  value={panelForm.scheduledAt}
                  onChange={(e) => setPanelForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full rounded-lg border border-light px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Panelists</label>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className={`text-sm rounded-full px-3 py-1.5 cursor-pointer border transition-colors ${
                      panelForm.panelistIds.includes(u.id)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-navy border-light hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={panelForm.panelistIds.includes(u.id)}
                      onChange={() => togglePanelist(u.id)}
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
                Create Panel & Notify Panelists
              </button>
              <button type="button" onClick={() => setShowPanelForm(false)} className="text-sm font-semibold text-navy/60 hover:underline">
                Cancel
              </button>
            </div>
          </form>
        )}

        {applicant.panels?.length === 0 ? (
          <p className="text-sm text-navy/50">No interview panels yet.</p>
        ) : (
          <div className="space-y-3">
            {applicant.panels?.map((panel) => (
              <div key={panel.id} className="border border-light rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold text-navy">
                    {STAGE_LABELS[panel.stage]} · {STANDARD_LABELS[panel.standard]} standard
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusPill status={panel.status === "completed" ? "green" : "yellow"} label={PANEL_STATUS_LABELS[panel.status]} />
                    {panel.status === "completed" && (
                      <StatusPill
                        status={["strong_yes", "yes"].includes(panel.overallDecision) ? "green" : "red"}
                        label={`Overall: ${PANEL_DECISION_LABELS[panel.overallDecision]}`}
                      />
                    )}
                    {editingPanelId !== panel.id && (
                      <button
                        onClick={() => startEditPanel(panel)}
                        className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2.5 py-1 transition-colors"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
                {panel.scheduledAt && (
                  <p className="text-xs text-navy/40">Scheduled {formatDate(panel.scheduledAt)}</p>
                )}

                {editingPanelId === panel.id && (
                  <form onSubmit={(e) => handleUpdatePanel(e, panel.id)} className="border border-light rounded-lg p-3 space-y-3 bg-bg">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Interview Standard</label>
                        <select
                          value={editPanelForm.standard}
                          onChange={(e) => setEditPanelForm((f) => ({ ...f, standard: e.target.value }))}
                          className="w-full rounded-lg border border-light px-3 py-2"
                        >
                          {Object.entries(STANDARD_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1">Scheduled At</label>
                        <input
                          type="datetime-local"
                          value={editPanelForm.scheduledAt}
                          onChange={(e) => setEditPanelForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                          className="w-full rounded-lg border border-light px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Panelists</label>
                      <div className="flex flex-wrap gap-2">
                        {users.map((u) => (
                          <label
                            key={u.id}
                            className={`text-sm rounded-full px-3 py-1.5 cursor-pointer border transition-colors ${
                              editPanelForm.panelistIds.includes(u.id)
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-navy border-light hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={editPanelForm.panelistIds.includes(u.id)}
                              onChange={() => toggleEditPanelist(u.id)}
                            />
                            {u.name}
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-navy/40 mt-1">Newly added panelists will be emailed an invite. Removed panelists lose access to this panel.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
                        Save Changes
                      </button>
                      <button type="button" onClick={() => setEditingPanelId(null)} className="text-sm font-semibold text-navy/60 hover:underline">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {panel.members.map((m) => (
                    <div key={m.id} className="bg-bg rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm text-navy font-medium">{m.user.name}</p>
                        {m.submittedAt ? (
                          <StatusPill
                            status={["strong_yes", "yes"].includes(m.decision) ? "green" : "red"}
                            label={PANEL_DECISION_LABELS[m.decision]}
                          />
                        ) : (
                          <StatusPill status="yellow" label="Awaiting response" />
                        )}
                      </div>
                      {m.submittedAt && m.scores && (
                        <div className="mt-1 space-y-1">
                          {(INTERVIEW_CRITERIA[panel.standard] || []).map((c) => {
                            const entry = m.scores[c.key];
                            const score = entry?.score ?? (typeof entry === "number" ? entry : null);
                            if (score == null) return null;
                            return (
                              <div key={c.key} className="text-xs text-navy/60">
                                <span className="bg-white border border-light rounded-full px-2 py-0.5">
                                  {c.label}: {score}/5
                                </span>
                                {entry?.notes && <p className="mt-0.5 text-navy/50 pl-1">{entry.notes}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {m.submittedAt && m.notes && (
                        <p className="text-xs text-navy/60 mt-1 font-medium">{m.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">Notes & Communications</h2>
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note about this applicant..."
            className="flex-1 rounded-lg border border-light px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
            Add
          </button>
        </form>

        {applicant.activities?.length === 0 ? (
          <p className="text-sm text-navy/50">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {applicant.activities?.map((act) => (
              <div key={act.id} className="border-l-4 border-primary/20 pl-4 py-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm text-navy">
                    {ACTIVITY_ICON[act.type] || "•"}{" "}
                    {act.type === "stage_change"
                      ? `${act.fromStage ? `${STAGE_LABELS[act.fromStage]} → ` : ""}${STAGE_LABELS[act.toStage]}`
                      : act.content}
                  </p>
                  {act.type === "stage_change" && (
                    <button
                      onClick={() => handleResendEmail(act.toStage)}
                      className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap"
                    >
                      ✉️ Resend
                    </button>
                  )}
                </div>
                <p className="text-xs text-navy/40 mt-0.5">
                  {formatDate(act.createdAt)} · {act.createdBy?.name}
                  {resent === act.toStage && act.type === "stage_change" && <span className="text-statusGreen ml-2">Sent!</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {applicant.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-5">
          <h2 className="text-lg font-semibold text-navy mb-2">Initial Notes</h2>
          <p className="text-sm text-navy/70">{applicant.notes}</p>
        </div>
      )}
    </div>
  );
}
