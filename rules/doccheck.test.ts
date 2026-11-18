import { test } from 'node:test';
import assert from 'node:assert/strict';
import { docCheck } from './doccheck.ts';

const EN = 'This rental agreement is made at Hyderabad between the Lessor and the Lessee. The monthly rent is Rs. 18,000 for residential use.';
test('an English rental agreement passes with no warnings', () => assert.deepEqual(docCheck(EN), { block: null, warnings: [] }));
test('Telugu and Hindi script are declined', () => {
  assert.ok(docCheck('ఈ అద్దె ఒప్పందం హైదరాబాద్‌లో యజమాని మరియు అద్దెదారు మధ్య కుదిరింది. నెలసరి అద్దె పద్దెనిమిది వేల రూపాయలు.').block);
  assert.ok(docCheck('यह किराया अनुबंध हैदराबाद में मकान मालिक और किरायेदार के बीच किया गया है। मासिक किराया अठारह हजार रुपये है।').block);
});
test('Hindi in English letters is declined', () => assert.ok(docCheck('Kirayedar ko 2 mahine ka advance dena hoga jo wapas nahi hoga. Kiraya har mahine 5 tarikh tak dena hoga aur makan malik ko rupaye dena hoga.').block));
test('a document that is not a rental agreement is declined', () => assert.ok(docCheck('This offer letter confirms your appointment as Software Engineer with an annual salary of Rs. 12,00,000 and a probation of six months.').block));
test('too little text is declined', () => assert.ok(docCheck('Rent 5000').block));
test('leave and licence, PG and commercial documents get a warning, not a block', () => {
  for (const t of [
    'This Leave and Licence agreement is made between the Licensor and the Licensee. The monthly licence fee (rent) is Rs. 30,000.',
    'Paying guest accommodation rules: the monthly rent of Rs. 9,000 includes food. The hostel gate closes at 10 pm for every tenant.',
    'The Lessor lets the shop premises to the Lessee for commercial use at a monthly rent of Rs. 60,000.',
  ]) { const r = docCheck(t); assert.equal(r.block, null, t); assert.equal(r.warnings.length, 1, t); }
});
