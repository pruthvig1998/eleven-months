// Side panel: rules + Gemini Nano on the device, through the Firebase AI Logic Web SDK in ONLY_ON_DEVICE mode.
// Deliberately no cloud: App Check's reCAPTCHA flow does not run in extension pages, so the masked cloud path stays
// in the web app. The Firebase config below is a placeholder; on-device inference needs no project.
import './sidepanel.css';
import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from 'firebase/ai';
import { CLS, FLD, parse } from '../../app/src/prompts.ts';
import { splitClauses, clauseLabel } from '../../app/src/split.ts';
import { decide, finalize, present, hasFigures, toLabel, type Model } from '../../rules/pipeline.ts';
import { extract } from '../../rules/extract.ts';
import { askForFinding, askForFlag } from '../../rules/asks.ts';

const APP_URL = 'https://eleven-months-nano.web.app/';
const ai = getAI(initializeApp({ apiKey: 'placeholder-on-device-only', projectId: 'placeholder', appId: '1:0:web:0' }), { backend: new GoogleAIBackend() });
const nano = getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE });
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const FLAGS: Record<string, string> = { deposit_over_3x_rent: 'Deposit over 3x rent', escalation_over_10pct: 'Rent rise over 10%', notice_under_15_days: 'Notice under 15 days', notice_one_sided: 'One-sided notice', lockin_binds_lessee_only: 'Lock-in binds tenant only' };
const status = (t: string) => { $('status').textContent = t; };
const pill = (t: string, ok: boolean) => { $('pill').textContent = t; $('pill').dataset.ok = String(ok); };

let nanoReady: Promise<boolean> | null = null;
const ensureNano = () => (nanoReady ??= (async () => {
  const LM = (self as any).LanguageModel;
  const avail = LM ? await LM.availability().catch(() => 'unavailable') : 'unavailable';
  if (avail === 'unavailable') { pill('On-device model: not available, rules only', false); return false; }
  try { await nano.initializeDeviceModel(v => pill(`On-device model: ${Math.round(v * 100)}%`, false)); pill('On-device model: ready', true); return true; }
  catch { pill('On-device model: unavailable, rules only', false); return false; }
})());
const ask = async (p: string) => parse((await nano.generateContent(p)).response.text());

async function check() {
  const text = ($('text') as HTMLTextAreaElement).value.trim();
  if (!text) { status('Select a clause on a page, or paste one here.'); return; }
  ($('check') as HTMLButtonElement).disabled = true;
  try {
    const clauses = splitClauses(text).length ? splitClauses(text) : [text];
    const useNano = await ensureNano(), rent = extract(text).rent ?? undefined;
    let risky = 0, second = 0; $('out').innerHTML = '';
    for (const [i, c] of clauses.entries()) {
      status(`Checking ${i + 1} of ${clauses.length} on this device...`);
      let m: Model = { label: null, fields: null };
      if (useNano) try { const l = await ask(CLS(c)); const f = hasFigures(c) ? await ask(FLD(c)) : {}; m = { label: toLabel(l?.label), fields: f && typeof f === 'object' ? f : null }; } catch { /* rules still run */ }
      const d = decide(c, m, { rent }), fin = present(d, finalize(d, m, null), null, !useNano);
      if (fin.label === 'risky') risky++;
      if (d.needsCloud && useNano) second++;
      const asks = [...d.rules.flags.map(askForFlag), ...d.topics.map(askForFinding)].filter((a, k, arr): a is string => !!a && arr.indexOf(a) === k);
      const tags = [...d.rules.flags.map(f => FLAGS[f] ?? f), ...d.topics.filter(t => t.severity !== 'info').map(t => t.title)];
      $('out').insertAdjacentHTML('beforeend', `<article class="card ${fin.label ?? 'none'}"><div class="head"><b>${esc(clauseLabel(c, i))}</b><span class="chip">${fin.label === 'risky' ? 'risk' : fin.label === 'ok' ? 'clear' : 'no rule hit'}</span>${fin.look ? '<span class="chip warn">check this clause</span>' : ''}</div><p class="text">${esc(c.length > 220 ? c.slice(0, 220) + '...' : c)}</p>${tags.length ? `<p class="tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}${asks.length ? `<div class="asks"><b>Ask for this instead</b><ul>${asks.map(a => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}${d.needsCloud && useNano ? '<p class="small">The rules and the on-device model do not agree here. The web app would ask cloud Gemini, after masking; use Full scan for that.</p>' : ''}</article>`);
    }
    status(`${clauses.length} ${clauses.length === 1 ? 'clause' : 'clauses'} checked on this device: ${risky} risky${second ? `, ${second} would get a cloud second opinion in the full scan` : ''}.${useNano ? '' : ' Rules only: this browser has no on-device model.'}`);
  } finally { ($('check') as HTMLButtonElement).disabled = false; }
}

// Hand-off: the text travels in the URL fragment, which browsers do not send to the server; the web app reads it,
// puts it in the agreement box and removes it from the address bar.
const b64url = (s: string) => { const b = new TextEncoder().encode(s); let bin = ''; for (const x of b) bin += String.fromCharCode(x); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
$('full').onclick = () => { const t = ($('text') as HTMLTextAreaElement).value.trim(); chrome.tabs.create({ url: t ? `${APP_URL}#lease=${b64url(t)}` : APP_URL }); };
$('check').onclick = check;

const take = (p?: { text: string }) => { if (p?.text) { ($('text') as HTMLTextAreaElement).value = p.text; chrome.storage.session.remove('pending'); check(); } };
chrome.storage.session.get('pending').then(r => take(r.pending));
chrome.storage.session.onChanged.addListener(ch => { if (ch.pending?.newValue) take(ch.pending.newValue); });
ensureNano();
