// Rules-first extractor for Indian residential lease clauses. No dependencies, no Firebase.
// Output contract: every numeric field is a number or null (never 0 for absent, never a string).
// Each field carries the matched text as evidence. A field is `unsure` when figures and words
// conflict, when several competing values exist, or when it cannot be computed (e.g. months' rent with no rent).
//
// Documented rule for the legacy single `notice_days` field (used for scoring only):
//   notice_days = lessee-side notice if stated, else the either-party notice, else the lessor-side notice.
// 1 month = 30 days, 1 week = 7 days.

export type Party = 'lessee' | 'lessor' | 'either';
export interface Ev { value: number | null; evidence: string | null; unsure?: string }
export interface Extraction {
  deposit: Ev;
  lockin: Ev & { binds: 'lessee' | 'lessor' | 'both' | 'unknown' };
  notice: { lessee: number | null; lessor: number | null; either: number | null; evidence: string[]; without_notice: boolean; unsure?: string };
  escalation_pct: Ev;
  rent: number | null;
  derived: { deposit: number | null; lockin_months: number | null; notice_days: number | null; escalation_pct: number | null };
  flags: string[];
  unsure: string[];
}
export interface Ctx { rent?: number }
// The tool's own thresholds for the numeric flags. The app may replace them from Firebase Remote Config before a scan;
// the flag names keep their original numbers because they are identifiers, not labels.
export const LIMITS = { depositMonths: 3, risePct: 10, noticeDays: 15 };

const W = '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakhs?|lacs?|crores?|half)';
const QW = `\\b${W}(?:[\\s-]+(?:and[\\s-]+a[\\s-]+|and[\\s-]+|a[\\s-]+)?${W})*\\b`;
const ND = '\\d[\\d,]*(?:\\.\\d+)?';
const Q = `(?:${ND}|${QW})`;
const QN = `(?:${Q}|\\ban?\\b)`;
const PAREN = '(?:\\s*\\(\\s*(\\d+|[a-z][a-z\\s-]*?)\\s*\\))?';

const UNIT: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

function wordsToNum(s: string): number | null {
  let total = 0, cur = 0, seen = false;
  for (const t of s.toLowerCase().split(/[\s-]+/)) {
    if (!t || t === 'and' || t === 'a' || t === 'only') continue;
    if (t in UNIT) { cur += UNIT[t]; seen = true; }
    else if (t === 'half') { cur += 0.5; seen = true; }
    else if (t === 'hundred') { cur = (cur || 1) * 100; seen = true; }
    else if (t === 'thousand') { total += (cur || 1) * 1000; cur = 0; seen = true; }
    else if (/^lakhs?$|^lacs?$/.test(t)) { total += (cur || 1) * 1e5; cur = 0; seen = true; }
    else if (/^crores?$/.test(t)) { total += (cur || 1) * 1e7; cur = 0; seen = true; }
    else return null;
  }
  return seen ? total + cur : null;
}
function parseQ(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (/^an?$/.test(t)) return 1;
  if (/^\d/.test(t)) { const n = parseFloat(t.replace(/,/g, '')); return Number.isNaN(n) ? null : n; }
  return wordsToNum(t);
}
const MULT = (u?: string) => !u ? 1 : /^cr/i.test(u) ? 1e7 : 1e5;

