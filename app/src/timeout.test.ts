import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout, TimeoutError } from './timeout.ts';

test('a call that answers in time returns its answer', async () => {
  assert.equal(await withTimeout(async () => 'ok', 200, 'x'), 'ok');
});
test('a call that never answers is cut off, and its signal is aborted', async () => {
  let aborted = false;
  const p = withTimeout(s => new Promise<string>(() => { s.addEventListener('abort', () => { aborted = true; }); }), 30, 'The on-device model');
  await assert.rejects(p, (e: Error) => e instanceof TimeoutError && /no answer in 0 s/.test(e.message));
  assert.ok(aborted);
});
test('an error from the call itself passes through unchanged', async () => {
  await assert.rejects(withTimeout(async () => { throw new Error('boom'); }, 200, 'x'), /boom/);
});
