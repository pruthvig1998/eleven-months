# Eleven Months: what it can do now, and the plan to make it better

Written 18 Nov 2026 after reading every source file (about 3,100 lines: `app/` 730, `rules/` 2,150, `harness/` 214), the test suite, the build output and the measurements. Deadline: 30 Nov, 2:00 PM Pacific. Personal target: 27 Nov.

## 1. What the code can do today

| Area | Capability | Where | How well it is proven |
|---|---|---|---|
| Input | Pasted text, text PDF, photo, scanned PDF (12 pages) | `app/src/pdf.ts`, `ocr.ts` | Photo and scan tested on the live site with clean rendered pages only |
| Gatekeeping | Declines non-English and non-rental documents; warns on licence, PG and commercial documents | `rules/doccheck.ts` | 6 tests |
| Splitting | Numbered clauses, paragraphs, long text cut to 250 words | `app/src/split.ts` | 8 tests |
| Numbers | Deposit, lock-in, notice, rent increase, rent, in digits or words, with five risk flags | `rules/extract.ts` | 22 tests; 20 of 20 fields on messy samples |
| Clause rules | 27 topic rules, each with examples the tests enforce | `rules/topics.ts` | Precise (0 false flags on unseen fair clauses) but weak on new wording: 4 of 20 on the third unseen set |
| On-device model | Gemini Nano labels each clause and finds names | `app/src/ai.ts` | 34 of 40 labels, 15 of 20 risky clauses, on the first data set only |
| Routing | Cloud only when Nano fails, rules are unsure, or the two disagree | `rules/pipeline.ts` | 40 of 40 labels with 15 of 40 clauses sent to cloud (13 before the medium-finding trigger), on the first data set only |
| Privacy | Names, Aadhaar, PAN, phones, emails masked before cloud; fails closed if the names check fails | `app/src/mask.ts` | 9 tests, including IDs misread by the photo reader |
| No on-device model | Rules-only scan, or opt-in cloud check of every clause | `app/src/main.ts` | Live: 23 s, 11 of 11 cloud checks |
| Whole agreement | Basics present, contradicting figures, distant court, stamp duty estimate | `rules/lease.ts` | 5 tests |
| Advice | An ask for every finding; printable signing sheet; flat-visit checklist | `rules/asks.ts` | 6 tests |
| Knowledge | 25 notes with source, trust level and what is unverified; 7 guides | `rules/knowledge.ts`, `guides.ts` | 14 tests on structure; 5 legal questions still open |
| Keep and share | Save in browser, message to landlord, missed-clause notes | `app/src/main.ts` | Save and message tested locally |

## 2. Where it is weak (from the scan)

**Accuracy**
1. The whole pipeline (rules + Nano + cloud) has only ever been measured on the first 40 clauses, which were also used to tune the prompts. Its accuracy on the three unseen sets is unknown. This is the biggest unknown in the project.
2. When the model marks a clause risky and no rule matched, the user sees "risk" with no reason and no ask. The model is never asked why.
3. The cloud answer is free text parsed as JSON. No response schema is used, so a malformed answer silently becomes "unknown".

**Speed**
4. Two on-device calls per clause. On a busy laptop the sample took 143 s.

**Hackathon fit**
5. Only App Check is used besides AI Logic. The rules name Remote Config, Firestore and Authentication as the supported products to build with.
6. Photo reading uses Tesseract, a separate local model. The FAQ says all AI inference should go through Firebase AI Logic. It is not an API call to another provider, but a judge could read it as outside the rule.
7. Web only. The grand prize favours more than one platform.
8. The page footer says "Demo only. Use synthetic text, not a real lease", which contradicts what the product is for.

**Code health**
9. No tests for `ai.ts`, `pdf.ts`, `ocr.ts` or the page logic in `main.ts` (265 lines, one long scan function that builds HTML as strings).
10. No automated check on GitHub: tests run only when someone runs them by hand.
11. No Content-Security-Policy header on the hosted site.
12. The build ships about 70 font files, including Cyrillic and Vietnamese sets the page never uses.
13. `rules/pii.ts` (Aadhaar checksum, PAN detection) is used only by a test; the app masks with its own patterns in `app/src/mask.ts`. Two places to keep in step.

**Not yet proven**
14. A real camera photo, a real phone, several users at once, and the scan time on an idle machine.

## 3. The plan

Ordered by what a judge scores: technological implementation (including hybrid inference), design, potential impact, quality of the idea. Each step says what "done" means.

