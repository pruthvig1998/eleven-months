# Eleven Months: Devpost entry and demo script (draft, not submitted)

For #BuildHybridAI 2026. Submissions close **Nov 30 2026, 2:00 PM PT** (3:30 AM IST Dec 1); personal target Nov 27. Nothing here is published. Every number comes from `RISK-KILL-REPORT.md`, `rules/README.md` or `AUDIT.md`. Items marked **[CHECK]** need you before submitting.

## Official rules: not verified

I could not find the official Devpost rules page; search returned only a third-party listing. That listing says: run on Devpost; build an AI app using Firebase AI Logic hybrid inference; judged on technical implementation (including how well it uses hybrid inference), design, potential impact and quality of the idea, with no weightings given; the full rules were due on 9 Nov 2026. **Video length, a public-repo requirement and eligibility details are unknown.** **[CHECK]** Open the Devpost page, read the Rules and Submit tabs, and tell me what they say so I can fit this draft to them.

## Title

Eleven Months

## Tagline (under 60 characters)

Read your rental agreement before you sign it.

## Short description

A rental-agreement checker built for Telangana tenants, starting with Hyderabad-style leases. Rules and Gemini Nano read every clause on your device; only unclear clauses go to cloud Gemini, with names and ID numbers masked first.

## Inspiration

Indian residential leases are usually an 11-month agreement in dense legal English. Tenants sign without noticing a ten-month deposit the landlord can forfeit for any reason, a lock-in that binds only the tenant, a right to enter "at any time without notice", or a clause that lets the landlord cut the water. Pasting a lease into a cloud tool means sending names, addresses and ID numbers off the device.

## What it does

