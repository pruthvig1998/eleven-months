// Deposit Shield: check a landlord's list of deductions against the tenant's own agreement.
// Pure functions, no network. Each line gets one of three labels:
//   in   "in your agreement"     : a clause makes this the tenant's cost, and the amount is within what it fixes
//   bill "ask for the bill"      : the charge may be owed, but only a bill, photo or meter reading can show the amount
//   out  "not in your agreement" : no clause makes this the tenant's cost
// The labels restate the agreement and two notes (rw-deposit-deductions, mta-repairs); they make no new legal claim.
import { extract } from './extract.ts';

export type DLabel = 'in' | 'bill' | 'out';
export const DLABEL_TEXT: Record<DLabel, string> = { in: 'in your agreement', bill: 'ask for the bill', out: 'not in your agreement' };
export interface Deduction { item: string; amount: number }
export interface Audited extends Deduction { label: DLabel; kind: string; why: string; clause?: string; note?: string }
export interface Audit {
  lines: Audited[]; deposit: number | null; claimed: number;
  totals: Record<DLabel, number>;
  minRefund: number | null; // deposit minus the lines labelled "in your agreement"
  blanket?: string;         // a clause letting the landlord keep the deposit without a reason, if any
}

// Kinds of deduction, first match wins. `allow` finds a clause that makes it the tenant's cost.
interface Kind { id: string; re: RegExp; allow?: RegExp; landlord?: RegExp }
const KINDS: Kind[] = [
  { id: 'notice', re: /notice|lock-?in|early exit|short(?:fall)? of notice/i },
  { id: 'fee', re: /brokerage|broker|commission|agreement|documentation|renewal|admin\w*|processing|legal fee|move-?out fee|\bfee\b|misc\w*|general charges?|other charges?|sundry/i },
  { id: 'servicing', re: /servic\w*|deep[- ]clean\w*\s+(?:of\s+)?(?:ac|sofa|appliances?)|gas refill|chimney|\bro\b|water purifier/i, allow: /servic\w*/i },
  { id: 'painting', re: /paint\w*|whitewash\w*|white-wash\w*|distemper/i, allow: /paint\w*|whitewash\w*|white-wash\w*/i },
  { id: 'cleaning', re: /clean\w*|pest control/i, allow: /clean\w*/i },
  { id: 'structure', re: /seepage|leak\w*|waterproof\w*|roof|plumbing|wiring|structur\w*|crack\w* (?:in )?(?:the )?wall|ceiling/i, allow: /structur\w*|roof|wiring|plumbing|leak\w*/i, landlord: /(?:major|structur\w*)[^.]{0,80}(?:lessor|landlord|owner)|(?:lessor|landlord|owner)[^.]{0,40}(?:major|structur\w*)/i },
  { id: 'minor', re: /\bbulbs?\b|tube ?lights?|tap washers?|\bwashers?\b|switch\w*|fuses?|tap\b/i, allow: /bulbs?|tap washers?|minor repairs?|switch\w*/i },
  { id: 'utility', re: /electric\w*|power bill|water (?:bill|charges?)|\bgas\b|internet|broadband|maintenance|society|association|meter/i },
  // Rent comes after every named charge, so "Painting - one month's rent" is painting, not rent owed.
  { id: 'rent', re: /\b(?:rent|arrears)\b(?![^,;]*\b(?:agreement|renewal)\b)/i },
  { id: 'damage', re: /damag\w*|broken|break\w*|replac\w*|missing|lost|stain\w*|scratch\w*|torn|burn\w*|key/i },
];

