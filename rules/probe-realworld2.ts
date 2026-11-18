// Second unseen set, written after the Phase 1 rules. The first-run number is the honest one; do not tune against this file.
import { analyzeClause } from './topics.ts';
import { extract } from './extract.ts';
const R: [string, string][] = [
['repaint fee','When the licensee moves out, a sum of Rs. 15,000 will be kept back for repainting, no matter how the walls look.'],
['deep clean','A deep-cleaning fee equal to half a month rent is compulsorily adjusted from the advance.'],
['late interest monthly','Rent not received by the due date shall bear interest of 3% per month until paid.'],
['daily fine','A fine of INR 300 for every day of delay will be levied on belated rent.'],
['balance months','Should the occupant leave during the lock-in, the rent for the balance months becomes payable at once.'],
['locks','In case of arrears the landlord is free to replace the locks of the flat.'],
['belongings','Upon default the owner can remove the goods of the tenant and keep them until dues are cleared.'],
['at will','The landlord has the right to cancel this arrangement whenever he wants, for whatever reason.'],
['no visitors','Friends of the opposite sex are strictly not permitted inside the house.'],
['veg only','Only vegetarian food may be prepared; meat and eggs are prohibited.'],
['no parents','Parents or relatives of the tenant cannot stay in the flat for more than two days.'],
['house tax','House tax for the tenancy period will be borne by the tenant.'],
['sinking fund','The tenant will contribute to the sinking fund and any other charges the society may raise.'],
['renewal charge','A renewal fee of Rs. 10,000 is payable to the owner each time the agreement is extended.'],
['slow refund','The advance will be returned within 120 days from the date of vacating.'],
['unit rate','Power will be billed at Rs 14 per unit by the owner.'],
['security cheque','An un-dated cheque signed by the tenant shall be held by the owner as security.'],
['usage wear','The tenant is liable for wear and tear arising from ordinary use.'],
['deposit eaten','If two months notice is not served, the advance stands forfeited in full.'],
['enter freely','The owner can walk in whenever he likes to check the house.'],
];
const OK: [string,string][] = [
['ok wear','The tenant shall return the flat in the same condition, fair wear and tear excepted.'],
['ok paint','If the walls are damaged beyond normal use, repainting cost at actuals with a bill may be deducted.'],
['ok interest','Rent delayed beyond seven days carries interest at 9% per annum.'],
['ok family','The premises are let for the residence of the tenant and his family members.'],
['ok tax','Property tax and society corpus contributions are the responsibility of the owner.'],
['ok refund','The deposit will be returned within 7 days of handing over the keys.'],
['ok meter','Electricity is payable by the tenant as per the electricity company meter.'],
['ok cheque','Rent may be paid by cheque or bank transfer on or before the 5th.'],
['ok possession','On expiry, the tenant shall hand over possession and the owner shall take possession after a joint inspection.'],
['ok renew','The agreement may be renewed for a further 11 months by mutual consent with a 5% increase.'],
];
let miss=0, fp=0;
for (const [k,t] of R) { const f=analyzeClause(t,{rent:25000}).filter(x=>x.severity!=='info'); const e=extract(t,{rent:25000}); const hit=f.length||e.flags.length; if(!hit) miss++; console.log((hit?'CAUGHT ':'MISSED ')+k+' | '+[...f.map(x=>x.severity+':'+x.title),...e.flags].join('; ')); }
for (const [k,t] of OK) { const f=analyzeClause(t,{rent:20000}).filter(x=>x.severity!=='info'); const e=extract(t,{rent:20000}); const hit=f.length||e.flags.length; if(hit) fp++; console.log((hit?'FALSE+ ':'clear  ')+k+' | '+[...f.map(x=>x.severity+':'+x.title),...e.flags].join('; ')); }
console.log(`missed ${miss}/${R.length}, false positives ${fp}/${OK.length}`);
