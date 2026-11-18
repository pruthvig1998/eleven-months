// Bundled reference notes: short plain-language summaries of public rental-law points, with sources and status.
// Not legal advice. Facts were checked against secondary commentary on 2026-11-17, not the enacted text:
// verify against the current act and your state's rules. No personal data. Add a note by appending to NOTES.
export type Status = 'law' | 'model-law' | 'tool' | 'tip';
// Basis = how we know it (the trust level shown to the user), separate from status (what kind of rule it is).
//   official   : taken from a government body's own site
//   act        : the act text itself, read on a legal database copy (not the government's own site)
//   court      : taken from a court order
//   commentary : legal commentary or news describing the law; the act text itself was not read
//   reports    : what tenants, advocates on Q&A forums and news reports say happens in practice; not verified
//   practice   : common practice or a practical tip, not a legal rule
//   tool       : a choice made by this tool
export type Basis = 'official' | 'act' | 'court' | 'commentary' | 'reports' | 'practice' | 'tool';
export type Scope = 'india' | 'telangana';
export const BASIS_LABEL: Record<Basis, string> = {
  official: 'Government source', act: 'Act text, database copy', court: 'Court order', commentary: 'Commentary or news, not the official text', reports: 'Reported online, not verified', practice: 'Common practice', tool: "This tool's choice",
};
export interface Note {
  id: string; title: string; summary: string; status: Status; tags: string[];
  sources: { label: string; url?: string }[]; checked: string;
  basis: Basis; scope: Scope;
  unverified?: string; // what could not be confirmed, in plain words
}

