import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASKS, askForFinding, askForFlag, askForGap, VISIT } from './asks.ts';
import { RULES, analyzeClause, coverage } from './topics.ts';
import { extract } from './extract.ts';

test('every high or medium finding a rule can produce has an ask', () => {
  for (const r of RULES) for (const t of [...(r.examples.high ?? []), ...(r.examples.medium ?? [])])
    for (const f of analyzeClause(t, { rent: 20000 })) if (f.severity !== 'info') assert.ok(askForFinding(f), `no ask for ${f.topic}:${f.severity} (${f.title})`);
});
test('info findings get no ask', () => {
  const info = analyzeClause('The Lessee shall not sublet the premises without written consent.');
  assert.ok(info.length && info.every(f => askForFinding(f) === undefined));
});
test('the deposit-size finding and every numeric flag have an ask', () => {
  const dep = analyzeClause("The security deposit is equal to ten months' rent, the monthly rent being Rs. 18,000.").find(f => f.topic === 'deposit');
  assert.ok(dep && askForFinding(dep));
  const flags = new Set([
    ...extract('Security deposit of Rs. 3,00,000 is payable. The monthly rent is Rs. 25,000.').flags,
    ...extract('The rent shall be increased by 25% every year.').flags,
    ...extract("The Lessee shall give 3 months notice before vacating, whereas the Lessor may terminate on 7 days notice.").flags,
    ...extract('There shall be a lock-in period of twelve (12) months, binding on the Lessee only.').flags,
  ]);
  assert.equal(flags.size, 5, [...flags].join(','));
  for (const fl of flags) assert.ok(askForFlag(fl), `no ask for flag ${fl}`);
});
test('every lease-checklist gap has an ask', () => {
  for (const c of coverage(['The rent is Rs. 20,000.'])) assert.ok(askForGap(c.topic), `no ask for gap ${c.topic}`);
});
test('the penalty ask differs from the forfeiture ask', () => {
  const pen = analyzeClause('In case of early exit the Lessee shall pay a penalty of one month rent.').find(f => f.topic === 'forfeiture')!;
  assert.equal(askForFinding(pen), ASKS['forfeiture:medium']);
});
test('asks are sentences that start with "Ask", and the visit checklist is not empty', () => {
  for (const [k, v] of Object.entries(ASKS)) assert.ok(/^Ask .+\.$/.test(v), k);
  assert.ok(VISIT.length >= 3 && VISIT.every(g => g.title && g.items.length >= 3));
});