export function normalize(text: string): string {
  return text
    .replace(/₹/g, 'Rs ')
    .replace(/(\d)\s*\/-/g, '$1')
    .replace(/\bRs\.\s*/gi, 'Rs ')
    .replace(/\b(Mr|Ms|Mrs|Dr|No)\./g, '$1')
    .replace(/[’‘]/g, "'");
}
export function sentences(text: string): string[] {
  return normalize(text).split(/(?<=[.!?])\s+(?=[A-Z0-9(])/).map(s => s.trim()).filter(Boolean);
}

interface Amt { start: number; end: number; value: number; words?: number; text: string; owner: string; superseded: boolean }

function findAmounts(s: string): Amt[] {
  const raw: Amt[] = [];
  const push = (m: RegExpExecArray, value: number | null) => {
    if (value === null || Number.isNaN(value)) return;
    raw.push({ start: m.index, end: m.index + m[0].length, value, text: m[0], owner: '', superseded: false });
  };
  let m: RegExpExecArray | null;
  const r1 = new RegExp(`\\b(?:rs|inr|rupees)\\b\\s*(${ND})(?:\\s*(lakhs?|lacs?|crores?)\\b)?`, 'gi');
  while ((m = r1.exec(s))) push(m, parseQ(m[1])! * MULT(m[2]));
  const r2 = new RegExp(`(${ND})\\s*(lakhs?|lacs?|crores?)\\b(?:\\s*(?:rupees|rs)\\b)?`, 'gi');
  while ((m = r2.exec(s))) push(m, parseQ(m[1])! * MULT(m[2]));
  const r3 = new RegExp(`(${QW})\\s+rupees\\b`, 'gi');
  while ((m = r3.exec(s))) push(m, wordsToNum(m[1]));
  const r4 = new RegExp(`\\brupees\\s+(${QW})(?:\\s+only)?`, 'gi');
  while ((m = r4.exec(s))) push(m, wordsToNum(m[1]));
  raw.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const out: Amt[] = [];
  for (const a of raw) {
    if (out.length && a.start < out[out.length - 1].end) continue;
    if (/\(\s*$/.test(s.slice(0, a.start)) && out.length) { out[out.length - 1].words = a.value; continue; }
    out.push(a);
  }
  const kw = /deposit|security|maintenance|charges?|penalt|\bfine\b|\bfees?\b|rent/gi;
  for (const a of out) {
    let owner = '', k: RegExpExecArray | null;
    kw.lastIndex = 0;
    const before = s.slice(0, a.start);
    while ((k = kw.exec(before))) {
      const t = k[0].toLowerCase();
      owner = /deposit|security/.test(t) ? 'deposit' : t === 'rent' ? 'rent' : /maint|charge|fee/.test(t) ? 'maintenance' : 'penalty';
    }
    if (!owner) {
      const after = /deposit|security|maintenance|charges?|\brent\b/i.exec(s.slice(a.end, a.end + 80));
      if (after) owner = /deposit|security/i.test(after[0]) ? 'deposit' : /rent/i.test(after[0]) ? 'rent' : 'maintenance';
    }
    a.owner = owner;
    a.superseded = /\b(draft|earlier|previously|originally|mentioned)\b/i.test(before.slice(-70)) && out.some(o => o !== a && o.start > a.start);
  }
  return out;
}

const none = (): Ev => ({ value: null, evidence: null });

function extractDeposit(sents: string[], ctx: Ctx, rent: number | null): Ev {
  const cands: { v: number; ev: string; words?: number }[] = [];
  for (const s of sents) for (const a of findAmounts(s)) if (a.owner === 'deposit' && !a.superseded) cands.push({ v: a.value, ev: a.text, words: a.words });
  const distinct = [...new Set(cands.map(c => c.v))];
  if (distinct.length > 1) return { value: null, evidence: cands.map(c => c.ev).join(' | '), unsure: 'several deposit amounts' };
  if (distinct.length === 1) {
    const c = cands[0];
    if (c.words !== undefined && c.words !== c.v) return { value: null, evidence: c.ev, unsure: `figures (${c.v}) and words (${c.words}) differ` };
    return { value: c.v, evidence: c.ev };
  }
  const re = new RegExp(`deposit[^.]*?(?:equal to|equivalent to|of|being|is)\\s+(${Q})\\s+months?'?s?\\s+(?:of\\s+)?(?:the\\s+)?(?:monthly\\s+)?rent\\b`, 'i');
  for (const s of sents) {
    const m = re.exec(s);
    if (!m) continue;
    const n = parseQ(m[1]);
    if (n === null) continue;
    if (rent === null) return { value: null, evidence: m[0], unsure: `${n} months' rent but rent not stated` };
    return { value: n * rent, evidence: m[0] };
  }
  return none();
}

function extractEscalation(sents: string[]): Ev {
  const re = new RegExp(`(${Q})\\s*(?:%|per[\\s-]?cent|percent)`, 'gi');
  const found: { v: number; ev: string }[] = [];
  for (const s of sents) {
    if (!/increas|enhanc|escalat|revis|go(?:es)? up|\brise|hike/i.test(s)) continue;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(s))) { const v = parseQ(m[1]); if (v !== null) found.push({ v, ev: m[0] }); }
  }
  const distinct = [...new Set(found.map(f => f.v))];
  if (distinct.length === 0) return none();
  if (distinct.length > 1) return { value: null, evidence: found.map(f => f.ev).join(' | '), unsure: 'several percentages' };
  return { value: distinct[0], evidence: found[0].ev };
}

