import { test } from 'node:test';
import { detectAadhaar, detectPan } from '../../rules/pii.ts';
import assert from 'node:assert/strict';
import { mask } from './mask.ts';
import { SAMPLE } from './sample.ts';

test('masks spaced and unspaced Aadhaar, PAN and Nano-found names', () => {
  const t = mask('Ravi Kumar Reddy, Aadhaar 1821 7365 9017 and 182173659017, PAN ABCPM1234K.', ['Ravi Kumar Reddy']);
  assert.equal(t, '[NAME], Aadhaar [AADHAAR] and [AADHAAR], PAN [PAN].');
});
// Redaction favours recall over precision: a typo or OCR error must not let an ID through.
test('masks Aadhaar with dashes and with a wrong checksum digit', () => {
  assert.equal(mask('Aadhaar 1821-7365-9017.', []), 'Aadhaar [AADHAAR].');
  assert.equal(mask('Aadhaar 1821 7365 9018.', []), 'Aadhaar [AADHAAR].');
});
test('masks PAN in any case', () => {
  assert.equal(mask('pan abcpm1234k.', []), 'pan [PAN].');
});
test('masks Indian phone numbers and emails', () => {
  assert.equal(mask('Call 9876501234 or +91 98765 01234 or 040-23456789.', []), 'Call [PHONE] or [PHONE] or [PHONE].');
  assert.equal(mask('Mail ravi.reddy@example.com now.', []), 'Mail [EMAIL] now.');
});
test('names fail open no more: honorific names are masked even when Nano found none', () => {
  assert.equal(mask('Mr. Ravi Kumar Reddy, the Lessor, may terminate.', []), 'Mr. [NAME], the Lessor, may terminate.');
  assert.equal(mask('Smt. P. Swathi and Sri K. Ramesh Babu agree.', []), 'Smt. [NAME] and Sri [NAME] agree.');
  assert.equal(mask('He is the son of Late Subba Rao, S/o Late Venkat Rao.', []), 'He is the son of Late [NAME], S/o Late [NAME].');
});
test('Nano-found names match case-insensitively and longest first', () => {
  assert.equal(mask('RAVI KUMAR REDDY signed; Ravi also.', ['Ravi', 'Ravi Kumar Reddy']), '[NAME] signed; [NAME] also.');
});
test('does not touch ordinary lease numbers', () => {
  const t = 'Rs. 2,40,000 deposit, Rs 30000 rent, 11 months from 01-02-2027, 5th day, 7 days notice, 25% increase.';
  assert.equal(mask(t, []), t);
});
test('sample lease has no ID number or name left after masking, even with no Nano names', () => {
  const t = mask(SAMPLE, []);
  assert.ok(!/1821|ABCPM1234K|Ravi Kumar|Anitha/.test(t), t);
});

test('masks IDs as a photo reader misreads them (O for 0, l for 1, a stray space)', () => {
  assert.equal(mask('Aadhaar 1821 7365 9O17, PAN ABCPM l234K, Aadhaar l821 7365 9017.', []), 'Aadhaar [AADHAAR], PAN [PAN], Aadhaar [AADHAAR].');
  assert.equal(mask('The hall Illo hall will be painted. Rs. 1,80,000 and 11 months.', []), 'The hall Illo hall will be painted. Rs. 1,80,000 and 11 months.');
});

test('every ID the precise detector finds is removed by the mask', () => {
  const text = 'Lessor Aadhaar 1821 7365 9017, PAN ABCPM1234K; Lessee Aadhaar 4891 2371 5904 and PAN QWERT5678Z.';
  const out = mask(text, []);
  assert.ok(detectAadhaar(text).length + detectPan(text).length >= 3); // the check is not vacuous
  for (const id of [...detectAadhaar(text), ...detectPan(text)]) assert.ok(!out.replace(/\s/g, '').includes(id), `${id} survived masking`);
  assert.equal(detectAadhaar(out).length + detectPan(out).length, 0);
});

test('leaks: masked text passes; anything mask() missed is caught', async () => {
  const { leaks } = await import('./mask.ts');
  const raw = 'The Lessee, Ms. Anitha Rao (phone 98480 12345, anitha.rao@example.com), paid Mr. Ravi Kumar Reddy (Aadhaar 1821 7365 9017, PAN ABCPM1234K) Rs. 1,80,000.';
  const names = ['Anitha Rao', 'Ravi Kumar Reddy'];
  assert.deepEqual(leaks(mask(raw, names), names), []);
  assert.deepEqual(leaks('Rao signed it.', names), ['a name']); // bare surname: mask() replaces only the full name
  assert.deepEqual(leaks('call 9848012345', []), ['a long number (ID or phone)']);
  assert.deepEqual(leaks('mail a@b.in', []), ['an email address']);
  assert.deepEqual(leaks('PAN abcpm1234k', []), ['a PAN']);
  assert.deepEqual(leaks('The Lessor and the Lessee agree.', ['the Lessor']), []);
});

test('leaks: no false block on the sample or the 96 unseen clauses', async () => {
  const { leaks } = await import('./mask.ts');
  const { SAMPLE } = await import('./sample.ts');
  const { readFileSync } = await import('node:fs');
  const { items } = JSON.parse(readFileSync(new URL('../../rules/data/unseen.json', import.meta.url), 'utf8'));
  for (const t of [...SAMPLE.split(/\n\n+/), ...items.map((x: { text: string }) => x.text)]) assert.deepEqual(leaks(mask(t, []), []), [], t);
});
