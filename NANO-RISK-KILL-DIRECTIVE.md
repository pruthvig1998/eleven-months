# Directive: Gemini Nano risk-kill for Eleven Months

Project: Eleven Months, an India rental-agreement checker web app for #BuildHybridAI 2026 (Best Web). Deadline Nov 30 2026, 2:00 PM PT; personal submit target Nov 27.
Budget for this task: 2 hours. Spend: $0 (Firebase Spark plan, no paid services).
Machine: M1 MacBook Pro, desktop Chrome.

## Goal

Decide GO or NO-GO on using Gemini Nano (via Firebase AI Logic hybrid inference) for per-clause lease classification and field extraction. Produce measured numbers, not impressions.

## Ground rules

- All inference goes through the Firebase AI Logic Web SDK (`firebase/ai`, version 12.5.0 or newer). Do not call Chrome's built-in Prompt API directly; the hackathon requires the SDK to be called at runtime.
- Check the current official docs before coding, because the API changed between 2025 and 2026: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started and https://firebase.google.com/docs/ai-logic/hybrid-on-device-inference. Report any difference from what this directive assumes.
- No secrets, tokens or API keys committed. Put the Firebase config in a git-ignored `.env.local`.
- Work in `/Users/HOME/Downloads/eleven-months/`. Create a plain Vite + vanilla TypeScript app (or plain HTML + ESM). No UI framework, no styling work.
- Do not build product features. This is a measurement harness only.
- English only. Synthetic data only. No real Aadhaar, PAN or names.

## Step 1: Setup (target 30 min)

1. Create or reuse a Firebase project on the Spark plan. Add a Web app. Enable Firebase AI Logic with the Gemini Developer API. (Cloud quota may not be available until Nov 19. The on-device tests below do not need it. Mark the cloud test "skipped" if the quota is missing.)
2. Initialize App Check with a debug token (`self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in dev). Register the debug token in the Firebase console. Note: AI Logic enforces App Check from Nov 2 2026, so confirm a cloud call succeeds with it when quota is available.
3. Enable Chrome's on-device model: in `chrome://flags` set the Prompt API for Gemini Nano and the on-device model optimization flags to Enabled (names may differ by Chrome version; record the exact names and the Chrome version). Relaunch. Confirm the model status in `chrome://on-device-internals`.
4. Page with one "Initialize on-device model" button. The SDK's `initializeDeviceModel()` must run from a user click. Show the download progress or status on the page.
5. Create the model with `getGenerativeModel(ai, { mode: InferenceMode.ONLY_ON_DEVICE })` for the tests. Log the inference source of every response. If the SDK exposes which source answered, record it; otherwise infer it from timing and from whether any network request to the Gemini backend occurred (check DevTools Network).

## Step 2: Labeled test set (target 20 min)

Generate `data/clauses.json` with 40 synthetic lease clauses in the style of Indian residential rental agreements (Hyderabad/Telangana style, "Lessor/Lessee", rupee amounts, 11-month term). Each item has:

```
{ "id": 1, "text": "...", "label": "ok" | "risky", "risk_type": null | "deposit" | "lockin" | "notice" | "escalation" | "eviction" | "maintenance" | "other",
  "fields": { "deposit": number|null, "lockin_months": number|null, "notice_days": number|null, "escalation_pct": number|null } }
```

Requirements: 20 risky and 20 ok. At least 12 clauses contain at least one extractable field. At least 6 are tricky: numbers written in words, "two months' rent" instead of a number, or a clause that contradicts a number stated elsewhere. Vary length from 20 to 250 words. Also create `data/pii.json` with 15 short synthetic snippets containing fake names, Aadhaar-format numbers (12 digits, with and without spaces) and PAN-format strings, with the ground-truth spans listed.

## Step 3: Tests (target 45 min)

Run each test over the whole set, 3 repetitions for latency.

A. **Per-clause classification.** Prompt Nano with one clause, ask for strict JSON: `{"label":"ok|risky","risk_type":"..."}`. Use a JSON response schema if the SDK supports it in on-device mode; if not, prompt for JSON and parse. Measure: JSON validity rate; label accuracy; risky-class recall and precision.

B. **Field extraction.** One clause per call, strict JSON for the four fields. Measure: JSON validity; exact-match rate per field (deposit, lockin_months, notice_days, escalation_pct), counting only clauses where the field exists; false-positive rate where the field should be null.

C. **Name redaction.** Ask Nano to list person names in each `pii.json` snippet. Measure name recall and false-positive rate. Separately, implement Aadhaar (12 digits, Verhoeff checksum) and PAN (`[A-Z]{5}[0-9]{4}[A-Z]`) detection in plain regex and report that recall too, so we can compare Nano alone with regex plus Nano.

D. **Context limit probe.** Concatenate clauses into one input of increasing length (about 250, 500, 1000, 2000, 4000 words). Record the length at which the call fails, truncates or degrades, and the error text.

E. **Latency.** Cold start (first call after browser launch, including model load), warm p50 and p95 per call for tests A and B. Note whether the page stays responsive.

F. **Fallback behavior.** Switch the mode to `PREFER_ON_DEVICE` and run a few calls with the model unavailable (for example, with the flag disabled or before the download completes). Record what happens: does it fall back to cloud, throw, or hang? Record the error messages.

G. **Cloud cross-check (only if quota exists).** Run the same clause set through `ONLY_IN_CLOUD` for tests A and B. Report the agreement rate between Nano and cloud, and where they disagree. This number decides whether the "disagreement flag" feature is usable.

## Step 4: Report (target 25 min)

Write `RISK-KILL-REPORT.md` in the project folder with: Chrome version, macOS version, SDK version, exact flags used, a results table for A to G, 5 example failures verbatim (input and output), and a GO / CONDITIONAL / NO-GO verdict using these thresholds:

- **GO (Nano does per-clause classification and extraction):** JSON validity at least 90%, label accuracy at least 75%, extraction exact-match at least 70% on deposit, lock-in and notice, warm p95 under 6 seconds per call.
- **CONDITIONAL (rules-first, Nano as tiebreaker and name finder):** any threshold missed by a small margin. List which ones.
- **NO-GO for Nano on-device extraction:** JSON validity under 70%, or warm p95 over 15 seconds, or the model fails to load reliably. Then the plan is deterministic rules for fields, Nano only for names and short summaries, and a recorded demo on whichever machine works.

End the report with the three most surprising findings and one recommended change to the architecture, if any.

## Do not

- Do not commit to git or push anything. Do not create a public repo yet.
- Do not spend money or enable billing.
- Do not tune prompts for more than 15 minutes in total; record the first-pass numbers and one improved pass.
