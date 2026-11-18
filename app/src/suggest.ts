// "Suggest a change": one form, three buckets, four ways to send. Every route ends as a GitHub issue labelled
// "inbox" plus its bucket, so suggestions are reviewed in one place. A route appears only when it is set up:
//   GitHub issue form   always (needs a GitHub account)
//   Cloudflare Worker   VITE_SUGGEST_WORKER_URL and VITE_TURNSTILE_SITE_KEY (no account)
//   Google Form         VITE_SUGGEST_GFORM_URL and VITE_SUGGEST_GFORM_ENTRIES (no account, if the form allows it)
//   Firestore           VITE_SUGGEST_FIRESTORE=on (no account; a daily GitHub Action files the issues)
// All of these values are public by design; none is a secret. Text is masked before it leaves the page.
import { mask } from './mask.ts';

export type Bucket = 'idea' | 'wrong' | 'new-info';
export const BUCKETS: Record<Bucket, string> = { idea: 'Idea or feature', wrong: 'Something is wrong', 'new-info': 'New law, rule or market information' };
const REPO = 'https://github.com/pruthvig1998/eleven-months';
const MAX = 2000;
const env: Record<string, string | undefined> = import.meta.env ?? {}; // empty under node --test

export interface Route { id: 'worker' | 'firestore' | 'gform' | 'github'; name: string; account: string; how: string; opensTab: boolean }
export function routes(): Route[] {
  const r: Route[] = [];
  if (env.VITE_SUGGEST_WORKER_URL && env.VITE_TURNSTILE_SITE_KEY) r.push({ id: 'worker', name: 'Send from this page', account: 'No account needed', how: 'Sent straight to the team as a GitHub issue. A quick check confirms you are not a bot.', opensTab: false });
  if (env.VITE_SUGGEST_FIRESTORE === 'on') r.push({ id: 'firestore', name: 'Save it with Eleven Months', account: 'No account needed', how: 'Stored on our Firebase server. The team reviews new suggestions every day.', opensTab: false });
  if (env.VITE_SUGGEST_GFORM_URL && env.VITE_SUGGEST_GFORM_ENTRIES) r.push({ id: 'gform', name: 'Google Form', account: 'No account needed', how: 'Opens a Google Form in a new tab, already filled in. Press Submit there.', opensTab: true });
  r.push({ id: 'github', name: 'GitHub issue', account: 'Needs a free GitHub account', how: 'Opens GitHub in a new tab, already filled in. Sign in, or create an account, then press Submit there. You can follow the discussion.', opensTab: true });
  return r;
}

export interface Suggestion { bucket: Bucket; text: string; source: string }
// What leaves the page: trimmed, capped, and masked (ID numbers, phones, emails, names after a title).
export function clean(s: Suggestion): Suggestion {
  return { bucket: s.bucket, text: mask(s.text.trim(), []).slice(0, MAX), source: mask(s.source.trim(), []).slice(0, 300) };
}
export const issueTitle = (s: Suggestion) => `[${s.bucket}] ${s.text.replace(/\s+/g, ' ').slice(0, 70)}${s.text.length > 70 ? '…' : ''}`;

export function githubUrl(s: Suggestion): string {
  const q = new URLSearchParams({ template: `${s.bucket}.yml`, title: issueTitle(s), details: s.text, source: s.source });
  return `${REPO}/issues/new?${q}`;
}
// VITE_SUGGEST_GFORM_ENTRIES = "entry.111,entry.222,entry.333" for bucket, text and source, from the form's pre-filled link.
export function gformUrl(s: Suggestion): string {
  const [b, t, src] = String(env.VITE_SUGGEST_GFORM_ENTRIES).split(',').map(x => x.trim());
  const q = new URLSearchParams({ usp: 'pp_url', [b]: BUCKETS[s.bucket], [t]: s.text, ...(src ? { [src]: s.source } : {}) });
  return `${String(env.VITE_SUGGEST_GFORM_URL).replace(/\/viewform.*$/, '')}/viewform?${q}`;
}

export async function sendWorker(s: Suggestion, turnstileToken: string): Promise<string> {
  const r = await fetch(String(env.VITE_SUGGEST_WORKER_URL), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...s, turnstileToken }) });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `The suggestion could not be sent (HTTP ${r.status}).`);
  return body.url as string;
}

export async function sendFirestore(s: Suggestion): Promise<void> {
  const [{ getFirestore, collection, addDoc, serverTimestamp }, { app }] = await Promise.all([import('firebase/firestore'), import('./ai.ts')]);
  await addDoc(collection(getFirestore(app), 'suggestions'), { ...s, createdAt: serverTimestamp() });
}

// Cloudflare Turnstile, loaded only when the visitor picks the Worker route.
let turnstileLoading: Promise<void> | null = null;
export function renderTurnstile(el: HTMLElement, onToken: (t: string) => void): Promise<void> {
  turnstileLoading ||= new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async = true;
    sc.onload = () => res(); sc.onerror = () => rej(new Error('The bot check could not load.')); document.head.appendChild(sc);
  });
  return turnstileLoading.then(() => {
    el.innerHTML = '';
    (self as any).turnstile.render(el, { sitekey: env.VITE_TURNSTILE_SITE_KEY, callback: onToken, 'expired-callback': () => onToken(''), theme: 'light' });
  });
}
