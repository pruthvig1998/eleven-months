import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSettings, DEFAULTS } from './config.ts';

const from = (o: Record<string, string>) => (k: string) => o[k] ?? '';
test('empty Remote Config gives the defaults', () => assert.deepEqual(parseSettings(from({}), false), DEFAULTS));
test('valid values are used', () => {
  const s = parseSettings(from({ deposit_months_limit: '2', rent_rise_pct_limit: '8', notice_days_min: '30', cloud_on_medium: 'false', cloud_model: 'gemini-3.5-flash' }), true);
  assert.deepEqual(s, { depositMonths: 2, risePct: 8, noticeDays: 30, cloudOnMedium: false, cloudModel: 'gemini-3.5-flash', source: 'Remote Config' });
});
test('out-of-range, non-numeric or odd values fall back to the defaults', () => {
  const s = parseSettings(from({ deposit_months_limit: '0', rent_rise_pct_limit: 'ten', notice_days_min: '9999', cloud_on_medium: 'maybe', cloud_model: 'https://evil.example/model' }), true);
  assert.deepEqual({ ...s, source: 'defaults' }, DEFAULTS);
});
