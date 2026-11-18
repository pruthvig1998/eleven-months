// "Law, or viral forward?": the eight most shared "new rent rules" claims, checked for three states.
// Same format as the reference notes (knowledge.ts): every verdict has its sources, a trust level (basis) and what
// could not be verified. Checked 19 Nov 2026 against the act texts below (database copies, not the gazette) and
// commentary. Not legal advice. A cell that could not be sourced says so ('unverified') instead of guessing.
// claims.test.ts enforces the shape: 8 claims x 3 states, https sources, and every "in force" verdict backed by act text.
import type { Basis } from './knowledge.ts';

export type State = 'telangana' | 'karnataka' | 'maharashtra';
export const STATES: { id: State; name: string }[] = [{ id: 'telangana', name: 'Telangana' }, { id: 'karnataka', name: 'Karnataka' }, { id: 'maharashtra', name: 'Maharashtra' }];
export type ClaimStatus = 'in-force' | 'mta' | 'false' | 'partly' | 'unverified';
export const STATUS_LABEL: Record<ClaimStatus, string> = {
  'in-force': 'In force',
  mta: 'Model Tenancy Act proposal, not adopted here',
  false: 'Not true',
  partly: 'Partly true: the details differ',
  unverified: 'Could not verify',
};
export interface Src { label: string; url?: string }
export interface Verdict { status: ClaimStatus; text: string; basis: Basis; sources: Src[]; unverified?: string; checked: string }
export interface Claim { id: string; claim: string; mta: string; states: Record<State, Verdict> }

const CHECKED = '2026-11-19';
const MTA: Src = { label: 'Model Tenancy Act, 2021: full text (copy hosted by LiveLaw)', url: 'https://livelaw.in/pdf_upload/model-tenancy-act-394449.pdf' };
const FACTCHECK: Src = { label: 'Outlook Money fact check of the viral "New Rent Rules 2026" post (March 2026)', url: 'https://www.outlookmoney.com/personal-finance/new-rent-rules-2026-truth-behind-viral-social-media-post-heres-the-fact-check' };
const TS_ACT: Src = { label: 'Telangana Buildings (Lease, Rent and Eviction) Control Act, 1960: text on Indian Kanoon', url: 'https://indiankanoon.org/doc/34729102/' };
const TS_MTA: Src = { label: 'SN Law Chambers: Telangana has not adopted the Model Tenancy Act (Sept 2026)', url: 'https://snlawchambers.in/blog/tenant-eviction-medchal-rent-control-act-vs-transfer-of-property-act/' };
const KA_RENT: Src = { label: 'Karnataka Rent Act, 1999, sections 4 to 16 (text on Vidhi Judicial)', url: 'https://vidhijudicial.com/sec-4-to-16-(chapter-ii-regulation-of-rent)-the-karnataka-rent-act,-1999.html' };
const KA_EVICT: Src = { label: 'Karnataka Rent Act, 1999, sections 27 to 46 (text on Vidhi Judicial)', url: 'https://vidhijudicial.com/sec-27-to-46-(chapter-vi-regulation-of-eviction)the-karnataka-rent-act,-1999.html' };
const KA_REPAIR: Src = { label: 'Karnataka Rent Act, 1999, sections 47 to 49 (text on Vidhi Judicial)', url: 'https://vidhijudicial.com/sec-47-to-49-(chapter-vii-special-obligations-of-landlords-and-tenants)the-karnataka-rent-act,-1999.html' };
const KA_PEN: Src = { label: 'Karnataka Rent Act, 1999, section 54 (text on Vidhi Judicial, before the 2025 amendment)', url: 'https://vidhijudicial.com/sec-50-to-70-(chapter-viii-miscellaneous)the-karnataka-rent-act,-1999.html' };
const KA_AMD: Src = { label: 'Khaitan & Co: Karnataka Rent (Amendment) Act, 2025 (Act 7 of 2026), April 2026', url: 'https://www.khaitanco.com/sites/default/files/2026-04/17042026%20-%20ERGO%20-%20Karnataka%20Rent%20(Amendment)%20Act.pdf' };
const MH = (s: number, what: string): Src => ({ label: `Maharashtra Rent Control Act, 1999, section ${s}: ${what} (text on AdvocateKhoj)`, url: `https://www.advocatekhoj.com/library/bareacts/maharashtrarentcontrol/${s}.php` });
const KA_ADOPT = 'Whether Karnataka has adopted the Model Tenancy Act. It is not among the adopters a March 2026 fact check names; no official notification was read.';
const MH_ADOPT = 'Whether Maharashtra has adopted the Model Tenancy Act. It is not among the adopters a March 2026 fact check names; no official notification was read.';
const TS_ADOPT = 'An official Telangana notification either way. This rests on secondary sources.';
const COVER = (st: string) => `Which flats the ${st} act covers: it has exemptions this tool did not check.`;
const v = (status: ClaimStatus, basis: Basis, text: string, sources: Src[], unverified?: string): Verdict => ({ status, basis, text, sources, unverified, checked: CHECKED });

