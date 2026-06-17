import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { formatDate } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import {
  INTERVIEW_CRITERIA,
  RATING_SCALE,
  STANDARD_LABELS,
  PANEL_DECISION_LABELS,
  PANEL_DECISION_DESCRIPTIONS,
  PANEL_DECISION_OPTIONS,
  PANEL_STATUS_LABELS,
  BINDER_STATUS_LABELS,
} from "../../lib/interviewStandards";

const STAGE_LABELS = {
  received: "Received",
  shortlisted: "Shortlisted",
  interview_1: "1st Interview",
  interview_2: "2nd Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export default function PanelReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [panel, setPanel] = useState(null);
  const [error, setError] = useState("");
  const [scores, setScores] = useState({});
  const [decision, setDecision] = useState("");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    api.get(`/panels/${id}`).then((data) => {
      setPanel(data);
      const mine = data.members.find((m) => m.user.id === user.id);
      if (mine) {
        setScores(mine.scores || {});
        setDecision(mine.decision !== "pending" ? mine.decision : "");
        setSummary(mine.notes || "");
      }
    }).catch((err) => setError(err.message));
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

  if (!panel) return <p className="text-navy/60 text-sm">Loading...</p>;

  const mine = panel.members.find((m) => m.user.id === user.id);
  const alreadySubmitted = !!mine?.submittedAt;
  const criteria = INTERVIEW_CRITERIA[panel.standard] || [];

  function setCriterionField(key, field, value) {
    setScores((s) => ({ ...s, [key]: { ...(s[key] || {}), [field]: value } }));
  }

  const allScored = criteria.every((c) => scores[c.key]?.score);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!decision) {
      setError("Please select an overall decision");
      return;
    }
    if (!allScored) {
      setError("Please rate every competency before submitting");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/panels/${id}/respond`, { decision, scores, notes: summary });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate("/panels")} className="text-sm font-semibold text-primary hover:underline mb-2">← My Panels</button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Interview Panel</h1>
            <p className="text-sm text-navy/60">
              {STAGE_LABELS[panel.stage]} · {STANDARD_LABELS[panel.standard]} Interview Standard
            </p>
            {panel.scheduledAt && <p className="text-xs text-navy/40 mt-0.5">Scheduled {formatDate(panel.scheduledAt)}</p>}
          </div>
          <StatusPill status={panel.status === "completed" ? "green" : "yellow"} label={PANEL_STATUS_LABELS[panel.status]} />
        </div>
      </div>

      {error && <p className="text-sm text-statusRed">{error}</p>}

      {/* Applicant dossier */}
      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
        <h2 className="text-lg font-semibold text-navy">Candidate</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-base font-bold text-navy">{panel.applicant.name}</p>
            <p className="text-sm text-navy/60">{panel.applicant.position}</p>
            <p className="text-xs text-navy/40 mt-1">{panel.applicant.email} {panel.applicant.phone ? `· ${panel.applicant.phone}` : ""}</p>
            <p className="text-xs text-navy/40">
              Applied {formatDate(panel.applicant.appliedDate)} {panel.applicant.source ? `via ${panel.applicant.source}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {panel.applicant.resumeUrl && (
              <a href={panel.applicant.resumeUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline">
                View resume / CV →
              </a>
            )}
          </div>
        </div>
        {panel.applicant.notes && (
          <div className="bg-bg rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-navy/60 mb-1">HR Notes</p>
            <p className="text-sm text-navy/70">{panel.applicant.notes}</p>
          </div>
        )}
      </div>

      {/* Candidate binder — pre-interview review team notes */}
      {(() => {
        const binder = (panel.applicant.binders || []).find((b) => b.stage === panel.stage) || (panel.applicant.binders || [])[0];
        if (!binder) return null;
        const submitted = binder.contributions.filter((c) => c.submittedAt);
        if (submitted.length === 0) return null;
        return (
          <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-navy">Candidate Binder — Review Team Notes</h2>
              <StatusPill status={binder.status === "completed" ? "green" : "yellow"} label={BINDER_STATUS_LABELS[binder.status]} />
            </div>
            <p className="text-sm text-navy/50">
              Guidance from the candidate's pre-interview review team — use this to focus your questions.
            </p>
            <div className="space-y-3">
              {submitted.map((c) => (
                <div key={c.id} className="bg-bg rounded-lg px-3 py-2 space-y-1">
                  <p className="text-sm font-semibold text-navy">{c.user.name}</p>
                  {c.summary && <p className="text-sm text-navy/70"><span className="font-semibold text-navy/50">Summary: </span>{c.summary}</p>}
                  {c.strengths && <p className="text-sm text-navy/70"><span className="font-semibold text-navy/50">Strengths: </span>{c.strengths}</p>}
                  {c.concerns && <p className="text-sm text-navy/70"><span className="font-semibold text-navy/50">Concerns: </span>{c.concerns}</p>}
                  {Array.isArray(c.probingQuestions) && c.probingQuestions.length > 0 && (
                    <div className="text-sm text-navy/70">
                      <span className="font-semibold text-navy/50">Suggested questions:</span>
                      <ul className="list-disc list-inside mt-0.5">
                        {c.probingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {alreadySubmitted && (
        <div className="bg-statusGreen/10 border border-statusGreen/30 rounded-xl p-4 text-sm text-navy">
          You submitted your evaluation: <strong>{PANEL_DECISION_LABELS[mine.decision]}</strong> — {PANEL_DECISION_DESCRIPTIONS[mine.decision]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-1">
          <h2 className="text-lg font-semibold text-navy">{STANDARD_LABELS[panel.standard]} Competency Assessment</h2>
          <p className="text-sm text-navy/50">
            For each competency, probe with the suggested behavioral questions (STAR: Situation, Task, Action, Result), then rate the evidence and record your observations.
          </p>
        </div>

        {criteria.map((c) => {
          const current = scores[c.key] || {};
          return (
            <div key={c.key} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
              <div>
                <h3 className="text-base font-semibold text-navy">{c.label}</h3>
                <p className="text-sm text-navy/50">{c.description}</p>
              </div>

              <div className="bg-bg rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-navy/60 mb-1">Suggested questions</p>
                <ul className="text-sm text-navy/70 list-disc pl-5 space-y-0.5">
                  {c.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-navy mb-1.5">Rating</p>
                <div className="flex flex-wrap gap-2">
                  {RATING_SCALE.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      disabled={alreadySubmitted}
                      title={r.description}
                      onClick={() => setCriterionField(c.key, "score", r.value)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold text-left transition-colors min-w-[120px] ${
                        current.score === r.value
                          ? "bg-primary text-white"
                          : "bg-bg text-navy/70 hover:bg-primary/10"
                      } ${alreadySubmitted ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <span className="block text-lg font-bold leading-none">{r.value}</span>
                      <span className="block text-xs font-medium leading-tight mt-0.5">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">Evidence / observations</label>
                <textarea
                  value={current.notes || ""}
                  onChange={(e) => setCriterionField(c.key, "notes", e.target.value)}
                  disabled={alreadySubmitted}
                  rows={3}
                  className="w-full rounded-lg border border-light px-3 py-2 text-sm"
                  placeholder="Capture specific examples the candidate gave, using their own words where possible..."
                />
              </div>
            </div>
          );
        })}

        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
          <h2 className="text-lg font-semibold text-navy">Overall Recommendation</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PANEL_DECISION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={alreadySubmitted}
                onClick={() => setDecision(opt)}
                className={`text-left rounded-lg px-4 py-3 transition-colors border ${
                  decision === opt
                    ? ["strong_yes", "yes"].includes(opt)
                      ? "bg-statusGreen/15 border-statusGreen text-navy"
                      : "bg-statusRed/15 border-statusRed text-navy"
                    : "bg-white border-light text-navy/70 hover:border-primary/40"
                } ${alreadySubmitted ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <span className="block text-sm font-bold">{PANEL_DECISION_LABELS[opt]}</span>
                <span className="block text-xs text-navy/50 mt-0.5">{PANEL_DECISION_DESCRIPTIONS[opt]}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Overall Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={alreadySubmitted}
              rows={4}
              className="w-full rounded-lg border border-light px-3 py-2 text-sm"
              placeholder="Summarize your overall impression, key strengths, concerns, and how the candidate compares to the bar for this role..."
            />
          </div>

          {!alreadySubmitted && (
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
