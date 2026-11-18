import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audit, parseDeductions, EXAMPLE_DEDUCTIONS, type DLabel } from './deposit.ts';
import { splitClauses } from '../app/src/split.ts';
import { SAMPLE } from '../app/src/sample.ts';

// Three synthetic deduction lists, checked against the sample agreement (deposit 10 x Rs 18,000). Gold labels were
// written by hand from the agreement's clauses; see rules/results-deposit.md for the measured accuracy.
export const GOLD: { name: string; list: string; gold: DLabel[] }[] = [
  { name: 'fair', gold: ['in', 'in', 'bill', 'bill'], list: `Rent for 1 to 10 January (10 days) - Rs. 6,000
Replacement of 3 bulbs and 1 tap washer - Rs. 600
Broken bathroom mirror (photo attached) - Rs. 1,500
Electricity bill, last month (meter) - Rs. 2,100` },
  { name: 'inflated', gold: ['out', 'out', 'out', 'out', 'bill', 'out', 'in'], list: EXAMPLE_DEDUCTIONS },
  { name: 'absent from the agreement', gold: ['out', 'out', 'out', 'out', 'in', 'bill'], list: `Brokerage for finding new tenant: ₹18,000
Agreement renewal and documentation fee: ₹3,000
Society move-out fee: ₹2,000
Geyser servicing: ₹1,500
Notice period shortfall (15 days): ₹9,000
Lost key and lock replacement: ₹800` },
];
const clauses = splitClauses(SAMPLE);

test('parses one deduction per line and skips the total', () => {
  const d = parseDeductions(EXAMPLE_DEDUCTIONS);
  assert.equal(d.length, 7);
  assert.deepEqual(d[0], { item: 'AC servicing', amount: 32000 });
  assert.deepEqual(parseDeductions('2. Deep cleaning ₹ 8,000/-\nPainting 1.5 lakh\n3 bulbs'), [{ item: 'Deep cleaning', amount: 8000 }, { item: 'Painting', amount: 150000 }]);
});
for (const g of GOLD) test(`gold labels: ${g.name} list`, () => {
  const a = audit(parseDeductions(g.list), clauses);
  assert.deepEqual(a.lines.map(l => l.label), g.gold, a.lines.map(l => `${l.item}: ${l.label} (${l.why})`).join('\n'));
});
test('totals against the deposit, and the blanket forfeiture clause is named', () => {
  const a = audit(parseDeductions(EXAMPLE_DEDUCTIONS), clauses);
  assert.equal(a.deposit, 180000);
  assert.equal(a.claimed, 159000);
  assert.deepEqual(a.totals, { in: 18000, bill: 25000, out: 116000 });
  assert.equal(a.minRefund, 162000);
  assert.match(a.blanket ?? '', /forfeit the entire deposit/);
});
test('a charge the agreement fixes is "in" up to the figure, and "ask for the bill" above it', () => {
  const c = ['1. The monthly rent is Rs. 20,000.', "2. At the time of vacating, up to one month's rent shall be deducted from the deposit towards painting."];
  assert.equal(audit([{ item: 'Painting', amount: 15000 }], c).lines[0].label, 'in');
  assert.equal(audit([{ item: 'Painting', amount: 30000 }], c).lines[0].label, 'bill');
  assert.equal(audit([{ item: 'Painting', amount: 15000 }], ['1. The monthly rent is Rs. 20,000.']).lines[0].label, 'out');
});
import { ladder, templateDrafts, citesLaw, factsText, refundClauseOf } from './deposit.ts';
import { noteById } from './knowledge.ts';
test('every ladder step links a note that exists, in both modes', () => {
  for (const s of ['telangana', 'other'] as const) for (const r of ladder(s)) if (r.note) assert.ok(noteById(r.note), r.note);
  assert.match(ladder('telangana')[2].title, /not in Telangana/);
});
test('template drafts cite no law, and the law check catches citations', () => {
  const a = audit(parseDeductions(EXAMPLE_DEDUCTIONS), clauses), f = { audit: a, handover: '31 Jan 2028', refundClause: refundClauseOf(clauses) };
  const d = templateDrafts(f);
  assert.ok(!citesLaw(d.whatsapp) && !citesLaw(d.notice));
  assert.match(d.notice, /clause 2/);
  assert.match(factsText(f), /AC servicing/);
  assert.ok(citesLaw('as required under Section 11 of the Model Tenancy Act') && citesLaw('Transfer of Property Act, 1882') && !citesLaw('as clause 2 of our agreement says'));
});
