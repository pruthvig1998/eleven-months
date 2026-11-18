// Rule-growth tool. Run: node rules/gaps.ts
// Runs the topic rules over every labelled clause we have and prints:
//   (a HIGH finding = a topic rule in topics.ts OR a numeric flag from extract.ts)
//   1. false alarms: clauses labelled ok that get a HIGH finding (fix the rule or its examples)
//   2. gaps: clauses labelled risky that get no HIGH finding (candidates for a new rule or a wider pattern)
//   3. clauses that no topic detects at all (the backlog of topics the registry does not cover yet)
// Add a rule in topics.ts with examples, rerun, and the numbers show whether it helped.
import { readFileSync } from 'node:fs';
import { analyzeClause, maxSeverity, topicsFor } from './topics.ts';
import { extract } from './extract.ts';

const rd = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const dev: { id: number; text: string; label: 'ok' | 'risky'; risk_type: string | null }[] = rd('../harness/data/clauses.json');
const rows = dev.map(c => ({ src: `dev#${c.id}`, text: c.text, label: c.label, type: c.risk_type }));

let fa = 0, hit = 0, risky = 0, none = 0;
const falseAlarms: string[] = [], gaps: string[] = [], uncovered: string[] = [];
for (const r of rows) {
  const fs = analyzeClause(r.text);
  const numeric = extract(r.text).flags; // deposit/escalation/notice/lock-in thresholds from extract.ts
  const high = maxSeverity(fs) === 'high' || numeric.length > 0;
  if (r.label === 'ok' && high) { fa++; falseAlarms.push(`${r.src}: ${[...fs.filter(x => x.severity === 'high').map(x => x.title), ...numeric].join('; ')} | ${r.text.slice(0, 90)}`); }
  if (r.label === 'risky') { risky++; if (high) hit++; else gaps.push(`${r.src} [${r.type}]: ${r.text.slice(0, 110)}`); }
  if (!topicsFor(r.text).length) { none++; uncovered.push(`${r.src} [${r.label}]: ${r.text.slice(0, 90)}`); }
}
console.log(`Labelled clauses: ${rows.length} (risky ${risky}, ok ${rows.length - risky})`);
console.log(`Risky clauses with a HIGH finding: ${hit}/${risky}`);
console.log(`False alarms (ok clauses with a HIGH finding): ${fa}/${rows.length - risky}`);
console.log(`Clauses no topic detects: ${none}/${rows.length}`);
if (falseAlarms.length) console.log('\nFALSE ALARMS\n' + falseAlarms.map(x => '  ' + x).join('\n'));
if (gaps.length) console.log('\nGAPS (risky, no high finding)\n' + gaps.map(x => '  ' + x).join('\n'));
if (uncovered.length) console.log('\nUNCOVERED (no topic matches)\n' + uncovered.map(x => '  ' + x).join('\n'));
