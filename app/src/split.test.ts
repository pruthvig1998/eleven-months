import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitClauses, clauseLabel } from './split.ts';
import { SAMPLE } from './sample.ts';

const words = (t: string) => t.split(/\s+/).length;

test('sample lease still splits into its 11 clauses', () => {
  assert.equal(splitClauses(SAMPLE).length, 11);
});
test('short numbered lines are kept, not dropped', () => {
  const c = splitClauses('1. Rent: Rs. 18,000.\n2. Deposit: Rs. 54,000.\n3. Notice: 30 days.\n4. Term: 11 months.');
  assert.equal(c.length, 4);
});
test('bare headings with no digits are still dropped', () => {
  assert.deepEqual(splitClauses('RENTAL AGREEMENT\n\n1. The rent is Rs. 18,000 per month, payable monthly.'), ['1. The rent is Rs. 18,000 per month, payable monthly.']);
});
test('dotted section numbering without a trailing dot starts a new clause', () => {
  const c = splitClauses('3.1 Rent: Rupees Twenty Five Thousand only per month.\n3.2 Deposit: two months rent (Rs. 50,000).\n4.1 The Tenant shall give notice of thirty days.');
  assert.equal(c.length, 3);
});
test('a wrapped line that starts with a plain number does not split a clause', () => {
  const c = splitClauses('The tenancy is for a period of\n11 months from the date of this agreement.');
  assert.equal(c.length, 1);
});
test('a giant single paragraph is split into clauses of at most about 250 words', () => {
  const big = Array(900).fill('The Lessee shall pay the rent on time and keep the premises clean.').join(' ');
  const c = splitClauses(big);
  assert.ok(c.length > 20);
  assert.ok(Math.max(...c.map(words)) <= 250, String(Math.max(...c.map(words))));
});
test('one sentence with no punctuation is hard-split by words', () => {
  const c = splitClauses(Array(2000).fill('word').join(' '));
  assert.ok(Math.max(...c.map(words)) <= 250);
});

test('clause labels follow the lease numbering, not the position', () => {
  const c = splitClauses(SAMPLE);
  assert.equal(clauseLabel(c[0], 0), 'Opening');
  assert.equal(clauseLabel(c[1], 1), 'Clause 1');
  assert.equal(clauseLabel(c[10], 10), 'Clause 10');
  assert.equal(clauseLabel('3.1 Rent: Rupees Twenty Five Thousand only.', 4), 'Clause 3.1');
  assert.equal(clauseLabel('The parties agree as follows.', 2), 'Part 3');
});