- Splits a pasted lease into clauses and marks each clear or risky.
- Reads the numbers that matter (deposit, lock-in, notice, rent increase) and says which layer produced each: rules, Nano or cloud.
- Applies 16 topic rules and links each finding to a short plain-language note on public rental law, with its status (law, model law, this tool's own threshold, or practical tip), sources and checked date.
- Shows a lease checklist of what the agreement covers and what it never mentions (for example, no deposit refund deadline).
- Has a "Get help" panel with step-by-step guides for seven tenant situations, including being asked for a bribe; every step shows its trust level (government source, act text, commentary, reported online, or common practice) and the tool lists what it could not verify.
- Has a searchable reference panel of 25 notes, offline, no network.
- Suggests what to ask the landlord for on each risky clause, and builds a printable "Take this to the signing" sheet: the points to raise, what the lease omits, and a flat-visit and handover checklist.

## How we built it (hybrid inference)

All model calls go through the **Firebase AI Logic Web SDK** (`firebase/ai`, 13.4.0).

1. **Rules first.** Deterministic extraction of amounts, months, days and percentages, plus topic rules. Fast, free, exact on what it covers.
2. **Gemini Nano on-device** (Chrome's built-in model) judges each clause and finds names. Nothing leaves the browser for this step.
3. **Cloud Gemini (`gemini-3.5-flash-lite`) only on a trigger:** Nano's answer is unusable, the rules are unsure, rules and Nano disagree, or Nano says ok while the rules flag a risk. Before anything is sent, Aadhaar (any 12-digit run, including wrong checksums), PAN, phone numbers, emails and names are masked. If the on-device names check fails, the clause stays on the device.
4. **Firebase App Check** with reCAPTCHA Enterprise (Fraud Defense) protects the cloud calls. The Firebase console shows AI Logic enforced and 101 of 101 requests verified.
5. Hosted on Firebase Hosting (Spark plan, no spend).

## Challenges we ran into (measured, Nov 17 2026, M1 MacBook Pro, Chrome 157)

- Nano alone is not enough. With a tuned prompt it labelled 85% of 40 synthetic clauses correctly but missed 25% of the risky ones, and it got arithmetic wrong ("ten months' rent" read as one month), so numbers come from rules.
- Structured-output settings did not constrain Nano on-device; the gains came from prompt wording.
- Speed is fine, startup is not: warm calls take about 1.8 s (p95) for classification and 2.6 s for extraction, but the first answer after restarting Chrome took 13 to 20 s, and the one-time model download is about 4 GB.
- With the model downloading, `PREFER_ON_DEVICE` falls back to cloud immediately while `ONLY_ON_DEVICE` waits; with the model unavailable, `ONLY_ON_DEVICE` throws at once.
- Rules written from one author's wording miss paraphrases: on 8 differently worded risky clauses the first topic rules caught **0 of 8**. After widening them with shared word lists, a fresh set written beforehand went from 0 to **7 of 8** with no false alarms on 4 ok clauses.
- A self-audit found real privacy leaks in our own masking (names failing open, dashed or mistyped Aadhaar, lowercase PAN, phones, emails) and a splitter that dropped short numbered leases; both were fixed with tests that failed first (`AUDIT.md`).

## Results (all on synthetic data written by the author, so optimistic)

| Measure | Result |
|---|---|
| Rules + Nano, cloud only on a trigger (offline replay, 40 clauses) | 13 sent to cloud; all four fields right on 40/40; labels right on 40/40 (the topic rules were written after seeing two of these clauses, so treat the label figure as optimistic) |
| Live runs on the 9-clause sample | 2 to 5 clauses went to cloud (22 to 55%); the rate varies run to run |
| Nano vs cloud label agreement | 85%; the disagreement signal caught all 6 Nano label errors with no false alarms |
| Nano name finding | 16 of 16 names, 1 false name |
| Topic rules on fresh clauses (first run) | 0 of 8, then 7 of 8 after widening (second set) |

## Accomplishments we're proud of

A hybrid pipeline where the on-device model does most of the work and the cloud is a measured fallback, with the privacy behaviour tested rather than promised; a rule set that can grow safely (each rule ships examples that a test enforces, plus a gap-finder tool); and honest numbers, including the ones that went badly.

## What we learned

Hybrid works best when each layer does what it is good at: rules for numbers, Nano for judgement and names, cloud for disagreements. Measure with data written after the rules, because the first version of anything looks better than it is.

## What's next

Verify the Telangana-specific law from the act text itself (our tools could not open it); more topics (late-payment interest, move-out charges, lock-in exit fees); a local "report a wrong result" button feeding the rule tests; other states; and, only if wanted, an opt-in store of masked clauses (design in `rules/EXPANDING.md`).

## Built with

Firebase AI Logic (Web SDK), Gemini Nano via Chrome's on-device model, Gemini cloud, Firebase App Check (reCAPTCHA Enterprise), Firebase Hosting, TypeScript, Vite.

## Try it

https://eleven-months-nano.web.app on desktop Chrome 139+ (about 4 GB download the first time; use the built-in sample lease). Repo: **[CHECK]** a public repo may be required; none exists yet, and nothing is committed.

## Honest limits (put these in the entry)

A screening aid, not legal advice. Reference notes come from secondary commentary and tell the user to verify; the Telangana notes are the thinnest because the act text could not be opened. All test data is synthetic and author-written.

## Demo video script (about 2:00; the first scan is slow, so record after a warm-up run and cut the waiting)

Before recording: open Chrome 139+, load the live site, click Scan lease on the sample once so the model is warm, then reload. Use Cmd+Shift+5 to record the screen with the microphone. Open DevTools to the Network tab on a second window or a clean second recording of the network view.

1. **0:00 Hook.** On screen: the headline. Say: "Indian rental agreements run 11 months and hide the clauses that matter. Eleven Months reads them on your device."
2. **0:10 Load the sample and press Scan lease.** The scan summary fills in as each clause turns. Say: "Rules and Gemini Nano on the device read each clause. Nothing is uploaded yet."
3. **0:25 Deposit clause.** Point at "Deposit is 10 months' rent" and "Deposit can be forfeited at the landlord's discretion". Say: "The deposit is read by rules, not the model, because small models get arithmetic wrong."
4. **0:40 Entry and water clauses.** Point at "Landlord can enter without notice" and "Water or power can be cut". Open "Why it matters" and show the note with its status and source.
5. **0:55 Intro clause with names and IDs.** Open "Sent to cloud (names and IDs masked)". Say: "Only unclear clauses go to cloud Gemini through Firebase AI Logic, and names, Aadhaar and PAN are replaced first."
6. **1:10 The trace and the summary.** Point at the RULES / NANO / CLOUD trace on a card and "Stayed on device" in the summary. Show the Network tab with only the few cloud calls.
7. **1:25 Lease checklist.** Scroll to it: "No deposit refund deadline, no registration mention."
8. **1:35 Signing sheet.** Scroll to "Take this to the signing", show the points to raise and the flat checklist, and click Print. Say: "It ends in something you can carry into the room."
9. **1:45 Reference search.** Type "why 11 months" in the reference panel and show the Registration Act note.
10. **1:55 Close.** Say the honest line: "Nano alone missed a quarter of the risky clauses in our tests, which is why rules and a cloud fallback exist. This is a screening aid, not legal advice." End on the live URL.

## Before you submit

- [ ] Read the official Devpost rules and tell me anything that changes this draft (video length, repo, eligibility).
- [ ] Record the demo and upload it.
- [ ] Decide whether to create a public repo (needs a first commit; I have made none). `.gitignore` and `README.md` are ready.
- [ ] Delete the `app-m1` App Check debug token and the unused Classic reCAPTCHA key under "My First Project" (its secret key was shown in a screenshot).
- [ ] If you market it as a Telangana product, use "built for Telangana tenants", not "Telangana law checker", and avoid official-looking branding.
