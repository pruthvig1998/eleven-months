// Collects the three unseen clause sets into one JSON file and one numbered test agreement, so the whole
// pipeline (rules + on-device model + cloud) can be measured in the browser. Run: node rules/build-unseen.ts
import { readFileSync, writeFileSync } from 'node:fs';
const grab = (src: string, name: string): [string, string][] => { const m = src.match(new RegExp(`const ${name}: \\[string, ?string\\]\\[\\] = (\\[[\\s\\S]*?\\n\\]);`)); return m ? new Function(`return ${m[1]}`)() : []; };
const items: { n: number; set: number; kind: 'harmful' | 'fair'; key: string; text: string }[] = [];
['probe-realworld.ts', 'probe-realworld2.ts', 'probe-realworld3.ts'].forEach((f, i) => {
  const src = readFileSync(new URL(f, import.meta.url), 'utf8');
  for (const [key, text] of grab(src, 'R')) items.push({ n: items.length + 1, set: i + 1, kind: 'harmful', key, text });
  for (const [key, text] of grab(src, 'OK')) items.push({ n: items.length + 1, set: i + 1, kind: 'fair', key, text });
});
const lease = 'RENTAL AGREEMENT\n\nThis agreement is between the Lessor and the Lessee. The monthly rent is Rs. 25,000.\n\n' + items.map(x => `${x.n}. ${x.text}`).join('\n\n');
writeFileSync(new URL('data/unseen.json', import.meta.url), JSON.stringify({ items, lease }, null, 1));
console.log(items.length, 'clauses;', items.filter(x => x.kind === 'harmful').length, 'harmful;', lease.length, 'characters');
