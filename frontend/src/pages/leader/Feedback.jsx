import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import StatusPill from "../../components/StatusPill";
import { formatDate, isoDate } from "../../lib/format";

const CONVERSATION_TYPES = ["underperformance", "quality_issue", "behavior", "conflict", "churn_risk"];

const TYPE_LABELS = {
  underperformance: "Underperformance",
  quality_issue: "Quality Issue",
  behavior: "Behavior / Attitude",
  conflict: "Conflict",
  churn_risk: "Churn Risk",
};

const TYPE_HINTS = {
  underperformance: "Focus on root cause and a concrete recovery plan with milestones.",
  quality_issue: "Be specific about the standard expected vs. what was delivered.",
  behavior: "Separate the behavior from the person; focus on impact on the team.",
  conflict: "Get both perspectives before forming a view; focus on a path forward both parties can commit to.",
  churn_risk: "Lead with empathy and curiosity — find out what's really going on before proposing anything.",
};

const STEPS = [
  { key: "behavior", label: "Step 3: Describe the specific behavior", hint: "Be concrete and factual, not vague (\"I noticed...\" not \"You always...\")." },
  { key: "rootCause", label: "Step 4: Explore the root cause", hint: "What's really going on? Ask open questions before proposing solutions." },
  { key: "impact", label: "Step 5: Share your perspective and the impact", hint: "How does this affect the team, the metrics, or the mission?" },
  { key: "actionPlan", label: "Step 6: Partner on a solution", hint: "Co-create an action plan rather than dictating one." },
];

export default function Feedback() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [conversationType, setConversationType] = useState(CONVERSATION_TYPES[0]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState({ behavior: "", rootCause: "", impact: "", actionPlan: "", followUpDate: "" });
  const [saved, setSaved] = useState(false);

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
    api.get("/feedback").then(setConversations);
  }

  async function handleStart(e) {
    e.preventDefault();
    setError("");
    try {
      const created = await api.post("/feedback", { userId, conversationType });
      refresh();
      openConversation(created);
    } catch (err) {
      setError(err.message);
    }
  }

  function openConversation(c) {
    setSelectedId(c.id);
    setDraft({
      behavior: c.behavior || "",
      rootCause: c.rootCause || "",
      impact: c.impact || "",
      actionPlan: c.actionPlan || "",
      followUpDate: c.followUpDate ? isoDate(c.followUpDate) : "",
    });
    setSaved(false);
  }

  const selected = conversations.find((c) => c.id === selectedId);

  async function handleSave(status) {
    const payload = { ...draft, followUpDate: draft.followUpDate || null };
    if (status) payload.status = status;
    await api.put(`/feedback/${selectedId}`, payload);
    refresh();
    if (status === "closed") {
      setSelectedId(null);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Feedback Conversations</h1>

      <form onSubmit={handleStart} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">Start a Conversation</h2>
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
            <label className="block text-sm font-medium text-navy mb-1">Conversation Type</label>
            <select value={conversationType} onChange={(e) => setConversationType(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2">
              {CONVERSATION_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-navy/60 bg-light/60 rounded-lg p-3">
          <strong>Step 1 (Schedule privately) &amp; Step 2 (Open with empathy):</strong> Find a quiet moment and start by acknowledging the person's effort and checking in on how they're doing. {TYPE_HINTS[conversationType]}
        </p>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Start Conversation
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">All Conversations</h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-navy/50">No feedback conversations yet.</p>
        ) : (
          <ul className="divide-y divide-light/60">
            {conversations.map((c) => (
              <li key={c.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-navy">{c.user.name} · {TYPE_LABELS[c.conversationType]}</p>
                  <p className="text-xs text-navy/40">{formatDate(c.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={c.status === "closed" ? "green" : "yellow"} label={c.status} />
                  <button onClick={() => openConversation(c)} className="text-sm font-semibold text-primary hover:underline">
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-navy">
              {selected.user.name} — {TYPE_LABELS[selected.conversationType]} ({formatDate(selected.date)})
            </h2>
            <button onClick={() => setSelectedId(null)} className="text-sm text-navy/50 hover:text-navy">Close</button>
          </div>

          {STEPS.map((step) => (
            <div key={step.key}>
              <label className="block text-sm font-medium text-navy mb-1">{step.label}</label>
              <p className="text-xs text-navy/40 mb-1">{step.hint}</p>
              <textarea
                value={draft[step.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [step.key]: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-light px-3 py-2"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Step 7: Follow-up date</label>
            <p className="text-xs text-navy/40 mb-1">Schedule a check-in and hold accountable.</p>
            <input
              type="date"
              value={draft.followUpDate}
              onChange={(e) => setDraft((d) => ({ ...d, followUpDate: e.target.value }))}
              className="w-full sm:w-48 rounded-lg border border-light px-3 py-2"
            />
          </div>

          {saved && <p className="text-sm text-statusGreen">Saved.</p>}

          <div className="flex gap-3">
            <button onClick={() => handleSave()} className="bg-white border border-light text-navy rounded-lg px-4 py-2 text-sm font-semibold hover:bg-light transition-colors">
              Save Draft
            </button>
            {selected.status !== "closed" && (
              <button onClick={() => handleSave("closed")} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
                Mark Resolved
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
