# Eleven Months audit (Nov 17 2026)

Scope: the deployed app (`app/`), the rules module (`rules/`), the measurement harness (`harness/`), and submission readiness. Offline checks only; the live app was not changed or redeployed. Each finding says how it was checked, so the numbers can be reproduced.

Ranking: P0 = privacy leak in what ships, P1 = breaks on plausible input, P2 = cost/quality, P3 = data, P4 = submission, P5 = still open for you.

## Status after fixes (same day, not yet deployed)

Fixed in code (`app/src/mask.ts`, `split.ts`, `main.ts`), with 15 new unit tests that failed before the fix (10 of 15 failed) and pass now; the 28 `rules/` tests still pass; type-check and build are clean:

- **P0.1 names fail open:** names are now also masked by honorific (`Mr/Mrs/Ms/Smt/Sri/Shri/Dr...`) and by "son of / S/o / D/o / W/o" patterns, case-insensitively, even when Nano finds none. If the on-device names check throws, the clause is **not sent to cloud** (fails closed) and the card says why.
- **P0.2 and P0.3:** any 12-digit run (spaces, dashes, wrong checksum) is masked as Aadhaar; PAN in any case; Indian mobile and landline numbers; emails.
- **P1 splitter:** `3.1 Rent` style numbering splits (messy C went from 2 to 6 clauses); short numbered lines are kept (4 of 4, was 0 of 4); a 9,000-word paragraph becomes 60 clauses of at most 195 words (was one clause of 11,700 words); headings without digits are still dropped.
- **False-positive check:** `mask()` changed 0 of 68 ordinary lease clauses (dev, both held-out sets), so amounts, dates and months are untouched.

Still open: the no-Chrome fallback, the 90% progress state, clause numbering that counts the intro, P2 (cloud rate), P3, P4, P5. Known residual in masking: a bare first name with no honorific and no Nano match (for example "Ravi signed") is not caught.

The sections below describe the findings as originally measured.

## P0: privacy leaks in the shipped app

The UI promises "names and ID numbers masked" before anything goes to cloud. Test of `mask()` (`app/src/mask.ts`) with the Nano names list empty:

| Input | Result |
|---|---|
| `Mr. Ravi Kumar Reddy, the Lessor...` with names `[]` | **leaks** the name |
| Aadhaar `1821-7365-9017` (dashes) | **leaks** |
| Aadhaar with one wrong digit (fails checksum) | **leaks** |
| PAN in lowercase | **leaks** |
| Phone numbers `9876501234`, `+91 98765 01234` | **leak** |
| Email address | **leaks** |
| Name in a different case than Nano returned (`RAVI KUMAR REDDY`) | **leaks** |
| Aadhaar `1821 7365 9017` (valid, spaces) and PAN uppercase | masked |

Causes and fixes:

1. **Names fail open.** `app/src/main.ts` calls `nanoNames(text).catch(() => [])`, so a failed or empty Nano names call sends the text unmasked. Fix: if names fail, regex-mask honorific plus capitalised words (`Mr|Ms|Mrs|Smt|Sri|Shri|Dr`) and make matching case-insensitive; or block the cloud send for that clause and mark it "check".
2. **Aadhaar masking is precision-first.** `mask.test.ts` even asserts that a checksum-failing 12-digit number passes through. For redaction, recall matters more: mask any `\d{4}[ -]?\d{4}[ -]?\d{4}` run (and update that test). Detection for the UI can stay strict.
3. **Gaps in coverage:** PAN case-insensitivity, phone numbers, emails, dashes in Aadhaar.
4. **The public sample's Aadhaar was in the issuable range. FIXED (Nov 18).** The sample and the test data used checksum-valid numbers starting with 2 to 9, the range UIDAI issues from (as far as I know, issued numbers do not start with 0 or 1; not verified against UIDAI), so one could belong to a real person. Every such number in the project (app sample, tests, harness data and saved results) was replaced with a checksum-valid number starting with 1, and deliberately invalid test numbers stay invalid. The detectors now accept a leading 1. The PAN `ABCPM1234K` is a pattern-valid fake and a smaller risk, left as is.

## P1: breaks on plausible input

Splitter (`app/src/split.ts`), run on the sample and the four messy documents:

| Input | Result |
|---|---|
| Sample (numbered, blank lines) | 9 clauses, longest 45 words |
| Messy A (numbered `1.`) | 6 clauses |
| Messy B (key : value schedule) | 2 clauses (lines merged) |
| Messy C (`3.1 Rent:` numbering) | 2 clauses, one of 89 words: `3.1` is not recognised because the pattern needs a trailing `.` or `)` |
| Same documents flattened to one paragraph | 1 clause each |
| `1. Rent: Rs. 18,000.\n2. Deposit: Rs. 54,000.\n3. Notice: 30 days.\n4. Term: 11 months.` | **0 clauses**: each line is under the 25-character minimum, so the whole lease is dropped and the user sees "No clauses found" |
| One 9,000-word paragraph | 1 clause of 11,700 words, over Nano's measured limit (about 6,200 to 8,000 words), so it fails with `QuotaExceededError` and the whole lease goes to cloud |

Fixes: accept `\d+(\.\d+)*` numbering without a trailing dot, drop the 25-character floor (merge short lines into the previous clause), split long paragraphs on sentences above about 250 words, and cap clause length.

