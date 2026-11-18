// First-run test of the rules on messy full documents. Run: node rules/score-messy.ts
import { readFileSync } from 'node:fs';
import { extract } from './extract.ts';

const docs = JSON.parse(readFileSync(new URL('./data/messy.json', import.meta.url), 'utf8')) as {
  id: string; note: string; text: string;
  gold: { rent: number | null; deposit: number | null; lockin_months: number | null; notice_days: number | null; escalation_pct: number | null };
}[];
const KEYS = ['rent', 'deposit', 'lockin_months', 'notice_days', 'escalation_pct'] as const;
let ok = 0, tot = 0, wrongNonNull = 0;
for (const d of docs) {
  const r = extract(d.text);
  const got: Record<string, number | null> = { rent: r.rent, ...r.derived };
  console.log(`\nDoc ${d.id}: ${d.note}`);
  for (const k of KEYS) {
    const g = d.gold[k], v = got[k];
    const status = v === g ? 'ok  ' : v === null ? 'miss' : 'WRONG';
    tot++; if (v === g) ok++; else if (v !== null) wrongNonNull++;
    console.log(`  ${status} ${k}: gold ${g} rules ${v}`);
  }
  console.log(`  flags: ${r.flags.join(', ') || '-'} | unsure: ${r.unsure.join(', ') || '-'} | notice: ${JSON.stringify({ lessee: r.notice.lessee, lessor: r.notice.lessor, either: r.notice.either })} | lock-in binds: ${r.lockin.binds}`);
}
console.log(`\nTotal ${ok}/${tot} fields exact; wrong non-null values: ${wrongNonNull}; misses (null): ${tot - ok - wrongNonNull}`);
