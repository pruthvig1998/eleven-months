// Check of topic rules on clauses written after the rules. Run: node rules/score-topics.ts [file in rules/data, default topics-heldout.json]
import { readFileSync } from 'node:fs';
import { analyzeClause, maxSeverity } from './topics.ts';
import { extract } from './extract.ts';
const file = process.argv[2] ?? 'topics-heldout.json';
const items = JSON.parse(readFileSync(new URL('./data/' + file, import.meta.url), 'utf8')) as { id: string; label: 'ok' | 'risky'; topic: string; text: string }[];
let hit = 0, risky = 0, fa = 0, ok = 0;
for (const c of items) {
  const fs = analyzeClause(c.text), high = maxSeverity(fs) === 'high' || extract(c.text).flags.length > 0;
  if (c.label === 'risky') { risky++; hit += +high; } else { ok++; fa += +high; }
  console.log(`${high ? 'HIGH' : '----'} ${c.label.padEnd(5)} ${c.id} [${c.topic}] ${high ? fs.filter(f => f.severity === 'high').map(f => f.title).join('; ') : c.text.slice(0, 70)}`);
}
console.log(`\nrisky caught: ${hit}/${risky} | false alarms on ok: ${fa}/${ok}`);
