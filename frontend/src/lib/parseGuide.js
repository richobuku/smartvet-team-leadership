// Parses a guide's markdown-ish content into sections. Each "## " line
// starts a new section; "- " / "1. " lines within a section become
// checklist items, everything else is treated as paragraph text.
export function parseGuideSections(content) {
  const lines = content.split("\n");
  const sections = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("# ")) continue; // top-level title, shown separately
    if (line.startsWith("## ")) {
      current = { title: line.slice(3).trim(), paragraphs: [], items: [] };
      sections.push(current);
      continue;
    }
    if (!current || !line) continue;

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (bulletMatch) {
      current.items.push(bulletMatch[1]);
    } else if (numberedMatch) {
      current.items.push(numberedMatch[1]);
    } else {
      current.paragraphs.push(line);
    }
  }

  return sections;
}

// Splits text on **bold** markers into an array of { text, bold } parts
// for rendering without dangerouslySetInnerHTML.
export function parseInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return { text: part.slice(2, -2), bold: true };
    }
    return { text: part, bold: false };
  });
}