function extractLockin(sents: string[]): Extraction['lockin'] {
  const res: Extraction['lockin'] = { value: null, evidence: null, binds: 'unknown' };
  const re = new RegExp(`(${Q})${PAREN}\\s*months?\\b`, 'gi');
  for (const s of sents) {
    const kwm = /lock[\s-]?in/i.exec(s);
    const notVac = new RegExp(`(?:not|never)\\s+(?:vacate|leave|terminate)[^.]*?first\\s+(${Q})${PAREN}\\s*months?`, 'i').exec(s);
    let best: { v: number; ev: string; dist: number; conflict: boolean } | null = null;
    if (kwm) {
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((m = re.exec(s))) {
        const a = parseQ(m[1]), b = m[2] !== undefined ? parseQ(m[2]) : null;
        const v = b ?? a;
        if (v === null) continue;
        const dist = Math.abs(m.index - kwm.index);
        if (!best || dist < best.dist) best = { v, ev: m[0], dist, conflict: b !== null && a !== null && a !== b };
      }
    } else if (notVac) {
      const a = parseQ(notVac[1]), b = notVac[2] !== undefined ? parseQ(notVac[2]) : null;
      const v = b ?? a;
      if (v !== null) best = { v, ev: notVac[0], dist: 0, conflict: b !== null && a !== null && a !== b };
    }
    if (!best) continue;
    res.value = best.v; res.evidence = best.ev;
    if (best.conflict) { res.value = null; res.unsure = 'figures and words differ'; }
    res.binds = /binding on the (?:lessee|tenant) only|for the (?:lessee|tenant)\b|(?:lessee|tenant) (?:alone|only)|applicable to the (?:lessee|tenant)|\b(?:lessee|tenant)\b[^.]*?\bnot\s+(?:vacate|leave|terminate)/i.test(s) ? 'lessee'
      : /both parties|either party|each party/i.test(s) ? 'both'
      : notVac ? 'lessee' : 'unknown';
    return res;
  }
  return res;
}

const DAYS = (n: number, u: string) => n * (/^week/i.test(u) ? 7 : /^month/i.test(u) ? 30 : 1);