export const CLAIMS: Claim[] = [
  {
    id: 'deposit-cap', claim: "Security deposit is now capped at 2 months' rent",
    mta: "Section 11 of the Model Tenancy Act, 2021: at most two months' rent for a home, refunded when the landlord takes back possession, less the tenant's dues.",
    states: {
      telangana: v('mta', 'commentary', "This is the Model Tenancy Act's figure, and Telangana has not adopted that Act. Where the 1960 control act applies, section 7 allows an advance of only one month's rent, which is stricter; but newer and higher-rent flats are outside that act, so for most leases the deposit is whatever the agreement says.", [MTA, TS_MTA, TS_ACT], TS_ADOPT),
      karnataka: v('mta', 'act', "The Model Tenancy Act's figure. No cap on a security deposit was found in sections 4 to 16 of the Karnataka Rent Act, 1999 (the chapter on regulating rent), and a law firm's note on the 2025 amendment says it did not change deposit limits.", [MTA, KA_RENT, KA_AMD], `${KA_ADOPT} The rest of the Karnataka act was not read.`),
      maharashtra: v('mta', 'commentary', "The Model Tenancy Act's figure. No cap on a refundable security deposit was found in the sections of the Maharashtra Rent Control Act, 1999 read for this check.", [MTA, FACTCHECK], `${MH_ADOPT} The Maharashtra act was not read in full.`),
    },
  },
  {
    id: 'rent-hike', claim: "Rent can go up only once a year, with 90 days' notice",
    mta: 'Not in the Model Tenancy Act, 2021 either: its section 9 says rent is revised according to the terms of the agreement, and disputes go to the Rent Authority (section 10).',
    states: {
      telangana: v('false', 'act', 'No such rule. The Model Tenancy Act leaves the rise to the agreement, and the 1960 control act instead lets the Rent Controller fix a fair rent in the buildings it covers. Your agreement decides when and by how much the rent rises.', [MTA, TS_ACT]),
      karnataka: v('false', 'act', 'No such rule. The Karnataka Rent Act allows a rise for improvements the landlord paid for (section 9: up to 10% of that cost a year) after a written notice (section 10), with no 90-day figure. Otherwise the agreement decides.', [MTA, KA_RENT], COVER('Karnataka')),
      maharashtra: v('false', 'act', 'No such rule. In premises the Maharashtra act covers, section 11 allows a 4% increase a year, and it states no notice period. Otherwise the agreement decides.', [MTA, MH(11, 'permitted increases')], COVER('Maharashtra')),
    },
  },
  {
    id: 'entry-notice', claim: "The landlord must give 24 hours' notice before entering",
    mta: 'Section 17 of the Model Tenancy Act, 2021: written or electronic notice at least 24 hours before entry, stating the day, time and reason, only between sunrise and sunset, except in emergencies.',
    states: {
      telangana: v('mta', 'act', "The Model Tenancy Act's rule, not adopted in Telangana. The 1960 control act has no notice rule for a landlord's entry; it lets only the Rent Controller inspect (section 31). Put a notice period in your agreement.", [MTA, TS_ACT], TS_ADOPT),
      karnataka: v('unverified', 'act', "The Karnataka Rent Act (section 48(3)) lets the landlord enter and inspect after notice 'in the prescribed manner'. The rules that set that notice were not read, so the 24-hour figure is not confirmed for Karnataka. 24 hours is the Model Tenancy Act's figure.", [KA_REPAIR, MTA], 'The notice period in the Karnataka rules.'),
      maharashtra: v('unverified', 'commentary', "No landlord-entry rule was found in the sections of the Maharashtra Rent Control Act read for this check. 24 hours is the Model Tenancy Act's figure.", [MTA], 'The Maharashtra act was not read in full, so a rule elsewhere in it is not ruled out.'),
    },
  },
  {
    id: 'registration', claim: 'Every rent agreement must be registered within 60 days',
    mta: "Section 4 of the Model Tenancy Act, 2021: landlord and tenant inform the Rent Authority within two months of the agreement. That is the source of the 'two months' or '60 days' figure.",
    states: {
      telangana: v('mta', 'act', "The two-month deadline is the Model Tenancy Act's, not adopted in Telangana, and the 1960 control act has no lease-registration rule. What does apply: under the Registration Act, 1908, a lease of more than one year must be registered. Most 11-month agreements are notarised on stamp paper instead.", [MTA, TS_ACT, { label: 'Registration Act, 1908, s.17(1)(d) (see the reference note on 11-month leases)' }], TS_ADOPT),
      karnataka: v('unverified', 'act', 'Section 4 of the Karnataka Rent Act requires a written agreement, presented for registration with the prescribed authority within a time set by the rules; not doing so carries a penalty (section 54(1)(i)). The rules were not read, so the 60-day figure is not confirmed.', [KA_RENT, KA_PEN], 'The time limit in the Karnataka rules, and which flats the act covers.'),
      maharashtra: v('partly', 'act', 'Registration, yes; 60 days, not found. Section 55 makes every leave-and-licence or tenancy agreement made after the act compulsorily registered, and puts that duty on the landlord. The section names no 60-day period.', [MH(55, 'compulsory registration')], COVER('Maharashtra')),
    },
  },
  {
    id: 'fine', claim: 'Breaking the new rules means a Rs 50,000 fine or jail',
    mta: "No Rs 50,000 fine was found in the Model Tenancy Act, 2021. Its money penalties are tied to rent, for example compensation of up to two months' rent for cutting essential supplies (section 20).",
    states: {
      telangana: v('false', 'act', 'Not true here. The Telangana 1960 control act sets fines of up to Rs 2,000 (section 29), and Telangana has not adopted the Model Tenancy Act.', [TS_ACT, MTA]),
      karnataka: v('partly', 'commentary', "Some Karnataka penalties now reach Rs 50,000, but not for an ordinary tenant or for the paperwork. The 2025 amendment (Act 7 of 2026) removed jail and raised the penalties: up to Rs 50,000 for unlawful subletting by a tenant, a landlord's false affidavit, or unlawful re-letting (section 54(1)(iv), (v), (vii)). Not presenting the agreement for registration costs up to Rs 2,000 plus Rs 5,000.", [KA_AMD, KA_PEN], "The amendment's commencement date; the figures come from a law firm's summary, not the gazette."),
      maharashtra: v('partly', 'act', "The jail part has a real basis, for landlords only: section 55(3) punishes a landlord who does not register the agreement with up to three months' imprisonment, a fine of up to Rs 5,000, or both. No Rs 50,000 fine was found.", [MH(55, 'compulsory registration')], 'The Maharashtra act was not read in full.'),
    },
  },
  {
    id: 'eviction', claim: 'A tenant can be evicted only through due legal process',
    mta: 'Section 21 of the Model Tenancy Act, 2021: no eviction during the tenancy except by order of the Rent Court on listed grounds.',
    states: {
      telangana: v('in-force', 'act', 'True. Where the 1960 control act applies, only the Rent Controller can order eviction, on listed grounds (section 10). Elsewhere the tenancy ends by notice under the Transfer of Property Act and possession is recovered through a civil suit. Lock-outs and cutting supplies are not the route.', [TS_ACT, TS_MTA]),
      karnataka: v('in-force', 'act', 'True for the premises the act covers. Section 27 of the Karnataka Rent Act: no order for recovery of possession except on the grounds it lists, made by the court.', [KA_EVICT], COVER('Karnataka')),
      maharashtra: v('in-force', 'act', 'True for the premises the act covers. Section 16 of the Maharashtra Rent Control Act: a landlord recovers possession only if the court is satisfied on one of the listed grounds.', [MH(16, 'when a landlord may recover possession')], COVER('Maharashtra')),
    },
  },
  {
    id: 'refund-deadline', claim: 'The deposit must be refunded within a fixed time',
    mta: "Section 11(2) of the Model Tenancy Act, 2021: refunded on the day the landlord takes back vacant possession, less the tenant's dues.",
    states: {
      telangana: v('mta', 'act', "The refund-at-handover rule is the Model Tenancy Act's, not adopted in Telangana. The 1960 control act sets no refund deadline. So the deadline you can rely on is the one written in your agreement: ask for one before signing.", [MTA, TS_ACT, TS_MTA], TS_ADOPT),
      karnataka: v('mta', 'commentary', "The refund-at-handover rule is the Model Tenancy Act's. No refund deadline was found in the sections of the Karnataka Rent Act read for this check.", [MTA, KA_RENT], `${KA_ADOPT} The Karnataka act was not read in full.`),
      maharashtra: v('mta', 'commentary', "The refund-at-handover rule is the Model Tenancy Act's. No refund deadline was found in the sections of the Maharashtra act read for this check.", [MTA], `${MH_ADOPT} The Maharashtra act was not read in full.`),
    },
  },
  {
    id: 'repair-deduct', claim: 'If the landlord will not repair, the tenant can repair and cut the cost from the rent',
    mta: "Section 15(4) of the Model Tenancy Act, 2021: if the landlord refuses agreed repairs, the tenant may do them and deduct the cost from later rent, at most 50% of a month's rent in any month.",
    states: {
      telangana: v('partly', 'act', "Only with the Rent Controller's permission, and only in buildings the 1960 control act covers. Section 19: if the landlord does not make necessary repairs after notice, the Controller may let the tenant make them and deduct the cost, up to one twelfth of the year's rent. Do not deduct on your own.", [TS_ACT], COVER('Telangana')),
      karnataka: v('partly', 'act', "Only with the Controller's permission. Section 47(2) of the Karnataka Rent Act: if necessary repairs are not made within three months of written notice, the Controller may let the tenant make them and deduct the cost, up to half of that year's rent.", [KA_REPAIR], COVER('Karnataka')),
      maharashtra: v('partly', 'act', "Yes, within a limit, in premises the act covers. Section 14(2) of the Maharashtra Rent Control Act: if the landlord does not make a needed repair within a reasonable time after 15 days' written notice, the tenant may make it and deduct the cost from rent, up to one quarter of that year's rent. Keep the vouchers.", [MH(14, "landlord's duty to keep premises in repair")], COVER('Maharashtra')),
    },
  },
];
