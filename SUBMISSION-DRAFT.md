# Eleven Months: Devpost entry (draft, not submitted)

Hackathon: Firebase hybrid AI hackathon, https://firebasehybridaihackathon.devpost.com/ (rules summarised in `HACKATHON-RULES.md`). Submissions close **30 Nov 2026, 2:00 PM Pacific** (1 Dec, 3:30 AM in India). Personal target: 27 Nov. Every number below is from `SCHEDULE.md`, `RISK-KILL-REPORT.md` or `rules/README.md`, measured on synthetic clauses written by the author.

Each heading below is a Devpost form field. Copy the text under it.

---

## Project name
Eleven Months

## Elevator pitch (under 200 characters)
Read your rental agreement before you sign it. Eleven Months finds the clauses that can cost an Indian tenant money or their home, says what to ask for instead, and keeps the text on your device.

## Platform
Web (Chrome)

## Links
- Try it: https://eleven-months-nano.web.app (desktop Chrome 139 or newer for the full on-device scan; any browser for the rules and the opt-in cloud check)
- Code: https://github.com/pruthvig1998/eleven-months (Apache-2.0)
- Video: **[add the YouTube link after upload]**

## Inspiration
Most rental agreements in Hyderabad run for eleven months and are signed in a few minutes, often from a photo sent on WhatsApp. They hide clauses like a deposit of ten months' rent that the owner may keep "without assigning any reason", a lock-in that binds only the tenant, entry "at any time without notice", or a right to cut the water. Tenants do not read them, and a lawyer costs more than the deposit. The text is also personal: names, Aadhaar and PAN numbers sit in the first paragraph. That combination, a judgement task on private text, is what hybrid inference is for.

## What it does
- Reads a pasted agreement, a text PDF, a photo, or a scanned PDF.
- Marks every clause clear or risky, with the figures that matter (deposit, lock-in, notice, rent increase) and which layer produced each one.
- For every risky clause, says what to ask the landlord for instead. When the model flags something no fixed rule covers, it says why in plain words, marked as the model's view.
- Checks the whole agreement: are the parties, address, start date, term and rent stated; do any figures contradict each other; is the court in a far-away city; roughly what should the stamp duty be.
- Builds a "Take this to the signing" sheet: the points to raise, what the agreement leaves out, and a checklist for the flat visit. Print it, save it on the device, or copy a message to the landlord.
- Has step-by-step guides for seven situations (before signing, water cut, told to leave, deposit not returned, moving out, rent increase, asked for a bribe) and 25 short law notes, each showing its source and what could not be verified.
- Declines documents it cannot judge (Telugu, Hindi, Hindi written in English letters, non-rental documents) instead of scanning them badly, and warns on leave-and-licence, paying-guest and commercial documents.

Built for Telangana tenants: the clause checks work on English agreements from any Indian state; the local law notes, fees and contacts cover Telangana.

## How we built it (how Firebase AI Logic is used)
Every model call goes through the Firebase AI Logic Web SDK (`firebase/ai`, `app/src/ai.ts`). Inference mode is chosen per task:

| Task | Mode | Why |
|---|---|---|
| Judge each clause, find names | `ONLY_ON_DEVICE` (Gemini Nano in Chrome) | The full text never leaves the browser for this step |
| Read a photo or scanned page | `ONLY_ON_DEVICE`, image input | An image cannot be masked before it is read, so it is never sent. The reading is used only if it shares 90% of its words with a plain text recogniser's reading of the same page, because a model can skip a line silently |
| Second opinion on a clause | `ONLY_IN_CLOUD` (`gemini-3.5-flash-lite`), with a JSON response schema | Only when Nano's answer is unusable, the rules are unsure, rules and Nano disagree, or Nano says "ok" while a rule raised a concern. Names, Aadhaar, PAN, phones and emails are masked first; if the on-device names check fails, the clause is not sent |
| Browsers with no on-device model (phones, Safari, Firefox) | `ONLY_IN_CLOUD`, opt-in | The page explains what is and is not masked before the user ticks the box |

Deterministic rules run before any model: they extract the numbers (small models get arithmetic wrong, so rules always win on figures) and apply 23 topic rules, each shipped with examples that the tests enforce.

Other Firebase products:
- **App Check** with reCAPTCHA Enterprise protects every cloud call.
- **Remote Config** holds the thresholds (deposit months, rent rise, notice days), the cloud model name and the switch for the cloud second opinion, range-checked with built-in defaults.
- **Hosting**, on the free Spark plan, with a Content-Security-Policy.

