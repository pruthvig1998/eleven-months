# Eleven Months: build schedule to Nov 27 2026

Source of the phases: `GAP-REPORT.md`. Each phase starts as soon as the one before it passes its tests. Deploys are separate and need your yes each time.

| When | Phase | What | Done means |
|---|---|---|---|
| Nov 18 | 1 | Rules for the missed clause types; blank-cheque fix; honest rules-only verdict; second unseen set | Probe at 26 of 30 or better with 0 false flags; first-run number on a new set recorded |
| Nov 18 | 2 | Read photos and scanned PDFs on the device; document type and language check | A photo of the sample lease scans; a non-English or non-rental document gets a clear message |
| Nov 18 | 3 | Whole-agreement checks: basics present, contradictions, court city, registration cost estimate | Each check has a test |
| Nov 18 | 4 | Knowledge: try to close the open questions from official pages | Each question closed with a source, or still listed as unverified |
| Nov 18 | 5 | Save a scan on the device, message to landlord, report a missed clause (stays on device) | Works with no server |
| Nov 19 | Review | You try it on desktop Chrome and on a phone; deploy on your yes | Live site matches local build |
| Nov 20 to 22 | Fixes | Whatever the review finds; retake video screens if the UI changed | No open P0 or P1 |
| Nov 23 to 25 | Submission | Devpost text, demo recording, check the official rules page | Draft complete |
| Nov 26 | Buffer | | |
| Nov 27 | Submit | Personal target (official deadline Nov 30, 2:00 PM PT) | Submitted |

## Status at end of Nov 18

Nothing from these phases is deployed. 154 tests pass; type-check and build are clean.

| Phase | State | Evidence |
|---|---|---|
| 1 | Done | Honest number: second unseen set, first run, 12 of 20 harmful clauses caught and 1 of 10 fair clauses wrongly flagged. After widening the rules both sets pass (28 of 30 and 20 of 20, 0 false flags), but those sets are now seen, so the next unseen set will score lower. A review then found 4 fair clauses wrongly flagged as high (wear and tear exceptions, tenant removing own belongings, deposit paid by cheque) and one old bug ("keep the premises clean" tagged as a penalty); all fixed and added as tests. |
| 2 | Done, partly tested | Tested in a browser: a photo (JPEG) and a scanned PDF with no text layer were both read on the device and scanned. Both were clean rendered pages, not camera photos. Hindi in English letters is declined. Not tested: a real camera photo, handwriting, a phone. |
| 3 | Done | Basics, contradictions, court city, stamp duty estimate: 5 tests, and seen in the browser. On the sample lease it reports 2 real gaps (no flat address, no stated term). |
| 4 | Not closed | 0 of 5 open questions closed from an official page. Legal aid ceiling narrowed (Rs 3 lakh appears to be Andhra Pradesh) but the NALSA pages would not open. Stamp duty 0.4%: more secondary sources agree, still no official page. Police verification: no statute named anywhere. |
| 5 | Done | Save in browser and message to landlord tested in the browser. Missed-clause notes built, not clicked through. |

Checked after the changes:
- Sample lease in desktop Chrome with the on-device model: runs; 8 points to raise, as before. It showed 5 risky, not 6, because cloud calls are refused on localhost (App Check allows only the live site), leaving clause 7 unresolved. Rules alone still mark 6. The live result can only be confirmed after a deploy.
- IDs misread by the photo reader (O for 0, l for 1) are now masked before anything goes to cloud; test added.

Not done:
- Phone layout pass, and Upload on the live site.
- Hosting the text-reader files with the app: they load from the library's CDN on first use (the image itself never leaves the device).
- The video's screens predate these changes (new button label, new sections).

## Third unseen set (Nov 18, after the widening)

`rules/probe-realworld3.ts`, first run, rules unchanged: **4 of 20** harmful clauses caught, **0 of 10** fair clauses wrongly flagged.

What this means: the fixed rules recognise the wordings they were written against (sets 1 and 2 now pass) but not fresh paraphrases of the same problems ("put his own padlock on the door", "ended by the owner at his pleasure", "repaid six months after the keys are returned"). Adding more patterns raises the score on the set in hand and not much on the next one. The rules are reliable for numbers (deposit, notice, lock-in, rent rise) and precise when they fire; catching paraphrased clauses is the model's job. So the rules-only mode (phones, Safari, Firefox) will miss most unusual harmful clauses, and its verdict text says so. The rules were not tuned against this set.

## Why the live scan took about 2 minutes (measured Nov 18, live site, desktop Chrome)

