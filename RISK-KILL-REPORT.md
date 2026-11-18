# Eleven Months: Gemini Nano risk-kill report

Run date: 2026-11-17. Harness: `harness/` (Vite + vanilla TS). Raw results: `harness/results/*.json`. Data: `harness/data/clauses.json` (40 clauses), `harness/data/pii.json` (15 snippets). All synthetic.

## Verdict: GO (thin margin, with caveats)

On the improved prompt (v2) every GO threshold is met. The first-pass prompt (v1) missed two of them, so the result depends on prompt wording and is based on one 40-clause set that I also tuned the prompt on. Treat the numbers as a lower-trust "yes, worth building on". Do not read them as production accuracy.

| GO threshold | Required | v1 first pass | v2 improved pass | Met (v2) |
|---|---|---|---|---|
| JSON validity | >= 90% | A 85.0%, B 97.5% | A 95.0%, B 100% | yes |
| Label accuracy | >= 75% | 67.5% | 85.0% | yes |
| Extraction exact match (deposit / lock-in / notice) | >= 70% | 85.7 / 100 / 100% | 85.7 / 100 / 75.0% | yes |
| Warm p95 per call | < 6 s | 1.85 s (A), 2.31 s (B) | 1.78 s (A), 2.61 s (B) | yes |

Weak spots even in v2: risky-class recall is only 75% (5 of 20 risky clauses called ok), and notice extraction has a 15.6% false-positive rate. See "Recommended change".

## Environment

- Chrome 157.0.8103.79 (Claude in Chrome extension reports the UA as 157.0.0.0), desktop, M1 MacBook Pro.
- macOS 15.6.1 (24G90).
- Firebase JS SDK `firebase` 13.4.0 (`firebase/ai`; directive minimum 12.5.0). Vite 8.3.8.
- Flags used: none. No `enabled_labs_experiments` in Chrome's `Local State`; `await LanguageModel.availability()` returned `available` with the model already on disk (about 4 GB, component `nano_v3_gpu_component` 2025.8.8.1141). The docs name `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` (Enabled) as the flag for Chrome 139+. It was not needed on this Chrome. I did not check `chrome://on-device-internals` (not reachable from the automation tab).
- Browser was driven via the Claude in Chrome extension, not Obscura (Obscura is not Chrome and cannot run Nano).
- Cloud config: none. Placeholder Firebase config used, no App Check, no secrets, no git commits.

## Differences from the directive's assumptions

(Update: the `ONLY_ON_DEVICE` fallback behaviour I first saw was a simulation artifact; real behaviour is in F2.)

- Source of an answer is exposed: `result.response.inferenceSource` returns `"on_device"` or `"in_cloud"`. All 480 A/B calls reported `on_device`.
- Docs: default cloud fallback model is `gemini-3.5-flash-lite`; on-device request limit is 9216 tokens; on-device supports structured output, no tools, no multi-turn.
- Observed: the `generationConfig.responseSchema` structured output did not constrain Nano output in this SDK/Chrome (see surprises). I kept plain-text JSON parsing.

## Results

### A. Per-clause classification (40 clauses x 3 reps for latency, first rep scored)

| Pass | JSON valid | Accuracy | Risky recall | Risky precision | TP / FP / FN |
|---|---|---|---|---|---|
| v1 plain prompt | 85.0% | 67.5% | 80.0% | 72.7% | 16 / 6 / 4 |
| v1s v1 prompt + schema | 77.5% | 52.5% | 80.0% | 64.0% | 16 / 9 / 4 |
| v2s improved prompt + schema | 95.0% | 85.0% | 75.0% | 93.8% | 15 / 1 / 5 |

### B. Field extraction (exact match counted only where the field exists; FP = non-null where gold is null)

| Pass | JSON valid | deposit | lock-in | notice | escalation |
|---|---|---|---|---|---|
| v1 | 97.5% | 6/7 = 85.7% | 5/5 = 100% | 8/8 = 100% | 5/6 = 83.3% |
| v1s | 100% | 7/7 = 100% | 5/5 = 100% | 6/8 = 75.0% | 5/6 = 83.3% |
| v2s | 100% | 6/7 = 85.7% | 5/5 = 100% | 6/8 = 75.0% | 6/6 = 100% |

