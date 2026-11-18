// Cloudflare Worker: turns a suggestion from the Eleven Months site (or the Google Form) into a GitHub issue.
// Secrets (set with `npx wrangler secret put NAME`, never in this file):
//   GITHUB_TOKEN      fine-grained token, this repository only, permission "Issues: read and write"
//   TURNSTILE_SECRET  Cloudflare Turnstile secret key
//   FORM_SECRET       shared secret the Google Form's Apps Script sends in the X-Form-Secret header
const REPO = 'pruthvig1998/eleven-months';
const ORIGINS = ['https://eleven-months-nano.web.app', 'https://eleven-months-nano.firebaseapp.com'];
const BUCKETS = { idea: 'Idea or feature', wrong: 'Something is wrong', 'new-info': 'New law, rule or market information' };
const NAMES = Object.fromEntries(Object.entries(BUCKETS).map(([k, v]) => [v, k]));

const json = (body, status, origin) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST' } });

export default {
  async fetch(req, env) {
    const origin = ORIGINS.includes(req.headers.get('origin')) ? req.headers.get('origin') : ORIGINS[0];
    if (req.method === 'OPTIONS') return json({}, 204, origin);
    if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405, origin);
    let d; try { d = await req.json(); } catch { return json({ error: 'Bad request.' }, 400, origin); }

    // Two ways in: the site (Turnstile token) or the Google Form script (shared secret).
    const fromForm = env.FORM_SECRET && req.headers.get('x-form-secret') === env.FORM_SECRET;
    if (!fromForm) {
      if (!ORIGINS.includes(req.headers.get('origin'))) return json({ error: 'Not allowed.' }, 403, origin);
      const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(d.turnstileToken || ''), remoteip: req.headers.get('cf-connecting-ip') || '' }) }).then(r => r.json());
      if (!v.success) return json({ error: 'The bot check failed. Please try again.' }, 403, origin);
    }
    const bucket = BUCKETS[d.bucket] ? d.bucket : NAMES[d.bucket];
    const text = String(d.text || '').trim().slice(0, 2000), source = String(d.source || '').trim().slice(0, 300);
    if (!bucket || text.length < 10) return json({ error: 'Please choose a type and write at least a sentence.' }, 400, origin);

    const title = `[${bucket}] ${text.replace(/\s+/g, ' ').slice(0, 70)}${text.length > 70 ? '…' : ''}`;
    const body = `${text}\n\n**Source:** ${source || 'none given'}\n\n_Sent through ${fromForm ? 'the Google Form' : 'the website'}. Not reviewed yet._`;
    const r = await fetch(`https://api.github.com/repos/${REPO}/issues`, { method: 'POST', headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'eleven-months-suggest' }, body: JSON.stringify({ title, body, labels: ['inbox', `bucket: ${bucket}`] }) });
    if (!r.ok) return json({ error: 'GitHub did not accept it. Please try again later.' }, 502, origin);
    return json({ url: (await r.json()).html_url }, 201, origin);
  },
};
