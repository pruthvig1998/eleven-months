// Splits a lease into clauses: numbered clauses ("1.", "4)", "3.1 Rent"), blank-line paragraphs, and
// long paragraphs cut into chunks of at most ~250 words (Nano fails above roughly 6,000 words per call, and
// short clauses classify better). Lines under 25 characters are kept only if they contain a digit.
// shortcut: no handling of tables or two-column PDFs, upgrade when real PDF text extraction is added.
const MAX_WORDS = 250, CHUNK_WORDS = 200;

function chunk(clause: string): string[] {
  const n = (s: string) => s.split(/\s+/).length;
  if (n(clause) <= MAX_WORDS) return [clause];
  const out: string[] = []; let cur: string[] = [], count = 0;
  const flush = () => { if (cur.length) out.push(cur.join(' ')); cur = []; count = 0; };
  for (const s of clause.split(/(?<=[.;])\s+(?=[A-Z0-9(])/)) {
    const words = s.split(/\s+/);
    if (words.length > MAX_WORDS) { flush(); for (let i = 0; i < words.length; i += CHUNK_WORDS) out.push(words.slice(i, i + CHUNK_WORDS).join(' ')); continue; }
    if (count + words.length > CHUNK_WORDS) flush();
    cur.push(s); count += words.length;
  }
  flush();
  return out;
}

export function splitClauses(lease: string): string[] {
  return lease
    .split(/\n\s*\n|\n(?=\s*(?:\d+[.)]\s|\d+(?:\.\d+)+[.)]?\s+[A-Z]))/)
    .map(c => c.replace(/\s*\n\s*/g, ' ').trim())
    .filter(c => c.length >= 25 || /\d/.test(c))
    .flatMap(chunk);
}

// The label a reader would use for a clause: its own number if it has one ("3.", "4)", "3.1 Rent").
export function clauseLabel(text: string, index: number): string {
  const m = text.match(/^\s*(\d+(?:\.\d+)*)[.)]?\s/);
  return m ? `Clause ${m[1]}` : index === 0 ? 'Opening' : `Part ${index + 1}`;
}
