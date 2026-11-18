// All model calls go through the Firebase AI Logic Web SDK. Nano on-device first; cloud only on trigger.
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { toLabel, type Model } from '../../rules/pipeline.ts';

const env = import.meta.env;
export const cloudConfigured = !!env.VITE_FIREBASE_API_KEY;
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'placeholder-on-device-only',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
  appId: env.VITE_FIREBASE_APP_ID || '1:0:web:0',
});
const siteKey = env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
if (cloudConfigured && (env.DEV || siteKey)) {
  if (env.DEV) (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true; // dev only; register the printed token in the console, never commit it
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey || 'unused-in-debug'), isTokenAutoRefreshEnabled: true });
}
const ai = getAI(app, { backend: new GoogleAIBackend() });
const nano = getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE });
const cloud = getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD });

// Prompt wording is the tuned "v2" pass from RISK-KILL-REPORT.md.
const CLS = (t: string) => `You review a tenant's rental agreement in India. Label the clause "risky" if it is unfavourable or one-sided against the tenant: deposit above 3 months' rent or arbitrary forfeiture/deductions, long or one-sided lock-in, notice shorter than 15 days or one-sided, rent increase above 10% a year, eviction without notice or process, tenant paying structural repairs or unbilled charges, or unfair dispute terms. Otherwise label it "ok". Reply with JSON only: {"label":"ok|risky","risk_type":"deposit|lockin|notice|escalation|eviction|maintenance|other|none"}.\n\nClause: ${t}`;
const FLD = (t: string) => `Extract numbers from this lease clause. deposit = security deposit in rupees (a plain number; convert words and "N months' rent" using the stated rent; if two figures conflict use the final operative one). lockin_months = lock-in months. notice_days = notice period in days (1 month = 30). escalation_pct = percent rent increase. Use null for anything not stated. JSON only: {"deposit":..,"lockin_months":..,"notice_days":..,"escalation_pct":..}.\n\nClause: ${t}`;
const NAMES = (t: string) => `List every person's name in this text, exactly as written. Do not include places, companies or titles. If none, return an empty list. JSON only: {"names":[...]}.\n\nText: ${t}`;

// Nano wraps JSON in code fences; empty or template echoes become null and trigger cloud.
const parse = (t: string): any => { try { return JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } } };
// The free cloud tier allows only about 10 to 15 requests a minute (measured: HTTP 429 above that), so a 429 waits and retries.
const run = async (m: typeof nano, prompt: string) => {
  for (let attempt = 0; ; attempt++) {
    try { return parse((await m.generateContent(prompt)).response.text()); }
    catch (e) { if (attempt >= 3 || !/429|RESOURCE_EXHAUSTED|quota/i.test(String((e as Error).message))) throw e; await new Promise(r => setTimeout(r, 8000 * (attempt + 1))); }
  }
};

export const initNano = (onProgress: (v: number) => void) => nano.initializeDeviceModel(onProgress);
// One throwaway prompt loads the model into memory, so the first real clause does not pay the load time (measured: about 19 s).
export const nanoWarm = () => nano.generateContent('Reply with the word ok.').then(() => undefined);

// The two prompts run one after the other. Sending the cloud pair together was tried and hit the free tier's
// requests-per-minute limit (5 of 11 clauses failed with HTTP 429), so it was reverted.
async function judge(m: typeof nano, text: string): Promise<Model> {
  const c = await run(m, CLS(text));
  const f = await run(m, FLD(text));
  return { label: toLabel(c?.label), fields: f && typeof f === 'object' ? f : null };
}
export const nanoJudge = (text: string) => judge(nano, text);
export const cloudJudge = (text: string) => judge(cloud, text);
// Label only: used when every clause goes to cloud (no on-device model). The rules already extract the numbers,
// so one request per clause instead of two keeps a whole agreement inside the free tier's rate limit.
export const cloudLabel = async (text: string): Promise<Model> => ({ label: toLabel((await run(cloud, CLS(text)))?.label), fields: null });
export const nanoNames = async (text: string): Promise<string[]> => {
  const r = await run(nano, NAMES(text));
  return Array.isArray(r?.names) ? r.names.map(String).filter(Boolean) : [];
};