const CHECKED = '2026-11-17';
export const NOTES: Note[] = [
  {
    id: 'tpa-106', basis: 'commentary', scope: 'india', status: 'law', checked: CHECKED,
    title: "Notice to end a month-to-month tenancy: 15 days",
    summary: "Under Section 106 of the Transfer of Property Act, 1882, a lease with no fixed term (other than agricultural or manufacturing) is treated as month to month and ends on 15 days' notice from either side. Courts also treat an unregistered lease over a year as month to month. A notice period much shorter than 15 days, or one binding only the tenant, deserves a second look.",
    tags: ['notice', 'terminate', 'termination', 'vacate', 'evict', 'eviction', 'month-to-month', '15 days', 'days'],
    sources: [{ label: 'Transfer of Property Act, 1882, s.106 (summarised from court and legal commentary; check the act text)' }],
  },
  {
    id: 'reg-17', basis: 'commentary', scope: 'india', status: 'law', checked: CHECKED,
    title: 'Leases over one year must be registered (why leases run 11 months)',
    summary: "Section 17(1)(d) of the Registration Act, 1908 requires registration of leases from year to year or for more than one year. An unregistered lease over a year is generally treated as month to month, not as the long term written down. This is why many residential agreements are written for 11 months. A term of 12 months or more with no mention of registration is worth asking about.",
    tags: ['registration', 'register', 'registered', 'stamp', 'stamp duty', '11 months', 'eleven', 'term', 'year', 'lease'],
    sources: [{ label: 'Registration Act, 1908, s.17(1)(d) (summarised from commentary; check the act text and state stamp duty rules)' }],
  },
  {
    id: 'mta-deposit', basis: 'commentary', scope: 'india', unverified: "Telangana had not adopted the Act as of late 2025 (secondary sources), so this is a benchmark there, not an enforceable rule.", status: 'model-law', checked: CHECKED,
    title: "Model Tenancy Act 2021: deposit cap of 2 months' rent (residential)",
    summary: "The Model Tenancy Act, 2021 sets a security deposit cap of two months' rent for residential premises (six months for non-residential), with the deposit to be refunded when the tenant leaves, less genuine dues. It is a model law: it binds only states that adopt it, so it is a benchmark, not a rule that a Telangana lease must meet. A deposit of ten months' rent is far above it.",
    tags: ['deposit', 'security', 'refund', 'months rent', 'forfeit', 'cap'],
    sources: [{ label: 'PRS Legislative Research: The Model Tenancy Act, 2021', url: 'https://prsindia.org/billtrack/the-model-tenancy-act-2021' }, 
      { label: 'Business Today summary', url: 'https://www.businesstoday.in/personal-finance/real-estate/story/model-tenancy-act-how-new-security-deposits-rent-agreement-entry-exit-rules-will-benefit-tenants-landlords-504839-2025-12-03' },
      { label: 'Mondaq summary', url: 'https://www.mondaq.com/india/landlord-tenant-leases/1632576/model-tenancy-act-security-deposit-to-rent-hike-all-you-need-to-know' },
    ],
  },
  {
    id: 'mta-entry', basis: 'commentary', scope: 'india', unverified: "The allowed hours of entry. Telangana had not adopted the Act as of late 2025 (secondary sources), so this is a benchmark there, not an enforceable rule.", status: 'model-law', checked: CHECKED,
    title: 'Model Tenancy Act 2021: 24 hours written notice before landlord entry',
    summary: "The Model Tenancy Act, 2021 expects a landlord to give the tenant written (or electronic) notice at least 24 hours before entering the premises, with exceptions for emergencies such as fire or flood. A right to enter at any time without notice is well outside that benchmark. The allowed hours of entry (one commentary says 7 am to 8 pm) are unverified.",
    tags: ['entry', 'enter', 'inspect', 'inspection', 'access', 'notice', '24 hours', 'privacy'],
    sources: [{ label: 'Forum IAS summary', url: 'https://forumias.com/blog/?p=110347' }],
  },
  {
    id: 'mta-written', basis: 'commentary', scope: 'india', unverified: "Telangana had not adopted the Act as of late 2025 (secondary sources), so this is a benchmark there, not an enforceable rule.", status: 'model-law', checked: CHECKED,
    title: 'Model Tenancy Act 2021: written agreement and Rent Authority',
    summary: "The Model Tenancy Act, 2021 expects a written tenancy agreement and provides for a state Rent Authority where agreements are registered and disputes go. Where a state has adopted the Act, renting without a written agreement is not allowed. Check whether your state has adopted it.",
    tags: ['written', 'agreement', 'rent authority', 'registration', 'dispute', 'arbitration', 'court', 'tribunal'],
    sources: [{ label: 'Drishti IAS summary', url: 'https://drishtiias.com/pdf/1731879214.pdf' }],
  },
  {
    id: 'mta-adoption', basis: 'commentary', scope: 'telangana', unverified: "An official Telangana notification either way. This rests on three secondary sources, the latest from 2026.", status: 'model-law', checked: CHECKED,
    title: "Telangana has not adopted the Model Tenancy Act (as of late 2025)",
    summary: "The Model Tenancy Act, 2021 is a template for states: PRS Legislative Research calls it only a suggestive framework, since housing is a state subject. It binds only states that pass their own version. Three sources, including a Telangana law firm writing in September 2026, say Telangana had not adopted it as of late 2025, and that tenancies there are still governed by the 1960 control act where it applies, and otherwise by the agreement and the Transfer of Property Act. Andhra Pradesh is cited as a state that has adopted it. So in Telangana, treat the Model Tenancy Act's numbers as benchmarks to negotiate with, not rights you can enforce.",
    tags: ['model', 'adopted', 'telangana', 'state', 'binding', 'hyderabad'],
    sources: [{ label: 'SN Law Chambers: rent control act vs Transfer of Property Act suit (Sept 2026)', url: 'https://snlawchambers.in/blog/tenant-eviction-medchal-rent-control-act-vs-transfer-of-property-act/' }, { label: 'PRS Legislative Research: The Model Tenancy Act, 2021', url: 'https://prsindia.org/billtrack/the-model-tenancy-act-2021' }, { label: 'Commoner Law, Telangana tenant rights (commentary)', url: 'https://commoner-law.com/india/housing-rights/tenant-rights/telangana' }],
  },
  {
    id: 'ts-rca', basis: 'act', scope: 'telangana', status: 'law', checked: '2026-11-18',
    unverified: "Whether your own building is covered: that turns on its 2005 rent and its age, which only you or a lawyer can check. The act text is a database copy dated 2016, updated 2019.",
    title: 'Telangana rent control act: who it covers and how eviction works',
    summary: "The Telangana Buildings (Lease, Rent and Eviction) Control Act, 1960 applies in Hyderabad, Secunderabad and the municipal corporations and municipalities of Telangana (section 1). But section 32 leaves many leases out: buildings whose rent was above Rs 3,500 a month in municipal corporation areas (Rs 2,000 elsewhere), buildings for 15 years after construction or substantial renovation, and government buildings. A Telangana law firm writing in September 2026 says the test is the rent as on 28 May 2005, not today's market rent, and treats these limits as current. So an older building with a low 2005 rent can still be covered, while newer and higher-rent flats are outside the Act. Outside it, the agreement and the Transfer of Property Act apply: 15 days' notice to end a monthly tenancy, then a civil suit for possession. Where the Act does apply, a tenant can be evicted only by order of the Rent Controller (section 10), on listed grounds: rent unpaid 15 days after the due date (if the default was not wilful, the Controller may give 15 more days to pay), sub-letting or change of use without written consent, damage, nuisance, having other accommodation or leaving the place empty for four months, and bad-faith denial of the landlord's title; or the landlord's genuine need for his own use, but not before an agreed term ends. Appeals go within 30 days to the Chief Judge, Small Causes Court (Hyderabad and Secunderabad), then to the High Court in revision.",
    tags: ['telangana', 'hyderabad', 'secunderabad', 'rent control', 'rent controller', 'eviction', 'evict', 'landlord', 'tenant', 'wilful default', 'sub-letting', 'section 10', 'section 32', '3500', 'covered', 'applies'],
    sources: [{ label: 'SN Law Chambers: which tenancies the Act covers (Sept 2026)', url: 'https://snlawchambers.in/blog/tenant-eviction-medchal-rent-control-act-vs-transfer-of-property-act/' }, 
      { label: 'Act text on Indian Kanoon (sections 1, 10, 20, 22, 32)', url: 'https://indiankanoon.org/doc/34729102/' },
      { label: 'India Code: Act 15 of 1960 (official; could not be opened by this tool)', url: 'https://www.indiacode.nic.in/handle/123456789/8607' },
    ],
  },
  {
    id: 'ts-amenities', basis: 'act', scope: 'telangana', status: 'law', checked: '2026-11-18',
    unverified: 'Whether your building is covered by the Act at all (see the coverage note), and the current fine amount.',
    title: 'Telangana rent control act, section 14: amenities cannot be cut',
    summary: "Where the Telangana control act applies, section 14 says a landlord may not, without just or sufficient cause, cut off or withhold amenities the tenant enjoys. The explanation lists water, electricity, passages, staircases, lights, lavatories, lifts and sanitary services. The tenant can apply to the Rent Controller, who may order restoration straight away, before hearing the landlord, and then decide finally after an inquiry. Section 29 sets a fine of up to Rs 2,000. If supply stops because the landlord did not pay a bill or tax, the tenant may pay it and deduct the amount from the rent. This helps only if the Act covers the building; newer buildings and those whose rent was above Rs 3,500 a month in 2005 are outside it.",
    tags: ['water', 'electricity', 'power', 'amenities', 'cut off', 'disconnect', 'supply', 'lift', 'section 14', 'rent controller', 'telangana', 'restore'],
    sources: [{ label: 'Act text on Indian Kanoon (sections 14, 29)', url: 'https://indiankanoon.org/doc/34729102/' }],
  },
  {
    id: 'ts-advance', basis: 'act', scope: 'telangana', status: 'law', checked: '2026-11-18',
    unverified: 'Whether your building is covered by the Act at all. The Act speaks of an advance and a premium; it does not use the words security deposit.',
    title: 'Telangana rent control act, section 7: advance limited to one month',
    summary: "Where the Telangana control act applies, section 7 bars a landlord from taking any premium, and allows an advance of not more than one month's rent. Terms to the contrary are void, and section 29 sets a fine of up to Rs 2,000. This is far stricter than the large deposits common in practice, but it reaches only buildings the Act covers: section 32 leaves out buildings under 15 years old and those whose rent was above Rs 3,500 a month in 2005 (corporation areas), which covers much of the current market.",
    tags: ['advance', 'deposit', 'premium', 'one month', 'section 7', 'telangana', 'security', 'pagdi'],
    sources: [{ label: 'Act text on Indian Kanoon (sections 7, 29, 32)', url: 'https://indiankanoon.org/doc/34729102/' }],
  },
  {
    id: 'tool-thresholds', basis: 'tool', scope: 'india', status: 'tool', checked: CHECKED,
    title: "This tool's screening thresholds (not law)",
    summary: "To mark a clause risky the tool uses simple thresholds: a deposit above 3 months' rent, a rent increase above 10% a year, notice under 15 days (matching the Transfer of Property Act default) or notice that binds only one side, and a lock-in that binds only the tenant. They are screening choices by the tool's builder to prompt a closer look. A flagged clause is not necessarily unlawful, and an unflagged one is not necessarily fair.",
    tags: ['threshold', 'risky', 'flag', 'deposit', 'escalation', 'rent increase', 'lock-in', 'notice'],
    sources: [{ label: 'Eleven Months rules (rules/extract.ts)' }],
  },
  {
    id: 'tip-receipts', basis: 'practice', scope: 'india', status: 'tip', checked: CHECKED,
    title: 'Practical tip: keep a paper trail for rent and deposit',
    summary: "Pay rent and deposit by bank transfer or cheque and ask for a written receipt. A clause that says the landlord's own record is conclusive, or that the tenant gets no receipt, leaves you without proof of payment. This is a practical tip, not a legal citation.",
    tags: ['receipt', 'cash', 'rent', 'proof', 'payment', 'record', 'bank transfer'],
    sources: [],
  },
  {
    id: 'tip-handover', basis: 'practice', scope: 'india', status: 'tip', checked: CHECKED,
    title: 'Practical tip: record the flat condition and the refund timeline',
    summary: "Photograph the flat and list fixtures at handover, and get the deposit refund deadline in writing (for example, within a fixed number of days of vacating). A deposit that is refunded only after the landlord finds a new tenant, with no time limit, depends on events you do not control. This is a practical tip, not a legal citation.",
    tags: ['deposit', 'refund', 'handover', 'condition', 'photos', 'inventory', 'deductions', 'damage', 'wear and tear', 'repairs'],
    sources: [],
  },
  {
    id: 'mta-holdover', basis: 'commentary', scope: 'india', unverified: "Telangana had not adopted the Act as of late 2025 (secondary sources), so this is a benchmark there, not an enforceable rule.", status: 'model-law', checked: CHECKED,
    title: 'Model Tenancy Act 2021: overstaying costs double rent, then four times',
    summary: "Under the Model Tenancy Act, 2021 a tenant who does not leave when the tenancy ends owes the landlord double the monthly rent for the first two months and four times the monthly rent after that. A lease that charges more than that for staying on, or starts a high multiple on day one, goes beyond the benchmark. It is a model law, so it applies only where a state has adopted it.",
    tags: ['holdover', 'overstay', 'stay', 'beyond', 'expiry', 'double rent', 'four times', 'penalty', 'vacate'],
    sources: [{ label: 'PRS Legislative Research: The Model Tenancy Act, 2021', url: 'https://prsindia.org/billtrack/the-model-tenancy-act-2021' }, 
      { label: 'Mondaq: analysis of the Model Tenancy Act', url: 'https://mondaq.com/india/landlord-tenant-leases/1082712/analysis-of-the-new-model-tenancy-act' },
      { label: 'Citizen Matters explainer', url: 'https://citizenmatters.in/guide-to-model-tenancy-act-2021-takeaways-for-landlords-and-tenants-26037' },
    ],
  },
  {
    id: 'mta-essential-supply', basis: 'commentary', scope: 'india', unverified: "Telangana had not adopted the Act as of late 2025 (secondary sources), so this is a benchmark there, not an enforceable rule.", status: 'model-law', checked: CHECKED,
    title: 'Model Tenancy Act 2021: essential services cannot be cut',
    summary: "The Model Tenancy Act, 2021 bars a landlord from withholding essential services such as water, electricity, piped cooking gas, and lift and passage lights. The Rent Authority can order them restored at once and award compensation of up to two months' rent. A lease clause that lets the landlord cut water or power to press the tenant runs against that benchmark. Model law: applies only where a state has adopted it.",
    tags: ['water', 'electricity', 'power', 'supply', 'cut off', 'disconnect', 'essential services', 'lift', 'gas', 'withhold'],
    sources: [{ label: 'PRS Legislative Research: The Model Tenancy Act, 2021', url: 'https://prsindia.org/billtrack/the-model-tenancy-act-2021' }, { label: 'Mondaq: analysis of the Model Tenancy Act', url: 'https://mondaq.com/india/landlord-tenant-leases/1082712/analysis-of-the-new-model-tenancy-act' }],
  },
  {
    id: 'mta-repairs', basis: 'commentary', scope: 'india', unverified: "Telangana had not adopted the Act as of late 2025 (secondary sources), so this is a benchmark there, not an enforceable rule.", status: 'model-law', checked: CHECKED,
    title: 'Model Tenancy Act 2021: who pays for repairs',
    summary: "As commentators summarise it, the Model Tenancy Act, 2021 makes the landlord responsible for structural repairs and the tenant responsible for small day-to-day items such as drain cleaning, wash basin repairs, geyser repairs, and switches and sockets. A clause making the tenant pay for roof, wiring or plumbing problems is the reverse of that split. Model law: a benchmark, not a rule in states that have not adopted it.",
    tags: ['repairs', 'repair', 'maintenance', 'structural', 'roof', 'wiring', 'plumbing', 'leak', 'landlord', 'tenant', 'geyser', 'fix'],
    sources: [{ label: 'PRS Legislative Research: The Model Tenancy Act, 2021', url: 'https://prsindia.org/billtrack/the-model-tenancy-act-2021' }, { label: 'The Print: what could change for tenants and landlords', url: 'https://theprint.in/theprint-essential/rent-security-maintenance-what-could-change-for-tenant-landlord-under-model-tenancy-act/671876' }],
  },
  {
    id: 'mta-eviction', basis: 'commentary', scope: 'india', unverified: "Telangana had not adopted the Act as of late 2025 (secondary sources), so this is a benchmark there, not an enforceable rule.", status: 'model-law', checked: CHECKED,
    title: 'Model Tenancy Act 2021: eviction goes through the Rent Authority',
    summary: "Under the Model Tenancy Act, 2021 a landlord who wants a tenant out must apply to the Rent Authority. Not paying the agreed rent (commentary mentions more than two months) is one listed ground. Locking out, cutting supplies or demanding that the tenant vacate immediately is not the route. Where a state has not adopted the Act, the Telangana control act note describes the position for Hyderabad and Secunderabad.",
    tags: ['evict', 'eviction', 'rent authority', 'non-payment', 'vacate', 'forthwith', 'immediately', 'lock out', 'terminate'],
    sources: [{ label: 'PRS Legislative Research: The Model Tenancy Act, 2021', url: 'https://prsindia.org/billtrack/the-model-tenancy-act-2021' }, { label: 'Mondaq: analysis of the Model Tenancy Act', url: 'https://mondaq.com/india/landlord-tenant-leases/1082712/analysis-of-the-new-model-tenancy-act' }],
  },
  {
    id: 'stamp-ts', basis: 'commentary', scope: 'telangana', unverified: "A current Telangana schedule showing the lease entry. The 0.4% figure comes from the Andhra Pradesh schedule Telangana inherited; Telangana's 2021 revision order, which I read in full, does not list leases, so it appears unchanged. Use the department's duty and fee calculator to confirm.", status: 'tip', checked: CHECKED,
    title: 'Stamp duty and registration for an 11-month rent agreement (Hyderabad)',
    summary: "Most 11-month residential agreements in Hyderabad are written on stamp paper and notarised, not registered. For a lease under one year, the stamp duty is 0.4% of the total amount payable: that is the rate in the Andhra Pradesh Schedule I-A (Article 31) that Telangana inherited, two third-party sites agree, and Telangana's 2021 revision of stamp duties does not touch leases. The registration fee, if you register, is 0.2% (official Table of Fees). Other sites quote 0.5% duty or a Rs 100 minimum, so confirm with the department's duty and fee calculator. An unregistered lease of 12 months or more may not be accepted as evidence of its terms (see the registration note).",
    tags: ['stamp', 'stamp duty', 'stamp paper', 'notary', 'notarised', 'registration', '11 months', 'hyderabad', 'telangana', 'igrs', 'fee'],
    sources: [
      { label: 'Andhra Pradesh Schedule I-A, Article 31 (copy hosted on ipindia.gov.in)', url: 'https://ipindia.gov.in/storage/uploads/reference/45DM70jW0RawZcZ32VSNqzACGEkqGtLWmNYo0kr5.pdf' }, 
      { label: 'Telangana Registration and Stamps Department (official portal, with a duty and fee calculator)', url: 'https://registration.telangana.gov.in' },
      { label: 'Landeed: rent agreement registration in Telangana', url: 'https://web.landeed.com/products/telangana/rent-agreement-registration' },
      { label: 'CalcGuru: rent agreement stamp duty in Telangana', url: 'https://calcguru.in/rent-agreement-stamp-duty-telangana/' },
      { label: 'Housing.com: rent agreement in Hyderabad', url: 'https://housing.com/news/rent-agreement-hyderabad/' },
    ],
  },
  {
    id: 'tds-194ib', basis: 'commentary', scope: 'india', unverified: "The section number under the Income-tax Act, 2025, and how rent for April to September 2024 is treated. The rate change itself is not confirmed from the tax department's own site.", status: 'law', checked: CHECKED,
    title: 'Tax on rent: TDS when rent is above Rs 50,000 a month (Section 194-IB)',
    summary: "If an individual or HUF tenant who is not under tax audit pays rent above Rs 50,000 a month to a resident landlord, the tenant must deduct tax at source and deposit it using Form 26QC. A PAN is needed; a TAN is not. The rate is 2% from 1 October 2024, cut from 5% by the Finance (No. 2) Act, 2024, so older guides that say 5% are out of date. The Income-tax Act, 2025 may renumber the section from April 2026. Many salaried tenants also hand over rent receipts to claim HRA.",
    tags: ['tds', 'tax', '194ib', 'form 26qc', 'pan', 'hra', 'receipts', 'rent', '50000', 'deduct'],
    sources: [{ label: 'TaxGuru: section 194-IB rate reduced to 2% from 1 October 2024', url: 'https://taxguru.in/income-tax/section-194-ib-tds-rate-reduced-rent-2percent-wef-01st-october-2024.html' }, 
      { label: 'Business Standard: paying rent above Rs 50,000', url: 'https://www.business-standard.com/amp/finance/personal-finance/paying-rent-above-rs-50-000-deduct-tds-or-face-income-tax-default-notice-125041500738_1.html' },
      { label: 'Quicko: Section 194IB', url: 'https://learn.quicko.com/section-194ib-tds-on-rent-of-property' },
    ],
  },
  {
    id: 'legal-aid', basis: 'official', scope: 'india', status: 'law', checked: '2026-11-18',
    unverified: "Which income ceiling is current. The Telangana authority's own page says Rs 1,00,000 a year. A web search on 18 Nov 2026 suggests the Rs 3 lakh figure belongs to Andhra Pradesh, not Telangana, but the NALSA pages that would confirm this could not be opened. Ask when you call.",
    title: "Free legal aid: NALSA helpline 15100 and the Telangana authority",
    summary: "The National Legal Services Authority (NALSA) runs a toll-free legal aid helpline, 15100, and takes applications online at nalsa.gov.in/lsams. In Telangana, the State Legal Services Authority is at Nyaya Seva Sadan, 1st floor, City Civil Court Premises, Purani Haveli, Hyderabad 500 002 (telefax 040-23446723, email telenganaslsa@gmail.com). Its site lists who gets free legal services under section 12 of the Legal Services Authorities Act, 1987: members of Scheduled Castes and Scheduled Tribes, women and children, persons with disabilities, victims of trafficking, disasters or caste atrocities, industrial workmen, people in custody, and anyone else whose annual income does not exceed Rs 1,00,000. You can also walk in to the District Legal Services Authority at your local court complex. They can advise on a tenancy dispute or point you to the right forum.",
    tags: ['legal aid', 'lawyer', 'free', 'helpline', '15100', 'nalsa', 'dlsa', 'help', 'advice', 'court', 'dispute'],
    sources: [{ label: 'Telangana State Legal Services Authority: who is entitled', url: 'https://tslsa.telangana.gov.in/legal-services.php' }, { label: 'Telangana State Legal Services Authority: contact', url: 'https://tslsa.telangana.gov.in/contact-ts-legal-service-authority.php' }, 
      { label: 'NALSA (National Legal Services Authority)', url: 'https://nalsa.gov.in/promoting-inclusive-legal-system/' },
      { label: 'NALSA online application', url: 'https://nalsa.gov.in/lsams' },
    ],
  },
  {
    id: 'police-verification', basis: 'commentary', scope: 'telangana', status: 'tip', checked: '2026-11-18',
    unverified: "The legal basis and whether it is mandatory. Sources conflict: some guides call it a legal mandate, one says it is not mandatory, and none names a Hyderabad statute. I could not find the police department's own page.",
    title: 'Tenant police verification in Hyderabad',
    summary: "News reports say Hyderabad police ask landlords to register every tenant before they move in, and that the Hawk Eye mobile app has a module for landlords to upload a tenant's details, ID and photograph. Paper forms are reported to be available at the local police station. Expect a landlord to ask for your ID and a photo for this. Reported timelines range from a few working days to a week. These are news and property-site reports, not a police notice I could read.",
    tags: ['police', 'verification', 'hawk eye', 'hawkeye', 'tenant', 'id', 'hyderabad', 'cyberabad', 'register', 'landlord'],
    sources: [
      { label: 'Siasat: verify tenants or face action', url: 'https://www.siasat.com/verify-tenants-or-face-action-hyderabad-police-warn-landlords-3507308/' },
      { label: 'Telangana Today: police caution house owners', url: 'https://telanganatoday.com/police-caution-house-owners-in-hyderabad' },
    ],
  },
  {
    id: 'regfee-ts', basis: 'official', scope: 'telangana', status: 'law', checked: '2026-11-18',
    unverified: 'Whether the table has been revised since 2021, and the stamp duty that is charged on top.',
    title: 'Official registration fee for a lease in Telangana: 0.2%',
    summary: "The Telangana Registration and Stamps Department's Table of Fees, made under section 78 of the Registration Act, 1908 and in force from 2 September 2021, sets the registration fee for a lease at 0.2% (Category 1, serial no. 6). A licence is also 0.2%. This is the government fee for registering the document; stamp duty is separate. If someone quotes a much larger 'registration charge', ask for the break-up and the official receipt.",
    tags: ['registration', 'fee', 'lease', '0.2', 'official', 'telangana', 'sub-registrar', 'stamp', 'charges', 'table of fees'],
    sources: [{ label: 'Telangana Registration and Stamps Department: Table of Fees (2021), read on the official portal', url: 'https://registration.telangana.gov.in/RegistrationFees.htm' }],
  },
  {
    id: 'rw-deposit-deductions', basis: 'reports', scope: 'india', status: 'tip', checked: '2026-11-18',
    unverified: 'How common this is. These are individual cases on advocate Q&A forums, including Hyderabad and Bangalore, not a survey.',
    title: 'What tenants report: painting and other deductions from the deposit',
    summary: "On advocate Q&A forums, tenants often report landlords keeping a month's rent or more for 'painting', cleaning or unnamed charges, sometimes with no bills. The advocates' answers are consistent: painting can be deducted only if the agreement says so; ordinary wear and tear is not the tenant's cost; ask for itemised bills; getting quotes from two painters helps show a demand is inflated; and the usual route is a written demand, then a legal notice, then a recovery suit. So settle the painting clause before signing, and keep move-out photos.",
    tags: ['deposit', 'painting', 'deduction', 'deductions', 'refund', 'cleaning', 'whitewash', 'wear and tear', 'not returned', 'reality', 'real world'],
    sources: [
      { label: 'Kaanoon: landlord deducted 42% from the deposit', url: 'https://www.kaanoon.com/286741/landlord-deducted-42-from-rent-deposit-citing-various-reasons' },
      { label: 'Kaanoon: exorbitant painting charges', url: 'https://www.kaanoon.com/258812/bangalore-landlord-is-charging-exorbitant-painting-charges-for-2bhk-what-are-my-legal-options' },
      { label: 'NoBroker forum: what can a landlord deduct', url: 'https://www.nobroker.in/forum/what-can-a-landlord-deduct-from-your-deposit' },
    ],
  },
  {
    id: 'rw-receipts-pan', basis: 'reports', scope: 'india', status: 'tip', checked: '2026-11-18',
    unverified: "The current tax thresholds, and your employer's own rules.",
    title: 'What tenants report: no receipts, cash rent, and no PAN for HRA',
    summary: "A common complaint is a landlord who wants rent in cash, gives no receipt and will not share a PAN. Tax guides say that matters: to claim HRA you generally need rent receipts, and the landlord's PAN once the rent is above Rs 1 lakh a year, or the employer may refuse the exemption. The practical advice is to agree on receipts and PAN before signing, and to pay by bank transfer or UPI so there is a record even if no receipt comes.",
    tags: ['receipt', 'cash', 'pan', 'hra', 'tax', 'landlord refuses', 'black', 'record', 'reality', 'real world'],
    sources: [
      { label: 'TaxGuru: landlord PAN needed for HRA above Rs 1 lakh', url: 'https://taxguru.in/income-tax/landlords-pan-needed-claim-hra-annual-rent-rs-1-lakh.html' },
      { label: 'Kaanoon: landlord refuses rent receipts or PAN', url: 'https://www.kaanoon.com/168147/landlord-refuses-to-give-rent-receipts-quote-pan-card' },
    ],
  },
  {
    id: 'rw-middlemen', basis: 'reports', scope: 'telangana', status: 'tip', checked: '2026-11-18',
    unverified: 'Whether this happens at any particular office today. One report is several years old and the other describes allegations in an investigation, not convictions.',
    title: 'What is reported: middlemen and extra payments at registration offices',
    summary: "News reports about Hyderabad sub-registrar offices describe document writers acting as middlemen and asking for extra money, saying part goes to staff, and an anti-corruption probe alleging that files did not move without a payment. You do not need a middleman to know the price: the official registration fee for a lease is 0.2%, and most 11-month agreements are notarised on stamp paper and never go to that office. Pay government fees through the official channel, ask for the official receipt, and do not hand over cash for which nobody will give a receipt.",
    tags: ['bribe', 'corruption', 'middleman', 'agent', 'document writer', 'sub-registrar', 'extra', 'speed money', 'registration', 'reality', 'real world'],
    sources: [
      { label: 'Siasat: document writers at sub-registrar offices', url: 'https://siasat.com/in-citys-sub-registrar-offices-the-document-writers-rule-the-roost-2132537' },
      { label: 'Hyderabad Mail: ACB raids on sub-registrar offices', url: 'https://hyderabadmail.com/hyderabad-acb-raids-expose-sub-registrar-bribe-network/' },
    ],
  },
  {
    id: 'acb', basis: 'official', scope: 'telangana', status: 'tip', checked: '2026-11-18',
    unverified: "The steps on the bureau's complaint page, which I did not read.",
    title: 'Reporting a bribe demand: Telangana Anti-Corruption Bureau, 1064',
    summary: "The Telangana Anti-Corruption Bureau's own site gives a toll-free number, 1064, a WhatsApp number, 9440446106, and an email, dg_acb@telangana.gov.in, and has a 'Raise a Complaint' page. Use it to report a public servant who demands a bribe. The site also warns that fraudsters pose as its officers and demand money, and says its officials never make such calls. The bureau deals with government staff, so it is the route for a demand at an office, not for a private landlord or broker asking for extra cash.",
    tags: ['bribe', 'corruption', 'acb', '1064', 'complaint', 'report', 'official', 'anti-corruption', 'helpline'],
    sources: [{ label: 'Telangana Anti-Corruption Bureau (official site)', url: 'https://acb.telangana.gov.in' }],
  },
];

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'is', 'are', 'be', 'by', 'it', 'at', 'as', 'with', 'what', 'how', 'do', 'does', 'my', 'can', 'i']);
const tok = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
export const noteById = (id: string): Note | undefined => NOTES.find(n => n.id === id);

