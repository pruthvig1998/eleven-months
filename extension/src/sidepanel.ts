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
import { docCheck } from '../../rules/doccheck.ts';
import { pdfText } from './pdftext.ts';

const APP_URL = 'https://eleven-months-nano.web.app/';
const ai = getAI(initializeApp({ apiKey: 'placeholder-on-device-only', projectId: 'placeholder', appId: '1:0:web:0' }), { backend: new GoogleAIBackend() });
// English in and out, so Chrome does not warn that no output language was set.
const nano = getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE, onDeviceParams: { createOptions: { expectedInputs: [{ type: 'text', languages: ['en'] }], expectedOutputs: [{ type: 'text', languages: ['en'] }] } } });
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const FLAGS: Record<string, string> = { deposit_over_3x_rent: 'Deposit over 3x rent', escalation_over_10pct: 'Rent rise over 10%', notice_under_15_days: 'Notice under 15 days', notice_one_sided: 'One-sided notice', lockin_binds_lessee_only: 'Lock-in binds tenant only' };
const status = (t: string) => { $('status').textContent = t; };
const pill = (t: string, ok: boolean) => { $('pill').textContent = t; $('pill').dataset.ok = String(ok); };

// A failure is not cached, so the next check tries again. On load the model is prepared only if it is already
// downloaded: a first download needs a user click, so it starts from the first check instead.
let nanoOk = false;
const ensureNano = async (fromClick = true): Promise<boolean> => {
  if (nanoOk) return true;
  const LM = (self as any).LanguageModel;
  const avail = LM ? await LM.availability().catch(() => 'unavailable') : 'unavailable';
  if (avail === 'unavailable') { pill('On-device model: not available, rules only', false); return false; }
  if (avail !== 'available' && !fromClick) { pill('On-device model: downloads on your first check', false); return false; }
  try { await nano.initializeDeviceModel(v => pill(`On-device model: ${Math.round(v * 100)}%`, false)); pill('On-device model: ready', true); return (nanoOk = true); }
  catch { pill('On-device model: unavailable, rules only', false); return false; }
};
const ask = async (p: string) => parse((await nano.generateContent(p)).response.text());

// One check at a time: a request that arrives during a check (button, PDF, right-click) waits and runs next.
let busy = false, queued: (() => void) | null = null;
const whenFree = (job: () => void) => { if (busy) { queued = job; status('Still checking. Your new request will start when this check finishes.'); } else job(); };
const setBusy = (b: boolean) => { busy = b; (['check', 'page', 'pdf'] as const).forEach(id => (($(id) as HTMLButtonElement).disabled = b)); };
// A message that replaces the results also clears the old results, so they are not read as the new page's.
const fail = (t: string) => { $('out').innerHTML = ''; status(t); };

const MAX_CLAUSES = 60; // shortcut: a long page is cut at 60 pieces so the on-device scan stays usable; Full scan has no cap
const BLOCKED = 'Chrome does not let extensions read this page. A PDF shown in a viewer (Chrome\'s own, or another extension\'s such as Adobe Acrobat) is one example. Download the PDF and press "Open a PDF file", or select the text and use the right-click item.';

async function check(fromPage = false) {
  const text = ($('text') as HTMLTextAreaElement).value.trim();
  if (!text) { fail(fromPage ? 'No text found on this page.' : 'Select a clause on a page, or paste one here.'); return; }
  if (fromPage) { const dc = docCheck(text); if (dc.block) { fail(`Not scanned: ${dc.block}`); return; } }
  setBusy(true);
  try {
    const all = splitClauses(text).length ? splitClauses(text) : [text], clauses = all.slice(0, MAX_CLAUSES);
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
    status(`${all.length > clauses.length ? `The page has ${all.length} pieces; the first ${clauses.length} were checked (use Full scan for all). ` : ''}${clauses.length} ${clauses.length === 1 ? 'clause' : 'clauses'} checked on this device: ${risky} risky${second ? `, ${second} would get a cloud second opinion in the full scan` : ''}.${useNano ? '' : ' Rules only: this browser has no on-device model.'}`);
  } finally {
    setBusy(false);
    const next = queued; queued = null; next?.();
  }
}