### Stage A: know the real accuracy (Nov 19, half a day)
- A1. Run all three unseen sets through the live pipeline in desktop Chrome (rules + Nano + cloud) and record caught, missed and false flags. Done: one table in `SCHEDULE.md`.
- A2. Run the same sets through the cloud-only phone mode. Done: second column in that table.
- Why first: every later choice depends on whether the model covers what the rules miss. If it catches most of the 16 that the rules missed, the product claim holds. If not, B1 becomes urgent.

### Stage B: make the model explain itself (Nov 19 to 20)
- B1. Ask the model for a label, a one-line reason and a topic in one answer, on device and in cloud. Show the reason on the clause, marked "model's view, not a fixed rule", and map the topic to an existing ask. Done: a clause the rules miss shows why it is risky and what to ask for.
- B2. Use a response schema for the cloud call so the answer always parses. Done: no "unknown" labels from malformed cloud answers in the replay.
- B3. Merge the label and numbers prompts into one on-device call where the rules already have the numbers. Re-run the first data set and the unseen sets before and after. Done: accuracy not lower, scan time measured on an idle machine.

### Stage C: fit the hackathon better (Nov 20 to 21)
- C1. Remote Config for the prompts, the thresholds (deposit 3 months, rise 10%, notice 15 days) and the cloud model name. Done: a threshold changed in the console changes the next scan with no deploy.
- C2. Read photos with the model through Firebase AI Logic (image input: on device where Chrome supports it, cloud otherwise), keeping Tesseract only as the offline fallback. Done: a photo scan with all inference through AI Logic, and the README says which path ran. Needs a check that image input is available on the free tier.
- C3. Fix the footer and the "synthetic text only" label so they say what is true: a screening aid, your text stays on the device unless a clause needs the cloud.
- C4. Decide on a second platform. A Chrome extension that scans the agreement open in the current tab reuses all of this code and counts under Web/Chrome, but it is not a second platform. Android would be one, and is at least three days with no test device confirmed. Recommendation: do not start Android; say so in the submission.

### Stage D: design and reach (Nov 21 to 23)
- D1. Phone pass on a real phone: tap sizes, the long clause cards, the printable sheet, the photo upload from the camera. Done: screenshots from the phone in `docs/`.
- D2. Accessibility pass: keyboard order, focus rings, contrast of the grey text, labels on every control, reduced-motion. Done: no failures in Chrome's Lighthouse accessibility audit.
- D3. First-run experience: one clear line above the box saying what happens to the text, and a visible estimate while the model downloads.
- D4. Telugu and Hindi: have the cloud model translate to English, scan that, and show the original beside it, clearly marked as a translation. Opt-in, because the whole text leaves the device after masking. Done: a Telugu sample scans end to end. Do this only if Stage A to C finish on time.

### Stage E: code health (Nov 23 to 24)
- E1. GitHub Action that runs the tests and the build on every push. Done: a green tick on the repository.
- E2. Split the scan function in `main.ts` into a pure "scan one clause" function and a renderer, and test the first. Done: the routing in rules-only, cloud-only and full modes has tests.
- E3. Content-Security-Policy header in `firebase.json`. Done: the live site still works with the header on, including the photo reader and Firebase.
- E4. Ship only the Latin font files. Done: font files in the build drop from about 70 to about 14.
- E5. One place for ID detection: have `mask.ts` use `rules/pii.ts`, or delete `pii.ts`.

### Stage F: submission (Nov 24 to 27)
- F1. Re-record the video from the final UI, keep it under 3 minutes, show on-device and cloud both working, upload it public to YouTube with the music credit.
- F2. Devpost text: how Firebase AI Logic is used, features, value, what was built in the period, known limits.
- F3. Final check of the repository against `HACKATHON-RULES.md`: licence visible, no secrets, run steps work on a fresh clone.
- F4. Submit on Nov 27. Nov 28 to 30 is buffer.

## 4. What I would not do before the deadline
- Other states' local law. Each one needs the same official-source work Telangana did.
- Accounts, a server database of agreements, or anything that stores a user's text off the device.
- Handwriting.
- More fixed rules as the main way to raise accuracy. The third unseen set showed that this does not carry over to new wording.

## 5. Needs your decision
1. C2: is replacing Tesseract with model-based photo reading worth two days, or do we keep it and explain it in the submission?
2. C4: agree to stay web only?
3. D4: Telugu and Hindi by translation, yes or no?
4. C3: may the page stop saying "use synthetic text only"? The hackathon rules ask that no personal data sits in the repository or the submission; they do not forbid users pasting their own agreement. Your own earlier constraint was synthetic data only for testing.
