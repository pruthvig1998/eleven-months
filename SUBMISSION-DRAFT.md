# Eleven Months: Devpost entry (final text, not submitted)

Hackathon: Firebase hybrid AI hackathon, https://firebasehybridaihackathon.devpost.com/ (rules summarised in `HACKATHON-RULES.md`). Submissions close **30 Nov 2026, 2:00 PM Pacific** (1 Dec, 3:30 AM in India). Personal target: 27 Nov.

Each heading below is a Devpost form field. Copy the text under it as it is. Every number comes from `SCHEDULE.md`, `RISK-KILL-REPORT.md`, `README.md` or the test run, measured on synthetic clauses written by the author. Nothing here has been submitted.

---

## Project name
Eleven Months

## Tagline
Read all eleven months before you sign them.

## Links
- Platforms: Web app + Chrome extension + Android app (Trusted Web Activity)
- Try it, web app: https://eleven-months-nano.web.app (desktop Chrome 139 or newer for the full on-device scan; any browser for the rules and the opt-in cloud check)
- Try it, Chrome extension: https://github.com/pruthvig1998/eleven-months/raw/main/docs/downloads/eleven-months-extension.zip (unzip, then `chrome://extensions`, Developer mode, Load unpacked; steps in `extension/README.md`). Chrome Web Store: submitted for review on 19 Nov 2026; if it is approved before submitting, replace this with the store link https://chromewebstore.google.com/detail/mhkioblkanhmcjcbhoipmbmfkojidejg
- Try it, Android app (Trusted Web Activity): the same web app, running in Chrome on Android. APK: https://github.com/pruthvig1998/eleven-months/raw/main/docs/downloads/eleven-months-android.apk (Android 7.0 or newer; allow installs from unknown sources). Chrome on Android has no on-device model yet, so the app runs the fixed rules with the opt-in cloud check.
- Code: https://github.com/pruthvig1998/eleven-months (Apache-2.0)
- Video: https://youtu.be/ITnxc7FrfWk (40 s; must be set to **Public** before submitting)

## Image gallery
Upload the fifteen files in `docs/gallery/` in order, with the captions from `docs/gallery/captions.md`. Add `docs/architecture.png` as the eighth image, captioned: "How a clause moves: rules and Gemini Nano on the device; only triggered clauses are masked and sent to cloud Gemini."

---

## Inspiration
Most rental agreements in Hyderabad run for eleven months, so they never have to be registered, and they are signed in a few minutes, often from a photo sent on WhatsApp. They hide clauses like a deposit of ten months' rent that the owner may keep "without assigning any reason", a lock-in that binds only the tenant, entry "at any time without notice", or a right to cut the water. Tenants do not read them, and a lawyer costs more than the deposit. The text is also personal: names, Aadhaar and PAN numbers sit in the first paragraph. A judgement task on private text is exactly what hybrid inference is for.

## What it does
- Reads a pasted agreement, a text PDF, a photo, or a scanned PDF.
- Marks every clause clear or risky, with the figures that matter (deposit, lock-in, notice, rent increase) and which layer produced each one.
- For every risky clause, says what to ask the landlord for instead. When the model flags something no fixed rule covers, it says why in plain words, marked as the model's view.
- Checks the whole agreement: are the parties, address, start date, term and rent stated; do any figures contradict each other; is the court in a far-away city; roughly what should the stamp duty be.
- Builds a "Take this to the signing" sheet: the points to raise, what the agreement leaves out, and a checklist for the flat visit. Print it, save it on the device, or copy a message to the landlord.
- Has step-by-step guides for seven situations (before signing, water cut, told to leave, deposit not returned, moving out, rent increase, asked for a bribe) and 25 short Telangana law notes, each showing its source and what could not be verified.
- Declines documents it cannot judge (Telugu, Hindi, Hindi written in English letters, non-rental documents) instead of scanning them badly, and warns on leave-and-licence, paying-guest and commercial documents.

Built for Telangana tenants: the clause checks work on English agreements from any Indian state; the local law notes, fees and contacts cover Telangana.

## How we built it

### How Firebase AI Logic is used
Every model call goes through the Firebase AI Logic Web SDK (`firebase/ai`) at runtime; see `app/src/ai.ts`. There are no direct calls to any other model API.

