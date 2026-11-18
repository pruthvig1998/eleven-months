// Offline scoring: rules vs saved Nano v2s and cloud outputs. Same rules as harness test B:
// exact match counted only where the gold field exists; false positive where gold is null.
// Run: node rules/score.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { extract } from './extract.ts';

const rd = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const KEYS = ['deposit', 'lockin_months', 'notice_days', 'escalation_pct'] as const;
type Fields = Record<(typeof KEYS)[number], number | null>;
interface Item { id: number; text: string; fields: Fields; ctx?: { rent?: number }; expect_unsure?: string[] }

const dev: Item[] = rd('../harness/data/clauses.json');
const fixes = rd('./data/gold-fixes.json');
for (const it of dev) { const f = fixes[it.id]; if (f) it.fields[f.field as keyof Fields] = f.new; }
const held: Item[] = rd('./data/heldout.json');
const held2: Item[] = rd('./data/heldout2.json');

const num = (v: unknown): number | null | 'bad' => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? 'bad' : n;
};
const strip = (t: string) => { try { return JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } } };

type Pred = (it: Item) => Partial<Record<keyof Fields, number | null | 'bad'>> | null;

function score(items: Item[], pred: Pred) {
  const per: Record<string, { exist: number; match: number; nullN: number; fp: number }> = {};
  KEYS.forEach(k => (per[k] = { exist: 0, match: 0, nullN: 0, fp: 0 }));
  for (const it of items) {
    const p = pred(it);
    for (const k of KEYS) {
      if (it.expect_unsure?.includes(k)) continue;
      const g = it.fields[k], v = p ? (p[k] ?? null) : 'bad';
      if (g !== null) { per[k].exist++; if (v === g) per[k].match++; }
      else { per[k].nullN++; if (v !== null && v !== 'bad') per[k].fp++; }
    }
  }
  return per;
}
const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}% (${a}/${b})` : 'n/a');

const rulesPred: Pred = it => extract(it.text, it.ctx).derived;
const nanoRaw = rd('../harness/results/AB_v2s.json').fld as { id: number; p?: Record<string, unknown> }[];
const nanoById = new Map(nanoRaw.map(r => [r.id, r.p]));
const cloudRaw = rd('../harness/results/G.json') as { id: number; b: string }[];
const cloudById = new Map(cloudRaw.map(r => [r.id, strip(r.b)]));
const fromMap = (m: Map<number, any>): Pred => it => {
  const p = m.get(it.id);
  return p ? Object.fromEntries(KEYS.map(k => [k, num(p[k])])) : null;
};

const table = (name: string, items: Item[], pred: Pred) => {
  const s = score(items, pred);
  return `| ${name} | ${KEYS.map(k => pct(s[k].match, s[k].exist)).join(' | ')} | ${KEYS.map(k => `${s[k].fp}/${s[k].nullN}`).join(' | ')} |`;
};
const head = '| Method | deposit EM | lock-in EM | notice EM | escalation EM | deposit FP | lock-in FP | notice FP | escalation FP |\n|---|---|---|---|---|---|---|---|---|';
const out: string[] = [];
out.push('### Dev set (40 clauses, gold corrected per data/gold-fixes.json)', head, table('rules', dev, rulesPred), table('Nano v2s (saved)', dev, fromMap(nanoById)), table('Cloud (saved)', dev, fromMap(cloudById)));
out.push('', '### Held-out set 2 (12 clauses, written after the rules were fixed on set 1; scored before any change)', head, table('rules', held2, rulesPred));
out.push('', '### Held-out set 1 (16 clauses, never used to develop rules; no saved Nano/cloud outputs)', head, table('rules', held, rulesPred));
const unsureMiss = held.filter(i => i.expect_unsure).filter(i => !extract(i.text, i.ctx).unsure.includes(i.expect_unsure![0])).map(i => i.id);
out.push('', `Expected-unsure held-out cases returned as unsure: ${held.filter(i => i.expect_unsure).length - unsureMiss.length}/${held.filter(i => i.expect_unsure).length}`);

// Disagreement trigger: flag a clause when rules and Nano differ on any field, or rules are unsure.
let nanoWrong = 0, caught = 0, falseFlags = 0, flagged = 0, nanoRight = 0;
for (const it of dev) {
  const p = fromMap(nanoById)(it), r = extract(it.text, it.ctx);
  const wrong = !p || KEYS.some(k => (p[k] ?? null) !== it.fields[k]);
  const differ = !p || KEYS.some(k => (p[k] ?? null) !== r.derived[k]) || r.unsure.length > 0;
  if (wrong) { nanoWrong++; if (differ) caught++; } else { nanoRight++; if (differ) falseFlags++; }
  if (differ) flagged++;
}
out.push('', '### Rules-vs-Nano disagreement trigger (dev set, whole-clause: any of 4 fields)', `Nano clauses with at least one wrong field: ${nanoWrong}/40; caught by trigger: ${caught}; false flags on clauses Nano got fully right: ${falseFlags}/${nanoRight}; total flagged: ${flagged}/40.`);

// Where rules are still wrong (dev), for the log
const miss: string[] = [];
for (const it of dev) { const r = extract(it.text, it.ctx).derived; for (const k of KEYS) if (r[k] !== it.fields[k]) miss.push(`dev ${it.id} ${k}: gold ${it.fields[k]} rules ${r[k]}`); }
for (const it of [...held, ...held2]) { const r = extract(it.text, it.ctx).derived; for (const k of KEYS) if (!it.expect_unsure?.includes(k) && r[k] !== it.fields[k]) miss.push(`held ${it.id} ${k}: gold ${it.fields[k]} rules ${r[k]}`); }
out.push('', '### Remaining rule misses', ...(miss.length ? miss.map(m => `- ${m}`) : ['none']));
const text = out.join('\n');
writeFileSync(new URL('./results.md', import.meta.url), text + '\n');
console.log(text);