False-positive rate (gold null) for v2s: deposit 0%, lock-in 8.6% (3/35), notice 15.6% (5/32), escalation 0%. Few existing-field cases per field (5 to 8), so one miss moves a rate by 12 to 20 points.

### C. Names and ID patterns (15 snippets, 16 gold names)

| Method | Recall | False positives | JSON valid | p50 / p95 |
|---|---|---|---|---|
| Nano names, prompt v1 | 100% (16/16) | 3 of 19 predicted | 100% | 0.92 s / 3.84 s |
| Nano names, prompt v2 | 100% (16/16) | 1 of 17 predicted | 100% | 1.05 s / 1.85 s |
| Aadhaar regex + Verhoeff | 100% | 0 | n/a | n/a |
| PAN regex `[A-Z]{5}[0-9]{4}[A-Z]` | 100% | 0 | n/a | n/a |

Caveat: Aadhaar numbers in my data were generated Verhoeff-valid, so regex recall of 100% is by construction. Real-world typos would be missed by the checksum filter.

### D. Context limit probe (needle "ZX-4417" at the start; ask for it back)

| Words | Prompt chars | Latency | Result |
|---|---|---|---|
| 276 | 1,790 | 2.4 s | needle found |
| 522 | 3,229 | 2.6 s | found |
| 1,022 | 6,125 | 3.9 s | found |
| 2,001 | 11,819 | 6.6 s | found |
| 4,006 | 23,501 | 10.6 s | found |
| 6,175 | 36,108 | 16.6 s | found |
| 8,008 | 46,769 | 69 ms | `QuotaExceededError: The input is too large.` |
| 10,015 / 14,010 | 58,427 / 81,688 | under 50 ms | same error |

Hard limit sits between about 6,200 and 8,000 words (matches the 9216-token cap). No silent truncation seen before the hard error. Latency grows roughly linearly with input. Whole-document calls are slow: about 10 s at 4,000 words. Per-clause calls are the right shape. (The estimated clause count in the answers was not accurate: 11, 25, 40, 18, 11, 12 for inputs of increasing length.)

### E. Latency (ms, 120 calls per column, 3 reps)

| Pass | A p50 | A p95 | B p50 | B p95 |
|---|---|---|---|---|
| v1 | 1,139 | 1,850 | 1,788 | 2,307 |
| v1s | 1,138 | 1,836 | 1,719 | 2,216 |
| v2s | 1,284 | 1,783 | 1,924 | 2,612 |

Cold start: first-ever call in the session took 35.8 s (model load into memory). After a fresh page load with the browser process still warm, the first call took 6.1 s, and `initializeDeviceModel()` returned in 7 to 55 ms (model already downloaded). Cold start after a true browser relaunch (added later, separate profile, model already on disk, two relaunches): first call 20.1 s and 13.2 s; the second call took 6.8 s in one run and 0.24 s in the other. So a user opening the page after restarting Chrome waits about 13 to 20 s for the first answer, and the second call can still be slow. The app should show a "loading on-device model" state. Two samples only.

Page responsiveness: **not verified.** My main-thread-gap probe reads about 60 s in every pass. That is an artifact of the automation tab being throttled in the background, not a real freeze. No visual check of UI jank was done.

### F. Fallback behaviour (simulated unavailability: `LanguageModel` global set to `undefined` before creating the model)

| Case | Outcome |
|---|---|
| `PREFER_ON_DEVICE`, model available | on_device, 225 ms, "Pong" |
| `PREFER_ON_DEVICE`, model "unavailable" | fell back to cloud in 1.17 s; failed only because my placeholder key is invalid: `FirebaseError: AI: Error fetching from https://firebasevertexai.googleapis.com/v1beta/projects/placeholder/models/gemini-3.5-flash-lite:generateContent: [400 ] API key not valid ... (AI/fetch-error)` |
| `ONLY_ON_DEVICE`, model "unavailable" | **also went to the cloud endpoint** (0.78 s, same error), where the docs say it should throw |

**The simulated rows above are superseded by the real-unavailable run below. The `ONLY_ON_DEVICE`-goes-to-cloud result was an artifact of removing the global.**

#### F2. Real unavailable state (re-run)

