import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, Schema } from 'firebase/ai';
import clauses from '../data/clauses.json';
import pii from '../data/pii.json';

const env = import.meta.env;
const realCfg = !!env.VITE_FIREBASE_API_KEY;
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'placeholder-on-device-only',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'placeholder',
  appId: env.VITE_FIREBASE_APP_ID || '1:0:web:0',
});
if (realCfg) {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true; // dev only; token is registered in console, never committed
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider('unused-in-debug'), isTokenAutoRefreshEnabled: true });
}
const ai = getAI(app, { backend: new GoogleAIBackend() });

const $ = (id: string) => document.getElementById(id)!;
const log = (s: string) => { $('log').textContent += s + '\n'; console.log(s); };
const R: any = ((window as any).R = { log: [], A: null, B: null, C: null, D: null, E: null, F: null, G: null });

// responsiveness: record worst main-thread gap while tests run
let lastTick = performance.now(), maxGap = 0;
setInterval(() => { const n = performance.now(); maxGap = Math.max(maxGap, n - lastTick - 50); lastTick = n; }, 50);

const clsSchema = Schema.object({ properties: { label: Schema.enumString({ enum: ['ok', 'risky'] }), risk_type: Schema.enumString({ enum: ['none', 'deposit', 'lockin', 'notice', 'escalation', 'eviction', 'maintenance', 'other'] }) } });
const num = () => Schema.number({ nullable: true });
const fldSchema = Schema.object({ properties: { deposit: num(), lockin_months: num(), notice_days: num(), escalation_pct: num() }, optionalProperties: [] });
const namesSchema = Schema.object({ properties: { names: Schema.array({ items: Schema.string() }) } });

function mk(mode: string, schema?: any) {
  return getGenerativeModel(ai, { mode, ...(schema ? { generationConfig: { responseMimeType: 'application/json', responseSchema: schema } } : {}) } as any);
}
let base: any;
const PROMPTS: any = {
  v1: {
    cls: (t: string) => `Classify this Indian residential lease clause. Reply with strict JSON only: {"label":"ok|risky","risk_type":"deposit|lockin|notice|escalation|eviction|maintenance|other|none"}.\n\nClause: ${t}`,
    fld: (t: string) => `Extract from this lease clause: deposit (rupees), lockin_months, notice_days, escalation_pct. Reply with strict JSON only: {"deposit":number|null,"lockin_months":number|null,"notice_days":number|null,"escalation_pct":number|null}. Use null if absent.\n\nClause: ${t}`,
    names: (t: string) => `List the person names in this text. Reply with strict JSON only: {"names":["..."]}.\n\nText: ${t}`,
  },
  // improved pass (one only): defines "risky", says to convert words/months to numbers
  v2: {
    cls: (t: string) => `You review a tenant's rental agreement in India. Label the clause "risky" if it is unfavourable or one-sided against the tenant: deposit above 3 months' rent or arbitrary forfeiture/deductions, long or one-sided lock-in, notice shorter than 15 days or one-sided, rent increase above 10% a year, eviction without notice or process, tenant paying structural repairs or unbilled charges, or unfair dispute terms. Otherwise label it "ok". Reply with JSON only: {"label":"ok|risky","risk_type":"deposit|lockin|notice|escalation|eviction|maintenance|other|none"}.\n\nClause: ${t}`,
    fld: (t: string) => `Extract numbers from this lease clause. deposit = security deposit in rupees (a plain number; convert words and "N months' rent" using the stated rent; if two figures conflict use the final operative one). lockin_months = lock-in months. notice_days = notice period in days (1 month = 30). escalation_pct = percent rent increase. Use null for anything not stated. JSON only: {"deposit":..,"lockin_months":..,"notice_days":..,"escalation_pct":..}.\n\nClause: ${t}`,
    names: (t: string) => `List every person's name in this text, exactly as written. Do not include places, companies or titles. If none, return an empty list. JSON only: {"names":[...]}.\n\nText: ${t}`,
  },
};
const save = (name: string, data: any) => fetch('/save?name=' + name, { method: 'POST', body: JSON.stringify(data) }).catch(() => {});
const pct = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.ceil(p / 100 * s.length) - 1)] : null; };

async function call(model: any, prompt: string) {
  const t0 = performance.now(); let text = '', src = '', err = '';
  try { const r = await model.generateContent(prompt); text = r.response.text(); src = String(r.response.inferenceSource); } catch (e: any) { err = `${e?.name}: ${e?.message}`; }
  return { ms: performance.now() - t0, text, src, err };
}
function parseJson(t: string): any | undefined {
  try { return JSON.parse(t); } catch { }
  const m = t.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch { } }
  return undefined;
}

