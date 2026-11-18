// Whole-agreement checks: things no single clause shows. Basics present, figures that contradict each other,
// a court in a city the agreement names nowhere else, and a rough stamp duty estimate for Telangana.
import { extract } from './extract.ts';
import { leaseTermMonths } from './topics.ts';

export interface Basic { label: string; present: boolean; why: string }
export interface LeaseReport { basics: Basic[]; conflicts: string[]; court: string | null; cost: { months: number; rent: number; duty: number } | null }

const fmt = (n: number) => n.toLocaleString('en-IN');
const DATE = /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:day of\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*,?\s+\d{4}\b|\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/i;

export function leaseReport(clauses: string[]): LeaseReport {
  const lease = clauses.join('\n');
  const rent = extract(lease).rent, months = leaseTermMonths(lease);
  const basics: Basic[] = [
    { label: 'Both parties named', present: /\b(lessor|landlord|owner|licen[cs]or)\b/i.test(lease) && /\b(lessee|tenant|licen[cs]ee)\b/i.test(lease), why: 'The agreement should say who the owner and the tenant are.' },
    { label: 'Address of the flat', present: /\b(flat|house|door|plot|h\.?\s?no|apartment|villa|portion)\b[^.\n]{0,40}\b(no\.?|number|#)?\s*[\w\/-]*\d|situated at|located at|premises at|bearing (no|number)/i.test(lease), why: 'Without the address of the flat, it is unclear what is being let.' },
    { label: 'Start date', present: DATE.test(lease), why: 'No date was found. The start date fixes when rent, notice and the term are counted from.' },
    { label: 'Length of the tenancy', present: months !== null, why: 'No term was found. Without one, either side may claim it is month to month.' },
    { label: 'Monthly rent', present: rent !== null, why: 'No monthly rent figure was found.' },
  ];
  // Figures stated more than once must agree.
  const conflicts: string[] = [];
  const seen = { rent: new Set<number>(), deposit: new Set<number>(), rise: new Set<number>() };
  for (const c of clauses) {
    const e = extract(c);
    if (e.rent !== null) seen.rent.add(e.rent);
    if (e.deposit.value !== null) seen.deposit.add(e.deposit.value);
    if (e.derived.escalation_pct !== null) seen.rise.add(e.derived.escalation_pct);
  }
  if (seen.rent.size > 1) conflicts.push(`The monthly rent is stated as different amounts: Rs. ${[...seen.rent].map(fmt).join(' and Rs. ')}.`);
  if (seen.deposit.size > 1) conflicts.push(`The deposit is stated as different amounts: Rs. ${[...seen.deposit].map(fmt).join(' and Rs. ')}.`);
  if (seen.rise.size > 1) conflicts.push(`The rent increase is stated as different percentages: ${[...seen.rise].join('% and ')}%.`);
  // Exclusive court in a city that appears nowhere else in the agreement.
  let court: string | null = null;
  const j = lease.match(/[Cc]ourts?\s+(?:at|in|of)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
  // A state or country is not a distant city, so it is not reported.
  if (j && lease.split(j[1]).length === 2 && !/^(India|Telangana|Andhra Pradesh|Karnataka|Maharashtra|Tamil Nadu|Kerala|Delhi State)$/.test(j[1])) court = j[1];
  // shortcut: 0.4% of total rent for terms under a year is the inherited Andhra Pradesh rate and is not confirmed
  // against a current Telangana schedule (see the stamp-ts note); replace when the department's rate is verified.
  const cost = rent !== null && months !== null && months < 12 ? { months, rent, duty: Math.ceil((rent * months * 0.004) / 10) * 10 } : null;
  return { basics, conflicts, court, cost };
}
