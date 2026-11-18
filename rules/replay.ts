// Offline replay of the routing on the saved dev-set outputs (no inference, no network).
// Run: node rules/replay.ts
import { readFileSync } from 'node:fs';
import { decide, finalize, toLabel, hasFigures, FIELDS, type Model } from './pipeline.ts';

const rd = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const dev = rd('../harness/data/clauses.json') as { id: number; text: string; label: 'ok' | 'risky'; fields: Record<string, number | null> }[];
for (const [id, f] of Object.entries(rd('./data/gold-fixes.json') as Record<string, { field: string; new: number | null }>)) dev.find(c => c.id === +id)!.fields[f.field] = f.new;

const strip = (t: string) => { try { return JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } } };
const nanoCls = new Map((rd('../harness/results/AB_v2s.json').cls as { id: number; p?: { label?: string } }[]).map(r => [r.id, r.p]));
const nanoFld = new Map((rd('../harness/results/AB_v2s.json').fld as { id: number; p?: Record<string, unknown> }[]).map(r => [r.id, r.p]));
const G = rd('../harness/results/G.json') as { id: number; a: string; b: string }[];
const cloud = new Map<number, Model>(G.map(g => [g.id, { label: toLabel(strip(g.a)?.label), fields: strip(g.b) }]));
const nano = (id: number): Model => ({ label: toLabel(nanoCls.get(id)?.label), fields: nanoFld.get(id) ?? null });
// What the app does now: the numbers prompt is not sent for a clause with no figures.
const nanoApp = (id: number, text: string): Model => (hasFigures(text) ? nano(id) : { label: nano(id).label, fields: {} });

interface Row { name: string; calls: number; labelOk: number; risky: number; riskyHit: number; fieldsAllOk: number; fpFields: number; check: number; checkOnWrong: number; wrong: number }
const blank = (name: string): Row => ({ name, calls: 0, labelOk: 0, risky: 0, riskyHit: 0, fieldsAllOk: 0, fpFields: 0, check: 0, checkOnWrong: 0, wrong: 0 });
function tally(r: Row, c: (typeof dev)[number], label: string | null, fields: Record<string, number | null>, check: boolean) {
  const okL = label === c.label;
  const okF = FIELDS.every(f => (fields[f] ?? null) === c.fields[f]);
  r.labelOk += +okL; r.fieldsAllOk += +okF;
  if (c.label === 'risky') { r.risky++; r.riskyHit += +(label === 'risky'); }
  r.fpFields += FIELDS.filter(f => c.fields[f] === null && fields[f] !== null).length;
  if (!okL || !okF) r.wrong++;
  if (check) { r.check++; if (!okL || !okF) r.checkOnWrong++; }
}

const nanoOnly = blank('Nano only'), cloudAll = blank('Cloud always'), pipe = blank('Pipeline (rules + Nano, cloud on trigger)');
const log: string[] = [];
let skipped = 0;
for (const c of dev) {
  const n = nano(c.id), cl = cloud.get(c.id)!;
  const nf = Object.fromEntries(FIELDS.map(f => [f, n.fields ? Number(n.fields[f] ?? null) || null : null]));
  tally(nanoOnly, c, n.label, nf, false);
  cloudAll.calls++;
  tally(cloudAll, c, cl.label, Object.fromEntries(FIELDS.map(f => [f, cl.fields ? Number(cl.fields[f] ?? null) || null : null])), false);
  const na = nanoApp(c.id, c.text);
  if (!hasFigures(c.text)) skipped++;
  const d = decide(c.text, na);
  const fin = finalize(d, na, d.needsCloud ? cl : null);
  if (d.needsCloud) pipe.calls++;
  tally(pipe, c, fin.label, fin.fields, fin.check);
  if (d.needsCloud) log.push(`  clause ${c.id}: ${d.reasons.join('; ')}`);
}
const line = (r: Row) => `| ${r.name} | ${r.calls}/40 | ${r.labelOk}/40 | ${r.riskyHit}/${r.risky} | ${r.fieldsAllOk}/40 | ${r.fpFields} | ${r.check} (${r.checkOnWrong} on wrong) |`;
console.log('| Method | cloud calls | label correct | risky found | all 4 fields correct | FP fields | check flags |\n|---|---|---|---|---|---|---|');
[nanoOnly, cloudAll, pipe].forEach(r => console.log(line(r)));
console.log(`\nOn-device numbers prompt skipped for ${skipped}/40 clauses (no figures in the text).`);
console.log('\nPipeline cloud triggers:\n' + log.join('\n'));