async function init() {
  $('status').textContent = 'initializing';
  base = mk(InferenceMode.ONLY_ON_DEVICE);
  const t0 = performance.now();
  await base.initializeDeviceModel((v: number) => { $('status').textContent = `download ${(v * 100).toFixed(1)}%`; });
  R.initMs = performance.now() - t0; $('status').textContent = `ready (init ${Math.round(R.initMs)} ms)`; await save('init', { initMs: R.initMs });
  return R.initMs;
}
$('init').addEventListener('click', () => { init().catch(e => { $('status').textContent = 'init failed: ' + e; R.initError = String(e); }); });

// ---- A/B (pass = 'v1' plain JSON | 'v1s' schema | 'v2s')
async function runAB(pass: string, reps = 3, limit = clauses.length) {
  const v = pass.startsWith('v2') ? 'v2' : 'v1', useSchema = pass.endsWith('s');
  const mc = mk(InferenceMode.ONLY_ON_DEVICE, useSchema ? clsSchema : undefined);
  const mf = mk(InferenceMode.ONLY_ON_DEVICE, useSchema ? fldSchema : undefined);
  const out: any = { pass, cls: [], fld: [], latCls: [], latFld: [], srcs: {}, errors: [] };
  maxGap = 0;
  for (let rep = 0; rep < reps; rep++) {
    for (const c of (clauses as any[]).slice(0, limit)) {
      const a = await call(mc, PROMPTS[v].cls(c.text)); out.latCls.push(a.ms); out.srcs[a.src] = (out.srcs[a.src] || 0) + 1;
      if (a.err) out.errors.push({ id: c.id, t: 'A', err: a.err });
      const b = await call(mf, PROMPTS[v].fld(c.text)); out.latFld.push(b.ms); out.srcs[b.src] = (out.srcs[b.src] || 0) + 1;
      if (b.err) out.errors.push({ id: c.id, t: 'B', err: b.err });
      if (rep === 0) { out.cls.push({ id: c.id, raw: a.text, p: parseJson(a.text), ms: a.ms }); out.fld.push({ id: c.id, raw: b.text, p: parseJson(b.text), ms: b.ms }); }
    }
  }
  out.maxMainThreadGapMs = Math.round(maxGap);
  // scoring
  const by: any = Object.fromEntries((clauses as any[]).map(c => [c.id, c]));
  let valid = 0, correct = 0, tp = 0, fp = 0, fn = 0; const fails: any[] = [];
  for (const r of out.cls) {
    const g = by[r.id]; const ok = r.p && (r.p.label === 'ok' || r.p.label === 'risky'); if (ok) valid++;
    const pred = ok ? r.p.label : null; if (pred === g.label) correct++; else fails.push({ test: 'A', id: r.id, input: g.text, gold: g.label, output: r.raw });
    if (g.label === 'risky' && pred === 'risky') tp++; if (g.label === 'ok' && pred === 'risky') fp++; if (g.label === 'risky' && pred !== 'risky') fn++;
  }
  const n = out.cls.length;
  out.A = { n, jsonValidity: valid / n, accuracy: correct / n, riskyRecall: tp / (tp + fn || 1), riskyPrecision: tp / (tp + fp || 1), tp, fp, fn };
  const keys = ['deposit', 'lockin_months', 'notice_days', 'escalation_pct']; const per: any = {}; keys.forEach(k => per[k] = { exist: 0, match: 0, nullN: 0, falsePos: 0 });
  let fvalid = 0;
  for (const r of out.fld) {
    const g = by[r.id]; const okj = r.p && typeof r.p === 'object'; if (okj) fvalid++;
    keys.forEach(k => {
      const gv = g.fields[k], pv = okj ? (r.p[k] ?? null) : undefined;
      if (gv !== null) { per[k].exist++; if (pv !== undefined && Number(pv) === gv) per[k].match++; else fails.push({ test: 'B', id: r.id, field: k, input: g.text, gold: gv, output: r.raw }); }
      else { per[k].nullN++; if (pv !== null && pv !== undefined) { per[k].falsePos++; fails.push({ test: 'B-fp', id: r.id, field: k, input: g.text, gold: null, output: r.raw }); } }
    });
  }
  out.B = { n: out.fld.length, jsonValidity: fvalid / out.fld.length, per: Object.fromEntries(keys.map(k => [k, { ...per[k], exactMatch: per[k].exist ? per[k].match / per[k].exist : null, fpRate: per[k].nullN ? per[k].falsePos / per[k].nullN : null }])) };
  out.lat = { cls: { p50: pct(out.latCls, 50), p95: pct(out.latCls, 95), n: out.latCls.length }, fld: { p50: pct(out.latFld, 50), p95: pct(out.latFld, 95), n: out.latFld.length }, firstCall: out.latCls[0] };
  out.fails = fails;
  R['AB_' + pass] = out; await save('AB_' + pass, out); return { A: out.A, B: out.B, lat: out.lat, srcs: out.srcs, errors: out.errors.length, gap: out.maxMainThreadGapMs };
}

