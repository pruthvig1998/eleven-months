# Eleven Months: gap report and plan (Nov 18 2026)

Question asked: is the app capable enough that people can rely on it, and what does it still skip?

Short answer: it works for the clauses it was built around (deposit, notice, lock-in, rent increase, entry, utilities), but it misses more than half of the other harmful clauses common in Indian rental agreements, and most people will open it on a phone, where it is weakest. It is a useful first screen today. It is not yet something a tenant should treat as "nothing found means safe".

## What was measured today

`rules/probe-realworld.ts` runs the fixed rules on 30 harmful clauses and 6 fair clauses that were written for this check and never used to build the rules. Run: `node --no-warnings rules/probe-realworld.ts`.

- Harmful clauses caught: 13 of 30. Missed: 17 of 30.
- Fair clauses wrongly flagged: 0 of 6.

Limits of this measurement: I wrote the clauses myself from common lease patterns, so they are not real leases (the project is synthetic-data only). It tests the rules alone. With the on-device model present, the model also labels each clause, so the full app catches more than this; that was not re-measured today (earlier measurement: model catches 75% of risky clauses on its own).

## Gaps, ranked

### 1. Harmful clauses the rules do not see (measured)
Missed today:
- One month's rent deducted for painting or cleaning regardless of condition
- Interest on late rent (24% a year)
- Tenant must pay rent for the whole remaining term on leaving early
- Electricity charged at the owner's own sub-meter rate (only tagged as information)
- Bans on guests or overnight visitors
- Owner may change locks and take possession after unpaid rent
- Deposit returned only after 90 days (only tagged as information)
- Renewal fee to the owner
- Courts in a distant city only
- Tenant pays for normal wear and tear
- Undated blank signed cheque as security (tagged as a good payment trail, which is wrong)
- Open-ended society charges and future levies
- Property tax put on the tenant
- Food restrictions
- Owner may end the agreement at any time without reason
- Family members not allowed to live in the flat
- Any clause in Hindi written in English letters

### 2. Most people get the weakest mode
The on-device model needs desktop Chrome with a 4 GB download. On phones, Safari and Firefox the app runs rules only. In that mode:
- the 17 misses above apply in full, with no model behind them;
- a clause is marked risky only when a number check fires or a rule is high severity, so medium findings (penalty clause, broad indemnity, non-refundable payment) do not count toward the verdict;
- the verdict says "No fixed rule was triggered", which is honest, but a tenant can still read it as a pass.

### 3. Documents it cannot read
- Photos and scanned PDFs: no text is extracted. Most tenants receive the agreement as a photo or scan on WhatsApp.
- Telugu, Hindi, Urdu, and mixed-language agreements.
- Tables and two-column PDFs (noted as a shortcut in `app/src/split.ts`).
- Other document types: leave and licence, paying-guest and hostel terms, commercial leases. The app does not detect these or warn that its checks may not fit.

### 4. Whole-agreement checks are thin
It checks seven "is this missing" items. Not checked:
- Parties, address, start date, term, and rent stated at all
- Contradictions between clauses (two different notice periods, two deposit amounts)
- Inventory or fittings list and move-in condition record
- Who pays brokerage, society move-in charges, and maintenance
- What the stamp duty and registration should cost for this rent and term (the knowledge exists in notes; nothing computes it)

### 5. Knowledge gaps
- Telangana only for local law. A tenant in another state gets general notes and no local act, fee, or contact.
- Five open questions are still unanswered (`OPEN_QUESTIONS` in `rules/knowledge.ts`): police verification basis, current lease stamp duty, legal-aid income ceiling, Model Tenancy Act adoption, forum research.
- 13 of 25 notes rest on commentary, not on the act text or an official page.
- Small test sets: 14 to 18 items each. Accuracy numbers come from tens of clauses, not hundreds.

### 6. Product gaps
- Nothing can be saved, reopened, or shared except by printing.
- No way for a user to say "this clause was wrong" or "you missed this".
- Upload PDF was tested on a local build only, never on the live site.
- No landlord-ready output: the tenant gets asks, but not a short message or marked-up clause list to send.

## Plan

Order is by how much each step reduces the chance a tenant is falsely reassured.

**Phase 1: stop false reassurance (1 to 2 days, no new cost)**
1. Add rules for the 16 missed English clause types above, each with test examples, then re-run the probe. Target: 26 of 30 or better, still 0 false flags.
2. Fix the blank-cheque case so it is flagged, not praised.
3. In rules-only mode, count medium findings toward the verdict and show "N clauses were not matched by any rule; read these yourself" with those clauses listed.
4. Write a second unseen set of 30 clauses after the fix and report the first-run number, so the improvement is not just fitting to this list.

**Phase 2: read what tenants actually have (2 to 3 days)**
5. Photo and scanned-PDF input using on-device text recognition (Tesseract in the browser, runs locally, free). Show the recognised text for the user to correct before scanning.
6. Detect document type and language first. If it is not an English residential rental agreement, say so plainly instead of scanning.
7. Phone layout pass on the live site, and test Upload PDF there.

**Phase 3: whole-agreement checks (1 to 2 days)**
8. Basics present: parties, address, start date, term, rent.
9. Contradiction check on deposit, notice, rent and term across clauses.
10. Stamp duty and registration estimate from rent and term, shown with its source and the open-question warning.

**Phase 4: knowledge depth (ongoing)**
11. Close the five open questions from official sources or mark them clearly as unverified in the app.
12. Replace commentary-based notes with act text or official pages where one exists.
13. Add a second state only after Telangana is solid. Karnataka or Maharashtra are the likely next ones by renter numbers; this needs the same official-source work again.

**Phase 5: keep and share (after the hackathon)**
14. Save a scan in the browser only (no server), and a "copy as message to landlord" button.
15. "Report a missed clause" that stays on the device unless the user chooses to send it. This is the opt-in design already written in `rules/EXPANDING.md` and still waits on your decision.

## What I would not do now
- Hindi or Telugu clause analysis: the rules are English patterns and the on-device model was only measured on English. Detect and decline (step 6) is the honest version for now.
- A server-side database of leases: conflicts with the privacy promise and the $0 budget.

## For the Nov 27 target
Phase 1 and steps 5 to 7 are the ones that change what a judge or a real tenant sees. Phases 3 to 5 can be listed as next steps in the submission.
