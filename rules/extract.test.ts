import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extract } from './extract.ts';
import { LIMITS } from './extract.ts';
import { detectAadhaar, detectPan, verhoeff } from './pii.ts';

const d = (t: string, ctx = {}) => extract(t, ctx).derived;

// --- the five verbatim Nano failures from RISK-KILL-REPORT.md
test('failure 1: two-sided notice (lessee 2 months, lessor 3 days)', () => {
  const r = extract("The Lessee shall give two months' written notice before vacating, whereas the Lessor shall be entitled to ask the Lessee to vacate on three days' notice if the Lessor requires the premises for any purpose.");
  assert.equal(r.notice.lessee, 60);
  assert.equal(r.notice.lessor, 3);
  assert.equal(r.derived.notice_days, 60);
  assert.ok(r.flags.includes('notice_one_sided') && r.flags.includes('notice_under_15_days'));
});
test('failure 2: fifteen percent in words', () => {
  assert.equal(d('The monthly rent shall be Rs. 22,000 for the first year. For the renewal period, the Lessor may revise the rent at his discretion by up to fifteen percent, and the Lessee shall pay the revised rent from the first day of the renewed term.').escalation_pct, 15);
});
test('failure 3: ten months of rent is multiplied, not copied', () => {
  const r = d("The Lessee has paid a security deposit equal to ten months' rent, the monthly rent being Rs. 18,000. The Lessor may forfeit the entire deposit, without assigning any reason, if the Lessee vacates the premises before the Lessor is satisfied with the condition of the flat.");
  assert.equal(r.deposit, 180000);
  assert.equal(typeof r.deposit, 'number');
});
test('failure 4: 90 days goes to notice, not lock-in', () => {
  const r = d("The Lessor may terminate this Agreement without notice if, in the opinion of the Lessor, the Lessee has caused nuisance. The Lessee shall give 90 days' notice to terminate.");
  assert.equal(r.notice_days, 90);
  assert.equal(r.lockin_months, null);
});
test('failure 5: absent fields are null, never 0', () => {
  const r = d('The Lessee shall deposit Rs. 2,40,000 as security. Rent is Rs. 20,000 per month. The Lessor may deduct painting, cleaning and any other charges at his sole discretion, and the Lessee waives the right to question the deductions.');
  assert.deepEqual(r, { deposit: 240000, lockin_months: null, notice_days: null, escalation_pct: null });
});

