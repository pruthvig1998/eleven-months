import './style.css';
import { initNano, nanoJudge, nanoNames, cloudJudge, cloudConfigured } from './ai.ts';
import { splitClauses, clauseLabel } from './split.ts';
import { readLeaseFile } from './pdf.ts';
import { SAMPLE } from './sample.ts';
import { decide, finalize, FIELDS, type Model } from '../../rules/pipeline.ts';
import { extract } from '../../rules/extract.ts';
import { mask } from './mask.ts';
import { coverage } from '../../rules/topics.ts';
import { noteById, searchNotes, BASIS_LABEL, OPEN_QUESTIONS, type Note } from '../../rules/knowledge.ts';
import { GUIDES, guideById, stepBasis } from '../../rules/guides.ts';
import { askForFinding, askForFlag, askForGap, VISIT } from '../../rules/asks.ts';
import { docCheck } from '../../rules/doccheck.ts';
import { leaseReport } from '../../rules/lease.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmt = (v: number) => v.toLocaleString('en-IN');
const LABELS: Record<string, string> = { deposit: 'Deposit (Rs.)', lockin_months: 'Lock-in (months)', notice_days: 'Notice (days)', escalation_pct: 'Rent increase (%)' };
const FLAGS: Record<string, string> = {
  deposit_over_3x_rent: 'Deposit over 3x rent', escalation_over_10pct: 'Rent rise over 10%', notice_under_15_days: 'Notice under 15 days',
  notice_one_sided: 'One-sided notice', lockin_binds_lessee_only: 'Lock-in binds tenant only',
};
const why = (r: string) =>
  r === 'nano_label_unusable' ? 'On-device answer unusable' : r === 'nano_fields_unusable' ? 'On-device numbers unusable'
  : r.startsWith('rules_unsure') ? 'Figures unclear' : r.startsWith('field_disagree:') ? `Rules and model disagree: ${LABELS[r.split(':')[1]] ?? r.split(':')[1]}`
  : r.startsWith('ok_but_flagged') ? 'Marked ok but rules flagged a risk' : r;

