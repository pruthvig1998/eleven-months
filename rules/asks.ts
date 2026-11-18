// "Ask for this instead" suggestions and the flat-visit checklist, for the printable signing sheet.
// Asks only restate benchmarks already in knowledge.ts (or plain fairness points); they add no new legal claims.
// Keys: a topic id from topics.ts (optionally "topic:severity"), "flag:<name>" for numeric flags from extract.ts,
// and "gap:<topic>" for items the lease checklist found missing. asks.test.ts fails if a key is missing.
import type { Finding } from './topics.ts';

export const ASKS: Record<string, string> = {
  entry: "Ask for at least 24 hours' written notice before the landlord enters, except in an emergency.",
  selfhelp: 'Ask to delete this clause. Water, power and other essential services should not be cut over a dispute.',
  eviction: "Ask for a written notice period of at least 15 days before you have to leave, including if the flat is sold.",
  receipts: 'Ask for a receipt for every payment, and pay by bank transfer or UPI so there is a record.',
  dispute: 'Ask for a neutral process: the local courts, or an arbitrator both sides agree on, with each side paying its own costs.',
  forfeiture: 'Ask that deductions from the deposit be limited to unpaid rent and proven damage, with an itemised list.',
  'forfeiture:medium': 'Ask for the trigger and the amount of the penalty to be written down and capped.',
  waiver: 'Ask to delete the waiver, so you can still question deductions and raise a claim.',
  maintenance: "Ask that structural repairs (roof, wiring, plumbing) are the landlord's cost unless you caused the damage, and that any maintenance charge is backed by bills.",
  utilities: 'Ask to pay utilities by meter reading or actual bills.',
  guests: 'Ask that a guest staying over is not, by itself, a reason to end the tenancy.',
  renewal: 'Ask for a fixed percentage for any rent revision, applied once a year.',
  fees: 'Ask what the fee covers and for a receipt, and whether any of it is refundable.',
  liability: 'Ask to exclude normal wear and tear and damage you did not cause.',
  holdover: 'Ask to bring the overstay charge down to double rent.',
  'deposit-refund': 'Ask for a refund deadline in writing, counted from the day you hand over the keys, and not tied to a new tenant or a sale.',
  cheque: 'Ask to delete this. Offer dated post-dated cheques for the rent only, or a bank standing instruction.',
  deductions: 'Ask that painting and cleaning are charged only if needed, at actual cost with a bill, and that normal wear and tear is excluded.',
  'late-fee': 'Ask for a grace period of a few days and a lower, capped late charge.',
  'early-exit': 'Ask to replace this with a notice period, or a fixed exit charge of at most one or two months of rent.',
  lockout: 'Ask to delete this. Possession should be taken back only through notice and the legal process.',
  restrictions: 'Ask to delete this restriction, or decide before signing whether you can accept it.',
  charges: "Ask that property tax, corpus and sinking funds stay with the owner, and that your society charges are a fixed monthly amount.",
  'renewal-fee': 'Ask to delete the renewal fee.',
  deposit: "Ask to reduce the deposit. The Model Tenancy Act benchmark is 2 months' rent (binding only where a state has adopted it).",
  'flag:deposit_over_3x_rent': "Ask to reduce the deposit. The Model Tenancy Act benchmark is 2 months' rent (binding only where a state has adopted it).",
  'flag:escalation_over_10pct': 'Ask for a lower, fixed rent increase, applied once a year.',
  'flag:notice_under_15_days': "Ask for at least 15 days' notice, the same for both sides.",
  'flag:notice_one_sided': 'Ask for the same notice period for both sides.',
  'flag:lockin_binds_lessee_only': 'Ask for the lock-in to bind both sides, or to be shortened.',
  'gap:deposit-refund': 'Ask to add a deadline for refunding the deposit.',
  'gap:notice': 'Ask to add a notice period for ending the tenancy, the same for both sides.',
  'gap:maintenance': 'Ask to add who pays for which repairs.',
  'gap:receipts': 'Ask to add how rent is paid and that receipts are given.',
  'gap:dispute': 'Ask to add how disputes are settled.',
  'gap:entry': 'Ask to add that the landlord gives notice before entering.',
  'gap:registration': 'Ask whether the agreement will be registered or notarised, and who pays the stamp duty.',
};

// Only findings that need action get an ask: high and medium, not info.
export const askForFinding = (f: Finding): string | undefined =>
  f.severity === 'info' ? undefined : ASKS[`${f.topic}:${f.severity}`] ?? ASKS[f.topic];
export const askForFlag = (flag: string): string | undefined => ASKS[`flag:${flag}`];
export const askForGap = (topic: string): string | undefined => ASKS[`gap:${topic}`];

// Practical tips for the physical visit and handover. Not legal advice and not specific to any state.
export const VISIT: { title: string; items: string[] }[] = [
  {
    title: 'At the flat, before you sign',
    items: [
      'Run every tap and flush. Check the water pressure and ask about the water source and timings.',
      'Look for damp patches, mould, or fresh paint over stains on walls and ceilings.',
      'Switch on every light, fan, geyser and socket. Look at the fuse board.',
      'Check that doors, windows, locks and grills open, close and lock.',
      'Check your mobile signal and ask which internet providers serve the building.',
      'Ask a neighbour or the watchman about water supply, power cuts and the association rules.',
      'Ask what the monthly maintenance covers and get the amount in writing.',
      'Ask to see proof that the person signing owns the flat or is authorised to let it.',
    ],
  },
  {
    title: 'At handover',
    items: [
      'Note the electricity, water and gas meter readings and photograph the meters.',
      'Take dated photos or a video of every room, including existing damage.',
      'List furniture, fittings and appliances with their condition, signed by both sides.',
      'Count the keys you receive.',
      'Get a receipt for the deposit and the first rent.',
    ],
  },
  {
    title: 'Paperwork to keep',
    items: [
      'A signed copy of the agreement, every page.',
      'Rent receipts or bank transfer records for every month.',
      'The handover photos and the signed inventory list.',
    ],
  },
];
