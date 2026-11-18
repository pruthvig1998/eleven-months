// Third unseen set, written on 18 Nov 2026 after sets 1 and 2 were used to widen the rules.
// The first-run number is the honest one; record it in SCHEDULE.md before changing any rule.
import { analyzeClause } from './topics.ts';
import { extract } from './extract.ts';
const R: [string, string][] = [
['whitewash fixed','A flat sum of Rs. 12,000 towards whitewashing will be recovered from the deposit at the end of the tenancy in all cases.'],
['interest daily pct','Unpaid rent will attract interest of 0.1% per day.'],
['late lump','If rent is late by more than three days, the tenant must pay an extra Rs. 2,000.'],
['whole tenure','On premature vacation, the licensee remains liable to pay the licence fee for the unexpired tenure.'],
['padlock','The owner may put his own padlock on the door if two months of rent are outstanding.'],
['throw out goods','The landlord reserves the right to throw out the tenant\'s luggage if the flat is not vacated on the due date.'],
['end at pleasure','This tenancy can be ended by the owner at his pleasure.'],
['no boys','Male visitors are not allowed after 8 pm.'],
['no beef','Cooking of beef or pork in the kitchen is forbidden.'],
['spouse only','Nobody other than the tenant and his spouse may live here, and relatives staying over is not allowed.'],
['municipal','All municipal taxes and cesses shall be borne by the lessee.'],
['any demand','The tenant agrees to pay whatever amount the apartment association demands from time to time.'],
['extension charge','For every extension of this agreement the tenant will pay Rs. 5,000 as documentation charges to the landlord.'],
['refund 6 months','The deposit will be repaid six months after the keys are returned.'],
['inflated power','Electricity is charged at a flat Rs. 3,000 a month regardless of usage.'],
['signed cheques','The tenant shall deposit two signed cheque leaves without date with the landlord.'],
['fair wear','Any deterioration of fittings from regular use will be charged to the tenant.'],
['deposit kept','The owner may keep the full advance if he is not happy with the state of the flat.'],
['key entry','The landlord keeps a spare key and can come in without telling the tenant.'],
['rent hike','The owner can increase the rent whenever he feels the market has gone up.'],
];
const OK: [string,string][] = [
['ok late','A grace period of five days applies, after which interest at 12% per annum is payable on overdue rent.'],
['ok exit','Either side may end the tenancy during the lock-in by paying one month of rent.'],
['ok guests','Guests are welcome; anyone staying longer than two weeks should be mentioned to the owner.'],
['ok food','The tenant may cook any food and shall keep the kitchen chimney clean.'],
['ok tax','The owner shall pay the property tax; the tenant pays the monthly maintenance of Rs. 2,500 to the association.'],
['ok refund','The owner shall return the deposit on the day the keys are handed over, less any unpaid rent.'],
['ok power','The tenant pays electricity directly to the electricity company as per the bill.'],
['ok locks','The tenant may change the main door lock at his own cost and shall hand over all keys on vacating.'],
['ok renew','Renewal is by mutual agreement in writing, with the rent to rise by 5% a year.'],
['ok entry','The owner may visit for repairs after agreeing a time with the tenant at least a day before.'],
];
let miss=0, fp=0;
for (const [k,t] of R) { const f=analyzeClause(t,{rent:25000}).filter(x=>x.severity!=='info'); const e=extract(t,{rent:25000}); const hit=f.length||e.flags.length; if(!hit) miss++; console.log((hit?'CAUGHT ':'MISSED ')+k+' | '+[...f.map(x=>x.severity+':'+x.title),...e.flags].join('; ')); }
for (const [k,t] of OK) { const f=analyzeClause(t,{rent:20000}).filter(x=>x.severity!=='info'); const e=extract(t,{rent:20000}); const hit=f.length||e.flags.length; if(hit) fp++; console.log((hit?'FALSE+ ':'clear  ')+k+' | '+[...f.map(x=>x.severity+':'+x.title),...e.flags].join('; ')); }
console.log(`missed ${miss}/${R.length}, false positives ${fp}/${OK.length}`);