Timed with the sample agreement, 11 clauses, 143 s in total:

| Part | Time |
|---|---|
| Clause 1 (model loads into memory, no network) | 18.7 s |
| Clause 2 (three on-device calls, the first names call, two cloud calls) | 50 s |
| Clauses 3 to 11 | about 4.5 s each once warm, more when a cloud call is needed |
| Each cloud call | 2.8 to 7.1 s |

Two causes. First, the cold start: the model loads on the first clause. Second, the machine: its load average was 10 to 13 during the test (other programs), and earlier idle measurements were about 2 s per on-device call. Each clause makes two on-device calls, so about 50 s for 11 clauses is the floor on this design.

Change made (not deployed): when the model is already downloaded, the page loads it in the background as soon as it opens, so the first clause does not wait. It never starts a download. Not yet timed on an idle machine.

Not changed: the two on-device calls per clause. Skipping the numbers call for clauses with no figures would save time but changes the routing that the accuracy numbers were measured on.

## Other results from Nov 18 (second pass)

- Photo and scanned-PDF upload on the live site: both read in about 3.5 s and scanned correctly (clean rendered pages, not camera photos).
- Public repository: https://github.com/pruthvig1998/eleven-months (Apache-2.0).
- Official hackathon rules read: see `HACKATHON-RULES.md`.

### After deploying the background model load (Nov 18)

One timed run on the live site: clause 1 took 33 s, clause 2 took 59 s, clause 3 took 36 s. No improvement, and slower than the run before the change. The machine was still under load from other programs, so this run does not show whether the change helps. It does show the cold start is not the whole cause. To settle it: time the scan on an idle machine, and if it is still slow, cut the on-device calls per clause from two to one.

## Cloud check for browsers with no on-device model (Nov 18, live site, phone-width desktop browser)

