// Situation guides: what to do, step by step, in common tenant situations.
// Every step states its basis. A step that makes a legal point must link a note in knowledge.ts (`note`), so its
// source, trust level and unverified parts travel with it. Steps with no note are practical tips (`practice`).
// guides.test.ts enforces this. Not legal advice: each dispute guide ends by pointing to free legal aid.
import { noteById, type Basis } from './knowledge.ts';

export interface Step { text: string; note?: string }
export interface Guide { id: string; title: string; when: string; steps: Step[]; dispute: boolean }

const AID: Step = { text: 'If it is not resolved, get advice before acting. Free legal aid: call the NALSA helpline 15100 or visit the District Legal Services Authority at your local court complex.', note: 'legal-aid' };

export const GUIDES: Guide[] = [
  {
    id: 'before-signing', title: 'Before you sign', when: 'You have a draft agreement and have not signed yet.', dispute: false,
    steps: [
      { text: 'Scan the draft here and print the "Take this to the signing" sheet.' },
      { text: 'Visit the flat with the checklist on that sheet before paying anything.' },
      { text: 'Ask for changes in writing, and get the corrected agreement before you pay the deposit.' },
      { text: "Check the deposit against the benchmark of 2 months' rent, and ask for a refund deadline.", note: 'mta-deposit' },
      { text: 'Check the term. A lease of more than one year must be registered, which is why many run 11 months.', note: 'reg-17' },
      { text: 'Ask who pays the stamp duty and whether the agreement will be notarised or registered.', note: 'stamp-ts' },
      { text: 'Expect the landlord to ask for your ID and photo for police tenant verification.', note: 'police-verification' },
      { text: 'Pay by bank transfer or UPI and get a receipt for the deposit and first rent.', note: 'tip-receipts' },
      { text: "If you claim HRA, agree before signing that you will get rent receipts and the landlord's PAN.", note: 'rw-receipts-pan' },
      { text: 'Settle in writing who pays for painting and cleaning when you leave.', note: 'rw-deposit-deductions' },
    ],
  },
  {
    id: 'services-cut', title: 'The landlord cut the water or power', when: 'Water, electricity or another essential service was stopped to pressure you.', dispute: true,
    steps: [
      { text: 'Record it: dated photos or video, and note the date and time it stopped.' },
      { text: 'Ask in writing (message or email) for it to be restored, and keep the reply.' },
      { text: 'Know the benchmark: under the Model Tenancy Act a landlord may not withhold essential services, and the Rent Authority can order them restored.', note: 'mta-essential-supply' },
      { text: 'If the Telangana control act covers your building, section 14 lets you apply to the Rent Controller, who can order the supply restored straight away.', note: 'ts-amenities' },
      { text: 'Check whether it covers you: the Act leaves out buildings under 15 years old and those whose rent was above Rs 3,500 a month in 2005 (corporation areas). If you are outside it, your agreement and the general law apply.', note: 'ts-rca' },
      { text: 'If you are threatened or locked out, contact the police.' },
      AID,
    ],
  },
  {
    id: 'told-to-leave', title: 'You are told to leave at short notice', when: 'The landlord asks you to vacate immediately or within a few days.', dispute: true,
    steps: [
      { text: 'Read the notice clause in your agreement and ask for the notice in writing.' },
      { text: "Know the default: a month-to-month tenancy ends on 15 days' notice under the Transfer of Property Act.", note: 'tpa-106' },
      { text: 'Keep paying rent on time and keep the proof, so non-payment cannot be used against you.', note: 'tip-receipts' },
      { text: 'Do not hand over the keys until the deposit refund is agreed in writing.' },
      { text: 'Eviction is meant to go through an authority, not through lock-outs or cutting supplies.', note: 'mta-eviction' },
      { text: 'Where the Telangana control act applies, eviction needs an order of the Rent Controller on listed grounds. It leaves out newer buildings and those whose rent was above Rs 3,500 a month in 2005, so many leases fall under the agreement and the general law instead: 15 days of notice, then a civil suit.', note: 'ts-rca' },
      AID,
    ],
  },
  {
    id: 'deposit-not-returned', title: 'The deposit is not returned', when: 'You have moved out and the deposit, or part of it, has not come back.', dispute: true,
    steps: [
      { text: 'Send a written demand with the date you handed over the keys, the amount due and your bank details.' },
      { text: 'Ask for an itemised list of any deductions, with bills.' },
      { text: 'Painting and cleaning charges are the most reported deduction. Check whether your agreement allows them, and get two painter quotes if the amount looks inflated.', note: 'rw-deposit-deductions' },
      { text: 'Use your handover photos, inventory list and meter readings to answer claims of damage.', note: 'tip-handover' },
      { text: 'Know the benchmark: the Model Tenancy Act expects the deposit back when you leave, less genuine dues.', note: 'mta-deposit' },
      { text: "Where the Telangana control act covers the building, an advance above one month's rent was not allowed in the first place.", note: 'ts-advance' },
      AID,
    ],
  },
  {
    id: 'moving-out', title: 'Moving out', when: 'You plan to leave at the end of the term or earlier.', dispute: false,
    steps: [
      { text: 'Give notice in writing for the period your agreement states, and keep a copy.', note: 'tpa-106' },
      { text: 'Check the lock-in clause before leaving early; it may carry a charge.' },
      { text: 'On the last day, photograph every room and the meters, and return the keys against a written acknowledgement.', note: 'tip-handover' },
      { text: 'Agree the deposit refund date and any deductions in writing before you hand over the keys.' },
      { text: 'Staying past the end date can cost extra; the Model Tenancy Act benchmark is double rent for two months.', note: 'mta-holdover' },
    ],
  },
  {
    id: 'rent-increase', title: 'The landlord wants more rent', when: 'You are asked to pay a higher rent during the term or at renewal.', dispute: false,
    steps: [
      { text: 'Check what your agreement says about increases and when they apply.' },
      { text: "Compare the rise with this tool's screening threshold of 10% a year. It is a screening choice, not a legal limit.", note: 'tool-thresholds' },
      { text: 'Get the new rent and its start date in writing, and a fresh agreement at renewal.' },
      { text: 'If rent is above Rs 50,000 a month, the tenant must deduct tax at source, at 2% since October 2024.', note: 'tds-194ib' },
    ],
  },
];

