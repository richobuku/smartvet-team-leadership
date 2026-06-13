import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import StatusPill from "../components/StatusPill";
import { formatDate } from "../lib/format";

const DECISIONS = ["pending", "recommend_hire", "extend", "end_internship"];
const DECISION_LABELS = {
  pending: "Pending",
  recommend_hire: "Recommend hire",
  extend: "Extend internship",
  end_internship: "End internship",
};

const READINESS_OPTIONS = ["exceeding", "on_track", "at_risk"];
const READINESS_LABELS = {
  exceeding: "Exceeding Expectations",
  on_track: "On Track",
  at_risk: "At Risk",
};
const READINESS_STATUS = {
  exceeding: "green",
  on_track: "green",
  at_risk: "red",
};

const FEEDBACK_TYPE_LABELS = {
  underperformance: "Underperformance",
  quality_issue: "Quality Issue",
  behavior: "Behavior / Attitude",
  conflict: "Conflict",
  churn_risk: "Churn Risk",
};

const COACHING_OUTCOME_STATUS = {
  pending: "yellow",
  in_progress: "yellow",
  implemented: "green",
  blocked: "red",
};

const ONEONONE_TYPE_LABELS = {
  weekly: "Weekly 1-on-1",
  monthly: "Monthly 1-on-1",
  quarterly: "Quarterly 1-on-1",
};

const ONEONONE_STATUS_PILL = {
  scheduled: "yellow",
  completed: "green",
  missed: "red",
};