| Version | Time for the sample (11 clauses) | Cloud checks that succeeded |
|---|---|---|
| Two cloud requests per clause, one after the other | 121 s | 11 of 11 |
| Two per clause, sent together | 55 s | 6 of 11 (HTTP 429 from the free tier's rate limit) |
| One request per clause (label only), retry on 429 | **23 s** | 11 of 11, no 429 |

The last version is live. The rate limit is shared by everyone using the site, so several people scanning at once can still get 429; the retry waits and tries again up to three times. Not tested on a real phone.

## Stage A: the whole pipeline on the unseen sets (Nov 18, live site)

Input: `rules/data/unseen.json`, the three unseen sets as one test agreement: 70 harmful clauses and 26 fair ones (built by `rules/build-unseen.ts`). "Caught" means the clause was marked **risk**.

| Mode | Harmful caught | Set 1 | Set 2 | Set 3 | Fair wrongly flagged | Sent to cloud | Time |
|---|---|---|---|---|---|---|---|
| Fixed rules alone (sets 1 and 2 were used to widen the rules) | n/a | 28 of 30 | 20 of 20 | 4 of 20 | 0 of 26 | 0 | instant |
| Desktop Chrome: rules + on-device model + cloud on trigger | **57 of 70** | 24 of 30 | 16 of 20 | 17 of 20 | 2 of 26 | 33 of 97 | 847 s |
| No on-device model: rules + cloud on every clause | **69 of 70** | 29 of 30 | 20 of 20 | 20 of 20 | 0 of 26 | 97 of 97 | 400 s |

What the numbers say:

1. The model covers what the rules miss. On set 3 the rules alone caught 4 of 20; with the on-device model 17; with cloud 20. In the desktop run, 15 harmful clauses were caught by the model with no rule matching.
2. The private path is the less accurate one. The 13 clauses the desktop run missed were all ones the on-device model called "ok" and nothing sent to cloud. For 10 of them a rule had already raised a medium finding (late interest, renewal fee, property tax, society levies, guest and family limits, sub-meter rate), shown as a tag, but a medium finding does not change the label or trigger a cloud check. The other 3 (no male visitors after 8 pm, no beef or pork, nobody but the tenant and spouse) had no rule match at all.
3. Both false flags in the desktop run came from the on-device model alone (a fair deposit clause and a fair repainting clause).
4. The one clause the cloud mode missed is the distant-court clause, which only the whole-agreement check can judge.
5. The cloud mode met the free tier's rate limit 10 times in 97 clauses; every retry succeeded.

Limits: every clause was written by the same author as the rules and the prompts, in clean English. Real agreements will score lower. One run per mode.

What follows for Stage B: send a clause to cloud when the on-device model says "ok" but a rule raised a medium finding (would have caught 10 of the 13), and show "check this clause" for medium findings in every mode. That costs privacy: in this run it would have raised cloud use from 33 to about 43 of 97 clauses.

## Stage B: built Nov 18, not deployed

- A medium rule finding on a clause the on-device model called "ok" now asks the cloud for a second opinion (`ok_but_medium`). Offline replay on the first data set: labels still 40 of 40, cloud use 13 to 15 of 40.
- A medium finding always shows "check this clause".
- A clause marked risky with no fixed rule behind it now shows why, in the model's words, marked as the model's view, and adds a point to the signing sheet. The reason comes from the cloud answer when there is one, otherwise from one extra on-device prompt.
- Cloud answers are held to a JSON schema.
- The on-device numbers prompt is skipped for clauses with no figures (9 of 40 in the first data set).
- Local test in desktop Chrome, 4 clauses: reasons shown for two model-only clauses, the 24% interest clause asked for cloud and showed "check this clause". Cloud calls are refused on localhost, so the schema, the cloud reason and the cloud second opinion are untested until a deploy.
- 156 tests pass.

## Stage B results (Nov 18, live site, same 96 unseen clauses)

| Mode | Harmful caught, before | after Stage B | Fair wrongly flagged, before | after | Sent to cloud, before | after | Time, before | after |
|---|---|---|---|---|---|---|---|---|
| Desktop Chrome: rules + on-device model + cloud on trigger | 57 of 70 | **67 of 70** | 2 of 26 | 1 of 26 | 33 of 97 | 45 of 97 | 847 s | 1,206 s |
| No on-device model: rules + cloud on every clause | 69 of 70 | 68 of 70 | 0 of 26 | 0 of 26 | 97 | 97 | 400 s | 341 s |

Desktop by set after Stage B: 30 of 30, 19 of 20, 18 of 20.

- Still missed on desktop: a per-unit electricity rate (the cloud also called it ok; it does show "check this clause"), a flat Rs. 2,000 late charge, and "male visitors are not allowed after 8 pm". The last two were called ok by the on-device model with no rule matching, so nothing went to cloud.
- The one false flag left is a fair deposit clause the on-device model calls risky; no rule or cloud check contradicts it.
- 17 clauses showed "Why the model flagged this" in each mode. The cloud response schema produced no failed or unparseable answers in about 150 cloud calls.
- Cost of the gain: 12 more clauses left the device (33 to 45 of 97), and the desktop run took 6 minutes longer. About 12 s per clause on this machine, which was under load. The extra time is the extra cloud calls plus one more on-device prompt for each model-only finding.
- The cloud mode lost one clause (the per-unit rate) compared with the earlier run. Its prompt now also asks for a reason; one run each, so this may be chance.
- The desktop summary showed "29 to check". Most of those are clauses already marked risk where the cloud and the on-device model disagreed, which is noise on a clause the user is already told to look at.

Same limit as before: clauses written by the project's author, in clean English, one run per mode.

## Stage C: built Nov 18, not deployed

- **Wording.** The page no longer says "synthetic text only" or "Demo only". The footer now says what happens to the text and shows the thresholds in use and where they came from.
- **Remote Config.** Thresholds (deposit months, rent rise %, notice days), the cloud model name and the switch for the cloud second opinion are read from Firebase Remote Config, range-checked, with built-in defaults. Local test: the fetch returned HTTP 200 and, with no parameters set in the console yet, the page showed "Source: built-in defaults". Changing a value in the console and seeing it take effect has not been tried.
- **Photo reading through Firebase AI Logic.** The on-device model reads the page image (on device only). The plain text recogniser reads it too, and the model's reading is used only when at least 90% of the words match. Local test in desktop Chrome, one clean rendered page: exact text, "a second reader agreed on 100% of the words", 18.6 s (the recogniser alone took 3.5 s). Not tested: a camera photo, a dense page, a multi-page scan.
- 166 tests pass.
- Second platform: not started. Web only.

### Stage C deployed (Nov 18), live checks

- Photo (one clean rendered page) on the live site: read by the on-device model, 100% word agreement with the second reader, exact text, 14.1 s.
- Footer and thresholds note show; source "built-in defaults" (no Remote Config parameters set in the console yet).
- Sample, desktop Chrome: 6 of 11 risky, 8 points to raise, 1 clause to cloud, 202 s.
- Sample, phone width with the cloud check: 6 of 11, 11 of 11 cloud checks, no errors, 76 s. Earlier today this took 23 s. Both runs happened at the same time on the same machine and shared the cloud rate limit, so neither time is clean.