- **On the device, Gemini Nano** (`InferenceMode.ONLY_ON_DEVICE`) judges each clause, reads its figures, finds the names in it, and reads photos and scanned pages. The full agreement text and every image stay in the browser.
- **In the cloud, Gemini** (`gemini-3.5-flash-lite`, `InferenceMode.ONLY_IN_CLOUD`, answers held to a JSON schema) gives a second opinion on a clause only when one of four triggers holds: Gemini Nano's answer is unusable, the rules are unsure of a figure, the rules and Gemini Nano disagree, or Gemini Nano says "ok" while a rule raised a risk or a concern.
- **Masking before the cloud.** Before a clause is sent, names (found on the device by Gemini Nano, plus titles such as Mr/Smt and "S/o"), Aadhaar, PAN, phone numbers and emails are replaced with tokens. If the on-device names check fails, the clause is not sent at all. The page shows, under each clause, the exact masked text that left the device.
- **App Check** with reCAPTCHA Enterprise protects every cloud call.
- **Remote Config** holds the thresholds (deposit months, rent rise, notice days), the cloud model name and the switch for the cloud second opinion. Each value is range-checked and falls back to a built-in default.
- **Firestore is not used for agreements or reports.** No agreement text and no scan result is stored on a server; a saved scan stays in the browser. (Firestore appears only as an optional route for the suggestion box, which is switched off.)
- **Hosting** on the free Spark plan, with a Content-Security-Policy.
- **Which surfaces call the cloud: the web app only.** The cloud second opinion needs App Check, and App Check's reCAPTCHA flow runs in a web page, not in an extension page. So the **Chrome extension's** own pages run the rules and Gemini Nano through the same SDK in `ONLY_ON_DEVICE` mode, with a placeholder config and a Content-Security-Policy of `connect-src 'self'` that blocks any network call. Its **Full app** tab frames the web app itself (the site allows framing only by extension pages), so the masked cloud second opinion, photos, Deposit Shield and the rest run there under App Check; the text is handed over in the URL fragment, which is never sent to the server. The **Android app** is a Trusted Web Activity: it is the web app itself in Chrome on Android, so its cloud calls are the web app's, under App Check. Chrome on Android has no on-device model yet, so there it runs the rules plus the opt-in cloud check.
- **Deposit Shield drafts** (the move-out message and notice) use the same masked path: names found by Gemini Nano on the device and masked, then cloud Gemini with a JSON schema; no names check, nothing sent. A draft that cites any law is discarded and a local template is shown instead.

Browsers with no on-device model (phones, Safari, Firefox) get a rules-only scan, and the user can opt in to send every clause to the cloud. The page explains before they tick the box that masking is then by pattern only.

### The rest of the stack
Deterministic rules run before any model: they extract the numbers (small models get arithmetic wrong, so a model never overrides a figure the rules extracted) and apply 27 topic rules, each shipped with examples that the tests enforce. Photo reading is checked against a second, plain text recogniser (Tesseract.js): the model's reading is used only if the two share at least 90% of their words, because a model can skip a line silently. TypeScript and Vite, with pdf.js for PDFs. 201 automated tests.

## Challenges we ran into
- **Gemini Nano alone is not enough.** On 40 clauses it labelled 34 correctly but missed 5 of 20 risky ones, and read "ten months' rent" as one month. So numbers come from the rules, and disagreements go to the cloud.
- **Fixed rules do not generalise.** On a fresh set of 20 harmful clauses in new wording, the rules alone caught 4. The model has to carry new wording.
- **Our first routing missed the private path's blind spot.** In the first full measurement, all 13 desktop misses were clauses Gemini Nano called "ok" with nothing sent to the cloud, and 10 of them already had a medium rule finding. Sending those to the cloud raised desktop recall from 57 to 67 of 70, at the cost of 12 more clauses leaving the device.
- **The free cloud tier has a rate limit.** Sending two cloud prompts at once failed 5 of 11 clauses with HTTP 429. One request per clause, plus a retry, fixed it.
- **Our own privacy claims had holes.** A self-audit found names failing open, and dashed or mistyped Aadhaar numbers, lowercase PAN, phones and emails reaching the cloud unmasked. All were fixed with tests that failed first (`AUDIT.md`).
- **Speed.** Each clause makes up to two on-device calls. On a busy laptop the 11-clause sample took 2 to 4 minutes; the first answer after a Chrome restart takes 13 to 20 s while the model loads.

## Accomplishments that we're proud of
**Measured, not claimed.** On 96 unseen clauses (70 harmful, 26 fair) run through the live site in desktop Chrome, the full pipeline caught **67 of 70** harmful clauses and flagged **1 of 26** fair ones by mistake. In the bundled sample agreement, **2 of 11** clauses left the device in the recorded run (3 of 11 in one of two re-runs on 19 Nov; Gemini Nano does not answer the same way every time).

| Mode | Harmful caught | Fair wrongly flagged | Sent to cloud |
|---|---|---|---|
| Fixed rules alone, hardest set (fresh wording) | 4 of 20 | 0 | 0 |
| Desktop: rules + Gemini Nano + cloud on trigger | **67 of 70** | 1 of 26 | 45 of 97 pieces* |
| No on-device model: rules + cloud on every clause | 68 of 70 | 0 of 26 | every clause |

\*The test agreement splits into 97 pieces: the 96 clauses plus its opening line.

Also: 174 automated tests, a Lighthouse accessibility score of 100, and photo reading that stays on the device and checks itself.