## Challenges we ran into
- **Gemini Nano alone is not enough.** On 40 clauses it labelled 34 correctly but missed 5 of 20 risky ones, and read "ten months' rent" as one month. So numbers come from rules, and disagreements go to the cloud.
- **Fixed rules do not generalise.** On a fresh set of 20 harmful clauses in new wording, the rules alone caught 4. Adding more patterns raised the score on the set in hand and barely on the next. The model has to carry new wording.
- **Our first routing missed the private path's blind spot.** In the first full measurement, all 13 misses on desktop were clauses Nano called "ok" with nothing sent to cloud, and 10 of them already had a medium rule finding. Sending those to the cloud raised desktop recall from 57 to 67 of 70, at the cost of 12 more clauses leaving the device.
- **The free cloud tier has a rate limit.** Sending two cloud prompts at once failed 5 of 11 clauses with HTTP 429. One request per clause plus retry fixed it.
- **Our own privacy claims had holes.** A self-audit found names failing open, dashed or mistyped Aadhaar, lowercase PAN, phones and emails reaching the cloud unmasked. All fixed with tests that failed first (`AUDIT.md`).
- **Speed.** Each clause makes up to two on-device calls. On a busy laptop the 11-clause sample took 2 to 4 minutes; the first answer after a Chrome restart takes 13 to 20 s while the model loads.

## Accomplishments that we're proud of
Measured, not claimed. On 96 unseen clauses (70 harmful, 26 fair), run on the live site:

| Mode | Harmful caught | Fair wrongly flagged | Sent to cloud |
|---|---|---|---|
| Fixed rules alone (hardest set) | 4 of 20 | 0 of 10 | 0 |
| Desktop: rules + Nano + cloud on trigger | **67 of 70** | 1 of 26 | 45 of 97 |
| No on-device model: rules + cloud on every clause | 68 of 70 | 0 of 26 | 97 of 97 |

Also: 171 automated tests that run on every push; a Lighthouse accessibility score of 100; photo reading that stays on the device and checks itself.

## What we learned
Each layer should do what it is good at: rules for numbers, the on-device model for judgement and names, the cloud for disagreements. Measure on data written after the rules, because the first version of anything looks better than it is. And the privacy trade-off is a number, not a slogan: in this design, catching 10 more harmful clauses cost 12 more clauses leaving the device.

## What's next
- Test on real agreements (with consent) and on real phone photos; every number here comes from clean, author-written English.
- Faster scans: one on-device call per clause where the rules already have the figures.
- Telugu and Hindi agreements, read on the device and translated before the scan.
- Local law for a second state, done with the same source checking as Telangana.

## Built with
Firebase AI Logic (Web SDK), Gemini Nano (Chrome built-in AI), Gemini 3.5 Flash-Lite, Firebase App Check (reCAPTCHA Enterprise), Firebase Remote Config, Firebase Hosting, TypeScript, Vite, pdf.js, Tesseract.js

## Testing instructions for judges
1. Open https://eleven-months-nano.web.app in desktop Chrome 139 or newer. No login.
2. Press **Prepare model** once. The first time, Chrome downloads its built-in model (about 4 GB); after a Chrome restart the first answer takes 13 to 20 s.
3. Press **Load sample**, then **Scan lease**. Expected: "6 of 11 clauses need attention." Open "Sent to cloud (names and IDs masked)" on any clause that has it to see exactly what left the device.
4. To try a phone or another browser: open the same link, tick the cloud check under the text box, and scan the sample.
5. To try photo reading: take a photo of any printed page of English text and press **Upload PDF or photo**.

The sample agreement is made up; no real personal data is used anywhere.

## Built during the hackathon, and pre-existing code
All code was written on 17 and 18 November 2026, inside the submission period. There is no pre-existing code. It was written with an AI coding assistant, which the rules allow. Open-source libraries: Firebase JS SDK, pdf.js, Tesseract.js, Fontsource fonts.

## Honest limits
A screening aid, not legal advice; "nothing found" does not mean "safe to sign". All test clauses were written by the author in clean English, so real agreements will score lower. Not tested on real camera photos, handwriting or a real phone. Five legal questions remain unverified and are listed inside the app.

---

## Video description for YouTube (paste under the video)

Eleven Months reads a rental agreement on your device and tells an Indian tenant which clauses can cost them money or their home, and what to ask for instead. Built with Firebase AI Logic: Gemini Nano on the device, cloud Gemini only for a masked second opinion.

Try it: https://eleven-months-nano.web.app
Code: https://github.com/pruthvig1998/eleven-months

Music: "Happy Beats & Business Moves Vol. 11" by Sascha Ende (ende.app), CC BY 4.0.

---

## Before you submit (your steps)

- [ ] Record the demo with `DEMO-SCRIPT.md` (I cannot record your screen with the on-device model).
- [ ] Upload the video to YouTube as **Public** (the rules say publicly visible; unlisted is a risk), with the description above.
- [ ] Fill the Devpost form from this file, select the Web platform, and add both links and the video link.
- [ ] Delete the `app-m1` App Check debug token, and the unused Classic reCAPTCHA key under "My First Project" (its secret key was shown in a screenshot).
- [ ] Keep the site and the Firebase project running, free, until judging ends on 16 Dec.
- [ ] Do not push to the repository after 30 Nov 2:00 PM Pacific: later commits are not evaluated.