const STATUS: Record<Note['status'], string> = { law: 'law', 'model-law': 'model law, binds only where adopted', tool: "this tool's threshold", tip: 'practical tip' };
const safeUrl = (u?: string) => (u && /^https:\/\//.test(u) ? u : '');
const srcLinks = (n: Note) => n.sources.map(x => safeUrl(x.url) ? `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a>` : esc(x.label)).join(' · ');
const noteHtml = (n: Note) => `<div class="note-card"><div class="nh"><b>${esc(n.title)}</b><span class="nstat ${n.status}">${esc(STATUS[n.status])}</span></div><p>${esc(n.summary)}</p><p class="trust"><span class="basis ${n.basis}">${esc(BASIS_LABEL[n.basis])}</span><span class="scope">${n.scope === 'telangana' ? 'Telangana' : 'All India'}</span></p>${n.unverified ? `<p class="unv"><b>Not verified:</b> ${esc(n.unverified)}</p>` : ''}<p class="nsrc">Source: ${srcLinks(n) || 'none (practical tip)'} &middot; checked ${esc(n.checked)}</p></div>`;
const pill = (id: string, state: string, text: string) => { $(id).dataset.state = state; $(id).querySelector('span')!.textContent = text; };
const status = (text: string, kind = '') => { $('status').textContent = text; $('status').dataset.kind = kind; };
if (cloudConfigured) pill('pillCloud', 'cloud', 'Cloud: masked clauses only'); else pill('pillCloud', 'idle', 'Cloud: off');

// Printable sheet: what to ask the landlord to change, what the lease omits, and what to check at the flat.
interface SheetAsk { no: string; excerpt: string; title: string; ask: string }
function renderSheet(scan: { asks: SheetAsk[]; gaps: string[]; summary: string } | null) {
  const asks = scan?.asks.length ? `<h3>Ask the landlord to change</h3><ol class="ask-list">${scan.asks.map(a => `<li><b>${esc(a.no)}: ${esc(a.title)}</b><p class="q">&ldquo;${esc(a.excerpt)}&rdquo;</p><p class="a">${esc(a.ask)}</p></li>`).join('')}</ol>` : '';
  const gaps = scan?.gaps.length ? `<h3>Missing from the lease</h3><ul class="gap-list">${scan.gaps.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : '';
  const visit = VISIT.map((g, gi) => `<h3>${esc(g.title)}</h3><ul class="tick-list">${g.items.map((it, ii) => `<li><label><input type="checkbox" id="v${gi}_${ii}"> <span>${esc(it)}</span></label></li>`).join('')}</ul>`).join('');
  $('sheet').innerHTML = `
    <div class="label"><span>Take this to the signing</span><button type="button" id="printBtn">Print or save as PDF</button></div>
    <p class="sheet-sum">${scan ? esc(scan.summary) : 'Scan a lease to add its risky clauses and what to ask for. The flat checklist below works without a scan.'}</p>
    ${scan && !scan.asks.length && !scan.gaps.length ? '<p class="sheet-sum">Nothing to ask for was found in this scan.</p>' : ''}
    ${asks}${gaps}${visit}
    <p class="nsrc">A screening aid, not legal advice. Suggestions restate public benchmarks and fairness points; a landlord may refuse them. The flat checklist is practical tips.</p>`;
  $('printBtn').onclick = () => window.print();
}
renderSheet(null);

let ready = false, running = false;
async function ensureNano(): Promise<boolean> {
  if (ready) return true;
  if (!('LanguageModel' in self)) {
    pill('pillNano', 'error', 'On-device model: unsupported');
    status('This browser has no on-device model. Use desktop Chrome 139 or newer.', 'error');
    return false;
  }
  pill('pillNano', 'busy', 'On-device model: preparing');
  status('Preparing the on-device model. The first time can mean a download of about 4 GB.', 'busy');
  try {
    await initNano(v => { const n = Math.round(v * 100); pill('pillNano', 'busy', `On-device model: ${n}%`); status(`Downloading the on-device model: ${n}%`, 'busy'); });
    ready = true; pill('pillNano', 'ready', 'On-device model: ready'); return true;
  } catch (e) {
    pill('pillNano', 'error', 'On-device model: unavailable');
    status(`On-device model unavailable: ${(e as Error).message}`, 'error'); return false;
  }
}

function hud(done: number, total: number, risky: number, cloud: number, checks: number) {
  const pct = done ? Math.round((risky / done) * 100) : 0, priv = done ? Math.round(((done - cloud) / done) * 100) : 100;
  $('ring').style.setProperty('--p', String(pct)); $('riskPct').textContent = String(pct);
  $('sTotal').textContent = String(total); $('sRisky').textContent = String(risky); $('sCloud').textContent = String(cloud); $('sCheck').textContent = String(checks);
  $('privPct').textContent = `${priv}%`; $('privBar').style.width = `${priv}%`;
  const prog = total ? Math.round((done / total) * 100) : 0; $('progPct').textContent = `${prog}%`; $('progBar').style.width = `${prog}%`;
}

const trace = (nanoOk: boolean, cloud: 'off' | 'on' | 'wait') =>
  `<div class="trace" aria-label="Resolved by"><span class="t on">RULES</span><span class="t ${nanoOk ? 'on' : ''}">NANO</span><span class="t cloud ${cloud === 'off' ? '' : cloud}">CLOUD</span></div>`;
const scanning = (i: number, text: string) => `
  <div class="rail"><span class="node"></span></div>
  <div class="body"><span class="beam"></span>
    <div class="head"><span class="no">${esc(clauseLabel(text, i))}</span><span class="chip scan">scanning</span></div>
    <p class="text">${esc(text)}</p></div>`;

$('sample').onclick = () => { ($('lease') as HTMLTextAreaElement).value = SAMPLE; status('Sample loaded. Press Scan lease.'); };
$('upload').onclick = () => ($('file') as HTMLInputElement).click();
($('file') as HTMLInputElement).onchange = async e => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  status(`Reading ${f.name} on this device...`, 'busy');
  try {
    const r = await readLeaseFile(f, m => status(m, 'busy'));
    ($('lease') as HTMLTextAreaElement).value = r.text;
    status(r.ocrUsed ? `Text read from ${f.name} on this device; nothing was uploaded. Reading a photo or scan makes mistakes: compare the text with the paper, fix any errors, then press Scan lease.` : `Loaded ${f.name}. Nothing was uploaded. Press Scan lease.`, 'done');
  }
  catch (err) { status((err as Error).message, 'error'); }
  (e.target as HTMLInputElement).value = '';
};
$('init').onclick = async () => { if (await ensureNano()) status('On-device model ready.', 'done'); };
$('analyze').onclick = async () => {
  if (running) return;
  const lease = ($('lease') as HTMLTextAreaElement).value.trim();
  if (!lease) { status('Paste a lease or load the sample first.', 'error'); ($('lease') as HTMLTextAreaElement).focus(); return; }
  const clauses = splitClauses(lease);
  if (!clauses.length) { status('No clauses found. Separate clauses with blank lines or numbers.', 'error'); return; }
  const dc = docCheck(lease);
  if (dc.block) { status(dc.block, 'error'); $('out').innerHTML = `<section class="verdict bad"><h2>Not scanned.</h2><p>${esc(dc.block)}</p></section>`; return; }
  running = true; (['analyze', 'init', 'sample', 'upload'] as const).forEach(id => ($(id) as HTMLButtonElement).disabled = true);
  $('out').setAttribute('aria-busy', 'true'); $('out').innerHTML = ''; $('hudState').textContent = 'scanning';
  try {
    // No on-device model (phones, Safari, Firefox): run the fixed rules only, and say so.
    let rulesOnly = !('LanguageModel' in self) || (await (self as any).LanguageModel.availability().catch(() => 'unavailable')) === 'unavailable';
    if (!rulesOnly) { $('hudState').textContent = 'loading model'; if (!(await ensureNano())) rulesOnly = true; $('hudState').textContent = 'scanning'; }
    if (rulesOnly) pill('pillNano', 'error', 'On-device model: not available here');
    const rent = extract(lease).rent ?? undefined;
    let risky = 0, cloudCalls = 0, checks = 0, unmatched = 0;
    const sheetAsks: SheetAsk[] = [];
    hud(0, clauses.length, 0, 0, 0);
    for (const [i, text] of clauses.entries()) {
      status(rulesOnly ? `Rules-only scan: ${i + 1} of ${clauses.length}` : i === 0 ? 'Scanning clause 1. After a Chrome restart the first answer can take up to 20 s while the model loads.' : `Scanning clause ${i + 1} of ${clauses.length}`, 'busy');
      const el = document.createElement('article'); el.className = 'clause scanning'; el.style.setProperty('--i', String(Math.min(i, 8))); el.innerHTML = scanning(i, text);
      $('out').appendChild(el); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      let nano: Model = { label: null, fields: null }, note = '';
      if (!rulesOnly) try { nano = await nanoJudge(text); } catch (e) { note = `On-device model failed: ${(e as Error).message}`; }
      const d = decide(text, nano, { rent });
      let cloud: Model | null = null, sent = '';
      if (d.needsCloud && !rulesOnly) {
        if (!cloudConfigured) note ||= 'Needs a cloud check, but cloud is not configured.';
        else {
          // Fail closed: if the on-device names check fails, the clause stays on the device instead of going out unchecked.
          let names: string[] | null = null;
          try { names = await nanoNames(text); } catch { note ||= 'Names could not be checked on this device, so the clause was not sent to cloud.'; }
          if (names) try { sent = mask(text, names); cloud = await cloudJudge(sent); cloudCalls++; }
          catch (e) { note ||= `Cloud check failed: ${(e as Error).message}`; sent = ''; }
        }
      }
      const fin0 = finalize(d, nano, cloud);
      // Rules-only: high findings mark the clause risky, medium ones ask for a look, and a clause no rule matched is counted so the verdict can say so.
      const fin = rulesOnly ? { ...fin0, label: d.rules.flags.length || d.topics.some(x => x.severity === 'high') ? ('risky' as const) : null, check: d.topics.some(x => x.severity === 'medium') } : fin0;
      if (!d.rules.flags.length && !d.topics.some(x => x.severity !== 'info')) unmatched++;
      const unresolved = !rulesOnly && d.needsCloud && !cloud, label = fin.label ?? 'unknown';
      if (fin.label === 'risky') risky++;
      if (fin.check || unresolved) checks++;
      const clauseRent = extract(text).rent;
      const rentCell = clauseRent !== null ? `<div class="cell"><dt>Monthly rent (Rs.)</dt><dd>${fmt(clauseRent)}<span class="src rules">rules</span></dd></div>` : '';
      const cells = rentCell + FIELDS.filter(f => fin.fields[f] !== null).map(f => {
        const src = d.rules.derived[f] !== null ? ['rules', 'rules'] : cloud ? ['cloud', 'cloud'] : ['nano', 'nano, unverified'];
        return `<div class="cell"><dt>${LABELS[f]}</dt><dd>${fmt(fin.fields[f]!)}<span class="src ${src[0]}">${src[1]}</span></dd></div>`;
      }).join('');
      const sev = (x: string) => (x === 'high' ? '' : x === 'medium' ? ' med' : ' info');
      const topicTags = d.topics.map(x => `<span class="tag${sev(x.severity)}">${esc(x.title)}</span>`).join('');
      const tags = d.rules.flags.filter(f => !(f === 'deposit_over_3x_rent' && d.topics.some(x => x.topic === 'deposit'))).map(f => `<span class="tag">${esc(FLAGS[f] ?? f)}</span>`).join('') + topicTags + (d.needsCloud && !rulesOnly ? d.reasons.map(r => `<span class="tag why">${esc(why(r))}</span>`).join('') : '');
      const findings = d.topics.length ? `<details class="why-it-matters"><summary>Why it matters (${d.topics.length})</summary>${d.topics.map(x => { const n = x.note ? noteById(x.note) : undefined; return `<div class="finding ${x.severity}"><b>${esc(x.title)}</b><p>${esc(x.why)}</p>${n ? `<p class="nsrc">${esc(n.title)} (${esc(STATUS[n.status])}): ${srcLinks(n)}</p>` : ''}</div>`; }).join('')}</details>` : '';
      const no = `${esc(clauseLabel(text, i))}`, excerpt = text.length > 150 ? text.slice(0, 150).trimEnd() + '...' : text;
      const shownFlags = d.rules.flags.filter(f => !(f === 'deposit_over_3x_rent' && d.topics.some(x => x.topic === 'deposit')));
      const clauseAsks: SheetAsk[] = [
        ...shownFlags.map(f => ({ title: FLAGS[f] ?? f, ask: askForFlag(f) })),
        ...d.topics.map(x => ({ title: x.title, ask: askForFinding(x) })),
      ].filter((a): a is { title: string; ask: string } => !!a.ask).filter((a, k, arr) => arr.findIndex(b => b.ask === a.ask) === k).map(a => ({ no, excerpt, ...a }));
      sheetAsks.push(...clauseAsks);
      const asksHtml = clauseAsks.length ? `<div class="asks"><b>Ask for this instead</b><ul>${clauseAsks.map(a => `<li>${esc(a.ask)}</li>`).join('')}</ul></div>` : '';
      el.className = `clause ${label}`;
      el.innerHTML = `
        <div class="rail"><span class="node"></span></div>
        <div class="body">
          <div class="head"><span class="no">${esc(clauseLabel(text, i))}</span>
            <span class="chip ${label}">${label === 'risky' ? 'risk' : label === 'ok' ? 'clear' : rulesOnly ? 'no rule hit' : 'unknown'}</span>
            ${fin.check || unresolved ? '<span class="chip check">check this clause</span>' : ''}
            ${trace(nano.label !== null, cloud ? 'on' : unresolved ? 'wait' : 'off')}</div>
          <p class="text">${esc(text)}</p>
          ${cells ? `<dl class="data">${cells}</dl>` : '<p class="empty">No numbers to extract in this clause.</p>'}
          ${tags ? `<div class="tags">${tags}</div>` : ''}
          ${asksHtml}
          ${findings}
          ${sent ? `<details><summary>Sent to cloud (names and IDs masked)</summary><p>${esc(sent)}</p></details>` : ''}
          ${note ? `<p class="note">${esc(note)}</p>` : ''}
        </div>`;
      hud(i + 1, clauses.length, risky, cloudCalls, checks);
    }
    const cov = coverage(clauses);
    $('out').insertAdjacentHTML('beforeend', `<section class="coverage"><h2>Lease checklist</h2><p class="nsrc">What the whole lease covers, and what it does not mention.</p><ul>${cov.map(c => {
      const n = c.note ? noteById(c.note) : undefined;
      return `<li class="${c.present ? 'yes' : 'no ' + c.severity}"><span class="mark" aria-hidden="true">${c.present ? '✓' : '!'}</span><div><b>${esc(c.label)}</b>${c.present ? '' : `<p>${esc(c.why)}${n ? ` <a href="#ref" data-q="${esc(n.id)}">See reference</a>` : ''}</p>`}</div></li>`;
    }).join('')}</ul></section>`);
    // Whole-agreement checks: basics, contradictions, court city, and a rough stamp duty figure.
    const rep = leaseReport(clauses);
    const whole: string[] = [...rep.basics.filter(b => !b.present).map(b => `${b.label}: ${b.why}`), ...rep.conflicts.map(c => `${c} Ask which one is right and have the other corrected.`), ...(rep.court ? [`Disputes go to the courts at ${rep.court}, a place the agreement names nowhere else. If that is far from the flat, any claim becomes costly; ask for the courts where the flat is.`] : [])];
    const costHtml = rep.cost ? `<li class="yes"><span class="mark" aria-hidden="true">i</span><div><b>Stamp duty estimate (Telangana): about Rs. ${fmt(rep.cost.duty)}</b><p>0.4% of the total rent for ${rep.cost.months} months at Rs. ${fmt(rep.cost.rent)} a month. This rate is not confirmed against the current Telangana schedule; check the department's calculator. If you register, the official fee is 0.2% on top. <a href="#ref" data-q="stamp-ts">See reference</a></p></div></li>` : '';
    $('out').insertAdjacentHTML('beforeend', `<section class="coverage"><h2>Whole agreement</h2><p class="nsrc">Checks across all clauses: the basics, figures that contradict each other, and cost.</p><ul>${rep.basics.map(b => `<li class="${b.present ? 'yes' : 'no medium'}"><span class="mark" aria-hidden="true">${b.present ? '✓' : '!'}</span><div><b>${esc(b.label)}</b>${b.present ? '' : `<p>${esc(b.why)}</p>`}</div></li>`).join('')}${[...rep.conflicts, ...(rep.court ? [whole[whole.length - 1]] : [])].map(c => `<li class="no medium"><span class="mark" aria-hidden="true">!</span><div><b>${esc(c)}</b></div></li>`).join('')}${costHtml}</ul></section>`);
    renderSheet({ asks: sheetAsks, gaps: [...cov.filter(c => !c.present).map(c => askForGap(c.topic)).filter((g): g is string => !!g), ...whole], summary: `Scan of ${clauses.length} clauses: ${risky} marked risky, ${sheetAsks.length} points to raise.` });
    // Plain-language verdict at the top of the results.
    const issues = [...new Set(sheetAsks.map(a => a.title))].slice(0, 3);
    const head = risky ? `${risky} of ${clauses.length} clauses need attention.` : checks ? `${checks} of ${clauses.length} clauses are worth a closer look.` : rulesOnly ? 'No fixed rule was triggered.' : 'No risky clauses found.';
    const detail = (issues.length ? `Biggest issues: ${issues.join('; ')}. ` : '') + `${sheetAsks.length} points to raise with the landlord` + (cov.some(c => !c.present) ? `, and ${cov.filter(c => !c.present).length} things the lease does not mention.` : '.') + (whole.length ? ` ${whole.length} whole-agreement ${whole.length === 1 ? 'problem' : 'problems'} listed at the end.` : '');
    $('out').insertAdjacentHTML('afterbegin', `<section class="verdict ${risky || checks ? 'bad' : 'good'}"><h2>${esc(head)}</h2><p>${esc(detail)}</p>${dc.warnings.map(w => `<p class="note">${esc(w)}</p>`).join('')}${rulesOnly ? `<p class="note">Rules-only scan: this browser has no on-device model. ${unmatched} of ${clauses.length} clauses matched no rule. That does not mean they are fine: read those yourself, or open this page in desktop Chrome for the full scan.</p>` : ''}<p class="nsrc">A screening aid, not legal advice.</p></section>`);
    lastScan = { lease, asks: sheetAsks }; $('tools').hidden = false;
    $('hudState').textContent = 'complete';
    status(`Done: ${clauses.length} clauses, ${risky} risky, ${cloudCalls} sent to cloud, ${checks} to check.`, 'done');
  } finally {
    running = false; (['analyze', 'init', 'sample', 'upload'] as const).forEach(id => ($(id) as HTMLButtonElement).disabled = false);
    $('out').removeAttribute('aria-busy'); if ($('hudState').textContent === 'scanning') $('hudState').textContent = 'standby';
  }
};