## Why this is different
Eleven Months protects privacy by routing, not only by masking: the rules and Gemini Nano judge every clause on the device, and only the clauses that meet a stated trigger go to the cloud, masked, with the exact sent text shown to the user. If the on-device names check fails, the clause is not sent. Deterministic rules win on numbers, so a model never overrides an extracted deposit, notice period or rent rise. And the output is a decision, not a summary: a verdict for each clause, what to ask the landlord for instead, a sheet to take to the signing, and Telangana law notes that show their sources and what could not be verified.

## What we learned
Each layer should do what it is good at: rules for numbers, the on-device model for judgement and names, the cloud for disagreements. Measure on data written after the rules, because the first version of anything looks better than it is. And the privacy trade-off is a number, not a slogan: in this design, catching 10 more harmful clauses cost 12 more clauses leaving the device.

## What's next
- Test on real agreements (with consent) and on real phone photos; every number here comes from clean, author-written English.
- Faster scans: one on-device call per clause where the rules already have the figures.
- Telugu and Hindi agreements, read on the device and translated before the scan.
- Local law for a second state, with the same source checking as Telangana.

## Built with
firebase, firebase-ai-logic, firebase-app-check, firebase-remote-config, cloud-firestore, firebase-hosting, gemini, gemini-nano, typescript, vite, chrome, chrome-extension, android, trusted-web-activity, bubblewrap

> **Confirm before submitting:** `cloud-firestore` is used only by the optional suggestion-box route, which is switched off on the live site. Delete the tag unless you switch that route on.

## Testing instructions for judges
1. Open https://eleven-months-nano.web.app in desktop Chrome 139 or newer. No login.
2. Press **Load sample**, then **Scan lease**. Press **Prepare model** first if the page asks. The first time, Chrome downloads its built-in model (about 4 GB); after a Chrome restart the first answer takes 13 to 20 s. Expected: "6 of 11 clauses need attention."
3. On any clause marked "Sent to cloud (names and IDs masked)", open it to see exactly what left the device.
4. To try a phone or another browser: open the same link, tick the cloud check under the text box, and scan the sample.
5. To try photo reading: take a photo of any printed page of English text and press **Upload PDF or photo**.

The sample agreement is made up; no real personal data is used anywhere.

## Additional info

**Project start date:** 18 Nov 2026 (first commit). The earliest measurement files are dated 17 Nov 2026. Both are inside the submission period (11 to 30 Nov 2026).

**Pre-existing code:** none. All code was written from 17 Nov 2026, inside the submission period, with an AI coding assistant, which the rules allow. Open-source libraries: Firebase JS SDK, pdf.js, Tesseract.js, Fontsource fonts.

**Licence:** https://github.com/pruthvig1998/eleven-months/blob/main/LICENSE (Apache-2.0)

**Eligibility (for you to confirm; do not tick until you have checked each one):**
- [ ] I am above the age of majority where I live.
- [ ] I live in an eligible country (India is not on the excluded list).
- [ ] I am not an employee of Google or Devpost, a member of their households, or a government employee.
- [ ] The repository and the submission contain no API secrets, App Check debug tokens, `.env` files or personal data.
- [ ] I hold the rights to everything in the video, including the music (CC BY 4.0, credited in the description).

## Honest limits
A screening aid, not legal advice; "nothing found" does not mean "safe to sign". All test clauses were written by the author in clean English, so real agreements will score lower. Not tested on real camera photos or handwriting; on a real phone only the Android app's install and full-screen launch were checked. Five legal questions remain unverified and are listed inside the app.

---

## Video description for YouTube (paste under the video)

Eleven Months reads a rental agreement on your device and tells an Indian tenant which clauses can cost them money or their home, and what to ask for instead. Built with Firebase AI Logic: Gemini Nano on the device, cloud Gemini only for a masked second opinion.

0:00 What it is and what it checks
0:20 Paste the agreement and get a verdict
0:30 What to ask for, and the sheet for the signing

Try it: https://eleven-months-nano.web.app
Code: https://github.com/pruthvig1998/eleven-months

Music: "Happy Beats & Business Moves Vol. 11" by Sascha Ende (ende.app), CC BY 4.0.

#BuildHybridAI #GeminiNano #Firebase

---

## Before you submit (your steps)

- [ ] Set the YouTube video to **Public** and paste the description above, with the chapters.
- [ ] Decide whether the 40 s trailer is enough. The rules ask for a video "showing the project working", and judges want to see both on-device and cloud inference. The trailer shows the scan but not a cloud second opinion, and one of its screens still says "Not yet: scanned photos", which is out of date. A full demo recorded with `DEMO-SCRIPT.md` (under 3 minutes) would cover both.
- [ ] Fill the Devpost form from this file, select the Web and Android platforms (Android only once the APK link above is filled in), and upload the gallery.
- [ ] Delete the `app-m1` App Check debug token, and the unused Classic reCAPTCHA key under "My First Project".
- [ ] Keep the site and the Firebase project running, free, until judging ends on 16 Dec.
- [ ] Do not push to the repository after 30 Nov 2:00 PM Pacific: later commits are not evaluated.