// ---- C: names
const verhoeff = (n: string) => { const d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]]; const p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]]; let c = 0; [...n].reverse().forEach((x, i) => c = d[c][p[i % 8][+x]]); return c === 0; };
const detectAadhaar = (t: string) => (t.match(/(?<!\d)[1-9]\d{3} ?\d{4} ?\d{4}(?!\d)/g) || []).map(x => x.replace(/ /g, '')).filter(verhoeff);
const detectPan = (t: string) => t.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g) || [];
async function runC(pass = 'v1', schema = false) {
  const m = mk(InferenceMode.ONLY_ON_DEVICE, schema ? namesSchema : undefined); const v = pass;
  let gold = 0, hit = 0, pred = 0, fpN = 0, valid = 0, aG = 0, aH = 0, pG = 0, pH = 0, aFp = 0, pFp = 0; const fails: any[] = [], lat: number[] = [];
  for (const s of pii as any[]) {
    const r = await call(m, PROMPTS[v].names(s.text)); lat.push(r.ms); const p = parseJson(r.text);
    if (p && Array.isArray(p.names)) valid++;
    const got: string[] = (p?.names || []).map((x: any) => String(x).trim());
    const norm = (x: string) => x.toLowerCase().replace(/^(mr|ms|mrs)\.?\s+/, '');
    s.names.forEach((g: string) => { gold++; if (got.some(x => norm(x).includes(norm(g)) || norm(g).includes(norm(x)))) hit++; });
    const falseNames = got.filter(x => !s.names.some((g: string) => norm(x).includes(norm(g)) || norm(g).includes(norm(x))));
    pred += got.length; fpN += falseNames.length;
    if (hit < gold - 0 && false) { }
    if (s.names.some((g: string) => !got.some(x => norm(x).includes(norm(g)))) || falseNames.length) fails.push({ test: 'C', id: s.id, input: s.text, gold: s.names, output: r.text });
    const ad = detectAadhaar(s.text), pn = detectPan(s.text);
    s.aadhaar.forEach((g: string) => { aG++; if (ad.includes(g)) aH++; }); aFp += ad.filter(x => !s.aadhaar.includes(x)).length;
    s.pan.forEach((g: string) => { pG++; if (pn.includes(g)) pH++; }); pFp += pn.filter(x => !s.pan.includes(x)).length;
  }
  const cr = R['C_' + pass] = { pass, nameRecall: hit / gold, nameGold: gold, nameHits: hit, predicted: pred, falsePositiveNames: fpN, fpShareOfPredicted: pred ? fpN / pred : 0, jsonValidity: valid / (pii as any[]).length, p50: pct(lat, 50), p95: pct(lat, 95), aadhaarRegexRecall: aH / aG, aadhaarFp: aFp, panRegexRecall: pH / pG, panFp: pFp, fails };
  await save('C_' + pass, cr); return cr;
}

// ---- D: context probe with a needle at the start
async function runD(sizes = [250, 500, 1000, 2000, 4000]) {
  const m = mk(InferenceMode.ONLY_ON_DEVICE); const rows: any[] = [];
  const pool = (clauses as any[]).map(c => c.text);
  for (const w of sizes) {
    let body = 'NOTE: the audit code for this document is ZX-4417. '; let i = 0;
    while (body.split(/\s+/).length < w) body += pool[i++ % pool.length] + ' ';
    const prompt = `Read the whole document below, then answer with JSON only: {"audit_code":"<the audit code stated in the NOTE>","clause_count_estimate":<number of numbered or separate clauses you saw>}.\n\nDOCUMENT:\n${body}`;
    const r = await call(m, prompt); const p = parseJson(r.text);
    rows.push({ words: body.split(/\s+/).length, promptChars: prompt.length, ms: Math.round(r.ms), err: r.err, validJson: !!p, codeFound: !!(p && String(p.audit_code).includes('ZX-4417')), raw: r.text.slice(0, 200) });
    log('D ' + JSON.stringify(rows.at(-1)));
  }
  R.D = rows; await save('D', rows); return rows;
}

// ---- F: fallback behaviour
async function runF() {
  const rows: any[] = []; const LM = (self as any).LanguageModel; const prompt = 'Reply with the single word: pong';
  const m = mk(InferenceMode.PREFER_ON_DEVICE);
  rows.push({ case: 'PREFER_ON_DEVICE, model available (baseline)', ...(await call(m, prompt)) });
  (self as any).LanguageModel = undefined;
  try {
    const m2 = mk(InferenceMode.PREFER_ON_DEVICE);
    const t0 = performance.now(); const r = await Promise.race([call(m2, prompt), new Promise<any>(res => setTimeout(() => res({ err: 'HANG >30s', ms: 30000, text: '', src: '' }), 30000))]);
    rows.push({ case: 'PREFER_ON_DEVICE, LanguageModel API removed (simulated unavailable)', ...r, wall: performance.now() - t0 });
    const m3 = mk(InferenceMode.ONLY_ON_DEVICE);
    rows.push({ case: 'ONLY_ON_DEVICE, LanguageModel API removed (simulated unavailable)', ...(await Promise.race([call(m3, prompt), new Promise<any>(res => setTimeout(() => res({ err: 'HANG >30s', ms: 30000, text: '', src: '' }), 30000))])) });
  } finally { (self as any).LanguageModel = LM; }
  R.F = rows; await save('F', rows); return rows;
}

