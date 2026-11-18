import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreement, AGREE_MIN } from './readcheck.ts';

const PAGE = '1. The monthly rent is Rs. 18,000, payable by the 5th of each month. 2. The Lessee has paid a security deposit of Rs. 1,80,000.';
test('identical readings agree fully, whatever the spacing and punctuation', () => assert.equal(agreement(PAGE, PAGE.replace(/, /g, ' ,\n')), 1));
test('a couple of misread characters still pass', () => assert.ok(agreement(PAGE, PAGE.replace('18,000', '18,0O0')) >= AGREE_MIN));
test('a skipped clause fails the check', () => assert.ok(agreement(PAGE, PAGE.split(' 2. ')[0]) < AGREE_MIN));
test('a reworded reading fails the check', () => assert.ok(agreement(PAGE, 'The rent is eighteen thousand rupees a month and the tenant paid a deposit of one lakh eighty thousand.') < AGREE_MIN));
test('empty input never agrees', () => assert.equal(agreement('', PAGE), 0));