// Simple weighted keyword search: title x3, tags x2, summary x1. Returns notes with a positive score, best first.
export function searchNotes(query: string, k = 5): { note: Note; score: number }[] {
  const q = tok(query);
  if (!q.length) return [];
  return NOTES.map(note => {
    const title = new Set(tok(note.title)), tags = new Set(note.tags.flatMap(tok)), sum = new Set(tok(note.summary));
    const score = q.reduce((s, w) => s + (title.has(w) ? 3 : 0) + (tags.has(w) ? 2 : 0) + (sum.has(w) ? 1 : 0), 0);
    return { note, score };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}

// Knowledge gaps: what this tool has NOT been able to confirm, and where the answer lives.
// Shown to users so they know what to check themselves. Close a gap by reading the source and updating the note.
export const OPEN_QUESTIONS: { question: string; where: string; url?: string; notes: string[] }[] = [
  { question: 'Is tenant police verification mandatory in Hyderabad, and under which law?', where: 'Hyderabad, Cyberabad or Rachakonda police website, or your local police station. Sources conflict and none names the law.', notes: ['police-verification'] },
  { question: 'Is the lease stamp duty still 0.4% in the current Telangana schedule?', where: 'The duty and fee calculator on the Telangana Registration and Stamps portal', url: 'https://registration.telangana.gov.in/DutyFeeCalculator.htm', notes: ['stamp-ts', 'regfee-ts'] },
  { question: "Is the free legal aid income ceiling in Telangana Rs 1,00,000 a year, and is the Rs 3 lakh figure seen elsewhere really Andhra Pradesh's?", where: 'Telangana State Legal Services Authority (telefax 040-23446723) or the NALSA helpline 15100', url: 'https://tslsa.telangana.gov.in/legal-services.php', notes: ['legal-aid'] },
  { question: 'Has Telangana notified its own version of the Model Tenancy Act since late 2025?', where: 'Telangana Gazette or the housing department. Secondary sources say it had not as of late 2025.', notes: ['mta-adoption'] },
  { question: 'What do tenants on Reddit and similar forums report about renting in Hyderabad?', where: 'Reddit blocks this tool, so those threads were not read. The real-world notes here come from advocate Q&A forums and news reports instead.', notes: ['rw-deposit-deductions', 'rw-receipts-pan', 'rw-middlemen'] },
];
