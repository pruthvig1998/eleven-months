// Settings that can change without a deploy, from Firebase Remote Config. Every value is checked against a sane
// range, and anything missing, malformed or unreachable falls back to the built-in default, so a bad console entry
// cannot break a scan. Parameters (all optional in the console):
//   deposit_months_limit (1-12), rent_rise_pct_limit (1-50), notice_days_min (1-90),
//   cloud_on_medium (true/false), cloud_model (a gemini-* model name)
import type { FirebaseApp } from 'firebase/app';
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';

export interface Settings { depositMonths: number; risePct: number; noticeDays: number; cloudOnMedium: boolean; cloudModel: string; source: 'defaults' | 'Remote Config' }
export const DEFAULTS: Settings = { depositMonths: 3, risePct: 10, noticeDays: 15, cloudOnMedium: true, cloudModel: 'gemini-3.5-flash-lite', source: 'defaults' };

const inRange = (raw: string, lo: number, hi: number, fallback: number) => { const n = Number(raw); return raw !== '' && Number.isFinite(n) && n >= lo && n <= hi ? n : fallback; };
export function parseSettings(get: (key: string) => string, remote: boolean): Settings {
  const model = get('cloud_model'), medium = get('cloud_on_medium');
  return {
    depositMonths: inRange(get('deposit_months_limit'), 1, 12, DEFAULTS.depositMonths),
    risePct: inRange(get('rent_rise_pct_limit'), 1, 50, DEFAULTS.risePct),
    noticeDays: inRange(get('notice_days_min'), 1, 90, DEFAULTS.noticeDays),
    cloudOnMedium: medium === 'false' ? false : medium === 'true' ? true : DEFAULTS.cloudOnMedium,
    cloudModel: /^gemini-[\w.-]{3,40}$/.test(model) ? model : DEFAULTS.cloudModel,
    source: remote ? 'Remote Config' : 'defaults',
  };
}
export async function loadSettings(app: FirebaseApp): Promise<Settings> {
  try {
    const rc = getRemoteConfig(app);
    rc.settings.minimumFetchIntervalMillis = 10 * 60 * 1000; rc.settings.fetchTimeoutMillis = 8000;
    await fetchAndActivate(rc);
    const keys = ['deposit_months_limit', 'rent_rise_pct_limit', 'notice_days_min', 'cloud_on_medium', 'cloud_model'];
    const remote = keys.some(k => getValue(rc, k).getSource() === 'remote');
    return parseSettings(k => getValue(rc, k).asString(), remote);
  } catch { return DEFAULTS; }
}