const AMOUNT = /(?:rs\.?|₹|inr)?\s*(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s*(?:\/-)?\s*(lakhs?|lacs?|k\b)?/gi;
function lineAmount(s: string): { amount: number; at: number } | null {
  let best: { amount: number; at: number } | null = null;
  for (const m of s.matchAll(AMOUNT)) {
    const n = +m[1].replace(/,/g, '') * (m[2] ? (/^k/i.test(m[2]) ? 1000 : 100000) : 1);
    // A money marker or thousands separator makes it an amount; a bare small number ("3 bulbs", "15 days") does not.
    if (!/rs|₹|inr/i.test(m[0]) && !m[1].includes(',') && !m[2] && n < 100) continue;
    best = { amount: n, at: m.index! }; // last amount on the line wins: lists put the figure at the end
  }
  return best;
}

// One deduction per line: "Painting of full flat - Rs. 45,000", "2. AC servicing: ₹32,000/-", "Deep cleaning 12000".
export function parseDeductions(text: string): Deduction[] {
  const out: Deduction[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim();
    if (!line || /^(?:total|grand total|balance|net|deposit|amount refundable|refund)\b/i.test(line)) continue;
    const a = lineAmount(line);
    if (!a) continue;
    const item = line.slice(0, a.at).replace(/[\s:–—=-]+$/, '').replace(/\s*(?:rs\.?|₹|inr)\s*$/i, '').trim() || line;
    out.push({ item, amount: a.amount });
  }
  return out;
}

const DEDUCT_CTX = /deduct\w*|deposit|at the (?:lessee|tenant)'s (?:own )?(?:cost|expense)|(?:lessee|tenant)'s cost|borne by the (?:lessee|tenant)|(?:lessee|tenant)[^.]{0,30}(?:shall|will|must)\s+(?:pay|bear)|charged? to the (?:lessee|tenant)/i;
const MONTHS: Record<string, number> = { half: 0.5, one: 1, '1': 1, two: 2, '2': 2 };

// Which clause, if any, makes `kind` the tenant's cost; and the figure it fixes, if any.
function findClause(clauses: string[], k: Kind, rent: number | null): { clause: string; cap: number | null } | null {
  if (!k.allow) return null;
  for (const c of clauses) {
    if (!k.allow.test(c) || !DEDUCT_CTX.test(c)) continue;
    if (k.landlord?.test(c) && !new RegExp(`${k.allow.source}[^.]{0,60}(?:lessee|tenant)'s (?:cost|expense)`, 'i').test(c)) continue;
    const m = c.match(/\b(half|one|two|1|2)\s+months?'?s?'?\s+rent/i), r = c.match(/(?:rs\.?|₹|inr)\s*([\d,]+)/i);
    const cap = m && rent ? MONTHS[m[1].toLowerCase()] * rent : r ? +r[1].replace(/,/g, '') : null;
    return { clause: c, cap };
  }
  return null;
}
const clauseNo = (c: string) => c.match(/^\s*(\d+)[.)]/)?.[1];

