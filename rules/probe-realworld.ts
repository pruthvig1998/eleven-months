import { analyzeClause } from './topics.ts';
import { extract } from './extract.ts';
const R: [string, string][] = [
['painting deduction','At the time of vacating, one month\'s rent shall be deducted towards painting and cleaning charges irrespective of the condition of the premises.'],
['late fee per day','Any delay in payment of rent beyond the 5th shall attract a penalty of Rs. 500 per day.'],
['interest 24%','Delayed rent shall carry interest at 24% per annum.'],
['pay full remaining term','If the Tenant vacates before the expiry of the term, the Tenant shall pay rent for the entire remaining period.'],
['structural repairs on tenant','All repairs, including structural repairs and major plumbing and electrical works, shall be borne by the Tenant.'],
['sub-meter rate','Electricity shall be charged at Rs. 12 per unit as per the Owner\'s sub-meter.'],
['guest ban','The Tenant shall not permit any guests of the opposite gender or overnight visitors without the Owner\'s written permission.'],
['self-help eviction','On default, the Owner may forcibly evict the Tenant and remove the belongings without any notice or court order.'],
['lock change','The Owner shall be entitled to change the locks and take possession if rent is unpaid for 7 days.'],
['rent at discretion','The Owner may revise the rent at any time at his sole discretion.'],
['deposit back in 90 days','The security deposit shall be refunded without interest within 90 days after vacating.'],
['renewal fee','On each renewal the Tenant shall pay one month\'s rent as renewal charges to the Owner.'],
['unlimited indemnity','The Tenant shall indemnify the Owner against all losses, claims and damages of whatsoever nature arising from any cause.'],
['far jurisdiction','Courts at New Delhi alone shall have jurisdiction over any dispute.'],
['waives rent control','The Tenant waives all rights under any rent control legislation.'],
['normal wear charged','The Tenant shall pay for all wear and tear including that caused by normal usage.'],
['duplicate key','The Owner shall retain a duplicate key and may enter the premises whenever he wishes.'],
['blank cheque','The Tenant shall hand over eleven post-dated cheques and one undated blank signed cheque as security.'],
['open-ended society levies','The Tenant shall pay all society charges, corpus fund, and any future levies demanded by the association.'],
['property tax on tenant','Property tax and all municipal taxes shall be paid by the Tenant.'],
['food restriction','The Tenant shall not cook or consume non-vegetarian food in the premises.'],
['owner ends anytime','The Owner may terminate this agreement at any time without assigning any reason.'],
['deposit forfeited on short notice','If the tenant fails to give two months notice, the entire deposit shall be forfeited.'],
['Hinglish non-refundable','Kirayedar ko 2 mahine ka advance dena hoga jo wapas nahi hoga.'],
['non-refundable advance','An advance amount of Rs.3,00,000/- (non-refundable) has been paid by the Tenant. The monthly rent is Rs.25,000/-.'],
['15% every 11 months','The rent shall be enhanced by 15% every eleven months.'],
['triple rent holdover','If the Tenant fails to vacate, he shall pay damages at three times the monthly rent for each day of overstay.'],
['no sublet/any family','The Tenant shall not allow any person other than himself to reside in the premises, including family members.'],
['amount in words','The Tenant has paid a refundable deposit of Rupees Two Lakhs Fifty Thousand only. The monthly rent is Rupees Twenty Five Thousand only.'],
['notice in words','Either party may terminate by giving one week notice in writing.'],
];
const OK: [string,string][] = [
['ok rent','The monthly rent is Rs. 20,000, payable by the 7th of each month by bank transfer.'],
['ok deposit','The Tenant has paid a refundable deposit of Rs. 40,000, returnable within 15 days of vacating after deducting unpaid rent and proven damage.'],
['ok notice','Either party may terminate this agreement by giving 30 days written notice.'],
['ok entry','The Owner may inspect the premises with 24 hours prior written notice at a reasonable time.'],
['ok repairs','Minor repairs up to Rs. 1,000 are borne by the Tenant; structural repairs are borne by the Owner.'],
['ok use','The premises shall be used for residential purposes only.'],
];
let miss=0, fp=0;
for (const [k,t] of R) { const f=analyzeClause(t,{rent:25000}); const e=extract(t,{rent:25000}); const hit=f.filter(x=>x.severity!=='info').length||e.flags.length; if(!hit) miss++; console.log((hit?'CAUGHT ':'MISSED ')+k+' | '+[...f.map(x=>x.severity+':'+x.title),...e.flags].join('; ')); }
for (const [k,t] of OK) { const f=analyzeClause(t,{rent:20000}); const e=extract(t,{rent:20000}); const hit=f.filter(x=>x.severity==='high'||x.severity==='medium').length||e.flags.length; if(hit) fp++; console.log((hit?'FALSE+ ':'clear  ')+k+' | '+[...f.map(x=>x.severity+':'+x.title),...e.flags].join('; ')); }
console.log(`missed ${miss}/${R.length}, false positives ${fp}/${OK.length}`);