// Hand-off: the text travels in the URL fragment, which browsers do not send to the server; the web app reads it,
// puts it in the agreement box and removes it from the address bar.
const b64url = (s: string) => { const b = new TextEncoder().encode(s); let bin = ''; for (const x of b) bin += String.fromCharCode(x); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
// Full app tab: the web app framed in the panel (its own origin, so App Check and the masked cloud path work as on
// the site). Created on first use. language-model lets Gemini Nano run inside the frame.
let frame: HTMLIFrameElement | null = null;
const showTab = (app: boolean) => {
  $('tabDev').setAttribute('aria-selected', String(!app)); $('tabApp').setAttribute('aria-selected', String(app));
  $('paneDev').hidden = app; $('paneApp').hidden = !app;
};
const openApp = (text = '') => {
  const hash = text ? `#lease=${b64url(text)}` : '';
  if (!frame) {
    frame = document.createElement('iframe');
    frame.title = 'Eleven Months web app';
    frame.allow = 'language-model; clipboard-write';
    frame.src = `${APP_URL}?embed=1${hash}`;
    $('appHost').appendChild(frame);
  } else if (hash) frame.src = `${APP_URL}?embed=1${hash}`; // only the fragment changes, so the page does not reload
  ($('appNew') as HTMLAnchorElement).href = `${APP_URL}${hash}`;
  showTab(true);
};
$('tabDev').onclick = () => showTab(false);
$('tabApp').onclick = () => openApp();
$('full').onclick = () => openApp(($('text') as HTMLTextAreaElement).value.trim());
$('check').onclick = () => whenFree(() => check());
// Open a PDF file: read on this device (pdf.js, bundled). Covers PDFs that Chrome or another extension's viewer blocks.
$('pdf').onclick = () => ($('pdfFile') as HTMLInputElement).click();
($('pdfFile') as HTMLInputElement).onchange = async e => {
  const input = e.target as HTMLInputElement, f = input.files?.[0];
  input.value = ''; // reset first, so choosing the same file again still fires
  if (!f) return;
  whenFree(async () => {
    status(`Reading ${f.name} on this device...`);
    try {
      const t = await pdfText(f);
      if (t.replace(/\s/g, '').length < 40) { fail('This PDF has no text layer (it is a scan). Use Full scan in Eleven Months: the web app reads scanned pages on your device.'); return; }
      ($('text') as HTMLTextAreaElement).value = t; check(true);
    } catch (err) { fail(`Could not read this PDF: ${(err as Error).message}`); }
  });
};
// Scan this page: the click on the panel's button, or the toolbar click that opened the panel, grants activeTab.
// The page text is read on the device; nothing is sent anywhere.
$('page').onclick = () => whenFree(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('no tab');
    const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => (document.body ? document.body.innerText : '') });
    ($('text') as HTMLTextAreaElement).value = String(r?.result ?? '').trim();
    check(true);
  } catch { fail(`${BLOCKED} If this is an ordinary web page, right-click on it and choose "Scan this page with Eleven Months".`); }
});

const take = (p?: { text: string; page?: boolean; blocked?: boolean }) => {
  if (!p) return;
  chrome.storage.session.remove('pending');
  whenFree(() => {
    if (p.blocked) { fail(BLOCKED); return; }
    if (!p.text) { if (p.page) fail('No text found on this page.'); return; }
    ($('text') as HTMLTextAreaElement).value = p.text; check(!!p.page);
  });
};
chrome.storage.session.get('pending').then(r => take(r.pending));
chrome.storage.session.onChanged.addListener(ch => { if (ch.pending?.newValue) take(ch.pending.newValue); });
ensureNano(false);
