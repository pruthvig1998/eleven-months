# Eleven Months: design direction ("stamp paper")

Decided 18 Nov 2026, after the dark neon look and the plain paper look were both rejected as generic.

## Contract
- **Job:** a tenant pastes or photographs a rental agreement and needs to know, fast, which clauses to push back on and what to ask for.
- **Audience:** Indian tenants, mostly first-time renters, often on a phone, often holding a printed agreement.
- **Primary action:** Scan lease. The first viewport is the tool, not a marketing page.
- **Viewports:** 390x844 and 1440x900.

## Direction
Indian rental agreements are typed on **non-judicial stamp paper**: pale green paper with a guilloché security pattern, a typewritten body, and violet rubber stamps from the notary and the sub-registrar's office. Every tenant has held one. The app borrows that object instead of a generic app look.

- **Paper:** pale stamp-paper green with a fine guilloché moiré in the header band.
- **Typewriter:** agreement text is set in Courier Prime, as if typed on the stamp paper.
- **Rubber stamp:** the verdict is a slightly crooked violet stamp; "RISK" and "CLEAR" are small stamps. Violet is the colour of Indian office stamp ink.
- **Margin notes:** each clause is laid out as the typed clause on the left and the review note on the right (findings, figures, what to ask instead), like a lawyer's annotated copy. On phones the note sits under the clause.
- **Receipt stub:** the scan summary is a perforated stub attached to the input sheet.
- **UI type:** Bricolage Grotesque for headings, Hanken Grotesk for interface text.

Colours: ink #1f2a24, paper #eef3e8, sheet #fdfcf7, stamp violet #4b3a9a, risk vermilion #b8321f, clear green #276749, caution #8a5a00. Every text colour is at least 4.5:1 on the backgrounds it sits on.

## Not used, on purpose
No purple gradients, no glow, no neon, no Inter, no centred marketing hero, no cards inside cards, no emblem or text that imitates real government stamp paper (the page never says "India Non Judicial" and shows no state emblem).

## References
- taste-skill (Leonxlnx/taste-skill, design-taste-frontend): bans on purple gradients, neon on dark, Inter; one saturated accent on a warm neutral; grid layouts; motion only on transform and opacity, reduced-motion respected.
- `frontend-design-direction` skill: decide the direction first, tool-first viewport, check contrast, focus and touch targets at both target sizes.