export function audit(list: Deduction[], clauses: string[], opts: { deposit?: number | null } = {}): Audit {
  const lease = clauses.join('\n\n');
  const ex = extract(lease), rent = ex.rent ?? null;
  const deposit = opts.deposit ?? clauses.map(c => extract(c, { rent: rent ?? undefined }).derived.deposit).find(d => d !== null) ?? null;
  const ref = (c: string) => (clauseNo(c) ? `clause ${clauseNo(c)}` : 'a clause');
  const hasNotice = clauses.find(c => /notice|lock-?in|shall not vacate/i.test(c) && /(?:lessee|tenant)/i.test(c));
  const lines: Audited[] = list.map(d => {
    const k = KINDS.find(x => x.re.test(d.item));
    const L = (label: DLabel, why: string, extra: Partial<Audited> = {}): Audited => ({ ...d, kind: k?.id ?? 'other', label, why, ...extra });
    switch (k?.id) {
      case 'rent': return rent ? L('in', `Rent owed is a genuine due: the agreement sets the rent at Rs. ${rent.toLocaleString('en-IN')} a month. Check the dates against your payment records.`) : L('bill', 'Rent owed is a genuine due, but no rent figure was found in the agreement. Check it against your payment records.');
      case 'notice': {
        // A penalty for leaving early is "in" only if a clause names a charge for it; a lock-in alone fixes no amount.
        if (/penalt|fine|compensat|charge|damages/i.test(d.item)) {
          const priced = clauses.find(c => /notice|lock-?in|vacat/i.test(c) && /(?:penalt\w*|compensat\w*|charge)[^.]{0,60}(?:(?:rs\.?|₹|inr)\s*\d|months?'?s?'? rent)|(?:(?:rs\.?|₹|inr)\s*\d|months?'?s?'? rent)[^.]{0,60}(?:penalt\w*|compensat\w*|charge)/i.test(c)); // a blanket forfeiture is not a price
          return priced ? L('in', `The agreement sets a charge for leaving early (${ref(priced)}). Check that the amount matches it.`, { clause: priced }) : L('bill', `The agreement has a notice or lock-in term${hasNotice ? ` (${ref(hasNotice)})` : ''} but fixes no charge for breaking it. Ask how this amount was worked out.`, { clause: hasNotice });
        }
        return hasNotice ? L('in', `The agreement has a notice or lock-in term (${ref(hasNotice)}). Check that the amount matches the days actually short.`, { clause: hasNotice }) : L('out', 'No notice or lock-in term binding you was found in the agreement.');
      }
      case 'fee': return L('out', 'A fee, brokerage or "miscellaneous" charge is not a cost of the flat, and no clause makes it yours. Ask what it is for.', { note: 'rw-deposit-deductions' });
      case 'utility': return L('bill', 'A bill you have not paid is a genuine due, but only the bill or meter reading shows the amount. Ask for it and compare with your last payment.');
      case 'damage': return L('bill', 'Damage you caused can be charged, but normal wear and tear cannot. Ask for a photo, the bill or two quotes, and compare with your handover photos.', { note: 'rw-deposit-deductions' });
      case undefined: return L('bill', 'This charge could not be matched to anything in the agreement. Ask what it is for, with a bill.');
    }
    const hit = findClause(clauses, k!, rent);
    if (k!.id === 'structure' && clauses.some(c => k!.landlord!.test(c))) {
      const c = clauses.find(x => k!.landlord!.test(x))!;
      return L('out', `The agreement puts major or structural repairs on the landlord (${ref(c)}). Seepage, wiring and similar repairs are the landlord's cost unless you caused the damage.`, { clause: c, note: 'mta-repairs' });
    }
    if (!hit) return L('out', k!.id === 'servicing' || k!.id === 'painting' || k!.id === 'cleaning'
      ? `No clause makes ${k!.id === 'servicing' ? 'servicing' : k!.id} your cost. Advocates' answers on tenant forums are consistent that such charges need a clause in the agreement, and that wear and tear from normal use is not the tenant's cost.`
      : 'No clause makes this your cost.', { note: 'rw-deposit-deductions' });
    if (hit.cap !== null && d.amount > hit.cap) return L('bill', `The agreement allows this (${ref(hit.clause)}) up to Rs. ${hit.cap.toLocaleString('en-IN')}, and Rs. ${d.amount.toLocaleString('en-IN')} is more. Ask for the bill for the difference.`, { clause: hit.clause });
    if (hit.cap !== null) return L('in', `The agreement fixes this charge (${ref(hit.clause)}) at up to Rs. ${hit.cap.toLocaleString('en-IN')}.`, { clause: hit.clause });
    return k!.id === 'minor' ? L('in', `The agreement makes these small repairs your cost (${ref(hit.clause)}). A receipt is still fair to ask for.`, { clause: hit.clause })
      : L('bill', `The agreement allows this charge (${ref(hit.clause)}) but fixes no amount, so it should be the actual cost. Ask for the bill.`, { clause: hit.clause });
  });
  const totals: Record<DLabel, number> = { in: 0, bill: 0, out: 0 };
  for (const l of lines) totals[l.label] += l.amount;
  const blanket = clauses.find(c => /forfeit\w*|keep|retain/i.test(c) && /deposit/i.test(c) && /without (?:assigning )?(?:any )?reason|sole discretion|for any reason|whatever reason/i.test(c));
  return { lines, deposit, claimed: lines.reduce((s, l) => s + l.amount, 0), totals, minRefund: deposit !== null ? Math.max(0, deposit - totals.in) : null, blanket };
}

