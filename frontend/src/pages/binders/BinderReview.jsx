import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { formatDate } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { BINDER_STATUS_LABELS } from "../../lib/interviewStandards";

const STAGE_LABELS = {
  received: "Received",
  shortlisted: "Shortlisted",
  interview_1: "1st Interview",
  interview_2: "2nd Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export default function BinderReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [binder, setBinder] = useState(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [questions, setQuestions] = useState([""]);
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    api.get(`/binders/${id}`).then((data) => {
      setBinder(data);
      const mine = data.contributions.find((c) => c.user.id === user.id);
      if (mine) {
        setSummary(mine.summary || "");
        setStrengths(mine.strengths || "");
        setConcerns(mine.concerns || "");
        const qs = Array.isArray(mine.probingQuestions) ? mine.probingQuestions : [];
        setQuestions(qs.length ? qs : [""]);
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

  if (!binder) return <p className="text-navy/60 text-sm">Loading...</p>;

  const mine = binder.contributions.find((c) => c.user.id === user.id);
  const alreadySubmitted = !!mine?.submittedAt;

  function updateQuestion(i, value) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? value : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, ""]);
  }

  function removeQuestion(i) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!summary.trim()) {
      setError("Please add a summary of your assessment");
      return;
    }
    setSubmitting(true);
    try {
      const probingQuestions = questions.map((q) => q.trim()).filter(Boolean);
      await api.put(`/binders/${id}/respond`, { summary, strengths, concerns, probingQuestions });
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
        <button onClick={() => navigate("/binders")} className="text-sm font-semibold text-primary hover:underline mb-2">← My Candidate Reviews</button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">Candidate Review</h1>
            <p className="text-sm text-navy/60">{STAGE_LABELS[binder.stage]} — review ahead of the interview panel</p>
          </div>
          <StatusPill status={binder.status === "completed" ? "green" : "yellow"} label={BINDER_STATUS_LABELS[binder.status]} />
        </div>
      </div>

      {error && <p className="text-sm text-statusRed">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
        <h2 className="text-lg font-semibold text-navy">Candidate</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-base font-bold text-navy">{binder.applicant.name}</p>
            <p className="text-sm text-navy/60">{binder.applicant.position}</p>
            <p className="text-xs text-navy/40 mt-1">{binder.applicant.email} {binder.applicant.phone ? `· ${binder.applicant.phone}` : ""}</p>
            <p className="text-xs text-navy/40">
              Applied {formatDate(binder.applicant.appliedDate)} {binder.applicant.source ? `via ${binder.applicant.source}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {binder.applicant.resumeUrl && (
              <a href={binder.applicant.resumeUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline">
                View resume / CV →
              </a>
            )}
          </div>
        </div>
        {binder.applicant.notes && (
          <div className="bg-bg rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-navy/60 mb-1">HR Notes</p>
            <p className="text-sm text-navy/70">{binder.applicant.notes}</p>
          </div>
        )}
      </div>

      {alreadySubmitted && (
        <div className="bg-statusGreen/10 border border-statusGreen/30 rounded-xl p-4 text-sm text-navy">
          You submitted your review. Thanks — the interview panel will see this as part of the candidate binder.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Summary</label>
            <p className="text-xs text-navy/50 mb-1.5">Your overall read on this candidate based on their application — who they are, what they've done, and your initial impression.</p>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={alreadySubmitted}
              rows={4}
              className="w-full rounded-lg border border-light px-3 py-2 text-sm"
              placeholder="Summarize the candidate's background, role, and what stands out about their application..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Strengths</label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                disabled={alreadySubmitted}
                rows={4}
                className="w-full rounded-lg border border-light px-3 py-2 text-sm"
                placeholder="What makes this candidate promising?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Concerns / open questions</label>
              <textarea
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                disabled={alreadySubmitted}
                rows={4}
                className="w-full rounded-lg border border-light px-3 py-2 text-sm"
                placeholder="What's unclear, inconsistent, or worth probing further?"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Probing questions for the interview panel</label>
            <p className="text-xs text-navy/50 mb-1.5">Specific, candidate-tailored questions the panel should ask based on what you've seen in their application.</p>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    disabled={alreadySubmitted}
                    className="flex-1 rounded-lg border border-light px-3 py-2 text-sm"
                    placeholder={`Question ${i + 1}`}
                  />
                  {!alreadySubmitted && questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="text-navy/40 hover:text-statusRed px-2"
                      aria-label="Remove question"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!alreadySubmitted && (
              <button
                type="button"
                onClick={addQuestion}
                className="mt-2 text-sm font-semibold text-primary hover:underline"
              >
                + Add another question
              </button>
            )}
          </div>

          {!alreadySubmitted && (
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
