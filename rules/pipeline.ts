// Routing: rules first, Nano as judge, cloud only when they cannot be trusted together.
// Pure decision function: callers supply Nano's output and (if needed) cloud's. No network here.
import { extract, type Ctx, type Extraction } from './extract.ts';
import { analyzeClause, maxSeverity, type Finding } from './topics.ts';

export type Label = 'ok' | 'risky';
export type Field = 'deposit' | 'lockin_months' | 'notice_days' | 'escalation_pct';
export const FIELDS: Field[] = ['deposit', 'lockin_months', 'notice_days', 'escalation_pct'];
export interface Model { label: Label | null; fields: Partial<Record<Field, unknown>> | null; reason?: string }

// Does the clause contain any figure at all? If not, the on-device numbers prompt is skipped (it can only invent values).
const FIGURE = /\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety|hundred|thousand|lakhs?|lacs?|crores?|half|double|twice|triple|fortnight)\b/i;
export const hasFigures = (text: string): boolean => FIGURE.test(text);

export interface Decision {
  rules: Extraction;
  topics: Finding[]; // topic findings from topics.ts (entry, receipts, forfeiture, ...); a high one counts like a numeric flag
  needsCloud: boolean;
  reasons: string[];
}
export interface Final {
  label: Label | null;
  fields: Record<Field, number | null>;
  source: 'rules+nano' | 'rules+cloud';
  check: boolean; // true = show "check this clause": models and rules disagree
  reasons: string[];
}

// Nano output is only trusted when it parses to a real label; "ok|risky" echoes and empty strings are not.
export const toLabel = (v: unknown): Label | null => (v === 'ok' || v === 'risky' ? v : null);
export const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

// mediumToCloud = false turns off the cloud second opinion on medium findings (fewer clauses leave the device, lower recall).
export function decide(text: string, nano: Model, ctx: Ctx & { mediumToCloud?: boolean } = {}): Decision {
  const rules = extract(text, ctx);
  const topics = analyzeClause(text, { rent: ctx.rent });
  const highTopics = topics.filter(x => x.severity === 'high');
  const reasons: string[] = [];
  if (nano.label === null) reasons.push('nano_label_unusable');
  if (nano.fields === null) reasons.push('nano_fields_unusable');
  if (rules.unsure.length) reasons.push(`rules_unsure:${rules.unsure.join(',')}`);
  if (nano.fields) for (const f of FIELDS) {
    if (rules.derived[f] !== toNum(nano.fields[f])) reasons.push(`field_disagree:${f}`);
  }
  if (nano.label === 'ok' && (rules.flags.length || highTopics.length)) reasons.push(`ok_but_flagged:${[...new Set([...rules.flags, ...highTopics.map(x => x.topic)])].join(',')}`);
  // Stage A finding: 10 of the 13 harmful clauses the desktop run missed were ones Nano called ok while a rule had
  // raised a medium finding. A medium finding now asks the cloud for a second opinion.
  const medium = topics.filter(x => x.severity === 'medium');
  if (ctx.mediumToCloud !== false && nano.label === 'ok' && !rules.flags.length && !highTopics.length && medium.length) reasons.push(`ok_but_medium:${[...new Set(medium.map(x => x.topic))].join(',')}`);
  return { rules, topics, needsCloud: reasons.length > 0, reasons };
}

// Rules win on any field they extracted; cloud (or Nano if cloud was not called) fills the rest.
// Label is cloud's when cloud was called. Without cloud, rules flags can only raise ok to risky.
export function finalize(d: Decision, nano: Model, cloud: Model | null): Final {
  const fields = {} as Record<Field, number | null>;
  let check = false;
  for (const f of FIELDS) {
    const r = d.rules.derived[f];
    const c = cloud?.fields ? toNum(cloud.fields[f]) : null;
    const n = nano.fields ? toNum(nano.fields[f]) : null;
    fields[f] = r ?? (cloud ? c : n);
    if (cloud && r !== null && c !== null && r !== c) check = true;
  }
  const label = cloud ? cloud.label ?? nano.label : nano.label === 'ok' && (d.rules.flags.length || maxSeverity(d.topics) === 'high') ? 'risky' : nano.label;
  if (cloud && nano.label !== null && cloud.label !== nano.label) check = true;
  return { label, fields, source: cloud ? 'rules+cloud' : 'rules+nano', check, reasons: d.reasons };
}
