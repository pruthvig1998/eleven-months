# Deposit Shield: deduction auditor (19 Nov 2026)

`rules/deposit.ts` labels each line of a landlord's deduction list against the tenant's own agreement: **in your agreement**, **ask for the bill**, or **not in your agreement**. Pure function, no model, no network; tested in `rules/deposit.test.ts`.

## Measured

Three synthetic lists, checked against the sample agreement (deposit 10 x Rs 18,000). Gold labels written by hand from the agreement's clauses before the first run.

| List | Lines | Correct on the first run |
|---|---|---|
| Fair (rent for 10 days, bulbs and a tap washer, a broken mirror, an electricity bill) | 4 | 4 |
| Inflated (the built-in made-up example: AC servicing Rs 32,000, painting Rs 45,000, deep cleaning, seepage, flooring damage, "miscellaneous", one month's rent) | 7 | 7 |
| Charges absent from the agreement (brokerage, renewal fee, society move-out fee, geyser servicing, notice shortfall, lost key) | 6 | 6 |
| **Total** | **17** | **17 (100%)** |
| Fresh list written after the first fixes (cracked tiles, chimney cleaning, water bill, painting priced as a month's rent, 5 days' extra rent, a lock-in penalty, sofa dry cleaning, tube lights) | 8 | **7** |

The miss on the fresh list was the worst kind: "Lock-in penalty, Rs 36,000" came out **in your agreement**, because the sample has a lock-in and the blanket forfeiture clause was taken as a price. Fixed: a penalty for leaving early is "in" only when a clause states a charge with an amount; otherwise it is "ask for the bill". Two other fixes from review, each with a test: a named charge priced in months of rent ("Painting - one month's rent") is that charge, not rent owed; and the law check now also catches a bare act name ("as per the Model Tenancy Act"). All four lists now pass (25 of 25 lines).

On the inflated example: Rs 1,59,000 claimed from Rs 1,80,000; Rs 1,16,000 not in the agreement, Rs 25,000 to ask bills for, Rs 18,000 backed by the agreement, so at least Rs 1,62,000 is due back.

Honest limit: the same person wrote the rules and the three lists on the same day, with the sample agreement in view, so 17 of 17 is a check that the rules do what they say, not an unseen-data accuracy. Real lists with unusual wording will score lower. A line the auditor cannot match is labelled "ask for the bill". The first-run miss above shows that a wrong "in your agreement" is possible, so the page says the labels are a comparison with the agreement's words, not a ruling.

## Drafts and ladder

- The two drafts (firm WhatsApp message, formal notice) go through the same path as the scan: names found by Gemini Nano on the device, masked with `mask.ts`, then cloud Gemini through Firebase AI Logic with a JSON schema. If the names check fails or there is no on-device model, nothing is sent and a plain template is used. A draft that cites an act, section or article is discarded (`citesLaw`), because the page shows no legal claim without a checked source.
- Not verified live: a cloud-written draft. The local check ran in a browser with no on-device model, so it showed the template path (nothing sent), which is the designed behaviour there.
- The escalation ladder links every step to a note. Telangana says plainly that there is no Rent Authority (the Model Tenancy Act is not adopted there); other states get the national routes only, labelled as such.