// --- traps
test('trap: dates, days and ordinals are not amounts', () => {
  assert.equal(d('This Lease is made on the 1st day of December 2026 and rent is payable by the 5th day of each month.').deposit, null);
});
test('trap: the last amount is rent, not deposit', () => {
  const r = extract('Security deposit of Rs. 3,00,000 is payable. The monthly rent is Rs. 25,000.');
  assert.equal(r.derived.deposit, 300000);
  assert.equal(r.rent, 25000);
  assert.ok(r.flags.includes('deposit_over_3x_rent'));
});
test('trap: contradiction takes the operative amount', () => {
  assert.equal(d('Although the draft circulated earlier mentioned a security deposit of Rs. 50,000, the parties have now agreed that the deposit actually payable by the Lessee shall be Rs. 40,000, and this clause prevails over the draft.').deposit, 40000);
});
test('trap: figures and words that disagree are unsure, not guessed', () => {
  const r = extract('The deposit shall be Rs. 3,00,000 (Rupees Two Lakhs only).');
  assert.equal(r.derived.deposit, null);
  assert.deepEqual(r.unsure, ['deposit']);
});
test('trap: "three months\' additional rent as penalty" is not a deposit', () => {
  assert.equal(d("In case of early exit, the Lessee shall forfeit the security deposit and shall also pay three months' additional rent as penalty.").deposit, null);
});
test("trap: months' rent with no rent anywhere is unsure", () => {
  const r = extract("The security deposit shall be equal to three months' rent.");
  assert.equal(r.derived.deposit, null);
  assert.deepEqual(r.unsure, ['deposit']);
  assert.equal(d("The security deposit shall be equal to three months' rent.", { rent: 22000 }).deposit, 66000);
});
test('trap: tenancy term and "every six months" are not lock-in', () => {
  assert.equal(d('The tenancy shall be for a period of eleven (11) months commencing from 1st December 2026.').lockin_months, null);
  assert.equal(d('The rent shall be increased by 25% at the end of every six months of the tenancy.').lockin_months, null);
});
test('lock-in: "shall not vacate during the first eleven months" and who it binds', () => {
  const r = extract('The Lessee shall not vacate the premises during the first eleven months of this Agreement.');
  assert.equal(r.derived.lockin_months, 11);
  assert.equal(r.lockin.binds, 'lessee');
});
test('lock-in: twelve (12) months binding on the Lessee only', () => {
  const r = extract('There shall be a lock-in period of twelve (12) months, binding on the Lessee only.');
  assert.equal(r.derived.lockin_months, 12);
  assert.ok(r.flags.includes('lockin_binds_lessee_only'));
});
test('notice: refund windows, cure periods and intimation are not notice', () => {
  assert.equal(d('The Lessor shall return the deposit within 15 days of the Lessee handing over vacant possession.').notice_days, null);
  assert.equal(d('If the Lessee fails to pay the rent for two consecutive months despite a written reminder with fifteen days to cure, the Lessor may terminate this Agreement by giving notice in writing.').notice_days, null);
  assert.equal(d("The Lessor may inspect after giving the Lessee at least 24 hours' prior intimation.").notice_days, null);
});
test("notice: a month's (30 days) either party", () => {
  assert.equal(d("Either party may terminate this tenancy by giving the other party one month's (30 days) prior written notice.").notice_days, 30);
  assert.equal(d("Either party shall give a month's notice in writing before terminating this Lease.").notice_days, 30);
});
test('numbers: two and a half percent, 1.5 lakh, ₹ and /-, words with rupees', () => {
  assert.equal(d('On renewal, the rent shall go up by two and a half percent.').escalation_pct, 2.5);
  assert.equal(d('The refundable deposit shall be 1.5 lakh rupees.').deposit, 150000);
  assert.equal(d('The Lessee shall pay ₹ 75,000/- as security deposit.').deposit, 75000);
  assert.equal(d('The Lessee has paid a deposit of fifty thousand rupees.').deposit, 50000);
});
test('output contract: every field is a number or null', () => {
  for (const t of ['', 'Both parties have signed this Agreement before two witnesses.', 'The deposit is Rs. 50,000 and the lock-in is 3 months.']) {
    for (const v of Object.values(d(t))) assert.ok(v === null || typeof v === 'number');
  }
});

// --- gaps found by the messy-document test
test('schedule line "Notice Period : 1 month"', () => {
  assert.equal(d('Lock-in Period : 6 months\nNotice Period : 1 month\nRent Escalation : 10% per annum').notice_days, 30);
});
test('Landlord/Tenant wording: both notices, one-sided flag, lock-in binds tenant', () => {
  const r = extract('After the lock-in, the Tenant shall give thirty days notice to terminate and the Landlord shall give 60 days notice.');
  assert.equal(r.notice.lessee, 30);
  assert.equal(r.notice.lessor, 60);
  assert.ok(r.flags.includes('notice_one_sided'));
  const l = extract('The Tenant shall not vacate before the expiry of 8 months from the commencement date (Lock-in).');
  assert.equal(l.derived.lockin_months, 8);
  assert.equal(l.lockin.binds, 'lessee');
});

test('"enter without notice" is not a one-sided termination notice', () => {
  assert.ok(!extract('The Lessor may enter and inspect the flat at any time of day or night without notice.').flags.includes('notice_one_sided'));
  assert.ok(extract('The Lessor may terminate this Agreement without notice. The Lessee shall give 90 days notice to terminate.').flags.includes('notice_one_sided'));
});

// --- PII (copied from harness test C)
test('Aadhaar needs a valid Verhoeff checksum; PAN is pattern-based', () => {
  assert.ok(verhoeff('182173659017'));
  assert.deepEqual(detectAadhaar('Aadhaar 1821 7365 9017.'), ['182173659017']);
  assert.deepEqual(detectAadhaar('Aadhaar 1821 7365 9018.'), []);
  assert.deepEqual(detectPan('PAN ABCPM1234K here'), ['ABCPM1234K']);
});

test('numeric flags follow LIMITS, so the thresholds can be changed without code', () => {
  const t = 'The rent shall be increased by 8% every year.';
  assert.deepEqual(extract(t).flags, []);
  const old = LIMITS.risePct; LIMITS.risePct = 5;
  try { assert.deepEqual(extract(t).flags, ['escalation_over_10pct']); } finally { LIMITS.risePct = old; }
});
