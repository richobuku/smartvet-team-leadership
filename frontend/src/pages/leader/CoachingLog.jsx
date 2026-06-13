import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { formatDate, isoDate } from "../../lib/format";

const OUTCOMES = ["pending", "in_progress", "implemented", "blocked"];
const CHECKIN_TYPES = ["day3", "week1", "week2"];
const CHECKIN_LABELS = { day3: "3-day", week1: "1-week", week2: "2-week" };
const DECISIONS = ["pending", "improving", "flat", "declining"];
const DECISION_PILL = { pending: "yellow", improving: "green", flat: "yellow", declining: "red" };

export default function CoachingLog() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const [notes, setNotes] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [action, setAction] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [error, setError] = useState("");
  const [checkinFormFor, setCheckinFormFor] = useState(null);
  const [checkinType, setCheckinType] = useState("day3");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [checkinDecision, setCheckinDecision] = useState("pending");

  useEffect(() => {
    if (!user?.teamId) return;
    api.get(`/teams/${user.teamId}/members`).then((mems) => {
      const teamMembers = mems.filter((m) => m.role === "team_member");
      setMembers(teamMembers);
      if (!userId && teamMembers.length > 0) setUserId(teamMembers[0].id);
    });
    refreshLogs();
  }, [user]);

  function refreshLogs() {
    if (!user) return;
    api.get(`/coaching/manager/${user.id}`).then(setLogs);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/coaching", {
        userId,
        topic,
        notes,
        rootCause: rootCause || undefined,
        action,
        followUp: followUp || undefined,
      });
      setTopic("");
      setNotes("");
      setRootCause("");
      setAction("");
      setFollowUp("");
      refreshLogs();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateOutcome(id, outcome) {
    await api.put(`/coaching/${id}`, { outcome });
    refreshLogs();
  }

  async function handleAddCheckin(logId) {
    await api.post(`/coaching/${logId}/checkins`, {
      type: checkinType,
      notes: checkinNotes,
      decision: checkinDecision,
    });
    setCheckinFormFor(null);
    setCheckinNotes("");
    setCheckinType("day3");
    setCheckinDecision("pending");
    refreshLogs();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Coaching Log</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-4">
        <h2 className="text-lg font-semibold text-navy">New Coaching Entry</h2>
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
            <label className="block text-sm font-medium text-navy mb-1">Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} required className="w-full rounded-lg border border-light px-3 py-2" placeholder="e.g. Handling rejection" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">What was discussed</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Root cause</label>
          <p className="text-xs text-navy/40 mb-1">What's really driving this — explored before jumping to solutions.</p>
          <textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={2} className="w-full rounded-lg border border-light px-3 py-2" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Action item</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2" placeholder="What will they do differently?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Follow-up date</label>
            <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="w-full rounded-lg border border-light px-3 py-2" />
          </div>
        </div>
        {error && <p className="text-sm text-statusRed">{error}</p>}
        <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors">
          Log Coaching Entry
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-light p-5">
        <h2 className="text-lg font-semibold text-navy mb-3">Coaching History</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-navy/50">No coaching logs yet.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li key={log.id} className="border-b border-light/60 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-semibold text-navy">{log.user.name} — {log.topic}</p>
                  <select
                    value={log.outcome}
                    onChange={(e) => updateOutcome(log.id, e.target.value)}
                    className="text-xs rounded border border-light px-2 py-1"
                  >
                    {OUTCOMES.map((o) => (
                      <option key={o} value={o}>{o.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-navy/70 mt-1">{log.notes}</p>
                {log.action && <p className="text-sm text-navy/70 mt-1"><strong>Action:</strong> {log.action}</p>}
                <p className="text-xs text-navy/40 mt-1">
                  {formatDate(log.date)}{log.followUp && ` · Follow-up: ${formatDate(log.followUp)}`}
                </p>

                {log.checkIns && log.checkIns.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {log.checkIns.map((ci) => (
                      <span key={ci.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        DECISION_PILL[ci.decision] === "green" ? "bg-statusGreen/10 text-statusGreen" :
                        DECISION_PILL[ci.decision] === "red" ? "bg-statusRed/10 text-statusRed" : "bg-statusYellow/10 text-statusYellow"
                      }`}>
                        {CHECKIN_LABELS[ci.type]}: {ci.decision}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2">
                  {checkinFormFor === log.id ? (
                    <div className="bg-light/40 rounded-lg p-3 space-y-2">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <select value={checkinType} onChange={(e) => setCheckinType(e.target.value)} className="text-sm rounded border border-light px-2 py-1">
                          {CHECKIN_TYPES.map((t) => (
                            <option key={t} value={t}>{CHECKIN_LABELS[t]} check-in</option>
                          ))}
                        </select>
                        <select value={checkinDecision} onChange={(e) => setCheckinDecision(e.target.value)} className="text-sm rounded border border-light px-2 py-1">
                          {DECISIONS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <textarea value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} rows={2} placeholder="Check-in notes" className="w-full text-sm rounded border border-light px-2 py-1" />
                      <div className="flex gap-2">
                        <button onClick={() => handleAddCheckin(log.id)} className="bg-primary text-white rounded px-3 py-1 text-xs font-semibold hover:bg-primary/90 transition-colors">
                          Save Check-in
                        </button>
                        <button onClick={() => setCheckinFormFor(null)} className="text-xs text-navy/50 hover:text-navy">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setCheckinFormFor(log.id)} className="text-xs font-semibold text-primary hover:underline">
                      + Add check-in
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
