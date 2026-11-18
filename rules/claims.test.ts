import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLAIMS, STATES } from './claims.ts';

const MTA_TEXT = 'https://livelaw.in/pdf_upload/model-tenancy-act-394449.pdf';
test('8 viral claims, each with a verdict for all three states', () => {
  assert.equal(CLAIMS.length, 8);
  assert.equal(new Set(CLAIMS.map(c => c.id)).size, 8);
  for (const c of CLAIMS) for (const s of STATES) assert.ok(c.states[s.id], `${c.id} missing ${s.id}`);
});
test('every verdict has a source, a checked date, and https links only', () => {
  for (const c of CLAIMS) for (const s of STATES) {
    const v = c.states[s.id];
    assert.ok(v.sources.length > 0 && v.text.length > 40 && /^\d{4}-\d{2}-\d{2}$/.test(v.checked), `${c.id}/${s.id}`);
    for (const x of v.sources) if (x.url) assert.ok(x.url.startsWith('https://'), x.url);
  }
});
test('"in force" rests on act text; a Model Tenancy Act verdict cites the Act and says what was not verified', () => {
  for (const c of CLAIMS) for (const s of STATES) {
    const v = c.states[s.id];
    if (v.status === 'in-force') assert.ok(['act', 'official', 'court'].includes(v.basis), `${c.id}/${s.id}`);
    if (v.status === 'mta') { assert.ok(v.sources.some(x => x.url === MTA_TEXT), `${c.id}/${s.id}`); assert.ok(v.unverified, `${c.id}/${s.id}`); }
  }
});
test('never presents the Model Tenancy Act as the law in force in these states', () => {
  for (const c of CLAIMS) for (const s of STATES) {
    const v = c.states[s.id];
    if (v.status === 'in-force') assert.ok(!v.sources.some(x => x.url === MTA_TEXT), `${c.id}/${s.id} cites the Model Tenancy Act as in force`);
  }
});