// Built-in example, made up for the demo: modelled on deductions tenants report online (large "AC servicing", painting
// and "miscellaneous" charges with no bills). Checked against the sample agreement.
export const EXAMPLE_DEDUCTIONS = `Deductions from security deposit (made-up example)
1. AC servicing - Rs. 32,000
2. Painting of full flat - Rs. 45,000
3. Deep cleaning - Rs. 12,000
4. Wall seepage repair - Rs. 18,000
5. Damage to wooden flooring - Rs. 25,000
6. Miscellaneous charges - Rs. 9,000
7. Unpaid rent, January - Rs. 18,000
Total deducted: Rs. 1,59,000`;

// Move-out checklist: practical tips (tip-handover), not law.
export const MOVE_OUT: { title: string; items: string[] }[] = [
  { title: 'Before you hand over the keys', items: [
    'Give notice in writing for the period your agreement states, and keep a copy.',
    'Ask for the refund date and any deductions in writing before the last day.',
    'Pay the last electricity and water bills and keep the receipts.',
  ] },
  { title: 'On the last day', items: [
    'Photograph or video every room, wall, fixture and appliance, with the date visible.',
    'Photograph the electricity, water and gas meters, with the readings readable.',
    'Hand over every key against a written note that lists them and says the date, signed or sent by message.',
    'Write down a forwarding address and your bank details for the refund, and give them to the landlord in writing.',
  ] },
  { title: 'After you leave', items: [
    'If the deposit is late or cut, ask in writing for an itemised list with bills.',
    'Keep every message. Send the firm message first, then the formal notice.',
  ] },
];

// Escalation ladder for a deposit that is not returned. Telangana gets its sourced specifics; any other state gets the
// national routes only, and the page says so. Each step links a note (knowledge.ts) or is a practical tip.
export interface Rung { title: string; text: string; note?: string }
export function ladder(state: 'telangana' | 'other'): Rung[] {
  const ts = state === 'telangana';
  return [
    { title: '1. Firm message', text: 'Send the WhatsApp message below: the amount due, the handover date, and a request for an itemised list with bills. Keep the reply.' },
    { title: '2. Formal notice', text: "Send the formal notice below by email and registered post, giving a date to pay by. Many tenants send it through a lawyer; advocates on tenant forums describe this as the usual next step.", note: 'rw-deposit-deductions' },
    ts ? { title: '3. Rent Authority: not in Telangana', text: 'A Rent Authority is created by the Model Tenancy Act, which Telangana has not adopted, so there is none to apply to. If your building is covered by the 1960 control act (older buildings with a low 2005 rent), an advance above one month\'s rent was not allowed in the first place, and the Rent Controller is the forum.', note: 'ts-advance' }
      : { title: '3. Rent Authority, if your state has one', text: 'States that adopted the Model Tenancy Act have a Rent Authority. This tool has no notes for your state, so check whether it has one before relying on this step.', note: 'mta-adoption' },
    { title: '4. Consumer commission, through e-Jagriti', text: 'A complaint can be filed online on the e-Jagriti portal. Whether a commission will hear a deposit claim against a private landlord is not confirmed here: ask legal aid first.', note: 'consumer-ejagriti' },
    { title: '5. Free legal aid', text: ts ? 'Call the NALSA helpline 15100, or contact the Telangana State Legal Services Authority in Hyderabad, or the District Legal Services Authority at your local court.' : 'Call the NALSA helpline 15100, or visit the District Legal Services Authority at your local court complex.', note: 'legal-aid' },
    { title: '6. Recovery suit', text: 'The last step advocates describe is a civil suit to recover the money, with your agreement, payment proofs, handover photos and the notices as evidence.', note: 'rw-deposit-deductions' },
  ];
}

