import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { parseGuideSections, parseInline } from "../lib/parseGuide";

const ROLE_LABELS = {
  master: "Master Mentorship Guide",
  team_leader: "Team Leader Playbook",
  team_member: "Your Guide",
};

function Inline({ text }) {
  return parseInline(text).map((part, i) =>
    part.bold ? <strong key={i}>{part.text}</strong> : <span key={i}>{part.text}</span>
  );
}

function GuideCard({ guide }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sections = parseGuideSections(guide.content);
  const [completedItems, setCompletedItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const [openSections, setOpenSections] = useState(() => new Set(sections.map((_, i) => i)));

  useEffect(() => {
    api.get(`/guides/${guide.id}/progress`).then((p) => {
      setCompletedItems(p.completedItems || []);
      setNotes(p.notes || "");
    });
  }, [guide.id]);

  function itemId(sectionIdx, itemIdx) {
    return `${sectionIdx}-${itemIdx}`;
  }

  function toggleItem(id) {
    const next = completedItems.includes(id)
      ? completedItems.filter((x) => x !== id)
      : [...completedItems, id];
    setCompletedItems(next);
    api.put(`/guides/${guide.id}/progress`, { completedItems: next }).catch(() => {});
  }

  function toggleSection(idx) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function saveNotes() {
    setNotesSaved(true);
    api.put(`/guides/${guide.id}/progress`, { notes }).catch(() => {});
  }

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const doneItems = completedItems.filter((id) => {
    const [sIdx, iIdx] = id.split("-").map(Number);
    return sections[sIdx] && iIdx < sections[sIdx].items.length;
  }).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-light p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-navy">{ROLE_LABELS[guide.role] || guide.title}</h2>
          <h3 className="text-sm font-semibold text-navy/60">{guide.title}</h3>
        </div>
        {totalItems > 0 && (
          <span className="text-xs font-semibold text-navy/50 bg-light rounded-full px-3 py-1">
            {doneItems}/{totalItems} done
          </span>
        )}
      </div>

      <div className="space-y-2">
        {sections.map((section, sIdx) => {
          const sectionDone = section.items.filter((_, iIdx) => completedItems.includes(itemId(sIdx, iIdx))).length;
          const isOpen = openSections.has(sIdx);
          return (
            <div key={sIdx} className="border border-light rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection(sIdx)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
              >
                <span className="font-semibold text-navy text-sm">{section.title}</span>
                <span className="flex items-center gap-2 text-xs text-navy/40">
                  {section.items.length > 0 && <span>{sectionDone}/{section.items.length}</span>}
                  <span>{isOpen ? "▾" : "▸"}</span>
                </span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {section.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm text-navy/80 leading-relaxed">
                      <Inline text={p} />
                    </p>
                  ))}
                  {section.items.length > 0 && (
                    <ul className="space-y-1.5">
                      {section.items.map((item, iIdx) => {
                        const id = itemId(sIdx, iIdx);
                        const checked = completedItems.includes(id);
                        return (
                          <li key={id} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleItem(id)}
                              className="mt-1 accent-primary"
                            />
                            <span className={`text-sm leading-relaxed ${checked ? "text-navy/40 line-through" : "text-navy/80"}`}>
                              <Inline text={item} />
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {user?.role === "team_leader" && (
                    <button
                      type="button"
                      onClick={() => navigate(`/leader/coaching?topic=${encodeURIComponent(section.title)}`)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      + Start a coaching log for this
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-xs font-semibold text-navy/50 mb-1">My notes</label>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
          onBlur={saveNotes}
          rows={2}
          placeholder="Jot down your own thoughts on this guide..."
          className="w-full rounded-lg border border-light px-3 py-2 text-sm"
        />
        {!notesSaved && <p className="text-xs text-navy/30 mt-1">Saving on blur...</p>}
      </div>
    </div>
  );
}

export default function Guides() {
  const { user } = useAuth();
  const [guides, setGuides] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/guides/mine").then(setGuides);
  }, [user]);

  const filtered = guides.filter((g) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return g.title.toLowerCase().includes(term) || g.content.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Coaching &amp; Mentorship Hub</h1>
      <p className="text-sm text-navy/60">
        Your guides are tailored to your role{user?.role === "team_leader" ? " — including your own guide if you're being mentored too" : ""}.
        Expand each section, check off what you've put into practice, and jot personal notes as you go.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search guides..."
        className="w-full sm:w-80 rounded-lg border border-light px-3 py-2"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-navy/50">No guides found.</p>
      ) : (
        filtered.map((g) => <GuideCard key={g.id} guide={g} />)
      )}
    </div>
  );
}
