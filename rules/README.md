# Rules-first lease extractor

Deterministic extractor for the four fields the risk-kill measured (deposit, lock-in months, notice days, escalation percent), plus rent, per-party notice, lock-in party, flags and `unsure`. No dependencies, no Firebase, no network. Written after `RISK-KILL-REPORT.md` recommended rules-first with Nano as judge and cloud on disagreement.

## Run

```bash
node --test --no-warnings rules/extract.test.ts   # 19 tests
node rules/score.ts                                # scores rules vs saved Nano/cloud, writes rules/results.md
```

Needs Node 23.6+ (runs `.ts` directly). Nothing is committed to git.

## Files

- `extract.ts`: `extract(text, { rent? })`.
- `pii.ts`: Aadhaar (Verhoeff) and PAN detection, copied from harness test C.
- `data/heldout.json`, `data/heldout2.json`: two held-out sets (16 and 12 clauses). `data/gold-fixes.json`: logged changes to dev gold.
- `results.md`: latest score output. `results-first-run.md`, `results-first-run-set2.md`: the first-run scores before any rule was fixed against those sets.

## Output contract

Every numeric field is a number or `null`. Never `0` for absent, never a string. Each field carries the matched text as evidence. A field is `unsure` (value `null`) when figures and words conflict ("Rs. 3,00,000 (Rupees Two Lakhs only)"), when several competing values exist, or when it cannot be computed (a months' rent deposit with no rent stated).

- `notice` is extracted per party (`lessee`, `lessor`, `either`). 1 month = 30 days, 1 week = 7.
- `lockin` has `binds`: `lessee`, `both` or `unknown`.
- **Legacy single `notice_days` rule** (used only for scoring): lessee-side notice if stated, else either-party notice, else lessor-side notice.
- `flags`, using the same thresholds as the v2 Nano prompt: `deposit_over_3x_rent`, `escalation_over_10pct`, `notice_under_15_days`, `notice_one_sided`, `lockin_binds_lessee_only`.

## Gold changes (dev set), logged in `data/gold-fixes.json`

The report's notice gold was inconsistent: one clause had the lessor's 3 days as gold, another the lessee's 90. Under the rule above:

- Dev id 17 (lessee two months, lessor three days): `notice_days` 3 changed to 60.
- Dev id 13 ("fifteen days to cure"): `notice_days` 15 changed to `null`. A cure period is not a notice period.

Effect on the saved models: re-scored against the corrected gold, Nano v2s notice is 5/7 (report: 6/8) and cloud notice is 7/7 (report: 6/8). Other fields are unchanged.

## Scores (exact match where the field exists; FP = non-null where gold is null)

Same rules as harness test B. EM = exact match.

### Dev set, 40 clauses (corrected gold)

| Method | deposit EM | lock-in EM | notice EM | escalation EM | FP (dep / lock / notice / esc) |
|---|---|---|---|---|---|
| Rules | 7/7 | 5/5 | 7/7 | 6/6 | 0/33, 0/35, 0/33, 0/34 |
| Nano v2s (saved) | 6/7 | 5/5 | 5/7 | 6/6 | 0/33, 3/35, 6/33, 0/34 |
| Cloud (saved) | 7/7 | 5/5 | 7/7 | 6/6 | 0/33, 0/35, 0/33, 0/34 |

**The dev rules score is not evidence.** I wrote the rules while reading these 40 clauses, so 100% here only shows the rules handle the cases I looked at.

### Held-out sets (written by me before and after the first rule pass; no saved Nano or cloud outputs exist for them)

| Set | When scored | deposit EM | lock-in EM | notice EM | escalation EM | FP |
|---|---|---|---|---|---|---|
| Set 1 (16 clauses) | first run, before any fix | 4/5 | 1/2 | 3/3 | 2/2 | 0 in all fields |
| Set 2 (12 clauses) | first run, before any fix | 3/4 | 2/2 | 2/3 | 2/2 | 0 in all fields |
| Set 1 | after fixing its two misses | 5/5 | 2/2 | 3/3 | 2/2 | 0 |
| Set 2 | after fixing its two misses | 4/4 | 2/2 | 3/3 | 2/2 | 0 |

The honest generalisation estimate is the first-run rows: 7 of 9 deposits, 3 of 4 lock-ins, 5 of 6 notices and 4 of 4 escalations across 28 unseen clauses, with no false positives. The after-fix rows are contaminated because the fixes came from those sets. The expected-unsure case (figures vs words conflict) was returned as unsure 1 of 1.

First-run misses and the general fixes made: an amount that appears before its keyword ("pay Rs 75,000 ... as security deposit"); a spelled-out figure in parentheses ("6 (six) months"); an extra fee amount in the same sentence as the deposit; "ended" as a termination word.

### Rules vs Nano disagreement trigger (dev set, whole clause)

Flag a clause when rules and Nano differ on any of the four fields, or when rules are `unsure`. Nano v2s had 9 of 40 clauses with at least one wrong field. The trigger caught all 9 and raised 0 false flags among the 31 clauses Nano got fully right (9 flagged in total). This is on the set the rules were developed on, so the real false-flag rate will be higher.

### Messy full documents (4 synthetic leases, `node rules/score-messy.ts`, first run, no tuning)

Documents with OCR-style spacing, line wraps, numbered clauses, a key-value schedule table, `Rs.x/-` plus words, amounts in words only, "N (word) months", "@ 7.5 %", two-sided notice. Result: **19 of 20 fields exact, 0 wrong values, 1 miss** (null).

- Miss: Doc B `notice_days` (gold 30). The schedule line `Notice Period : 1 month` has no "notice of N" or "N months' notice" wording, so nothing matched.
- Not counted in the 19/20 but wrong: Doc C lessor notice (60 days) was not extracted, because the clause split only knows "Lessor/Lessee" and not "Landlord/Tenant" as the next party, so `notice_one_sided` was not flagged there. Doc C lock-in `binds` came back `unknown` (should be lessee).
- **Fixed afterwards** (so the first-run numbers above stay the honest ones): schedule lines like `Notice Period : 1 month` are now read; "Landlord/Tenant" wording splits clauses and sets the party like "Lessor/Lessee"; lock-in `binds` now catches "the Tenant shall not vacate ...". Rerun: 20/20 fields exact, Doc C notice is lessee 30 / lessor 60 with `notice_one_sided` flagged and lock-in binds the lessee. Two new unit tests cover this (21 tests pass); dev and held-out scores are unchanged.
- Caveat: I wrote these documents after writing the extractor, so they are harder than the dev clauses but not blind, and the post-fix 20/20 is contaminated. They are 4 documents, not real leases.

## Routing pipeline (`pipeline.ts`, `replay.ts`)

`decide(text, nanoOutput)` runs the rules and says whether cloud is needed; `finalize()` merges the answers. Cloud is called when: Nano's label or fields are unusable (empty, `ok|risky` echo); the rules are `unsure`; rules and Nano disagree on any field (including Nano inventing a value); or Nano says ok while the rules flag something. Rules win on any field they extracted. `check` is set when cloud disagrees with Nano's label or with a rules value. Pure functions, no network.

Offline replay on the 40 dev clauses (saved Nano v2s and cloud outputs, corrected gold; `node rules/replay.ts`):

| Method | cloud calls | label correct | risky found | all 4 fields correct | FP fields |
|---|---|---|---|---|---|
| Nano only | 0/40 | 34/40 | 15/20 | 32/40 | 6 |
| Cloud always | 40/40 | 40/40 | 20/20 | 40/40 | 0 |
| Rules + Nano, cloud on trigger | 11/40 | 38/40 | 18/20 | 40/40 | 0 |

The pipeline uses 27.5% of the cloud calls and gets every field right. Its two label misses are clauses 22 (vacate within 48 hours on sale of the premises) and 35 (no rent receipts, landlord's record conclusive). Both are pure judgement clauses with nothing numeric for the rules to disagree with, so only a better Nano or a risk-phrase list catches them. I did not add phrases to fit those two, since that would tune to the dev set.

Caveats: the fields result is on the set the rules were developed on, the cloud labels are from the same prompt wording I tuned, and the 11/40 trigger rate will differ on real leases. This is a replay, not a live run.

## Topic rules, reference notes and lease checklist (`topics.ts`, `knowledge.ts`)

16 topic rules (entry, cutting services, eviction, receipts, disputes, forfeiture, waiver, maintenance, utilities, subletting, guests, registration, renewal, fees, liability, deposit refund) plus a deposit-size check against the Model Tenancy Act benchmark. Each finding has a severity (`high` marks the clause risky, like a numeric flag), a plain-language reason and a link to a reference note. `knowledge.ts` bundles 10 notes (Transfer of Property Act s.106, Registration Act s.17, Model Tenancy Act benchmarks, Telangana rent control act, this tool's own thresholds, two practical tips) with status, sources and checked date, and a keyword search. `coverage()` reports what a whole lease covers or omits. The facts come from secondary commentary checked on 2026-11-17, not the enacted text.

Honest numbers: dev set 20/20 risky clauses get a high finding with 0/20 false alarms, but I wrote those rules after reading the dev clauses, so that is contaminated. Blind first run on 8 differently worded risky clauses: **0/8**. After widening with shared word lists, a second blind set written beforehand went from **0/8 to 7/8** with 0/4 false alarms. Offline replay with the topics wired into the pipeline: labels right 40/40 (was 38), cloud-bound clauses 13/40 (was 11); the two newly caught labels are clauses I later wrote rules for, so that gain is contaminated too. See `EXPANDING.md` for the growth loop and `gaps.ts` / `score-topics.ts` to measure.

## Not covered or not verified

- Nothing was run on real leases. Wording that differs from my synthetic Hyderabad-style clauses will find misses.
- Held-out sets are small (28 clauses, 9 deposits, 4 lock-ins, 6 notices, 4 escalations). One miss moves a rate by 11 to 25 points.
- Party detection for notice is a heuristic (first party word in a clause segment). Sentences that split across clauses, or passive wording ("notice shall be given"), fall back to `either`.
- `unsure` is rare by design (1 of 28 held-out cases). It will not catch every ambiguous clause.
- No risky-or-ok judgement here: the flags only encode the threshold rules. Nano and cloud still do the judgement.
- Nano and cloud were not re-run on the held-out sets.
