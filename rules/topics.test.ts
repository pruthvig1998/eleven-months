import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES, analyzeClause, maxSeverity, coverage, leaseTermMonths, topicsFor } from './topics.ts';
import { NOTES, noteById, searchNotes } from './knowledge.ts';

// Rule-growth guard: every rule must ship examples, and every example must behave as declared.
for (const r of RULES) {
  test(`rule "${r.id}": ships at least 2 detected and 2 not-detected examples`, () => {
    assert.ok(r.examples.detected.length >= 2, 'needs >= 2 detected');
    assert.ok(r.examples.notDetected.length >= 2, 'needs >= 2 notDetected');
    assert.ok(r.examples.high?.length || r.examples.medium?.length || r.examples.notHigh?.length || !r.check || r.id === 'subletting' || r.id === 'registration', 'needs a severity example');
  });
  test(`rule "${r.id}": detected and not-detected examples`, () => {
    for (const t of r.examples.detected) assert.ok(r.detect.test(t), `should detect: ${t}`);
    for (const t of r.examples.notDetected) assert.ok(!r.detect.test(t), `should not detect: ${t}`);
  });
  test(`rule "${r.id}": severity examples`, () => {
    const only = (t: string) => (r.check?.(t, { ex: undefined as never }) ?? []);
    for (const t of r.examples.high ?? []) assert.equal(maxSeverity(only(t)), 'high', `should be high: ${t}`);
    for (const t of r.examples.medium ?? []) assert.equal(maxSeverity(only(t)), 'medium', `should be medium: ${t}`);
    for (const t of r.examples.notHigh ?? []) assert.notEqual(maxSeverity(only(t)), 'high', `should not be high: ${t}`);
  });
}
test('every finding links to a note that exists', () => {
  const texts = RULES.flatMap(r => [...(r.examples.high ?? []), ...(r.examples.medium ?? []), ...r.examples.detected]);
  for (const t of texts) for (const f of analyzeClause(t, { rent: 20000 })) if (f.note) assert.ok(noteById(f.note), `missing note ${f.note}`);
});
test('note ids are unique, sources are https, and every note has a status and checked date', () => {
  assert.equal(new Set(NOTES.map(n => n.id)).size, NOTES.length);
  for (const n of NOTES) for (const x of n.sources) if (x.url) assert.ok(x.url.startsWith('https://'), n.id);
  assert.equal(new Set(RULES.map(r => r.id)).size, RULES.length);
  for (const n of NOTES) { assert.ok(n.status && n.checked && n.summary.length > 40, n.id); }
});

test('deposit size is checked against the Model Tenancy Act benchmark', () => {
  assert.equal(maxSeverity(analyzeClause("The Lessee has paid a security deposit equal to ten months' rent, the monthly rent being Rs. 18,000.")), 'high');
  assert.equal(maxSeverity(analyzeClause('The security deposit is Rs. 50,000 and the monthly rent is Rs. 20,000.')), 'medium');
  assert.equal(maxSeverity(analyzeClause('The security deposit is Rs. 40,000 and the monthly rent is Rs. 20,000.')), null);
});
test('ordinary clauses produce no high findings', () => {
  for (const t of [
    'This agreement is made at Hyderabad between the Lessor and the Lessee.',
    'The monthly rent is Rs. 20,000, payable by the 5th of each month through bank transfer.',
    'Either party may terminate this tenancy by giving one month notice in writing.',
    'The Lessee shall not sublet the premises without the prior written consent of the Lessor.',
    'Any dispute shall be subject to the jurisdiction of the civil courts at Hyderabad.',
  ]) assert.notEqual(maxSeverity(analyzeClause(t, { rent: 20000 })), 'high', t);
});

test('lease term parsing', () => {
  assert.equal(leaseTermMonths('The tenancy shall be for a period of eleven (11) months.'), 11);
  assert.equal(leaseTermMonths('The term of this lease is 3 years.'), 36);
  assert.equal(leaseTermMonths('The rent is Rs. 20,000.'), null);
});
test('coverage lists missing topics and asks for registration on long terms', () => {
  const c = coverage(['The tenancy is for a period of 24 months. The deposit is Rs. 40,000.', 'The rent is Rs. 20,000.']);
  const byTopic = Object.fromEntries(c.map(x => [x.topic, x]));
  assert.equal(byTopic['deposit-refund'].present, false);
  assert.equal(byTopic['notice'].present, false);
  assert.equal(byTopic['registration'].present, false);
  assert.equal(byTopic['registration'].severity, 'medium');
  const ok = coverage(['The tenancy is for a period of 11 months.', 'Deposit Rs. 40,000, refund within 15 days of vacating. Either party may give 30 days notice. Rent by bank transfer with receipt. Repairs by the Lessor. Courts at Hyderabad have jurisdiction. The Lessor may enter after 24 hours notice.']);
  assert.ok(ok.every(x => x.present), JSON.stringify(ok.filter(x => !x.present)));
});

test('topicsFor returns the topics a clause touches', () => {
  assert.deepEqual(topicsFor('The Lessee shall not sublet and shall pay electricity as per meter.').map(r => r.id).sort(), ['subletting', 'utilities']);
});

test('reference search finds the right note', () => {
  assert.equal(searchNotes('how much notice to vacate')[0].note.id, 'tpa-106');
  assert.equal(searchNotes('security deposit limit months')[0].note.id, 'mta-deposit');
  assert.equal(searchNotes('landlord entry inspection 24 hours')[0].note.id, 'mta-entry');
  assert.equal(searchNotes('why 11 months registration')[0].note.id, 'reg-17');
  assert.equal(searchNotes('overstay beyond the term double rent')[0].note.id, 'mta-holdover');
  assert.deepEqual(searchNotes('landlord cut off water electricity supply', 2).map(h => h.note.id).sort(), ['mta-essential-supply', 'ts-amenities']);
  assert.equal(searchNotes('who pays for roof repairs')[0].note.id, 'mta-repairs');
  assert.equal(searchNotes('tds tax on rent')[0].note.id, 'tds-194ib');
  assert.equal(searchNotes('stamp duty rent agreement hyderabad')[0].note.id, 'stamp-ts');
  assert.ok(searchNotes('evict tenant rent authority', 3).some(h => h.note.id === 'mta-eviction'));
  assert.equal(searchNotes('zzzz qqqq').length, 0);
  assert.equal(searchNotes('').length, 0);
});
