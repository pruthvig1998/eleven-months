# How to keep expanding the rules (and what it can do)

The rules are precise but brittle: written from one author's wording, they miss paraphrases. First blind run of the topic rules on 8 risky clauses worded differently from the rules: **0 of 8 caught**. After widening with shared word lists, a second blind set of 8 (written before the widening) went from **0 to 7 of 8**, with 0 false alarms on 4 ok clauses. So growth has to be a loop with measurement, not one-off patterns.

## The growth loop

1. **Find gaps.** `node rules/gaps.ts` runs the topic rules and the numeric flags over every labelled clause and lists: false alarms (ok clauses with a high finding), gaps (risky clauses with none), and clauses no topic detects at all (the topic backlog).
2. **Add or widen a rule** in `topics.ts`. Prefer adding synonyms to a shared word list (`LEX`) over a one-off pattern: one new synonym improves every rule that uses it.
3. **Ship examples with the rule** (`detected`, `notDetected`, and a severity example). `topics.test.ts` fails if a rule has fewer than 2 of each or if any example misbehaves, so a rule cannot land untested.
4. **Measure on clauses written after the rule.** Put them in `data/topics-heldout*.json` with a `label`, run `node rules/score-topics.ts <file>`, and record the first-run number. Once you fix misses from a set, that set is contaminated: write a new one.
5. **Add a reference note** in `knowledge.ts` for any finding that needs a source. Every finding can link to a note (`note: 'tpa-106'`); a test fails if the link is dead. Each note has a status (`law`, `model-law`, `tool`, `tip`), sources and a checked date. Verify facts before adding them.

## The knowledge architecture: how help stays trustworthy

Three layers, each enforced by tests (`guides.test.ts`, `topics.test.ts`):

1. **Notes** (`knowledge.ts`): one fact each. Every note carries a **basis** (how we know it: government source, court order, commentary with the act text not read, common practice, or this tool's choice), a **scope** (All India or Telangana), its sources, a checked date, and an **unverified** line saying what could not be confirmed. A note that is not a tip must name a source; one marked government or court must link it.
2. **Guides** (`guides.ts`): what to do in a situation, step by step. A step that names a law or benchmark must link a note, so its source and trust level show next to it. A step with no note is labelled common practice. Every dispute guide ends with free legal aid (NALSA 15100).
3. **Open questions** (`OPEN_QUESTIONS` in `knowledge.ts`): what the tool could not verify and where the answer lives. Shown to users under "What this tool could not verify".

Where things stand (Nov 18 2026): 25 notes. 3 rest on a government source (legal aid from NALSA and the Telangana State Legal Services Authority; the 0.2% lease registration fee from the Telangana Registration department's Table of Fees; the Anti-Corruption Bureau's contact details from its own site), 3 on the text of the Telangana control act read on Indian Kanoon, 13 on commentary or news, 3 on what is reported online (advocate Q&A forums and news; labelled not verified), 2 are practical tips and 1 is a tool threshold. Five open questions remain (police verification's legal basis, the current lease stamp duty entry, the legal-aid income ceiling, any new Model Tenancy Act notification, and Reddit, which blocks the tools used). India Code could not be opened, so the act notes are marked "database copy". **To raise the trust level, a person has to read the official source** (India Code, the Telangana Registration and Stamps portal, a police notice), then update the note's text, `basis`, `checked` date and `unverified` line, and remove the matching open question. Do not mark a note `official` unless its text was checked against that source.

## Ideas that expand what it can do (not built yet)

- **Report a wrong result:** a button on each card that downloads a JSON of the masked clause, the tool's answer and the user's correction. Stays local (no database); you drop the files into the held-out sets and the gap finder picks them up.
- **More topics:** the backlog the gap finder prints. Candidates: late-payment interest, painting and move-out charges, lock-in exit fees, parking and common areas, furniture and inventory lists, sub-metering, society rules.
- **Lease comparison:** scan two leases and show which clauses differ in risk.
- **Other languages and states:** needs new word lists and new notes per state (rent control acts differ).
- **Cloud help for rules:** use Gemini to draft candidate patterns from clauses the gap finder lists, then a person reviews each before it ships. Never auto-merge generated rules.

## A database (Firestore): not built, and why

A database of user leases would break the app's promise (the text stays on your device; only masked, unclear clauses go to cloud) and the synthetic-data rule. If you still want one, the safe shape is:

- **Opt-in only**, off by default, with a plain statement of what is stored.
- Store **only masked clause text plus the tool's label**, never the full lease, and no IDs or account.
- Firestore security rules that allow create-only writes, no reads from the browser, and a short retention period.
- Needs your console steps (enable Firestore on Spark, deploy rules) and a decision on retention. Residual risk: masking misses a bare first name with no honorific.

For the reference notes themselves a database is not needed: they are bundled, searchable offline and versioned in git.
