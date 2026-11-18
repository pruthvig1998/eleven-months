import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clean, githubUrl, issueTitle, routes } from './suggest.ts';

test('only the GitHub route shows when nothing else is set up', () => {
  assert.deepEqual(routes().map(r => r.id), ['github']);
  assert.match(routes()[0].account, /GitHub account/);
});

test('suggestion text is masked and capped before it leaves the page', () => {
  const s = clean({ bucket: 'wrong', text: '  My PAN is ABCDE1234F and phone 9876543210. ' + 'x'.repeat(3000), source: ' https://example.org ' });
  assert.doesNotMatch(s.text, /ABCDE1234F|9876543210/);
  assert.equal(s.text.length, 2000);
  assert.equal(s.source, 'https://example.org');
});

test('GitHub link opens the matching issue form, prefilled', () => {
  const s = { bucket: 'new-info' as const, text: 'Stamp duty changed in December.', source: 'Gazette notice' };
  const u = new URL(githubUrl(s));
  assert.equal(u.pathname, '/pruthvig1998/eleven-months/issues/new');
  assert.equal(u.searchParams.get('template'), 'new-info.yml');
  assert.equal(u.searchParams.get('details'), s.text);
  assert.equal(u.searchParams.get('source'), 'Gazette notice');
  assert.equal(issueTitle(s), '[new-info] Stamp duty changed in December.');
});