Other robustness gaps:
- On any browser without `LanguageModel` (Safari, Firefox, mobile Chrome) the app just stops with an error. A judge opening the link on a phone sees nothing useful. Add an opt-in "rules + masked cloud" mode; the SDK's `PREFER_ON_DEVICE` already falls back.
- The progress callback stalls at 90% (measured), so the UI will sit at "90%" during the 4 GB download. Add a "verifying model" state after 90%.
- Clause numbering counts the intro paragraph as C01, so numbers shown do not match the lease's own numbering.

## P2: cloud rate and quality

Saved dev-set outputs, replayed offline (`pipeline.ts` logic, corrected gold):

| Variant | Clauses to cloud | Cloud calls | Labels right | All fields right |
|---|---|---|---|---|
| Current (any rules/Nano field mismatch triggers cloud) | 11/40 | 22 | 38/40 | 40/40 |
| Ignore "rules found nothing, Nano invented a number" (drop that Nano value) | 5/40 | 10 | 37/40 | 40/40 |

Why clauses go to cloud now (dev set): Nano invented `notice_days` in 6 clauses and `lock_in` in 3, 2 had an unusable label, and the rest are one-offs. So the trigger is mostly Nano hallucinating numbers the rules correctly left null. Dropping those cuts cloud calls by 55% at the cost of one label (clause 13). Live sample runs sent 4, 2, 4 and 5 of 9 clauses (22 to 55%), so the rate varies run to run.

Further levers:
- Each cloud-bound clause costs 2 cloud calls plus an extra Nano names call. A single merged classify-and-extract prompt would halve cloud calls. Not tested.
- The variance is not tunable through the SDK: `LanguageModelCreateOptions` in `@firebase/ai` accepts `expectedInputs`, `expectedOutputs` and `initialPrompts` only, with no `temperature` or `topK`, and the cloud docs mark `temperature`/`topK` deprecated for Gemini 3.x. So run-to-run variance is not something I can fix from the SDK.
- Both clauses that contained ID numbers got an unusable Nano label. I could not log Nano's raw output without a live run. If personal data triggers refusals, masking before Nano would also cut cloud calls. **Unverified.**

## P3: data

- Every dataset (dev, two held-out sets, four messy documents) was written by the same author who tuned the prompts and rules. Held-out first-run results are the honest figures (28 clauses; 7/9 deposits, 3/4 lock-ins, 5/6 notices, 4/4 escalations), but they are small.
- Nano and cloud were never run on the held-out or messy documents, so there are no end-to-end label or cloud-rate numbers beyond the dev set. A single browser run over held-out plus messy documents would give an honest cloud rate and label accuracy.
- **Your call:** whether a public blank template (for example the Model Tenancy Act 2021 schedule, which has no personal data) counts as "synthetic" under your rule. I did not use any.
- Minor: `harness/data/pii.json` item 15 uses the same Aadhaar number twice; `harness/results/F2.json` was overwritten by a later run (documented in the report).

## P4: submission readiness

- **Devpost rules not verified.** Search returned only third-party listings, not the official page. They say: online hackathon from Google, run on Devpost; build an app using Firebase AI Logic hybrid inference; submissions close 30 Nov 2026; judges reportedly score technical implementation (use of hybrid inference), design, impact and idea quality, with a complete coherent product rather than a proof of concept; full rules were said to go live 9 Nov 2026. Video length, a public repo requirement, and weightings are **unknown**. Open the official Devpost page and check them yourself, or share the link and I will read it. Source: [startupgrantsindia listing](https://www.startupgrantsindia.com/firebase-buildhybridai-2026).
- **No git repo yet.** Before the first commit: add a root `.gitignore`; delete `.playwright-mcp/` at the root (tool logs and snapshots); add a root `README.md` for judges (requirements: desktop Chrome 139+, about 4 GB first download; how to run; architecture; what is measured). A scan of the tree for `AIza`, reCAPTCHA keys, `vck_` and debug-token UUIDs (excluding `node_modules`, `dist`, `.env.local`) found nothing; the config lives only in the git-ignored `app/.env.local`.
- **Draft claims to fix** in `SUBMISSION-DRAFT.md` (fixed in this pass): the demo script said the network tab stays empty (false: the intro clause and others go to cloud, masked); the "11/40 to cloud" figure now sits next to the live sample range (22 to 55%).
- **Public site risks:** anyone can run cloud calls against your free Gemini quota. App Check is the only guard; there is no rate limiting, no usage alert, and no consent prompt before the first cloud send. The UI text says clauses may go to the cloud, but there is no explicit opt-in.

## P5: still open for you

- Delete the `app-m1` App Check debug token (Security > App Check > Apps > ⋮ > Manage debug tokens).
- Delete the unused Classic reCAPTCHA key under "My First Project"; its secret key was shown in a screenshot in this session's record.
- Record the demo video and submit on Devpost (I will not submit anything).
- Decide the public-template question (P3). (The sample Aadhaar question is fixed, see P0.4.)

## Suggested order

1. Fix P0 (masking: names fallback, looser Aadhaar, PAN case, phone, email, new sample number) with failing tests first.
2. Fix P1 splitter and the 90% state; add the no-Chrome message or fallback mode.
3. Apply the "ignore Nano-invented numbers" variant and run one live pass over held-out plus messy documents for honest cloud-rate numbers.
4. Check the official Devpost rules; write the root README; clean the repo; commit.
5. Redeploy once, after your OK.

## Not verified in this audit

Nano's raw output on ID-bearing clauses; the merged-prompt saving; behaviour on Safari, Firefox and mobile; accessibility with a screen reader; the sample number's real-world status; any official Devpost requirement.
