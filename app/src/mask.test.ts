import { test } from 'node:test';
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