GUIDES.push({
  id: 'asked-for-extra', title: 'Someone asks for a bribe or unrecorded cash', when: 'An office, agent, broker or landlord asks for money with no receipt.', dispute: true,
  steps: [
    { text: 'Ask what the payment is for, what the official amount is, and for a receipt. A genuine charge survives those three questions.' },
    { text: 'Know the official price: the government registration fee for a lease in Telangana is 0.2%. Stamp duty is separate.', note: 'regfee-ts' },
    { text: 'You do not have to use a middleman, and most 11-month agreements are notarised and never go to the registration office.', note: 'rw-middlemen' },
    { text: 'Do not pay cash that nobody will write down. Pay government charges through the official channel and keep the receipt.' },
    { text: 'If a government employee demands a bribe, note the name, office, date and amount, and report it to the Anti-Corruption Bureau: toll-free 1064 or WhatsApp 9440446106.', note: 'acb' },
    { text: 'If it is a landlord or broker asking for unrecorded cash, that is a private demand: ask for it to be written into the agreement with a receipt, or walk away.' },
    { text: 'A landlord who insists on cash rent with no receipt or PAN can cost you your HRA claim. Decide before you sign.', note: 'rw-receipts-pan' },
    AID,
  ],
});

export const guideById = (id: string): Guide | undefined => GUIDES.find(g => g.id === id);
// The trust level of a step: its note's basis, or 'practice' for a plain tip.
export const stepBasis = (s: Step): Basis => (s.note ? noteById(s.note)?.basis ?? 'practice' : 'practice');
