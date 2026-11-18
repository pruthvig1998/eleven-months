// Topic rule registry. A rule = detector (is this clause about X?) + optional check (is it a problem?) + examples.
// To add a rule: append to RULES with at least 2 `detected`, 2 `notDetected`, and one severity example; topics.test.ts
// enforces every example, so a new rule cannot ship untested. Findings link to a reference note (knowledge.ts) via `note`.
// Severity: high = marks the clause risky; medium = worth a closer look; info = context only.
import { extract, sentences, LIMITS, type Extraction } from './extract.ts';

export type Severity = 'high' | 'medium' | 'info';
export interface Finding { topic: string; severity: Severity; title: string; why: string; note?: string }
interface Ctx { rent?: number | null; ex: Extraction }
export interface Rule {
  id: string; label: string; detect: RegExp;
  check?: (text: string, ctx: Ctx) => Finding[];
  examples: { detected: string[]; notDetected: string[]; high?: string[]; medium?: string[]; notHigh?: string[] };
}

const f = (topic: string, severity: Severity, title: string, why: string, note?: string): Finding => ({ topic, severity, title, why, note });
const any = (text: string, re: RegExp) => sentences(text).some(s => re.test(s));
const LESSOR = '(?:lessor|landlord|owner)', LESSEE = '(?:lessee|tenant)';
// Shared word lists: widen a list here and every rule that uses it improves. Add synonyms as new paraphrases appear.
const LEX = {
  enter: '(?:enter|entry|come into|come in|walk in|look around|visit|inspect\\w*)',
  anytime: '(?:at any (?:time|hour)|as and when|whenever|any time|when(?:ever)? (?:he|she|they|it) (?:feels?|wish(?:es)?|want(?:s)?|like(?:s)?)|without (?:any )?(?:prior )?(?:notice|intimation|permission|consent|informing))',
  cut: '(?:cut(?: off)?|switch(?:ed)?(?: off)?|turn(?:ed)?(?: off)?|shut(?: off)?|disconnect(?:ed)?|discontinue(?:d)?|withhold|withheld|stop(?:ped)?|suspend(?:ed)?|block(?:ed)?)',
  utility: '(?:water|electricity|power|current|gas|lift)',
  leave: '(?:vacate|leave|move out|quit|evacuate|hand over possession|exit)',
  urgent: '(?:forthwith|immediately|at once|(?:the )?(?:very )?next day|on the spot|same (?:day|evening|night|morning)|by (?:tomorrow|tonight)|within\\s+\\d+\\s*hours?|without (?:any )?(?:prior )?notice)',
  keep: '(?:forfeit\\w*|keeps?|retain\\w*|appropriate\\w*|confiscat\\w+)',
  whole: '(?:entire|whole|full|complete|all of|total)',
  noReason: '(?:without (?:assigning )?(?:any )?reason|(?:for )?whatever (?:the )?reason|for any reason|sole discretion|irrespective of)',
  structure: '(?:structural|roof|plumbing|wiring|electrical|leak\\w*|ceiling|wall)',
};

// Lifestyle pack: a clock time, words for coming and going, and the penalties that turn a house rule into a real cost.
const TIME = '\\b\\d{1,2}(?:[.:]\\d{2})?\\s*(?:pm|p\\.m\\.|am|a\\.m\\.)';
const MOVE = '(?:return\\w*|(?:be |come |coming |get |getting )?back|com(?:e|ing) (?:home|in)|enter\\w*|entry|leav(?:e|ing)|go(?:ing)? out|be inside|be in)';
const WHEN = '(?:before|after|by|between|beyond|later than|past)';
const PEN = /(forfeit\w*|deduct\w*|\bfine\b|penalt\w*|terminat\w*|evict\w*|eviction|vacate|cancel\w*)/i;