function EventCard({ event }) {
  if (event.type === "coaching") {
    return (
      <div className="border-l-4 border-primary/40 pl-4 py-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-semibold text-navy">🗨️ Coaching: {event.topic}</p>
          <StatusPill status={COACHING_OUTCOME_STATUS[event.outcome] || "yellow"} label={event.outcome.replace("_", " ")} />
        </div>
        <p className="text-xs text-navy/40 mt-0.5">{formatDate(event.date)} · with {event.manager?.name}</p>
        {event.notes && <p className="text-sm text-navy/70 mt-1">{event.notes}</p>}
        {event.action && <p className="text-sm text-navy/70 mt-1"><strong>Action:</strong> {event.action}</p>}
        {event.followUp && <p className="text-xs text-navy/40 mt-1">Follow-up: {formatDate(event.followUp)}</p>}
        {event.checkIns?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {event.checkIns.map((ci) => (
              <span key={ci.id} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-light text-navy/60">
                {ci.type}: {ci.decision}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (event.type === "celebration") {
    return (
      <div className="border-l-4 border-statusGreen/40 pl-4 py-1">
        <p className="font-semibold text-navy">🎉 Celebration: {event.achievement}</p>
        <p className="text-xs text-navy/40 mt-0.5">
          {formatDate(event.date)} · from {event.manager?.name} · {event.visibility === "company" ? "Company-wide" : "Team"}
        </p>
        {event.impact && <p className="text-sm text-navy/70 mt-1">{event.impact}</p>}
        {event.notes && <p className="text-sm text-navy/70 mt-1">{event.notes}</p>}
      </div>
    );
  }

  if (event.type === "feedback") {
    return (
      <div className="border-l-4 border-statusRed/40 pl-4 py-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-semibold text-navy">⚠️ {FEEDBACK_TYPE_LABELS[event.conversationType] || "Feedback"} conversation</p>
          <StatusPill status={event.status === "closed" ? "green" : "yellow"} label={event.status} />
        </div>
        <p className="text-xs text-navy/40 mt-0.5">{formatDate(event.date)} · with {event.manager?.name}</p>
        {event.behavior && <p className="text-sm text-navy/70 mt-1"><strong>Behavior:</strong> {event.behavior}</p>}
        {event.rootCause && <p className="text-sm text-navy/70 mt-1"><strong>Root cause:</strong> {event.rootCause}</p>}
        {event.impact && <p className="text-sm text-navy/70 mt-1"><strong>Impact:</strong> {event.impact}</p>}
        {event.actionPlan && <p className="text-sm text-navy/70 mt-1"><strong>Action plan:</strong> {event.actionPlan}</p>}
        {event.followUpDate && <p className="text-xs text-navy/40 mt-1">Follow-up: {formatDate(event.followUpDate)}</p>}
      </div>
    );
  }

  if (event.type === "oneonone") {
    return (
      <div className="border-l-4 border-secondary/40 pl-4 py-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-semibold text-navy">📅 {ONEONONE_TYPE_LABELS[event.oneOnOneType] || "1-on-1"}</p>
          <StatusPill status={ONEONONE_STATUS_PILL[event.status] || "yellow"} label={event.status} />
        </div>
        <p className="text-xs text-navy/40 mt-0.5">{formatDate(event.date)} · with {event.manager?.name}</p>
        {event.notes && <p className="text-sm text-navy/70 mt-1">{event.notes}</p>}
        {event.actionItems?.length > 0 && (
          <ul className="list-disc list-inside text-sm text-navy/70 mt-1">
            {event.actionItems.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
        {event.recapNotes && <p className="text-sm text-navy/70 mt-1"><strong>Recap:</strong> {event.recapNotes}</p>}
      </div>
    );
  }

  return null;
}

const EVENT_FILTERS = [
  { key: "all", label: "All" },
  { key: "coaching", label: "Coaching" },
  { key: "celebration", label: "Celebrations" },
  { key: "feedback", label: "Feedback/Disciplinary" },
  { key: "oneonone", label: "1-on-1s" },
];

export default function InternshipProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [internship, setInternship] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [decisionDraft, setDecisionDraft] = useState({ conversionDecision: "pending", conversionNotes: "" });
  const [assessmentDraft, setAssessmentDraft] = useState({ readiness: "on_track", overallAssessment: "" });
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  function refresh() {
    api.get(`/internships/${id}`).then((data) => {
      setInternship(data);
      setDecisionDraft({ conversionDecision: data.conversionDecision, conversionNotes: data.conversionNotes || "" });
      setAssessmentDraft({ readiness: data.readiness || "on_track", overallAssessment: data.overallAssessment || "" });
    }).catch((err) => setError(err.message));
    api.get(`/internships/${id}/timeline`).then(setTimeline).catch(() => {});
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

  if (!internship) return <p className="text-navy/60 text-sm">Loading...</p>;

  const isAdmin = user?.role === "admin" || user?.role === "executive";
  const isSupervisor = internship.supervisor?.id === user?.id;
  const canEdit = isAdmin || isSupervisor;

  async function saveDecision() {
    setError("");
    setSaved("");
    try {
      await api.put(`/internships/${id}`, decisionDraft);
      setSaved("decision");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveAssessment() {
    setError("");
    setSaved("");
    try {
      await api.put(`/internships/${id}`, assessmentDraft);
      setSaved("assessment");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConvert() {
    setError("");
    try {
      await api.post(`/internships/${id}/convert`, {});
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const events = timeline?.events?.filter((e) => filter === "all" || e.type === filter) || [];

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-primary hover:underline mb-2">← Back</button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">{internship.user.name}</h1>
            <p className="text-sm text-navy/60">
              {internship.track} · {internship.user.team?.name || "—"} · Supervised by {internship.supervisor.name}
            </p>
            <p className="text-xs text-navy/40 mt-0.5">
              {formatDate(internship.startDate)} – {formatDate(internship.plannedEndDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={internship.status === "converted" ? "green" : internship.status === "ended" ? "red" : "yellow"} label={internship.status.replace("_", " ")} />
            <StatusPill status={READINESS_STATUS[internship.readiness] || "yellow"} label={READINESS_LABELS[internship.readiness] || internship.readiness} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-statusRed">{error}</p>}

      {/* Quick action links — log a new interaction for this intern */}
      {isSupervisor && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-4">
          <p className="text-xs font-semibold text-navy/50 mb-2">Log a new interaction</p>
          <div className="flex flex-wrap gap-2">
            <Link to={`/leader/coaching?userId=${internship.userId}`} className="text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-3 py-1.5 transition-colors">
              + Coaching session
            </Link>
            <Link to={`/leader/celebrations?userId=${internship.userId}`} className="text-sm font-semibold text-statusGreen bg-statusGreen/10 hover:bg-statusGreen/20 rounded-full px-3 py-1.5 transition-colors">
              + Celebration
            </Link>
            <Link to={`/leader/feedback?userId=${internship.userId}`} className="text-sm font-semibold text-statusRed bg-statusRed/10 hover:bg-statusRed/20 rounded-full px-3 py-1.5 transition-colors">
              + Feedback / disciplinary conversation
            </Link>
            <Link to={`/leader/oneonones?userId=${internship.userId}`} className="text-sm font-semibold text-secondary bg-secondary/10 hover:bg-secondary/20 rounded-full px-3 py-1.5 transition-colors">
              + Schedule 1-on-1
            </Link>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Conversion decision */}
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
          <h2 className="text-lg font-semibold text-navy">Conversion Decision</h2>
          {canEdit ? (
            <>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Decision</label>
                <select
                  value={decisionDraft.conversionDecision}
                  onChange={(e) => setDecisionDraft((d) => ({ ...d, conversionDecision: e.target.value }))}
                  className="w-full rounded-lg border border-light px-3 py-2"
                >
                  {DECISIONS.map((d) => (
                    <option key={d} value={d}>{DECISION_LABELS[d]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Notes</label>
                <textarea
                  value={decisionDraft.conversionNotes}
                  onChange={(e) => setDecisionDraft((d) => ({ ...d, conversionNotes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-light px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveDecision} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Save Decision
                </button>
                {saved === "decision" && <span className="text-sm text-statusGreen">Saved.</span>}
              </div>
              {isAdmin && internship.status === "active" && (
                <button onClick={handleConvert} className="text-sm font-semibold text-secondary hover:underline">
                  Convert to Staff
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-navy/70">{DECISION_LABELS[internship.conversionDecision]}</p>
              {internship.conversionNotes && <p className="text-sm text-navy/60">{internship.conversionNotes}</p>}
            </>
          )}
        </div>

        {/* Readiness / overall assessment */}
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
          <h2 className="text-lg font-semibold text-navy">Readiness & Overall Assessment</h2>
          <p className="text-xs text-navy/40">
            This summary, plus the timeline below, is intended to support future AI-assisted hiring and staffing predictions.
          </p>
          {canEdit ? (
            <>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Readiness</label>
                <select
                  value={assessmentDraft.readiness}
                  onChange={(e) => setAssessmentDraft((d) => ({ ...d, readiness: e.target.value }))}
                  className="w-full rounded-lg border border-light px-3 py-2"
                >
                  {READINESS_OPTIONS.map((r) => (
                    <option key={r} value={r}>{READINESS_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Overall assessment</label>
                <textarea
                  value={assessmentDraft.overallAssessment}
                  onChange={(e) => setAssessmentDraft((d) => ({ ...d, overallAssessment: e.target.value }))}
                  rows={2}
                  placeholder="Strengths, concerns, trajectory — kept up to date for future hiring decisions."
                  className="w-full rounded-lg border border-light px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveAssessment} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Save Assessment
                </button>
                {saved === "assessment" && <span className="text-sm text-statusGreen">Saved.</span>}
              </div>
              {internship.assessmentUpdatedAt && (
                <p className="text-xs text-navy/40">Last updated {formatDate(internship.assessmentUpdatedAt)}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-navy/70">{internship.overallAssessment || "No assessment yet."}</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-navy">Internship Timeline</h2>
          {timeline?.summary && (
            <div className="flex gap-2 text-xs text-navy/50 flex-wrap">
              <span className="bg-light rounded-full px-2.5 py-1">{timeline.summary.coachingCount} coaching</span>
              <span className="bg-light rounded-full px-2.5 py-1">{timeline.summary.celebrationCount} celebrations</span>
              <span className="bg-light rounded-full px-2.5 py-1">{timeline.summary.feedbackCount} feedback ({timeline.summary.openFeedbackCount} open)</span>
              <span className="bg-light rounded-full px-2.5 py-1">{timeline.summary.oneOnOneCount} 1-on-1s</span>
            </div>
          )}
        </div>

        <div className="flex gap-1 flex-wrap">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold rounded-full px-3 py-1.5 transition-colors ${
                filter === f.key ? "bg-primary text-white" : "bg-light text-navy/60 hover:bg-primary/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-navy/50">No recorded interactions yet.</p>
        ) : (
          <div className="space-y-4">
            {events.map((e) => <EventCard key={`${e.type}-${e.id}`} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
