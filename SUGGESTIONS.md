# Suggestion box: how it works and how to switch on each route

Visitors use the **Suggest a change** panel on the site. They pick a type (idea, something wrong, new law or information), write the suggestion, add an optional source, and pick how to send it. Each route says up front whether it needs an account.

Every route ends in the same place: a GitHub issue in this repository labelled `inbox` and `bucket: idea`, `bucket: wrong` or `bucket: new-info`. Review them at
https://github.com/pruthvig1998/eleven-months/issues?q=is%3Aopen+label%3Ainbox

Text is masked in the browser before it is sent (ID numbers, phones, emails, names after Mr/Ms/S/o).

| Route | Visitor needs | Live now? | What you set up |
|---|---|---|---|
| GitHub issue form | A free GitHub account | Yes | Nothing more (templates and labels are in the repo) |
| Send from this page (Cloudflare Worker) | No account | No | Cloudflare account, Turnstile widget, Worker |
| Google Form | No account (if sign-in is off) | No | A Google Form, optional Apps Script |
| Save it with Eleven Months (Firestore) | No account | No | Firestore in the Firebase project, one GitHub secret |

A route appears on the site only after its values are in `app/.env.local` and the site is rebuilt and deployed. All `VITE_` values are public by design. Real secrets go only into Cloudflare or GitHub secret stores, never into the repo.

## 1. Cloudflare Worker (no account for visitors) — $0 on the free plan

1. Create a free Cloudflare account.
2. Turnstile: Cloudflare dashboard > Turnstile > Add widget. Hostname `eleven-months-nano.web.app`, mode "Managed". Keep the site key (public) and the secret key (private).
3. GitHub token: GitHub > Settings > Developer settings > Fine-grained tokens > Generate. Repository access: only `eleven-months`. Permission: Issues, read and write. Nothing else.
4. Deploy the Worker, from this repo:
   ```bash
   cd suggest-worker
   npx wrangler login
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler deploy
   ```
   You type each secret yourself when wrangler asks. The deploy prints the Worker URL, like `https://eleven-months-suggest.<you>.workers.dev`.
5. Add to `app/.env.local`:
   ```
   VITE_SUGGEST_WORKER_URL=https://eleven-months-suggest.<you>.workers.dev
   VITE_TURNSTILE_SITE_KEY=<site key>
   ```

## 2. Google Form (no account for visitors)

1. Create a form with three questions, in this order: **Type** (multiple choice: `Idea or feature`, `Something is wrong`, `New law, rule or market information`), **Your suggestion** (paragraph), **Source** (short answer).
2. Settings > Responses: turn **off** "Restrict to users in your organisation" and "Limit to 1 response", so no sign-in is asked.
3. Three-dot menu > Get pre-filled link. Fill each answer with any text, press Get link, and copy it. The link contains `entry.123456=` for each question.
4. Add to `app/.env.local`:
   ```
   VITE_SUGGEST_GFORM_URL=https://docs.google.com/forms/d/e/<form id>/viewform
   VITE_SUGGEST_GFORM_ENTRIES=entry.111,entry.222,entry.333
   ```
   (type, suggestion, source, in that order)
5. Optional, to turn form answers into GitHub issues automatically (needs the Worker from step 1):
   - Set a third Worker secret: `npx wrangler secret put FORM_SECRET` (any long random text).
   - In the form: three-dot menu > Apps Script. Paste `suggest-worker/google-form-apps-script.js`.
   - Project settings > Script properties: `WORKER_URL` = the Worker URL, `FORM_SECRET` = the same text.
   - Triggers > Add trigger > `onSubmit`, event "On form submit".
   Without this step, answers stay in the form's Responses tab for you to read.

## 3. Firestore (no account for visitors) — stays on the free Spark plan

1. Firebase console > `eleven-months-nano` > Firestore Database > Create database (production mode, a region near India such as `asia-south1`).
2. Deploy the rules in this repo (visitors can only add a suggestion; nobody can read, change or delete one from the site):
   ```bash
   cd app && npx firebase deploy --only firestore:rules
   ```
3. Firebase console > App Check > Firestore > Enforce (the site already uses App Check).
4. Service account for the daily job: Project settings > Service accounts > Generate new private key. Do not save the file in this repo. Open it, copy all of it, then delete the downloaded file.
5. GitHub repo > Settings > Secrets and variables > Actions > New repository secret: name `FIREBASE_SA`, value = the copied JSON.
6. Add to `app/.env.local`: `VITE_SUGGEST_FIRESTORE=on`

The workflow `.github/workflows/suggestions.yml` runs every day at 03:30 UTC (09:00 IST). It files each new suggestion as an issue and removes it from Firestore. Run it by hand from the Actions tab at any time.

## After changing `app/.env.local`

Rebuild and deploy the site. The CSP already allows Turnstile (`challenges.cloudflare.com`) and Worker URLs (`*.workers.dev`).
