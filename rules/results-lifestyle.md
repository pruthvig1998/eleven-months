# Lifestyle-clause rules (19 Nov 2026)

Four topic rules added to `rules/topics.ts`: `curfew`, `visitors`, `occupants`, `food`, with the practical note `tip-lifestyle` and four "Ask for this instead" lines. A house rule alone is **medium** (a closer look, and a cloud second opinion when the on-device model says ok). A house rule with a fine, a deduction, forfeiture or termination attached is **high** (marks the clause risky). Each rule skips what the older `guests` and `restrictions` rules already report.

| Set | When written | Harmful flagged (high or medium) | Harmful high | Fair flagged |
|---|---|---|---|---|
| `data/lifestyle-heldout.json` (12 harmful, 6 fair) | before the rules, but in view while writing them, so not a true unseen set | 12 of 12 (was 3 before the rules) | 5 of 12 (was 1) | 0 of 6 |
| `data/lifestyle-heldout2.json` (8 harmful, 4 fair), first run | after the rules | **7 of 8** | 2 of 8 | **0 of 4** |
| same set after widening for "entertain visitors" and "cohabiting" | now seen | 8 of 8 | 3 of 8 | 0 of 4 |

Effect on the 96 unseen clauses (`data/unseen.json`), rules alone: high findings unchanged at 25 of 70 harmful and 0 of 26 fair. Two harmful clauses (74 and 75) gained a medium finding (`visitors`, `food`); no fair clause changed. So on the whole pipeline the four rules can only add up to two cloud second opinions; every other clause gets exactly the same rule output as before.