function extractNotice(sents: string[]): Extraction['notice'] {
  const out: Extraction['notice'] = { lessee: null, lessor: null, either: null, evidence: [], without_notice: false };
  const a = new RegExp(`notice\\s+(?:of|period of)\\s+(${QN})${PAREN}\\s*(days?|weeks?|months?)\\b`, 'i');
  const b = new RegExp(`(${QN})${PAREN}\\s*(days?|weeks?|months?)['’]?s?\\s*(?:\\(\\s*(\\d+)\\s*days?\\s*\\)\\s*)?(?:(?:prior|written|advance|clear|previous)\\s+)*notice\\b`, 'i');
  const c = new RegExp(`\\bnotice(?:\\s+period)?\\s*[:\\-]\\s*(${QN})${PAREN}\\s*(days?|weeks?|months?)\\b`, 'i');
  for (const s of sents) {
    if (!/notice/i.test(s)) continue;
    const sched = c.exec(s);
    if (sched) {
      const n = (sched[2] !== undefined ? parseQ(sched[2]) : null) ?? parseQ(sched[1]);
      if (n !== null && out.either === null) { out.either = DAYS(n, sched[3]); out.evidence.push(`either: ${sched[0]}`); }
      continue;
    }
    const sentTerm = /terminat/i.test(s);
    // Only a tenancy-ending sentence counts: "enter without notice" is an entry term, not a notice period.
    if (/without (?:any )?notice/i.test(s) && /terminat|vacat|evict|\bquit\b/i.test(s)) out.without_notice = true;
    for (const seg of s.split(/(?:,\s*)?\b(?:whereas|while|but)\b|;|(?:,\s*)?\band\s+(?=the\s+(?:lessor|lessee|landlord|tenant)\b)/i)) {
      if (!/notice/i.test(seg)) continue;
      if (!(/terminat|vacat(?:e|ing|es)\b|evict|\bquit\b|\bend(?:ed|ing)?\b|cancel/i.test(seg) || sentTerm)) continue;
      const m = b.exec(seg) || a.exec(seg);
      if (!m) continue;
      let days: number | null;
      if (m[4] !== undefined) days = parseFloat(m[4]);
      else {
        const n = (m[2] !== undefined ? parseQ(m[2]) : null) ?? parseQ(m[1]);
        days = n === null ? null : DAYS(n, m[3]);
      }
      if (days === null) continue;
      const pm = /\b(either party|each party|both parties|lessee|tenant|lessor|landlord)\b/i.exec(seg);
      const who = !pm ? 'either' : /either|each|both/i.test(pm[1]) ? 'either' : /lessee|tenant/i.test(pm[1]) ? 'lessee' : 'lessor';
      if (out[who as Party] === null) { out[who as Party] = days; out.evidence.push(`${who}: ${m[0]}`); }
    }
  }
  return out;
}

export function extract(text: string, ctx: Ctx = {}): Extraction {
  const sents = sentences(text);
  const rentAmts = [...new Set(sents.flatMap(s => findAmounts(s)).filter(a => a.owner === 'rent' && !a.superseded).map(a => a.value))];
  const rent = ctx.rent ?? (rentAmts.length === 1 ? rentAmts[0] : null);
  const deposit = extractDeposit(sents, ctx, rent);
  const lockin = extractLockin(sents);
  const notice = extractNotice(sents);
  const escalation_pct = extractEscalation(sents);
  const derivedNotice = notice.lessee ?? notice.either ?? notice.lessor;
  const derived = { deposit: deposit.value, lockin_months: lockin.value, notice_days: derivedNotice, escalation_pct: escalation_pct.value };
  const flags: string[] = [];
  if (deposit.value !== null && rent !== null && deposit.value > LIMITS.depositMonths * rent) flags.push('deposit_over_3x_rent');
  if (escalation_pct.value !== null && escalation_pct.value > LIMITS.risePct) flags.push('escalation_over_10pct');
  const notices = [notice.lessee, notice.lessor, notice.either].filter((x): x is number => x !== null);
  if (notices.some(n => n < LIMITS.noticeDays)) flags.push('notice_under_15_days');
  if ((notice.lessee !== null && notice.lessor !== null && notice.lessee !== notice.lessor) || notice.without_notice) flags.push('notice_one_sided');
  if (lockin.value !== null && lockin.binds === 'lessee') flags.push('lockin_binds_lessee_only');
  const unsure = [deposit.unsure && 'deposit', lockin.unsure && 'lockin_months', escalation_pct.unsure && 'escalation_pct'].filter((x): x is string => !!x);
  return { deposit, lockin, notice, escalation_pct, rent, derived, flags, unsure };
}