I did not toggle the flag in your Chrome (that needs a relaunch of your real browser). Instead I used a separate Chrome 157 instance with a fresh profile (Playwright), where `await LanguageModel.availability()` returns `"unavailable"`. No simulation.

| Case | Outcome |
|---|---|
| `PREFER_ON_DEVICE` generateContent | falls back to cloud in 0.45 s; failed only on my placeholder key: `FirebaseError: AI: Error fetching from https://firebasevertexai.googleapis.com/v1beta/projects/placeholder/models/gemini-3.5-flash-lite:generateContent: [400 ] API key not valid ... (AI/fetch-error)` |
| `ONLY_ON_DEVICE` generateContent | throws at once (0.3 ms): `FirebaseError: AI: Local LanguageModel API not available in this environment. (AI/api-not-enabled)` |
| `PREFER_IN_CLOUD` generateContent | cloud call in 0.79 s, same placeholder-key error |
| `ONLY_ON_DEVICE` `initializeDeviceModel()` | throws at once (0.5 ms): same `AI/api-not-enabled` |

No hangs. Behaviour matches the docs: prefer-modes fall back to cloud, only-on-device throws. The throw is fast and catchable, so the app can route to cloud. Not tested: the state with the model present but the flag explicitly set to Disabled (the fresh-profile "unavailable" state may differ in cause).

#### F3. Mid-download state (Nov 17, separate Chrome 157 profile, model not yet on disk)

A fresh profile (`LanguageModel.availability()` = `downloadable`) was used, so your own Chrome was untouched. `initializeDeviceModel()` was started, then calls were made while the download ran.

| Case | Outcome |
|---|---|
| `availability()` 4 s after start | `downloading`, 2.6% progress |
| `PREFER_ON_DEVICE` during download | did not wait: went straight to cloud (2.3 s). The cloud call returned `[401 ] Firebase App Check token is invalid. (AI/fetch-error)` only because this fresh profile's debug token was not registered. It also shows App Check enforcement is active. |
| `ONLY_ON_DEVICE` during download | did not throw: still pending after 20 s while progress went from 2.6% to 22.1%, as the docs say ("waits for the download") |
| Download total | about 4.1 GB on disk; `available` after a few minutes. The progress callback stopped at 90% before the model became available. |
| First call right after the download, same session | 0.70 s, `on_device` |

So the app must show download progress and must not rely on `ONLY_ON_DEVICE` returning quickly on first use; `PREFER_ON_DEVICE` falls back to cloud immediately.

### G. Cloud cross-check

Run on 2026-11-17 against Firebase project `eleven-months-nano` (Spark plan, Gemini Developer API, App Check debug token registered). `ONLY_IN_CLOUD`, default model `gemini-3.5-flash-lite`, same v2 prompts and schemas as the Nano v2s pass, 40 clauses x 2 calls. All 80 calls returned `in_cloud` with no errors, so App Check with the debug token works. Cloud was compared against the first-repetition Nano v2s outputs.

| Measure | Cloud | Nano v2s |
|---|---|---|
| A: JSON valid | 100% | 95.0% |
| A: label accuracy | 100% (40/40) | 85.0% |
| A: risky recall / precision | 100% / 100% | 75.0% / 93.8% |
| B: JSON valid | 100% | 100% |
| B: exact match deposit / lock-in / notice / escalation | 7/7, 5/5, 6/8, 6/6 | 6/7, 5/5, 6/8, 6/6 |
| B: false positives (gold null) | 0 of 134 | 8 of 134 field slots |

**Nano vs cloud agreement:**
- **Label agreement:** 85% (34 of 40). The 6 disagreements are clauses 13, 17, 22, 34, 35, 37. In all 6 the cloud was right and Nano was wrong.
- **Field agreement:** 92.5% (148 of 160 field slots). Of the 12 disagreements, the cloud matched the gold value in 10 and Nano in 1.
- **Disagreement flag:** it caught all 6 Nano label errors, and it never fired when Nano was right (0 false flags). On this set the flag is usable: "Nano and cloud disagree" correctly marked every wrong Nano label.

Caveats: 40 clauses, one run, and the cloud used the same prompt wording I tuned against this set, so 100% cloud accuracy partly reflects that my gold labels and the prompt rules came from the same author. Real leases will be messier. Cloud also missed 2 of 8 notice values, so notice is hard for both models (some of my gold values are two-sided and arguable). The cloud calls were slow in this run (the first took about 10 s), so cloud latency was not benchmarked.

