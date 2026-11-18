### Dev set (40 clauses, gold corrected per data/gold-fixes.json)
| Method | deposit EM | lock-in EM | notice EM | escalation EM | deposit FP | lock-in FP | notice FP | escalation FP |
|---|---|---|---|---|---|---|---|---|
| rules | 100.0% (7/7) | 100.0% (5/5) | 100.0% (7/7) | 100.0% (6/6) | 0/33 | 0/35 | 0/33 | 0/34 |
| Nano v2s (saved) | 85.7% (6/7) | 100.0% (5/5) | 71.4% (5/7) | 100.0% (6/6) | 0/33 | 3/35 | 6/33 | 0/34 |
| Cloud (saved) | 100.0% (7/7) | 100.0% (5/5) | 100.0% (7/7) | 100.0% (6/6) | 0/33 | 0/35 | 0/33 | 0/34 |

### Held-out set (16 clauses, never used to develop rules; no saved Nano/cloud outputs)
| Method | deposit EM | lock-in EM | notice EM | escalation EM | deposit FP | lock-in FP | notice FP | escalation FP |
|---|---|---|---|---|---|---|---|---|
| rules | 80.0% (4/5) | 50.0% (1/2) | 100.0% (3/3) | 100.0% (2/2) | 0/10 | 0/14 | 0/13 | 0/14 |

Expected-unsure held-out cases returned as unsure: 1/1

### Rules-vs-Nano disagreement trigger (dev set, whole-clause: any of 4 fields)
Nano clauses with at least one wrong field: 9/40; caught by trigger: 9; false flags on clauses Nano got fully right: 0/31; total flagged: 9/40.

### Remaining rule misses
- held 101 deposit: gold 75000 rules null
- held 107 lockin_months: gold 6 rules null
