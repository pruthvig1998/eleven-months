import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaseReport } from './lease.ts';

const GOOD = [
  'This agreement is made at Hyderabad on 3 January 2027 between Mr. A, the Lessor, and Ms. B, the Lessee, for Flat No. 204, Green Residency, Hyderabad.',
  'The tenancy shall be for a period of eleven (11) months.',
  '1. The monthly rent is Rs. 18,000, payable by the 5th of each month.',
  '2. The Lessee has paid a security deposit of Rs. 36,000.',
  '3. Any dispute shall be subject to the jurisdiction of the courts at Hyderabad.',
];
test('a complete agreement has all basics, no conflicts, a local court and a duty estimate', () => {
  const r = leaseReport(GOOD);
  assert.deepEqual(r.basics.filter(b => !b.present).map(b => b.label), []);
  assert.deepEqual(r.conflicts, []);
  assert.equal(r.court, null);
  assert.deepEqual(r.cost, { months: 11, rent: 18000, duty: 800 }); // 18,000 x 11 x 0.4% = 792, rounded up to 800
});
test('missing basics are reported', () => {
  const r = leaseReport(['The Lessee shall keep the flat clean.', 'No pets are allowed.']);
  assert.deepEqual(r.basics.filter(b => !b.present).map(b => b.label), ['Both parties named', 'Address of the flat', 'Start date', 'Length of the tenancy', 'Monthly rent']);
  assert.equal(r.cost, null);
});
test('two different deposit or rent figures are a conflict', () => {
  const r = leaseReport([...GOOD, '9. The security deposit of Rs. 54,000 shall be refunded on vacating.', '10. The monthly rent is Rs. 20,000.']);
  assert.equal(r.conflicts.length, 2);
  assert.match(r.conflicts.join(' '), /36,000 and Rs\. 54,000/);
});
test('a court in a city named nowhere else is reported', () => {
  const r = leaseReport([...GOOD.slice(0, 4), '3. Courts at New Delhi alone shall have jurisdiction over any dispute.']);
  assert.equal(r.court, 'New Delhi');
  assert.equal(leaseReport([...GOOD.slice(0, 4), '3. Courts in Telangana shall have jurisdiction.']).court, null);
});
test('no duty estimate for a term of a year or more', () => assert.equal(leaseReport([...GOOD.slice(0, 1), 'The term of this lease is 3 years.', ...GOOD.slice(2)]).cost, null));