export const RULES: Rule[] = [
  {
    id: 'entry', label: 'Entry and inspection', detect: new RegExp(`\\b${LEX.enter}\\b`, 'i'),
    check: t => {
      if (any(t, new RegExp(`${LEX.enter}[^.]{0,120}${LEX.anytime}|${LEX.anytime}[^.]{0,80}${LEX.enter}`, 'i')))
        return [f('entry', 'high', 'Landlord can enter without notice', "The Model Tenancy Act's benchmark is written notice of at least 24 hours before entry, except emergencies. Entry at any time with no notice is well outside it.", 'mta-entry')];
      const h = t.match(/(\d+)\s*hours?/i);
      if (h && +h[1] < 24) return [f('entry', 'medium', `Entry notice of only ${h[1]} hours`, 'Shorter than the 24 hours the Model Tenancy Act expects.', 'mta-entry')];
      if (/notice|intimation/i.test(t)) return [f('entry', 'info', 'Entry needs prior notice', 'Entry with notice is in line with the Model Tenancy Act benchmark.', 'mta-entry')];
      return [];
    },
    examples: {
      detected: ['The Lessor may inspect the premises once a month after 24 hours notice.', 'The Landlord shall have a right of entry for repairs.'],
      notDetected: ['The Lessee shall pay rent by the 5th of each month.', 'The deposit is Rs. 40,000.'],
      high: ['The Lessor shall have the right to enter the premises at any time of day or night without notice.'],
      medium: ['The Lessor may enter the premises for inspection after giving the Lessee 2 hours notice.'],
      notHigh: ['The Lessor may inspect the premises once a month after giving the Lessee at least 24 hours prior intimation.'],
    },
  },
  {
    id: 'selfhelp', label: 'Cutting essential services', detect: new RegExp(`\\b${LEX.cut}\\s+(?:off\\s+)?(?:the\\s+)?(?:supply\\s+(?:of|to)\\s+)?(?:the\\s+)?${LEX.utility}|${LEX.utility}(?:\\s+supply)?[^.]{0,40}(?:shall|will|may|can) be ${LEX.cut}`, 'i'),
    check: () => [f('selfhelp', 'high', 'Water or power can be cut to force the tenant out', 'Cutting essential services to pressure a tenant bypasses notice and process. Worth a lawyer\'s look before signing.', 'mta-essential-supply')],
    examples: {
      detected: ['The Lessor may cut off water and electricity if rent is late.', 'The landlord may disconnect the electricity supply on breach.'],
      notDetected: ['The Lessee shall pay the electricity bill as per the meter.', 'Water charges are included in the maintenance.'],
      high: ['The Lessor may cut off water and electricity and re-enter the premises.'],
    },
  },
  {
    id: 'eviction', label: 'Termination and eviction', detect: new RegExp(`(evict|re-?enter|vacant possession|terminat|cancel\\w*|${LEX.leave})`, 'i'),
    check: t => {
      const out: Finding[] = [];
      if (any(t, new RegExp(`(?:evict|re-?enter|terminat\\w*|${LEX.leave})[^.]{0,80}${LEX.urgent}|${LEX.urgent}[^.]{0,60}(?:evict|re-?enter|terminat\\w*|${LEX.leave})`, 'i')))
        out.push(f('eviction', 'high', 'Exit or termination with no real notice', "The Transfer of Property Act's default for ending a tenancy is 15 days' notice. Termination or exit 'immediately', 'forthwith' or within hours is far shorter.", 'tpa-106'));
      const sale = t.match(/(sale|sell|transfer)[^.]{0,80}vacate[^.]{0,50}within\s+(\d+)\s*(hours?|days?)/i);
      if (sale && (/hour/i.test(sale[3]) || +sale[2] < 15)) out.push(f('eviction', 'high', 'Very short exit if the flat is sold', "Leaving within hours or under 15 days of a sale is shorter than the 15 days' default notice.", 'tpa-106'));
      if (any(t, new RegExp(`${LESSOR}[^.]{0,40}(?:may|can|shall be entitled to|is free to|has the right to)[^.]{0,30}(?:terminat\\w*|cancel|end|evict)[^.]{0,80}(?:at any time|whenever|${LEX.noReason})`, 'i')) && !/by giving|notice of|days'? notice|months?'? notice/i.test(t) && !out.length)
        out.push(f('eviction', 'high', 'Landlord can end the tenancy at any time without a reason', "A right to end the tenancy at will, with no reason and no notice period, leaves the tenant with no security for the term.", 'tpa-106'));
      return out;
    },
    examples: {
      detected: ['The Lessee shall hand over vacant possession on expiry of the tenancy.', 'Either party may terminate by giving 30 days notice.'],
      notDetected: ['The monthly rent is Rs. 18,000.', 'The Lessee shall not sublet the premises.'],
      high: ['In the event of sale of the premises, the Lessee shall vacate within 48 hours of being informed.', 'The Lessor may evict the Lessee immediately if the rent is delayed by one day.', 'The Owner may terminate this agreement at any time without assigning any reason.'],
      notHigh: ['The Lessee shall hand over vacant possession on expiry of the tenancy.', 'Either party may terminate by giving 30 days notice.'],
    },
  },
  {
    id: 'receipts', label: 'Rent payment and receipts', detect: /(receipt|acknowledg\w+|written proof|in cash|by cash|cheque|bank transfer|\bupi\b|\bneft\b|\brtgs\b)/i,
    check: t => {
      if (/(blank|undated|un-dated)[^.]{0,30}cheques?|cheques?[^.]{0,40}(blank|undated|un-dated)|cheques?[^.]{0,30}(held|kept|retained|given|handed over)[^.]{0,20}as security(?! deposit)/i.test(t))
        return [f('cheque', 'high', 'Blank or undated cheque as security', 'A signed cheque with no date or amount can be filled in and presented later. A bounced cheque is a criminal matter, so this gives the holder strong leverage.', 'tip-receipts')];
      if (/(?:no|not|never|without)\b[^.]{0,40}\b(?:receipt|acknowledg\w+|proof)\b|(?:own\s+)?records?[^.]{0,60}conclusive/i.test(t))
        return [f('receipts', 'high', 'No receipt, no proof of rent paid', "A clause that denies receipts or makes the landlord's own record conclusive leaves the tenant without proof of payment.", 'tip-receipts')];
      return [f('receipts', 'info', 'Payment trail described', 'Receipts or traceable payment make disputes easier to settle.', 'tip-receipts')];
    },
    examples: {
      detected: ['The Lessor shall give a receipt for every payment of rent.', 'Rent shall be paid by bank transfer.'],
      notDetected: ['The Lessee shall keep the flat clean.', 'The tenancy is for 11 months.'],
      high: ['The Lessee shall not be entitled to any receipt for rent paid in cash.', "The Lessor's own record shall be conclusive evidence of the rent paid or unpaid.", 'The Tenant shall hand over one undated blank signed cheque as security.'],
      notHigh: ['The Lessor shall give a receipt for every payment of rent.', 'The Lessee has paid Rs. 40,000 by cheque as security deposit.', 'Rent shall be paid by post-dated cheques.'],
    },
  },
  {
    id: 'dispute', label: 'Disputes and arbitration', detect: /(arbitrat|jurisdiction|dispute|disagreement|\bcourts?\b)/i,
    check: t => {
      if (/(?:landlord|lessor|owner)(?:'s)?\s+(?:own\s+|chosen\s+|nominated\s+|appointed\s+)?arbitrator|arbitrator[^.]{0,80}(appointed|nominated|chosen|selected) by the (lessor|landlord|owner)|(cost|expenses|fees)[^.]{0,80}(borne|paid|bear)[^.]{0,40}(lessee|tenant)[^.]{0,60}(even if|irrespective|whether)/i.test(t))
        return [f('dispute', 'high', 'Dispute process favours the landlord', "An arbitrator picked by the landlord, or costs the tenant pays even if the tenant wins, tilts the process. The Model Tenancy Act routes disputes to a Rent Authority or courts instead.", 'mta-written')];
      if (/jurisdiction[^.]{0,40}courts?/i.test(t)) return [f('dispute', 'info', 'Disputes go to the local courts', 'A neutral court jurisdiction is the ordinary position.', 'mta-written')];
      return [];
    },
    examples: {
      detected: ['Any dispute shall be subject to the jurisdiction of the civil courts at Hyderabad.', 'Disputes will be settled by arbitration.'],
      notDetected: ['The rent is Rs. 20,000.', 'The Lessee shall keep the keys safe.'],
      high: ['Any dispute shall be decided solely by an arbitrator appointed by the Lessor, and the Lessee shall bear the entire cost of arbitration, even if the Lessee succeeds.'],
      notHigh: ['Any dispute shall be subject to the jurisdiction of the civil courts at Hyderabad.'],
    },
  },
  {
    id: 'forfeiture', label: 'Forfeiture and penalties', detect: new RegExp(`(${LEX.keep}|penalt|liquidated damages)`, 'i'),
    check: t => {
      if (any(t, new RegExp(`(?:deposit|advance)[^.]{0,100}${LEX.keep}[^.]{0,100}(?:${LEX.whole}|${LEX.noReason})|${LEX.keep}[^.]{0,60}${LEX.whole}[^.]{0,25}(?:deposit|advance)|${LEX.keep}[^.]{0,80}${LEX.noReason}`, 'i')))
        return [f('forfeiture', 'high', "Deposit can be forfeited at the landlord's discretion", "Forfeiture of the whole deposit without a stated reason is far from the Model Tenancy Act's idea of refund less genuine dues.", 'mta-deposit')];
      return /(penalt|liquidated damages|forfeit\w*|confiscat\w+|\bfine\b)/i.test(t) ? [f('forfeiture', 'medium', 'Penalty clause', 'Check what triggers the penalty and how much it is.', 'tip-handover')] : [];
    },
    examples: {
      detected: ['The Lessee shall pay a penalty of one month rent on early exit.', 'The deposit may be forfeited on breach.'],
      notDetected: ['The Lessee shall pay the rent monthly.', 'Repairs are at the Lessor cost.'],
      high: ['The Lessor may forfeit the entire deposit, without assigning any reason, if the Lessee vacates early.'],
      medium: ['In case of early exit the Lessee shall pay a penalty of one month rent.'],
      notHigh: ['The Tenant shall keep the premises clean and pay the cleaning staff directly.'],
    },
  },
  {
    id: 'waiver', label: 'Waiver of rights', detect: /(waive|relinquish|gives? up|forgo|surrender|no claim|shall have no (claim|right)|cannot (raise|make|file|bring))/i,
    check: t => /(waives?|relinquish\w*|gives? up|forgo\w*|surrender\w*)[^.]{0,40}(right|claim|remedy)|no claim of any kind|shall have no (claim|right)|cannot (raise|make|file|bring)[^.]{0,30}(objection|claim|complaint|dispute)/i.test(t)
      ? [f('waiver', 'high', 'Tenant gives up rights or claims', 'Clauses that waive the right to question deductions or to claim anything are one-sided and hard to enforce either way.', 'tip-handover')] : [],
    examples: {
      detected: ['The Lessee waives the right to question the deductions.', 'The parties may waive notice by mutual written consent.'],
      notDetected: ['The deposit is Rs. 60,000.', 'Rent is payable monthly.'],
      high: ['The Lessee waives the right to question the deductions.', 'The Lessee shall have no claim of any kind against the Lessor.'],
      notHigh: ['The parties may waive notice by mutual written consent.'],
    },
  },
  {
    id: 'maintenance', label: 'Repairs and maintenance', detect: new RegExp(`(repair|maintenance|upkeep|association|fixing|replac\\w+|${LEX.structure})`, 'i'),
    check: t => {
      if (any(t, new RegExp(`${LEX.structure}`, 'i')) && sentences(t).some(x => new RegExp(LEX.structure, 'i').test(x) && new RegExp(`(?:paid(?: for)?|borne|met|funded) by the ${LESSEE}|${LESSEE}[^.]{0,40}(?:shall |will |must )?(?:bear|pay|meet)|${LESSEE}'s (?:own |financial )?(?:responsibility|cost|expense|liability)|at the ${LESSEE}'s (?:own )?(?:cost|expense)`, 'i').test(x) && !new RegExp(`${LESSOR}[^.]{0,30}(?:shall|will|must)[^.]{0,20}(?:carry|bear|pay|do|undertake)|(?:carried out|borne|paid) by the ${LESSOR}`, 'i').test(x)))
        return [f('maintenance', 'high', 'Tenant pays for structural repairs', 'Roof, wiring, plumbing and structure are usually the owner\'s cost unless the damage is the tenant\'s doing.', 'mta-repairs')];
      if (/(not|need not)\s+(be\s+)?required\s+to\s+(produce|furnish|give)[^.]{0,20}(bill|receipt|account)/i.test(t))
        return [f('maintenance', 'high', 'Maintenance charge with no bills', 'A fixed charge the landlord does not have to back with bills or receipts cannot be checked.', 'tip-receipts')];
      return [];
    },
    examples: {
      detected: ['Minor repairs are at the Lessee cost.', 'The association charges are Rs. 2,500 per month.'],
      notDetected: ['The rent is Rs. 20,000.', 'The tenancy lasts 11 months.'],
      high: ["The Lessee shall bear all structural repairs, including leakage of roof, at the Lessee's cost.", 'The Lessee shall pay a fixed maintenance charge of Rs. 8,000 per month and the Lessor shall not be required to produce any bills or receipts.'],
      notHigh: ["Minor repairs such as bulbs are at the Lessee's cost. Major repairs to the structure, roof and wiring, not caused by the Lessee, shall be carried out by the Lessor."],
    },
  },
  {
    id: 'utilities', label: 'Utilities', detect: /(electricity|water charges|\bgas\b|internet|utilit|per unit)/i,
    check: t => {
      if (/(charge|bill|rate)s?[^.]{0,60}(decided|determined|fixed|set)\s+by\s+the\s+(lessor|landlord)|fixed[^.]{0,30}(electricity|water)[^.]{0,30}(per month|monthly)/i.test(t))
        return [f('utilities', 'medium', 'Utility charges not tied to the meter', 'Charges the landlord sets, or a fixed amount, may differ from actual use.', 'tip-receipts')];
      if (/(?:rs\.?|₹|inr)\s*\d+(?:\.\d+)?\s*(?:\/-)?\s*per unit|sub-?meter/i.test(t))
        return [f('utilities', 'medium', "Electricity at the owner's own rate or sub-meter", "A per-unit rate set in the agreement, or a private sub-meter, can cost more than the electricity company's tariff. Compare it with a recent bill.", 'tip-receipts')];
      if (/(meter|actuals|as per (consumption|usage))/i.test(t)) return [f('utilities', 'info', 'Utilities billed by meter', 'Paying actual use is the ordinary position.')];
      return [];
    },
    examples: {
      detected: ['The Lessee shall pay electricity charges as per meter.', 'Internet charges are borne by the Lessee.'],
      notDetected: ['The rent is Rs. 18,000.', 'No subletting is allowed.'],
      medium: ['Electricity charges shall be fixed by the Lessor and paid monthly.', "Electricity shall be charged at Rs. 12 per unit as per the Owner's sub-meter."],
      notHigh: ['The Lessee shall pay electricity charges as per meter readings.'],
    },
  },
  {
    id: 'subletting', label: 'Subletting', detect: /(sublet|sub-let|sub let|assign (the )?(lease|tenancy)|part with possession)/i,
    check: () => [f('subletting', 'info', 'Subletting needs consent', 'A bar on subletting without written consent is common.')],
    examples: {
      detected: ['The Lessee shall not sublet the premises without written consent.', 'The Lessee shall not part with possession of the flat.'],
      notDetected: ['The rent is Rs. 20,000.', 'Repairs are the Lessor duty.'],
    },
  },
  {
    id: 'guests', label: 'Guests, pets and use', detect: /(guest|visitor|overnight|\bpets?\b|animal|bachelor|opposite (?:gender|sex))/i,
    check: t => /(guest|visitor|overnight)[^.]{0,100}(breach|terminate|cut off|forthwith)/i.test(t)
      ? [f('guests', 'medium', 'Guests can trigger a breach', 'An overnight guest should not by itself be a ground to end the tenancy.')]
      : /(?:not|no|prohibit\w*|forbid\w*)\b[^.]{0,60}(?:guest|visitor)s?[^.]{0,60}(?:opposite (?:gender|sex)|overnight)|opposite (?:gender|sex)/i.test(t)
        ? [f('guests', 'medium', 'Limits on who may visit', 'A ban on overnight visitors, or on guests of a particular gender, controls the tenant\'s private life and is easy to use as a pretext.')] : [],
    examples: {
      detected: ['No pets are allowed in the flat.', 'Overnight guests need written permission.'],
      notDetected: ['The rent is Rs. 18,000.', 'The deposit is refundable.'],
      medium: ['Any guest staying overnight without written permission shall be treated as a breach of this Agreement.', "The Tenant shall not permit any guests of the opposite gender or overnight visitors without the Owner's written permission."],
    },
  },
  {
    id: 'registration', label: 'Registration and stamp duty', detect: /(registr|stamp duty|stamp paper|notaris)/i,
    check: () => [f('registration', 'info', 'Registration or stamp duty mentioned', 'Leases over a year must be registered; many agreements run 11 months to avoid this.', 'reg-17')],
    examples: {
      detected: ['This agreement shall be registered with the Sub-Registrar.', 'Stamp duty shall be borne by the Lessee.'],
      notDetected: ['The rent is Rs. 18,000.', 'The Lessee shall keep the flat clean.'],
    },
  },
  {
    id: 'renewal', label: 'Renewal and rent revision', detect: /(renew|extension|extend|revise (the )?rent|enhance)/i,
    check: t => /at (his|the lessor's|the landlord's|its) (sole )?discretion|as (decided|determined) by the (lessor|landlord)/i.test(t)
      ? [f('renewal', 'medium', "Rent revision at the landlord's discretion", 'Without a fixed percentage the rise can be anything.', 'tool-thresholds')]
      : /renewal (?:charges?|fees?)|renew\w*[^.]{0,80}pay[^.]{0,60}month'?s?'?\s+rent/i.test(t)
        ? [f('renewal-fee', 'medium', 'Fee to renew the agreement', 'A payment to the owner just for renewing is extra rent under another name. Brokerage, if any, is owed to the broker and only if you used one.', 'rw-middlemen')] : [],
    examples: {
      detected: ['The tenancy may be renewed by mutual consent.', 'On renewal the rent shall be enhanced by 5%.'],
      notDetected: ['The deposit is Rs. 50,000.', 'No pets allowed.'],
      medium: ['On renewal the Lessor may revise the rent at his discretion.', "On each renewal the Tenant shall pay one month's rent as renewal charges to the Owner."],
      notHigh: ['On renewal the rent shall be enhanced by 5%.'],
    },
  },
  {
    id: 'fees', label: 'Fees and non-refundable payments', detect: /(brokerage|key money|premium|non-?refundable|processing fee|administrative (fee|charge))/i,
    check: () => [f('fees', 'medium', 'Non-refundable payment', 'Check what it covers and whether it is allowed to be non-refundable.', 'tip-handover')],
    examples: {
      detected: ['A non-refundable fee of Rs. 5,000 is payable on signing.', 'Brokerage of one month rent is payable by the Lessee.'],
      notDetected: ['The deposit is refundable.', 'Rent is payable monthly.'],
      medium: ['A non-refundable administrative charge of Rs. 5,000 is payable on signing.'],
    },
  },
  {
    id: 'liability', label: 'Liability and indemnity', detect: /(indemnif|liable for (all|any)|all (damage|loss)|whatsoever)/i,
    check: () => [f('liability', 'medium', 'Broad liability or indemnity', 'Check whether it excludes normal wear and tear and damage the tenant did not cause.', 'tip-handover')],
    examples: {
      detected: ['The Lessee shall be liable for all damage to the premises.', 'The Lessee shall indemnify the Lessor against any loss whatsoever.'],
      notDetected: ['The rent is Rs. 18,000.', 'Pets are not allowed.'],
      medium: ['The Lessee shall be liable for all damage to the premises whatsoever.'],
    },
  },
  {
    id: 'holdover', label: 'Overstaying after the term', detect: /(holdover|hold over|overstay|stays? (on|beyond|after)|beyond the (term|expiry|period)|continues? to (occupy|stay)|after (the )?(expiry|termination))/i,
    check: t => {
      const m = t.match(/(double|twice|two times|2x|three times|triple|3x|four times|4x|five times|ten times)\s*(?:the\s+)?(?:monthly\s+)?rent/i);
      if (!m) return [];
      return /double|twice|two times|2x/i.test(m[1])
        ? [f('holdover', 'info', 'Overstay costs double rent', 'The Model Tenancy Act benchmark is double rent for the first two months, then four times.', 'mta-holdover')]
        : [f('holdover', 'medium', 'Overstay charge above the benchmark', 'A multiple above double rent from the start is more than the Model Tenancy Act benchmark (double for two months, then four times).', 'mta-holdover')];
    },
    examples: {
      detected: ['If the Lessee stays beyond the term, rent shall be payable at double the monthly rent.', 'Overstay after expiry attracts additional charges.'],
      notDetected: ['The monthly rent is Rs. 20,000.', 'No pets are allowed in the flat.'],
      medium: ['If the Lessee continues to occupy after expiry, the Lessee shall pay three times the monthly rent.'],
      notHigh: ['If the Lessee stays beyond the term, the rent shall be double the monthly rent.'],
    },
  },
  {
    id: 'deposit-refund', label: 'Deposit refund', detect: /deposit|\badvance (?:amount |money )?(?:will|shall|is to) be (?:returned|refunded)/i,
    check: t => {
      if (/(refund|return)[^.]{0,100}(only )?(after|until)[^.]{0,80}(re-?let|new tenant|sale)|no (interest or )?time limit/i.test(t))
        return [f('deposit-refund', 'high', 'Deposit refund has no deadline or depends on the landlord', 'A refund tied to finding a new tenant, a sale, or with no time limit depends on events the tenant does not control.', 'tip-handover')];
      const d = t.match(/(?:refund|return)[^.]{0,80}(?:within|after)\s+(\d+)\s*days?/i);
      if (d && +d[1] > 30) return [f('deposit-refund', 'medium', `Deposit refunded only after up to ${d[1]} days`, "A long wait for the deposit is money the tenant needs for the next flat. The Model Tenancy Act expects the refund at handover.", 'mta-deposit')];
      if (d) return [f('deposit-refund', 'info', `Deposit refunded within ${d[1]} days`, 'A stated deadline is good practice.', 'tip-handover')];
      return [];
    },
    examples: {
      detected: ['The deposit shall be refunded within 15 days of vacating.', 'A security deposit of Rs. 50,000 is paid.'],
      notDetected: ['The rent is Rs. 20,000.', 'The Lessee shall not sublet.'],
      high: ['The Lessor shall refund the deposit only after the Lessor has re-let the premises to a new tenant, and no interest or time limit shall apply.'],
      medium: ['The security deposit shall be refunded without interest within 90 days after vacating.'],
      notHigh: ['The deposit shall be refunded within 15 days of the Lessee handing over vacant possession.'],
    },
  },
  {
    id: 'deductions', label: 'Painting, cleaning and wear and tear', detect: /(paint\w*|whitewash\w*|white-wash\w*|cleaning|wear and tear)/i,
    check: t => {
      const out: Finding[] = [];
      if (/(?:paint\w*|whitewash\w*|white-wash\w*|cleaning)[^.]{0,120}(?:irrespective|regardless|whether or not|no matter|in any case|compulsor\w+|mandator\w+)|(?:irrespective|regardless|whether or not|no matter|compulsor\w+)[^.]{0,120}(?:paint\w*|whitewash\w*|cleaning)/i.test(t))
        out.push(f('deductions', 'high', 'Painting or cleaning charge whatever the condition', 'A deduction that applies even if the flat is returned clean is a fixed fee, not a repair cost.', 'rw-deposit-deductions'));
      else if (/(?:one|two|1|2|half)\s+months?'?s?'?\s+rent[^.]{0,80}(?:paint\w*|whitewash\w*|cleaning)|(?:paint\w*|whitewash\w*|cleaning)[^.]{0,80}(?:one|two|1|2|half)\s+months?'?s?'?\s+rent/i.test(t))
        out.push(f('deductions', 'medium', "Painting or cleaning charge of a month's rent", 'Check that the amount matches a real quote, and that it is charged only if the flat needs it.', 'rw-deposit-deductions'));
      if (/(?:pay|liable|charge\w*|bear|deduct\w*|recover\w*)[^.]{0,80}wear and tear/i.test(t) && !/(?:except\w*|exclud\w*|other than|save|barring|beyond|not for|but not|apart from|in excess of|more than)[^.]{0,40}wear and tear|wear and tear[^.]{0,25}except/i.test(t))
        out.push(f('deductions', 'high', 'Tenant pays for normal wear and tear', 'Fading paint, worn fittings and other results of ordinary use are the cost of letting a flat. The usual position is that the tenant pays only for damage.', 'rw-deposit-deductions'));
      return out;
    },
    examples: {
      detected: ['Painting charges shall be deducted from the deposit.', 'The flat shall be returned in good condition, reasonable wear and tear excepted.'],
      notDetected: ['The rent is Rs. 20,000.', 'Either party may terminate by giving 30 days notice.'],
      high: ["At the time of vacating, one month's rent shall be deducted towards painting and cleaning charges irrespective of the condition of the premises.", 'The Tenant shall pay for all wear and tear including that caused by normal usage.'],
      medium: ["One month's rent shall be deducted towards painting at the time of vacating."],
      notHigh: ['The flat shall be returned in good condition, reasonable wear and tear excepted.', 'The Tenant shall pay for damage beyond normal wear and tear.', 'The Lessee is liable for damage, but not for reasonable wear and tear.', 'The Owner shall paint the flat before handing over.'],
    },
  },
  {
    id: 'late-fee', label: 'Late payment charges', detect: /(?:late|delay\w*|overdue|default\w*|belated)[^.]{0,80}(?:interest|penalt\w*|fine|charges?)|(?:interest|penalt\w*|\bfine)[^.]{0,80}(?:late|delay\w*|overdue|belated)|interest\s+(?:at|of|@)/i,
    check: t => {
      const m = t.match(/(\d+(?:\.\d+)?)\s*(?:%|per ?cent)\s*(?:per|p\.?\s?)\s*(annum|a\b|year|month|m\b|day)/i);
      if (m) { const yearly = +m[1] * (/month|^m$/i.test(m[2]) ? 12 : /day/i.test(m[2]) ? 365 : 1); if (yearly > 18) return [f('late-fee', 'medium', `Late-rent interest of about ${Math.round(yearly)}% a year`, 'Interest far above bank rates on a few days of delay works as a penalty.', 'tool-thresholds')]; }
      if (/(?:rs\.?|₹|inr)\s*[\d,]+[^.]{0,25}(?:per|a|each|every)\s+day/i.test(t)) return [f('late-fee', 'medium', 'Late fee charged per day', 'A daily charge adds up quickly. Check what a week of delay would cost against the rent.', 'tool-thresholds')];
      return [];
    },
    examples: {
      detected: ['Delayed rent shall carry interest at 24% per annum.', 'Late payment attracts a penalty of Rs. 500 per day.'],
      notDetected: ['The rent is Rs. 20,000.', 'The deposit shall be refunded without interest.'],
      medium: ['Delayed rent shall carry interest at 24% per annum.', 'Any delay in payment of rent beyond the 5th shall attract a penalty of Rs. 500 per day.'],
      notHigh: ['Delayed rent shall carry interest at 9% per annum.'],
    },
  },
  {
    id: 'early-exit', label: 'Leaving before the term ends', detect: /(?:remaining|balance|unexpired|rest of the)\s+(?:period|term|months|tenure|lock-?in)/i,
    check: t => /(?:pay|liable|forfeit\w*|recover\w*)[^.]{0,120}(?:remaining|balance|unexpired|rest of the)\s+(?:period|term|months|tenure|lock-?in)/i.test(t)
      ? [f('early-exit', 'high', 'Rent owed for the whole remaining term on leaving early', 'Paying for every remaining month is the heaviest possible exit cost. A notice period, or a fixed charge of a month or two, is the common alternative.', 'tool-thresholds')] : [],
    examples: {
      detected: ['The Tenant shall pay rent for the entire remaining period.', 'Rent for the unexpired term is payable on early exit.'],
      notDetected: ['The rent is Rs. 20,000.', 'The tenancy is for a period of 11 months.'],
      high: ['If the Tenant vacates before the expiry of the term, the Tenant shall pay rent for the entire remaining period.'],
    },
  },
  {
    id: 'lockout', label: 'Lock-out and taking possession', detect: /(?:chang\w+|replac\w+|break\w*)\s+(?:the\s+)?locks?|lock(?:ed|ing)?\s+(?:the\s+)?(?:premises|flat|house|tenant out)|take (?:back |over )?possession|remov\w+\s+(?:the\s+)?(?:\w+\s+)?(?:belongings|goods|articles|luggage)|forcibl/i,
    check: t => sentences(t).some(x => (/(?:chang\w+|replac\w+|break\w*)\s+(?:the\s+)?locks?|lock(?:ed|ing)?\s+(?:the\s+)?(?:premises|flat|house|tenant out)|remov\w+\s+(?:the\s+)?(?:\w+\s+)?(?:belongings|goods|articles|luggage)|forcibl/i.test(x) || /take (?:back |over )?possession[^.]{0,100}(?:without[^.]{0,40}(?:notice|court|process)|unpaid|default|arrears)/i.test(x))
        && new RegExp(LESSOR, 'i').test(x) && !new RegExp(`${LESSEE}\\s+(?:shall|will|must|may|is to)\\s+(?:not\\s+)?(?:remove|change|replace|take)`, 'i').test(x))
      ? [f('lockout', 'high', 'Landlord can lock the tenant out or take possession by force', 'Changing locks, removing belongings or taking the flat back without a court order is self-help eviction. Recovery of possession is meant to go through the Rent Controller or a court.', 'mta-eviction')] : [],
    examples: {
      detected: ['The Owner may change the locks if rent is unpaid.', 'The Owner may take possession on default.'],
      notDetected: ['The rent is Rs. 20,000.', 'The Lessee shall hand over vacant possession on expiry of the tenancy.'],
      high: ['The Owner shall be entitled to change the locks and take possession if rent is unpaid for 7 days.', "The Owner may remove the Tenant's belongings and take possession without notice."],
      notHigh: ['On expiry the Tenant shall remove his belongings and hand over the keys.', 'The Tenant shall not change the locks without informing the Owner.'],
    },
  },
  {
    id: 'restrictions', label: 'Limits on how the tenant lives', detect: /(non-?veg\w*|vegetarian|\bmeat\b|family members?|relatives|parents|\bspouse\b|religio\w+|\bcaste\b|community)/i,
    check: t => {
      if (/(?:not|no|prohibit\w*|forbid\w*|ban\w*)\b[^.]{0,80}(?:non-?veg\w*|\bmeat\b)|(?:non-?veg\w*|\bmeat\b)[^.]{0,60}(?:not (?:allowed|permitted)|prohibited|forbidden|banned)|only vegetarian/i.test(t))
        return [f('restrictions', 'medium', 'Food restriction', 'A rule about what you may cook or eat at home is a limit on private life. Decide before signing whether you can live with it; a breach can be used to end the tenancy.')];
      if (/(?:not|no)\b[^.]{0,100}(?:reside|stay|live)[^.]{0,60}(?:family|relatives|spouse|parents)|(?:not|no)\b[^.]{0,80}(?:family|relatives|spouse|parents)[^.]{0,60}(?:reside|stay|live)|(?:family|relatives|spouse|parents)[^.]{0,60}(?:cannot|can not|shall not|may not|must not)\s+(?:reside|stay|live)/i.test(t))
        return [f('restrictions', 'medium', 'Family members barred from living in the flat', 'A home normally includes the tenant\'s family. A bar on family staying is unusual and worth removing.')];
      return [];
    },
    examples: {
      detected: ['Non-vegetarian food is not allowed.', 'The flat is let to the Tenant and his family members.'],
      notDetected: ['The rent is Rs. 20,000.', 'The deposit is refundable.'],
      medium: ['The Tenant shall not cook or consume non-vegetarian food in the premises.', 'The Tenant shall not allow any person other than himself to reside in the premises, including family members.'],
      notHigh: ['The flat is let to the Tenant and his family members for residential use.'],
    },
  },
  {
    id: 'charges', label: 'Taxes and society charges', detect: /(property tax|municipal tax\w*|house tax|corpus|sinking fund|society charges?|future (?:levies|charges|demands)|any (?:other|future) (?:charges|levies))/i,
    check: t => {
      const out: Finding[] = [];
      if (sentences(t).some(x => /(property tax|municipal tax\w*|house tax)/i.test(x) && new RegExp(`(?:paid|borne|payable) by the ${LESSEE}|${LESSEE}[^.]{0,40}(?:shall |will |must )?(?:bear|pay)`, 'i').test(x) && !new RegExp(`(?:paid|borne|payable) by the ${LESSOR}|${LESSOR}[^.]{0,30}(?:shall|will|must)[^.]{0,20}(?:bear|pay)`, 'i').test(x)))
        out.push(f('charges', 'medium', 'Property tax put on the tenant', 'Property tax is a tax on ownership and is normally the owner\'s cost.', 'mta-repairs'));
      if (/(corpus|sinking fund|future (?:levies|charges|demands)|any (?:other|future) (?:charges|levies))/i.test(t) && !new RegExp(`(?:responsibility|cost|account) of the ${LESSOR}|(?:paid|borne|payable) by the ${LESSOR}`, 'i').test(t))
        out.push(f('charges', 'medium', 'Open-ended society charges', 'Corpus and sinking funds build the owner\'s asset, and "any future levy" has no ceiling. Ask for a monthly figure.', 'tip-receipts'));
      return out;
    },
    examples: {
      detected: ['Property tax shall be paid by the Owner.', 'Society charges of Rs. 2,000 are payable monthly.'],
      notDetected: ['The rent is Rs. 20,000.', 'No pets are allowed.'],
      medium: ['Property tax and all municipal taxes shall be paid by the Tenant.', 'The Tenant shall pay all society charges, corpus fund, and any future levies demanded by the association.'],
      notHigh: ['Property tax shall be paid by the Owner.'],
    },
  },
  // Lifestyle pack (19 Nov 2026): curfews, visitor bans, who may live in the flat, food. A restriction alone is medium
  // (a closer look, and a cloud second opinion if the on-device model says ok); a restriction that costs the deposit,
  // a fine or the flat is high. Each skips what the older guests and restrictions rules already report, so a clause is
  // not flagged twice for the same thing.
  {
    id: 'curfew', label: 'Curfew and coming-home times', detect: new RegExp(`${TIME}|\\bmidnight\\b|\\bcurfew\\b`, 'i'),
    check: t => {
      const hit = sentences(t).some(x => !new RegExp(`${LESSOR}[^.]{0,30}(?:may|shall|will|can)[^.]{0,30}(?:enter|visit|inspect)`, 'i').test(x)
        && (/\bcurfew\b/i.test(x) || new RegExp(`${MOVE}\\b[^.]{0,60}${WHEN}\\s+(?:\\d|midnight)|${WHEN}\\s+(?:${TIME}|midnight)[^.]{0,60}${MOVE}`, 'i').test(x)));
      if (!hit) return [];
      return PEN.test(t) ? [f('curfew', 'high', 'Coming home late can cost you the flat or money', 'A fixed time to be home, backed by a fine, a deduction or ending the tenancy, controls your private life and gives the landlord an easy reason to act.', 'tip-lifestyle')]
        : [f('curfew', 'medium', 'Fixed time to be home', 'A rule on when you may come and go is a limit on your private life. Ask for it to be removed, or for a gate key.', 'tip-lifestyle')];
    },
    examples: {
      detected: ['The Tenant must return before 10 PM.', 'A curfew applies to all occupants.'],
      notDetected: ['The rent is Rs. 20,000.', 'The Lessee shall keep the flat clean.'],
      high: ['Coming home after 11 p.m. more than twice a month shall be a breach, and the Owner may terminate this Agreement.'],
      medium: ['The Tenant must return to the premises before 10 PM every night.', 'The Lessee shall not enter or leave the building between 11 pm and 5 am.'],
      notHigh: ['The Landlord may enter between 10 am and 6 pm after 24 hours notice.', 'Loud music shall not be played after 10 PM.', 'The main gate is closed at 11 PM; residents have their own key.'],
    },
  },
  {
    id: 'visitors', label: 'Visitor bans and permission', detect: /\b(?:guests?|visitors?|friends|outsiders)\b/i,
    check: t => {
      const ban = /(?:not|no|never)\b[^.]{0,20}\b(?:entertain|invite|receive|host)\w*[^.]{0,20}\b(?:guests?|visitors?|friends|outsiders)\b|(?:\bno\b|\bnot\b)[^.]{0,30}\b(?:guests?|visitors?|friends|outsiders)\b[^.]{0,60}(?:allowed|permitted|entertained|admitted)|\b(?:guests?|visitors?|friends|outsiders)\b[^.]{0,60}(?:prohibited|not (?:be )?(?:allowed|permitted|entertained)|barred|forbidden)/i.test(t);
      const perm = /\b(?:guests?|visitors?|friends|outsiders)\b[^.]{0,80}(?:only |solely )?(?:with|after|without)[^.]{0,30}(?:written |prior |advance )*(?:permission|approval|consent)/i.test(t);
      if (!ban && !perm) return [];
      if (PEN.test(t)) return [f('visitors', 'high', 'A visitor can cost you money or the flat', 'A fine, a deduction or ending the tenancy because someone visited you is a heavy penalty for ordinary life.', 'tip-lifestyle')];
      if (RULES.find(r => r.id === 'guests')!.check!(t, { ex: undefined as never }).length) return []; // already reported by "guests"
      return [f('visitors', 'medium', ban ? 'No visitors allowed' : "Visitors only with the landlord's permission", 'Who visits your home is your own affair. A ban, or a permission you must ask for each time, is easy to use as a pretext.', 'tip-lifestyle')];
    },
    examples: {
      detected: ['No guests are allowed in the flat.', 'Visitors shall sign the register at the gate.'],
      notDetected: ['The rent is Rs. 20,000.', 'The deposit is refundable.'],
      high: ["If any visitor is found in the flat without the Owner's approval, Rs. 5,000 shall be deducted from the deposit."],
      medium: ['No guests or visitors are allowed inside the flat.', 'The Tenant shall not entertain any visitors in the flat.', 'Visitors may come only with the prior written permission of the Landlord.'],
      notHigh: ['Visitors shall sign the register at the gate.', 'Guests staying longer than 15 days should be informed to the Owner.'],
    },
  },
  {
    id: 'occupants', label: 'Who may live in the flat', detect: /\b(?:unmarried|married couples?|live-?in|partners?|girlfriend|boyfriend|bachelors?|spinsters?|marriage certificate|cohabit\w*)\b/i,
    check: t => {
      const limit = /(?:only|solely|exclusively)[^.]{0,30}(?:to )?(?:a )?married|\b(?:unmarried|live-?in|partners?|girlfriend|boyfriend|bachelors?|spinsters?)\b[^.]{0,80}(?:not (?:be )?(?:allowed|permitted)|prohibited|barred|forbidden|found|shall not|cannot|will not)|(?:not|no)\b[^.]{0,40}\b(?:unmarried|live-?in|partners?|girlfriend|boyfriend|bachelors?)\b|marriage certificate|cohabit\w*[^.]{0,60}(?:not|other than)[^.]{0,30}(?:spouse|husband|wife)/i.test(t);
      if (!limit) return [];
      return PEN.test(t) ? [f('occupants', 'high', 'Your partner or marital status can cost you the deposit or the flat', 'Losing the deposit or the home because of who you live with, or whether you are married, is a heavy penalty for private life.', 'tip-lifestyle')]
        : [f('occupants', 'medium', 'Limits on who may live with you', 'A rule that only married couples may stay, or that bars a partner or bachelors, reaches into your private life. Decide before signing whether you can live with it.', 'tip-lifestyle')];
    },
    examples: {
      detected: ['The flat is let only to a married couple.', 'Bachelors are not allowed.'],
      notDetected: ['The rent is Rs. 20,000.', 'The partnership firm of the Owner shall collect rent.'],
      high: ['If an unmarried partner is found staying, the entire security deposit shall stand forfeited.', "Should the Lessee be found cohabiting with a person who is not the Lessee's spouse, this lease shall be cancelled and the advance forfeited."],
      medium: ['Bachelors and live-in couples are not permitted, and the Tenant shall produce a marriage certificate on demand.', 'The Tenant shall not allow a boyfriend, girlfriend or any partner to stay in the flat.'],
      notHigh: ['The flat is let to the Tenant and his family members.'],
    },
  },
  {
    id: 'food', label: 'Food rules', detect: /\b(?:eggs?|fish|chicken|mutton|beef|pork|non-?veg\w*|vegetarian\w*|pure[- ]veg|onions?|garlic)\b/i,
    check: t => {
      const limit = /(?:not|no|prohibit\w*|forbid\w*|ban\w*)\b[^.]{0,80}\b(?:eggs?|fish|chicken|mutton|beef|pork|onions?|garlic)\b|\b(?:eggs?|fish|chicken|mutton|beef|pork|onions?|garlic)\b[^.]{0,80}(?:not (?:be )?(?:allowed|permitted|cooked)|prohibited|forbidden|banned|shall not)|pure[- ]veg\w*|only vegetarian|vegetarians? only|strictly vegetarian/i.test(t);
      const older = /(?:not|no|prohibit\w*|forbid\w*|ban\w*)\b[^.]{0,80}(?:non-?veg\w*|\bmeat\b)|(?:non-?veg\w*|\bmeat\b)[^.]{0,60}(?:not (?:allowed|permitted)|prohibited|forbidden|banned)|only vegetarian/i.test(t);
      const linked = /(?:cook\w*|eat\w*|consum\w*|bring\w*)[^.;]{0,40}\b(?:eggs?|fish|chicken|mutton|beef|pork|non-?veg\w*|meat|onions?|garlic)\b/i.test(t) && PEN.test(t);
      if (!limit && !older && !linked) return [];
      if (PEN.test(t)) return [f('food', 'high', 'What you cook can cost you money or the flat', 'A fine, a deduction or eviction over the food you cook at home is a heavy penalty for private life.', 'tip-lifestyle')];
      return older ? [] : [f('food', 'medium', 'Food restriction', 'A rule about what you may cook or eat at home is a limit on private life. Decide before signing whether you can live with it.', 'tip-lifestyle')]; // the plain non-veg ban is reported by "restrictions"
    },
    examples: {
      detected: ['Cooking fish is not allowed.', 'This is a pure veg building.'],
      notDetected: ['The rent is Rs. 20,000.', 'The Tenant shall dispose of food waste in the bins.'],
      high: ['Cooking non-vegetarian food will lead to immediate eviction.', 'Onion and garlic shall not be cooked, failing which a fine of Rs. 2,000 shall be payable.'],
      medium: ['Cooking eggs, fish or chicken is strictly prohibited in the kitchen.'],
      notHigh: ['The Tenant shall keep the kitchen clean.', 'Non-vegetarian food is not allowed.'],
    },
  },
];

const RANK: Record<Severity, number> = { info: 0, medium: 1, high: 2 };
export const maxSeverity = (fs: Finding[]): Severity | null => fs.reduce<Severity | null>((m, x) => (m === null || RANK[x.severity] > RANK[m] ? x.severity : m), null);
export const topicsFor = (text: string): Rule[] => RULES.filter(r => r.detect.test(text));

// Findings for one clause. Deposit size is checked against the Model Tenancy Act benchmark using extracted figures.
export function analyzeClause(text: string, ctx: { rent?: number | null } = {}): Finding[] {
  const ex = extract(text, { rent: ctx.rent ?? undefined });
  const out = topicsFor(text).flatMap(r => r.check?.(text, { rent: ctx.rent, ex }) ?? []);
  const dep = ex.derived.deposit, rent = ex.rent;
  if (dep !== null && rent) {
    if (dep > LIMITS.depositMonths * rent) out.push(f('deposit', 'high', `Deposit is ${(dep / rent).toFixed(1).replace(/\.0$/, '')} months' rent`, `Above this tool's ${LIMITS.depositMonths}-month threshold and far above the Model Tenancy Act's 2-month residential benchmark.`, 'mta-deposit'));
    else if (dep > 2 * rent) out.push(f('deposit', 'medium', `Deposit is ${(dep / rent).toFixed(1).replace(/\.0$/, '')} months' rent`, "Above the Model Tenancy Act's 2-month residential benchmark (a model law: binding only where a state adopted it).", 'mta-deposit'));
  }
  return out;
}

// Lease-level view: which common topics the whole lease covers, and what is missing.
const WORDS: Record<string, number> = { six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
export function leaseTermMonths(lease: string): number | null {
  const m = lease.match(/(?:period|term|tenancy|lease)[^.]{0,60}?\b(\d+|six|seven|eight|nine|ten|eleven|twelve)\s*(?:\(\s*\w+\s*\)\s*)?(months?|years?)/i);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? +m[1] : WORDS[m[1].toLowerCase()];
  return /year/i.test(m[2]) ? n * 12 : n;
}
export interface Coverage { topic: string; label: string; present: boolean; severity: Severity; note?: string; why: string }
export function coverage(clauses: string[]): Coverage[] {
  const lease = clauses.join('\n');
  const has = (id: string) => clauses.some(c => RULES.find(r => r.id === id)!.detect.test(c));
  const term = leaseTermMonths(lease), hasDeposit = /deposit/i.test(lease);
  const refundTimeline = /(refund|return)[^.]{0,100}(within|before)\s+\d+\s*(days?|weeks?|months?)/i.test(lease);
  const rows: Coverage[] = [
    { topic: 'deposit-refund', label: 'Deposit refund deadline', present: !hasDeposit || refundTimeline, severity: 'medium', note: 'tip-handover', why: 'A deposit is mentioned but no refund deadline is stated.' },
    { topic: 'notice', label: 'Notice period to end the tenancy', present: /notice/i.test(lease), severity: 'medium', note: 'tpa-106', why: "No notice period found. Without one, the Transfer of Property Act's 15-day default may apply." },
    { topic: 'maintenance', label: 'Repairs and maintenance split', present: has('maintenance'), severity: 'info', note: 'tip-handover', why: 'Who pays for repairs is not stated.' },
    { topic: 'receipts', label: 'Rent payment mode and receipts', present: has('receipts'), severity: 'info', note: 'tip-receipts', why: 'No payment mode or receipt term found.' },
    { topic: 'dispute', label: 'Dispute resolution', present: has('dispute'), severity: 'info', note: 'mta-written', why: 'No jurisdiction or dispute clause found.' },
    { topic: 'entry', label: 'Landlord entry and inspection', present: has('entry'), severity: 'info', note: 'mta-entry', why: 'No entry or inspection terms found; the Model Tenancy Act expects 24 hours notice.' },
    { topic: 'registration', label: 'Registration and stamp duty', present: has('registration') || (term !== null && term <= 11), severity: term !== null && term > 12 ? 'medium' : 'info', note: 'reg-17', why: term !== null && term > 12 ? `A ${term}-month term should be registered, but registration is not mentioned.` : 'Registration or stamp duty is not mentioned.' },
  ];
  return rows;
}