// ---- F2: real unavailable state (no simulation); run in a browser where LanguageModel.availability() != 'available'
async function runF2() {
  const to = (p: Promise<any>) => Promise.race([p, new Promise<any>(res => setTimeout(() => res({ err: 'HANG >30s', ms: 30000, text: '', src: '' }), 30000))]);
  const rows: any[] = [];
  rows.push({ case: 'availability', value: (self as any).LanguageModel ? await (self as any).LanguageModel.availability() : 'no LanguageModel global' });
  for (const [name, mode] of [['PREFER_ON_DEVICE', InferenceMode.PREFER_ON_DEVICE], ['ONLY_ON_DEVICE', InferenceMode.ONLY_ON_DEVICE], ['PREFER_IN_CLOUD', InferenceMode.PREFER_IN_CLOUD]] as any) {
    rows.push({ case: name + ' generateContent', ...(await to(call(mk(mode), 'Reply with the single word: pong'))) });
  }
  const t0 = performance.now(); let ie = '';
  try { await to(mk(InferenceMode.ONLY_ON_DEVICE).initializeDeviceModel()); } catch (e: any) { ie = `${e?.name}: ${e?.message}`; }
  rows.push({ case: 'ONLY_ON_DEVICE initializeDeviceModel() (no user click)', err: ie, ms: performance.now() - t0 });
  R.F2 = rows; await save('F2', rows); return rows;
}

// ---- Mid-download probe: start the model download, then call while it is still downloading.
async function runMid() {
  const LM = (self as any).LanguageModel; const rows: any[] = []; const t0 = performance.now();
  const mark = (k: string, extra: any = {}) => { const r = { k, t: Math.round(performance.now() - t0), ...extra }; rows.push(r); return r; };
  const to = (p: Promise<any>, ms: number) => Promise.race([p, new Promise<any>(res => setTimeout(() => res({ err: `still pending after ${ms} ms`, ms, text: '', src: '' }), ms))]);
  mark('availability_before', { v: LM ? await LM.availability() : 'none' });
  const only = mk(InferenceMode.ONLY_ON_DEVICE); let prog = 0;
  const init = only.initializeDeviceModel((v: number) => { prog = v; }).then(() => mark('init_resolved'), (e: any) => mark('init_rejected', { e: String(e?.message || e) }));
  await new Promise(r => setTimeout(r, 4000));
  mark('availability_during', { v: LM ? await LM.availability() : 'none', progress: Math.round(prog * 1000) / 10 });
  const pref = await call(mk(InferenceMode.PREFER_ON_DEVICE), 'Reply with the single word: pong');
  mark('PREFER_ON_DEVICE_during_download', { ms: Math.round(pref.ms), src: pref.src, text: pref.text, err: (pref.err || '').slice(0, 300) });
  const onlyR = await to(call(mk(InferenceMode.ONLY_ON_DEVICE), 'Reply with the single word: pong'), 20000);
  mark('ONLY_ON_DEVICE_during_download', { ms: Math.round(onlyR.ms), src: onlyR.src, text: onlyR.text, err: (onlyR.err || '').slice(0, 300), progress: Math.round(prog * 1000) / 10 });
  (window as any).midRows = rows; (window as any).midInit = init; (window as any).midProg = () => prog;
  return rows;
}

// ---- G: cloud
async function runG() {
  const mc = mk(InferenceMode.ONLY_IN_CLOUD, clsSchema), mf = mk(InferenceMode.ONLY_IN_CLOUD, fldSchema);
  const out: any[] = [];
  for (const c of clauses as any[]) { const a = await call(mc, PROMPTS.v2.cls(c.text)); const b = await call(mf, PROMPTS.v2.fld(c.text)); out.push({ id: c.id, a: a.text, b: b.text, errA: a.err, errB: b.err, src: a.src }); }
  R.G = out; await save('G', out); return out;
}
Object.assign(window as any, { H: { init, runAB, runC, runD, runF, runF2, runMid, runG, getAvail: async () => (self as any).LanguageModel ? await (self as any).LanguageModel.availability() : 'no LanguageModel global', maxGap: () => maxGap } });
log('harness ready; realFirebaseConfig=' + realCfg);