// Reference notes: bundled, searchable, no network.
const refQ = $('refQ') as HTMLInputElement;
const refSearch = (q: string) => {
  const hits = searchNotes(q, 4);
  $('refOut').innerHTML = !q.trim() ? '' : hits.length ? hits.map(h => noteHtml(h.note)).join('') : '<p class="empty">No note matches. Try words like notice, deposit, entry, registration, receipt.</p>';
};
refQ.addEventListener('input', () => refSearch(refQ.value));
document.querySelectorAll<HTMLButtonElement>('#refChips button').forEach(b => b.addEventListener('click', () => { refQ.value = b.dataset.q!; refSearch(b.dataset.q!); }));
$('out').addEventListener('click', e => { const a = (e.target as HTMLElement).closest('a[data-q]') as HTMLElement | null; if (a) { const n = noteById(a.dataset.q!); if (n) { refQ.value = n.title; $('refOut').innerHTML = noteHtml(n); } } });

// Get help: situation guides. Each step shows how we know it; linked steps open the reference note.
const showGuide = (id: string) => {
  const g = guideById(id); if (!g) return;
  document.querySelectorAll<HTMLButtonElement>('#helpChips button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === id)));
  $('helpOut').innerHTML = `<h3>${esc(g.title)}</h3><p class="sheet-sum">${esc(g.when)}</p><ol class="steps">${g.steps.map(st => {
    const b = stepBasis(st);
    return `<li><p>${esc(st.text)}</p><p class="trust"><span class="basis ${b}">${esc(BASIS_LABEL[b])}</span>${st.note ? `<a href="#ref" data-q="${esc(st.note)}">See the note and its source</a>` : ''}</p></li>`;
  }).join('')}</ol>`;
};
$('helpChips').innerHTML = GUIDES.map(g => `<button type="button" data-g="${esc(g.id)}" aria-pressed="false">${esc(g.title)}</button>`).join('');
$('helpChips').addEventListener('click', e => { const b = (e.target as HTMLElement).closest('button[data-g]') as HTMLElement | null; if (b) showGuide(b.dataset.g!); });
$('help').addEventListener('click', e => { const a = (e.target as HTMLElement).closest('a[data-q]') as HTMLElement | null; if (a) { const n = noteById(a.dataset.q!); if (n) { refQ.value = n.title; $('refOut').innerHTML = noteHtml(n); } } });
$('openQ').innerHTML = OPEN_QUESTIONS.map(q => `<li><b>${esc(q.question)}</b><p>Where to check: ${safeUrl(q.url) ? `<a href="${esc(safeUrl(q.url))}" target="_blank" rel="noopener noreferrer">${esc(q.where)}</a>` : esc(q.where)}</p></li>`).join('');

// Keep and share. Everything here stays in this browser: no server, no account.
let lastScan: { lease: string; asks: SheetAsk[] } | null = null;
const store = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); return true; } catch { return false; } }, del: (k: string) => { try { localStorage.removeItem(k); } catch { /* storage blocked */ } } };
const copy = async (text: string, okMsg: string) => { try { await navigator.clipboard.writeText(text); status(okMsg, 'done'); } catch { status('Could not copy. Select the text and copy it by hand.', 'error'); } };
const savedUi = () => { const has = !!store.get('em_saved'); $('loadSaved').hidden = !has; $('clearScan').hidden = !has; };
const missed = (): string[] => { try { return JSON.parse(store.get('em_missed') ?? '[]'); } catch { return []; } };
const missUi = () => { const n = missed().length; $('missCount').textContent = n ? `${n} saved ${n === 1 ? 'note' : 'notes'}` : ''; };
$('copyMsg').onclick = () => {
  if (!lastScan) return;
  if (!lastScan.asks.length) { status('The scan found nothing to ask for, so there is no message to copy.'); return; }
  // The message names the clause and the problem only; what to ask for is on the printed sheet, in the user's own words.
  copy(`Hello, before signing I would like to discuss these points in the agreement:\n\n${lastScan.asks.map((a, i) => `${i + 1}. ${a.no}: ${a.title}`).join('\n')}\n\nCould we go through them and agree changes before I sign? Thank you.`, 'Message copied. Paste it into WhatsApp or email and edit it before sending.');
};
$('saveScan').onclick = () => { if (lastScan && store.set('em_saved', lastScan.lease)) { savedUi(); status('Saved in this browser. Use "Open saved scan" to bring the text back.', 'done'); } else status('Could not save: this browser blocks storage.', 'error'); };
$('clearScan').onclick = () => { store.del('em_saved'); savedUi(); status('Saved scan deleted from this browser.', 'done'); };
$('loadSaved').onclick = () => { const t = store.get('em_saved'); if (t) { ($('lease') as HTMLTextAreaElement).value = t; status('Saved text loaded. Press Scan lease.', 'done'); } };
$('missSave').onclick = () => { const t = ($('missText') as HTMLTextAreaElement).value.trim(); if (!t) return; if (store.set('em_missed', JSON.stringify([...missed(), t]))) { ($('missText') as HTMLTextAreaElement).value = ''; missUi(); status('Note saved in this browser.', 'done'); } };
$('missCopy').onclick = () => { const all = missed(); if (all.length) copy(all.map((t, i) => `${i + 1}. ${t}`).join('\n'), 'Notes copied.'); };
savedUi(); missUi();