## Five failures, verbatim

1. Test A, id 17 (gold: risky). Input: "The Lessee shall give two months' written notice before vacating, whereas the Lessor shall be entitled to ask the Lessee to vacate on three days' notice if the Lessor requires the premises for any purpose." Output: `` ```json\n{"label":"ok|risky","risk_type":"notice"}\n``` `` (echoed the template, no label).
2. Test A, id 34 (gold: risky). Input: "The monthly rent shall be Rs. 22,000 for the first year. For the renewal period, the Lessor may revise the rent at his discretion by up to fifteen percent, and the Lessee shall pay the revised rent from the first day of the renewed term." Output: `''` (empty string).
3. Test B, id 23, deposit (gold 180000). Input: "The Lessee has paid a security deposit equal to ten months' rent, the monthly rent being Rs. 18,000. The Lessor may forfeit the entire deposit, without assigning any reason, if the Lessee vacates the premises before the Lessor is satisfied with the condition of the flat." Output: `` ```json\n{"deposit": "18000", "lockin_months": null, "notice_days": null, "escalation_pct": null}\n``` `` (no multiplication; also a string, not a number).
4. Test B, id 26, notice_days (gold 90). Input: "The Lessor may terminate this Agreement without notice if, in the opinion of the Lessor, the Lessee has caused nuisance. The Lessee shall give 90 days' notice to terminate." Output: `` ```json\n{"deposit": null, "lockin_months": 90, "notice_days": null, "escalation_pct": null}\n``` `` (90 put in the wrong field).
5. Test B, id 10, false positives (gold lock-in and notice null). Input starts: "The Lessee shall deposit Rs. 2,40,000 as security. Rent is Rs. 20,000 per month. The Lessor may deduct painting, cleaning and any other charges at his sole discretion ..." (shortened here; full text in `harness/data/clauses.json`, id 10). Output: `` ```json\n{"deposit": 240000, "lockin_months": 0, "notice_days": 0, "escalation_pct": null}\n``` `` (zeros instead of null).

## Three most surprising findings

1. Schema-constrained output did not work on-device: `generationConfig.responseSchema` still returned markdown-fenced JSON, even echoing the schema text (`"ok|risky"`). Adding it made the v1 prompt worse (accuracy 67.5% to 52.5%). The big gain came from rewording the prompt (defining "risky", telling it to convert months to rupees), not from the schema.
2. Nano is fast enough: warm calls take 1.1 to 2.6 s p95 on an M1, far under the 6 s limit. The real risk is quality, not speed.
3. Nano missed 25% of risky clauses while almost never crying wolf (precision 94%), and it did name extraction perfectly in this set. (Earlier I listed a fallback oddity here; it was a simulation artifact, see F2.)

## Recommended change

(G update: the cloud cross-check supports the disagreement flag. It caught every Nano label error with no false alarms on this set, so keep "Nano vs cloud disagree" as the "check this clause" signal.)

Run rules first, Nano second: use deterministic regex for numbers (rupee amounts, "N months", notice days, percentages) and Aadhaar/PAN, and let Nano handle the judgment calls (is this clause risky) and name finding. The failures above are all arithmetic, field-mix-up or null-handling errors that rules handle better. Because Nano recall on risky clauses is 75%, send anything the rules flag, plus every clause Nano calls ok but where rules found a number outside normal ranges, to cloud Gemini. Strip code fences before parsing, and treat an empty or template-echo output as "unsure", not "ok".

## Not done / not verified

- Cloud latency (only accuracy and agreement were measured in G).
- Note: `harness/results/F2.json` was overwritten by a later `runF2` run in a Chrome that had Nano available (that run only confirmed a working cloud call). The F2 table in this report comes from the fresh-profile run.
- F with the flag explicitly set to Disabled in a profile that has the model (F2 used a fresh profile instead). Mid-download (F3) and cold start after a relaunch are now measured; cold start has only 2 samples.
- UI responsiveness during inference.
- Single 40-clause set, with the prompt tuned on the same set; the improved-pass numbers are likely optimistic.
