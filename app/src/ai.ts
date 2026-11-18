// All model calls go through the Firebase AI Logic Web SDK. Nano on-device first; cloud only on trigger.
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, Schema } from 'firebase/ai';
import { toLabel, type Model } from '../../rules/pipeline.ts';

const env = import.meta.env;
export const cloudConfigured = !!env.VITE_FIREBASE_API_KEY;
export const app = initializeApp({
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
// Cloud answers are held to a JSON schema, so a malformed answer cannot turn into an "unknown" label.
// (A schema did not constrain the on-device model in the risk tests, so Nano's answers are still parsed loosely.)
// The cloud model name comes from Remote Config (default: the SDK's own default for hybrid mode), so the models
// are built on first use, after the settings have loaded.
let cloudModel = 'gemini-3.5-flash-lite', built: { cls: typeof nano; fld: typeof nano; name: string } | null = null;
export const setCloudModel = (name: string) => { cloudModel = name; };
const num = () => Schema.number({ nullable: true });
function cloudModels() {
  if (built?.name === cloudModel) return built;
  const json = (responseSchema: Schema) => ({ model: cloudModel, generationConfig: { responseMimeType: 'application/json', responseSchema } });
  return (built = {
    name: cloudModel,
    cls: getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD, inCloudParams: json(Schema.object({ properties: { label: Schema.enumString({ enum: ['ok', 'risky'] }), reason: Schema.string() } })) }),
    fld: getGenerativeModel(ai, { mode: InferenceMode.ONLY_IN_CLOUD, inCloudParams: json(Schema.object({ properties: { deposit: num(), lockin_months: num(), notice_days: num(), escalation_pct: num() } })) }),
  });
}

// Prompt wording is the tuned "v2" pass from RISK-KILL-REPORT.md.
const CLS = (t: string) => `You review a tenant's rental agreement in India. Label the clause "risky" if it is unfavourable or one-sided against the tenant: deposit above 3 months' rent or arbitrary forfeiture/deductions, long or one-sided lock-in, notice shorter than 15 days or one-sided, rent increase above 10% a year, eviction without notice or process, tenant paying structural repairs or unbilled charges, or unfair dispute terms. Otherwise label it "ok". Reply with JSON only: {"label":"ok|risky","risk_type":"deposit|lockin|notice|escalation|eviction|maintenance|other|none"}.\n\nClause: ${t}`;
const FLD = (t: string) => `Extract numbers from this lease clause. deposit = security deposit in rupees (a plain number; convert words and "N months' rent" using the stated rent; if two figures conflict use the final operative one). lockin_months = lock-in months. notice_days = notice period in days (1 month = 30). escalation_pct = percent rent increase. Use null for anything not stated. JSON only: {"deposit":..,"lockin_months":..,"notice_days":..,"escalation_pct":..}.\n\nClause: ${t}`;
// Cloud is also asked why, in one sentence, so a clause no fixed rule matched still comes with an explanation.
const WHY = ' Also give "reason": one short plain sentence for the tenant saying why you chose that label.';
const REASON = (t: string) => `In one short plain sentence, tell a tenant in India why this rental agreement clause could be unfavourable to them. Reply with the sentence only.\n\nClause: ${t}`;
const NAMES = (t: string) => `List every person's name in this text, exactly as written. Do not include places, companies or titles. If none, return an empty list. JSON only: {"names":[...]}.\n\nText: ${t}`;

// Nano wraps JSON in code fences; empty or template echoes become null and trigger cloud.
const parse = (t: string): any => { try { return JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); try { return m ? JSON.parse(m[0]) : null; } catch { return null; } } };
// The free cloud tier has a rate limit (HTTP 429 was seen with 22 requests in under a minute; 11 in 23 s passed; the exact
// limit is not known), so a 429 waits and retries.
const run = async (m: typeof nano, prompt: string) => {
  for (let attempt = 0; ; attempt++) {
    try { return parse((await m.generateContent(prompt)).response.text()); }
    catch (e) { if (attempt >= 3 || !/429|RESOURCE_EXHAUSTED|quota/i.test(String((e as Error).message))) throw e; await new Promise(r => setTimeout(r, 8000 * (attempt + 1))); }
  }
};

export const initNano = (onProgress: (v: number) => void) => nano.initializeDeviceModel(onProgress);

// Photo reading through Firebase AI Logic, on the device only: the page image never goes to the cloud, because it
// cannot be masked before it is read. Returns null where the on-device model does not take images.
const nanoVision = getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE, onDeviceParams: { createOptions: { expectedInputs: [{ type: 'image' }, { type: 'text', languages: ['en'] }], expectedOutputs: [{ type: 'text', languages: ['en'] }] } } });
export async function nanoReadImage(image: Blob): Promise<string | null> {
  const LM = (self as any).LanguageModel;
  if (!LM || (await LM.availability({ expectedInputs: [{ type: 'image' }, { type: 'text', languages: ['en'] }] }).catch(() => 'unavailable')) !== 'available') return null;
  const bytes = new Uint8Array(await image.arrayBuffer()); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const r = await nanoVision.generateContent([{ type: 'inlineData', inlineData: { mimeType: image.type || 'image/jpeg', data: btoa(bin) } }, { type: 'text', text: 'Transcribe all the text in this image exactly as written, line by line. Keep clause numbers and blank lines. Output only the text.' }]);
  return r.response.text().trim() || null;
}
// One throwaway prompt loads the model into memory, so the first real clause does not pay the load time (measured: about 19 s).
export const nanoWarm = () => nano.generateContent('Reply with the word ok.').then(() => undefined);

// The two prompts run one after the other. Sending the cloud pair together was tried and hit the free tier's
// requests-per-minute limit (5 of 11 clauses failed with HTTP 429), so it was reverted.
// withFields = false skips the numbers prompt: for a clause with no figures it can only invent values.
export async function nanoJudge(text: string, withFields = true): Promise<Model> {
  const c = await run(nano, CLS(text));
  const f = withFields ? await run(nano, FLD(text)) : {};
  return { label: toLabel(c?.label), fields: f && typeof f === 'object' ? f : null };
}
const clean = (r: unknown) => (typeof r === 'string' && r.trim() ? r.trim().slice(0, 240) : undefined);
// Label (with a reason) only: one request. Used when every clause goes to cloud (no on-device model), where the
// rules already extract the numbers, so a whole agreement stays inside the free tier's rate limit.
export const cloudLabel = async (text: string): Promise<Model> => { const c = await run(cloudModels().cls, CLS(text) + WHY); return { label: toLabel(c?.label), fields: null, reason: clean(c?.reason) }; };
export const cloudJudge = async (text: string): Promise<Model> => { const c = await cloudLabel(text); const f = await run(cloudModels().fld, FLD(text)); return { ...c, fields: f && typeof f === 'object' ? f : null }; };
// On-device explanation for a clause the model marked risky when no fixed rule matched and cloud was not used.
export const nanoReason = async (text: string) => clean((await nano.generateContent(REASON(text))).response.text());
export const nanoNames = async (text: string): Promise<string[]> => {
  const r = await run(nano, NAMES(text));
  return Array.isArray(r?.names) ? r.names.map(String).filter(Boolean) : [];
};