// Drafts for the move-out pack. The facts are built here, on the device; the page masks them before any cloud call.
export interface DraftFacts { handover?: string; refundClause?: string; audit: Audit }
const rs = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;
export const refundClauseOf = (clauses: string[]): string | undefined =>
  clauses.find(c => /refund|return/i.test(c) && /deposit/i.test(c)) ?? clauses.find(c => /deposit/i.test(c));
export function factsText(f: DraftFacts): string {
  const a = f.audit, disputed = a.lines.filter(l => l.label !== 'in');
  return [
    `Security deposit paid: ${a.deposit !== null ? rs(a.deposit) : 'amount not stated'}.`,
    f.handover ? `Keys handed over on: ${f.handover}.` : 'Keys handed over on: [DATE].',
    `Deductions claimed by the landlord: ${rs(a.claimed)} in total.`,
    disputed.length ? `Disputed items: ${disputed.map(l => `${l.item} (${rs(l.amount)}, ${DLABEL_TEXT[l.label]})`).join('; ')}.` : 'No disputed items.',
    a.minRefund !== null ? `Amount the tenant says is due now, at least: ${rs(a.minRefund)}.` : '',
    f.refundClause ? `The agreement's deposit clause: "${f.refundClause}"${/forfeit|without (?:assigning )?(?:any )?reason/i.test(f.refundClause) ? ' (The tenant disputes this clause: it lets the landlord keep the deposit without a reason, and it is not a bill for any item.)' : ''}` : 'The agreement has no deposit refund clause.',
  ].filter(Boolean).join('\n');
}
// Fallback when the cloud is off or the names check fails. Cites only the agreement, never a law.
export function templateDrafts(f: DraftFacts): { whatsapp: string; notice: string } {
  const a = f.audit, disputed = a.lines.filter(l => l.label !== 'in'), due = a.minRefund ?? 0, cl = f.refundClause?.match(/^\s*(\d+)[.)]/)?.[1];
  const list = disputed.map(l => `- ${l.item}: ${rs(l.amount)}`).join('\n');
  return {
    whatsapp: `Hello, I handed over the flat and keys on ${f.handover || '[DATE]'}. Of my deposit of ${a.deposit !== null ? rs(a.deposit) : '[AMOUNT]'}, you have deducted ${rs(a.claimed)}. Please send an itemised list with bills for these items, which our agreement does not make my cost or which need a bill:\n${list || '- (none)'}\nPlease refund at least ${rs(due)} by [DATE, 7 days from today] to my account [BANK DETAILS]. Thank you.`,
    notice: `Date: [DATE]\nTo: [NAME], [ADDRESS]\n\nSubject: Refund of security deposit for [FLAT ADDRESS]\n\n1. Under our rental agreement dated [DATE], I paid a security deposit of ${a.deposit !== null ? rs(a.deposit) : '[AMOUNT]'}${cl ? ` (clause ${cl})` : ''}.\n2. I vacated and handed over the keys on ${f.handover || '[DATE]'}.\n3. You have deducted ${rs(a.claimed)}. The following items are not my cost under the agreement, or are not supported by any bill:\n${list || '   (none)'}\n4. I ask you to refund ${rs(due)} within 15 days of this notice, and to send bills for any other deduction you still claim.\n5. If the amount is not refunded by then, I will take the further steps open to me, without further notice.\n\n[NAME]\n[CONTACT]`,
  };
}
// A model can invent law. Drafts that cite an act, section or article are not shown.
export const citesLaw = (t: string) => /\b(?:[A-Z][a-z]+ ){1,5}Act\b/.test(t) || /\b(?:section|sec\.|article|clause \d+ of the \w+ act)\s*\d|\bact,?\s*(?:18|19|20)\d\d|\b(?:ipc|bns|crpc|cpc)\b|under the [a-z ]{0,60}\bact\b/i.test(t);
