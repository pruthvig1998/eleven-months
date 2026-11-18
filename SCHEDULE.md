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
