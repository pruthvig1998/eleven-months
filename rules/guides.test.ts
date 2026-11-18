import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUIDES, guideById, stepBasis } from './guides.ts';
import { NOTES, noteById, OPEN_QUESTIONS, BASIS_LABEL, searchNotes } from './knowledge.ts';

// Trust architecture: every note says how we know it and where it applies.
test('every note has a basis, a scope and a checked date', () => {
  for (const n of NOTES) {
    assert.ok(n.basis in BASIS_LABEL, `${n.id}: basis`);
    assert.ok(n.scope === 'india' || n.scope === 'telangana', `${n.id}: scope`);
    assert.match(n.checked, /^\d{4}-\d{2}-\d{2}$/, n.id);
  }
});
test('anything that is not a tip or a tool choice names at least one source', () => {
  for (const n of NOTES) if (n.basis !== 'practice' && n.basis !== 'tool') assert.ok(n.sources.length >= 1, `${n.id} has no source`);
});
test('a note marked official, act or court links an https source', () => {
  for (const n of NOTES) if (n.basis === 'official' || n.basis === 'act' || n.basis === 'court') assert.ok(n.sources.some(s => s.url?.startsWith('https://')), n.id);
});
test('Model Tenancy Act notes say what is unverified about adoption', () => {
  for (const n of NOTES) if (n.id.startsWith('mta-')) assert.ok(n.unverified, `${n.id} needs an unverified line`);
});

test('real-world reports are labelled as unverified and still name their sources', () => {
  const rw = NOTES.filter(n => n.basis === 'reports');
  assert.ok(rw.length >= 3);
  for (const n of rw) { assert.ok(n.unverified, n.id); assert.ok(n.sources.some(s => s.url?.startsWith('https://')), n.id); assert.match(n.title, /report/i, n.id); }
});
test('the bribe guide gives the official fee, the reporting route, and ends with legal aid', () => {
  const g = guideById('asked-for-extra')!;
  const ids = g.steps.map(s => s.note);
  assert.ok(ids.includes('regfee-ts') && ids.includes('acb'));
  assert.equal(noteById('regfee-ts')!.basis, 'official');
  assert.equal(noteById('acb')!.basis, 'official');
  assert.match(noteById('acb')!.summary, /1064/);
  assert.match(noteById('regfee-ts')!.summary, /0\.2%/);
});
test('guide ids are unique and every guide has at least 4 steps', () => {
  assert.equal(new Set(GUIDES.map(g => g.id)).size, GUIDES.length);
  for (const g of GUIDES) assert.ok(g.steps.length >= 4 && g.title && g.when, g.id);
});
test('every note a guide step links exists', () => {
  for (const g of GUIDES) for (const s of g.steps) if (s.note) assert.ok(noteById(s.note), `${g.id}: missing note ${s.note}`);
});
test('steps that name a law or benchmark link a note', () => {
  const legalWords = /\b(Act|benchmark|Rent Controller|Rent Authority|registered|stamp duty|tax|registration fee|Anti-Corruption)\b/;
  for (const g of GUIDES) for (const s of g.steps) if (legalWords.test(s.text)) assert.ok(s.note, `${g.id}: "${s.text.slice(0, 50)}" makes a legal point without a note`);
});
test('every dispute guide ends with free legal aid', () => {
  for (const g of GUIDES.filter(x => x.dispute)) assert.equal(g.steps.at(-1)!.note, 'legal-aid', g.id);
});
test('a step with no note is a practical tip; a linked step takes its note basis', () => {
  const g = guideById('services-cut')!;
  assert.equal(stepBasis(g.steps[0]), 'practice');
  assert.equal(stepBasis(g.steps.at(-1)!), 'official');
  assert.equal(stepBasis(g.steps.find(s => s.note === 'ts-rca')!), 'act');
  assert.equal(stepBasis(g.steps.find(s => s.note === 'ts-amenities')!), 'act');
});

test('every open question points at notes that exist and says where the answer lives', () => {
  assert.ok(OPEN_QUESTIONS.length >= 3);
  for (const q of OPEN_QUESTIONS) { assert.ok(q.where && q.question.endsWith('?')); for (const id of q.notes) assert.ok(noteById(id), id); if (q.url) assert.ok(q.url.startsWith('https://')); }
});
test('the Telangana act notes all warn that coverage is limited', () => {
  for (const id of ['ts-rca', 'ts-amenities', 'ts-advance']) assert.match(noteById(id)!.summary, /3,500/, id);
});
test('search finds the new help notes', () => {
  assert.equal(searchNotes('landlord cut water section 14 rent controller')[0].note.id, 'ts-amenities');
  assert.equal(searchNotes('free legal aid helpline')[0].note.id, 'legal-aid');
  assert.equal(searchNotes('police verification tenant')[0].note.id, 'police-verification');
});
