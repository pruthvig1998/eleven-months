import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decide, finalize, toLabel, hasFigures, type Model } from './pipeline.ts';

const NOTICE = "Either party may terminate this tenancy by giving the other party one month's (30 days) prior written notice.";
const agree: Model = { label: 'ok', fields: { deposit: null, lockin_months: null, notice_days: 30, escalation_pct: null } };

test('toLabel rejects template echoes and empty output', () => {
  assert.equal(toLabel('ok|risky'), null);
  assert.equal(toLabel(''), null);
  assert.equal(toLabel('risky'), 'risky');
});
test('no cloud call when rules and Nano agree and nothing is flagged', () => {
  const d = decide(NOTICE, agree);
  assert.equal(d.needsCloud, false);
  assert.equal(finalize(d, agree, null).fields.notice_days, 30);
});
test('unusable Nano label or fields triggers cloud', () => {
  assert.ok(decide(NOTICE, { label: null, fields: agree.fields }).reasons.includes('nano_label_unusable'));
  assert.ok(decide(NOTICE, { label: 'ok', fields: null }).reasons.includes('nano_fields_unusable'));
});
test('field disagreement triggers cloud, including Nano inventing a value', () => {
  const nano: Model = { label: 'ok', fields: { deposit: null, lockin_months: 90, notice_days: 30, escalation_pct: null } };
  assert.deepEqual(decide(NOTICE, nano).reasons, ['field_disagree:lockin_months']);
});
test('Nano ok but rules flag a short notice triggers cloud; without cloud the label is raised to risky', () => {
  const t = "The Lessor may terminate on 7 days' notice.";
  const nano: Model = { label: 'ok', fields: { deposit: null, lockin_months: null, notice_days: 7, escalation_pct: null } };
  const d = decide(t, nano);
  assert.ok(d.reasons.some(r => r.startsWith('ok_but_flagged')));
  assert.equal(finalize(d, nano, null).label, 'risky');
});
test('rules unsure triggers cloud; cloud fills the value and the label comes from cloud', () => {
  const t = 'The deposit shall be Rs. 3,00,000 (Rupees Two Lakhs only).';
  const nano: Model = { label: 'ok', fields: { deposit: 300000, lockin_months: null, notice_days: null, escalation_pct: null } };
  const d = decide(t, nano);
  assert.ok(d.reasons.some(r => r.startsWith('rules_unsure')));
  const cloud: Model = { label: 'risky', fields: { deposit: 200000, lockin_months: null, notice_days: null, escalation_pct: null } };
  const f = finalize(d, nano, cloud);
  assert.equal(f.fields.deposit, 200000);
  assert.equal(f.label, 'risky');
  assert.equal(f.check, true);
});
test('rules win over cloud when both have a value, and the difference is flagged for checking', () => {
  const nano: Model = { label: 'ok', fields: { deposit: null, lockin_months: null, notice_days: 60, escalation_pct: null } };
  const cloud: Model = { label: 'ok', fields: { deposit: null, lockin_months: null, notice_days: 45, escalation_pct: null } };
  const f = finalize(decide(NOTICE, nano), nano, cloud);
  assert.equal(f.fields.notice_days, 30);
  assert.equal(f.check, true);
});

test('Nano ok plus a medium rule finding asks the cloud; cloud decides the label', () => {
  const t = 'Delayed rent shall carry interest at 24% per annum.';
  const nano: Model = { label: 'ok', fields: { deposit: null, lockin_months: null, notice_days: null, escalation_pct: null } };
  const d = decide(t, nano);
  assert.deepEqual(d.reasons, ['ok_but_medium:late-fee']);
  assert.equal(finalize(d, nano, { label: 'risky', fields: null }).label, 'risky');
  assert.equal(finalize(d, nano, null).label, 'ok'); // without cloud a medium finding does not change the label
});
test('a clause with no figures skips the numbers prompt without triggering cloud', () => {
  assert.equal(hasFigures('The Lessee shall keep the premises clean.'), false);
  assert.equal(hasFigures('Notice of thirty days is required.'), true);
  assert.equal(hasFigures('The deposit is Rs. 40,000.'), true);
  const d = decide('The Lessee shall keep the premises clean.', { label: 'ok', fields: {} });
  assert.equal(d.needsCloud, false);
});

test('the cloud second opinion on medium findings can be switched off', () => {
  const nano: Model = { label: 'ok', fields: {} };
  assert.equal(decide('Delayed rent shall carry interest at 24% per annum.', nano, { mediumToCloud: false }).needsCloud, false);
});
