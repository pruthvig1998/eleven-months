// Everything that leaves the device is masked first. Redaction favours recall over precision:
// any 12-digit run is treated as an Aadhaar (a typo must not let it through), PAN is case-insensitive,
// and names are masked from three sources: Nano's list, honorific patterns, and "son of / S/o" patterns,
// so an empty or failed Nano names call no longer leaks honorific names.
// shortcut: a bare name with no honorific and no Nano match (e.g. "Ravi signed") is not caught; upgrade with a name list if needed.
const NAME_WORD = '(?:[A-Z]\\.|[A-Z][A-Za-z]+)';
const NAME = `((?:${NAME_WORD}\\s*){1,4})`;
const HON = '(?:Mr|MR|Mrs|MRS|Ms|MS|Miss|Dr|DR|Smt|SMT|Sri|SRI|Shri|SHRI|Sh|Kum)';
const REL = '(S\\/o|D\\/o|W\\/o|H\\/o|[Ss]on of|[Dd]aughter of|[Ww]ife of|[Hh]usband of)';
const TITLES = '((?:(?:Late|Sri|Smt|Shri|Mr|Mrs|Ms)\\.?\\s+)*)';
const trail = (s: string) => s.match(/\s*$/)![0];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function mask(text: string, names: string[]): string {
  let t = text
    // Text read from a photo confuses 0/O and 1/l/I, so those letters count as digits when most of the run is digits.
    .replace(/(?<![A-Za-z\d])[\dOoIl]{4}[\s-]?[\dOoIl]{4}[\s-]?[\dOoIl]{4}(?![A-Za-z\d])/g, m => ((m.match(/\d/g) ?? []).length >= 8 ? '[AADHAAR]' : m))
    .replace(/\b[A-Za-z]{5}\s?[\dOoIl]{4}\s?[A-Za-z]\b/g, m => ((m.match(/\d/g) ?? []).length >= 2 ? '[PAN]' : m))
    .replace(/(?<!\d)(?:\+?91[ -]?)?[6-9]\d{4}[ -]?\d{5}(?!\d)/g, '[PHONE]')
    .replace(/(?<!\d)0\d{2,4}[ -]\d{6,8}(?!\d)/g, '[PHONE]')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[EMAIL]');
  for (const n of [...names].filter(Boolean).sort((a, b) => b.length - a.length))
    t = t.replace(new RegExp(`(?<![A-Za-z])${esc(n)}(?![A-Za-z])`, 'gi'), '[NAME]');
  t = t.replace(new RegExp(`\\b${REL}\\.?\\s+${TITLES}${NAME}`, 'g'), (_m, rel, titles, name) => `${rel} ${titles}[NAME]${trail(name)}`);
  t = t.replace(new RegExp(`\\b(${HON}\\.?)\\s+${NAME}`, 'g'), (_m, hon, name) => `${hon} [NAME]${trail(name)}`);
  return t;
}

// Second, independent look at text about to leave the device, so a gap in mask() cannot slip through unseen.
// Deliberately cruder and stricter than mask(): it does not reuse mask()'s patterns. Any hit blocks the send.
const NOT_NAME = new Set(['the', 'lessor', 'lessee', 'landlord', 'tenant', 'owner', 'licensor', 'licensee', 'party', 'mr', 'mrs', 'ms', 'miss', 'dr', 'smt', 'sri', 'shri', 'kum', 'late']);
export function leaks(sent: string, names: string[]): string[] {
  const found: string[] = [];
  if (/\d{10,}/.test(sent.replace(/[\s-]/g, ''))) found.push('a long number (ID or phone)');
  if (sent.includes('@')) found.push('an email address');
  if (/\b[A-Za-z]{5}\d{4}[A-Za-z]\b/.test(sent)) found.push('a PAN');
  const low = ` ${sent.toLowerCase().replace(/[^a-z]+/g, ' ')} `;
  const words = names.flatMap(n => n.toLowerCase().split(/[^a-z]+/)).filter(w => w.length >= 3 && !NOT_NAME.has(w));
  if (words.some(w => low.includes(` ${w} `))) found.push('a name');
  return found;
}
