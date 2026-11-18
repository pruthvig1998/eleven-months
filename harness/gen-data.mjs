// Generates data/clauses.json and data/pii.json (synthetic only)
import fs from 'node:fs';
const F=(d=null,l=null,n=null,e=null)=>({deposit:d,lockin_months:l,notice_days:n,escalation_pct:e});
const C=[]; const add=(label,risk_type,text,fields=F(),tricky=false)=>C.push({label,risk_type,text,fields,tricky});
// ---- RISKY (20)
add('risky','deposit',"The Lessee shall pay to the Lessor an interest-free refundable security deposit of Rs. 3,00,000 (Rupees Three Lakhs only) on or before the date of execution of this Agreement. The monthly rent is Rs. 25,000.",F(300000));
add('risky','deposit',"The Lessee has paid a security deposit equal to ten months' rent, the monthly rent being Rs. 18,000. The Lessor may forfeit the entire deposit, without assigning any reason, if the Lessee vacates the premises before the Lessor is satisfied with the condition of the flat.",F(180000),true);
add('risky','deposit',"Security deposit of Rs. 1,50,000 shall be paid by the Lessee. On termination, the Lessor shall refund the deposit only after the Lessor has re-let the premises to a new tenant, and no interest or time limit shall apply to such refund.",F(150000));
add('risky','deposit',"The Lessee shall deposit Rs. 2,40,000 as security. Rent is Rs. 20,000 per month. The Lessor may deduct painting, cleaning and any other charges at his sole discretion, and the Lessee waives the right to question the deductions.",F(240000));
add('risky','lockin',"The Lessee shall not vacate the premises during the first eleven months of this Agreement. If the Lessee leaves earlier for any reason, the Lessee shall pay the full rent for the remaining months of the term, while the Lessor may terminate at any time.",F(null,11));
add('risky','lockin',"This Agreement carries a lock-in period of 10 months for the Lessee. In case of early exit, the Lessee shall forfeit the security deposit and shall also pay three months' additional rent as penalty.",F(null,10));
add('risky','lockin',"There shall be a lock-in period of twelve (12) months, binding on the Lessee only. The Lessor retains the right to terminate this tenancy at any time by giving a notice of seven days.",F(null,12,7),true);
add('risky','notice',"Either party may terminate this tenancy by giving notice of 7 days. On expiry of the notice the Lessee shall hand over vacant possession, failing which the Lessor may remove the belongings of the Lessee.",F(null,null,7));
add('risky','notice',"The Lessee shall give two months' written notice before vacating, whereas the Lessor shall be entitled to ask the Lessee to vacate on three days' notice if the Lessor requires the premises for any purpose.",F(null,null,3),true);
add('risky','notice',"The Lessor may terminate this Agreement without notice if, in the opinion of the Lessor, the Lessee has caused nuisance. The Lessee shall give 90 days' notice to terminate.",F(null,null,90));
add('risky','escalation',"The rent shall be increased by 25% at the end of every six months of the tenancy, and the Lessee agrees to pay the enhanced rent without demur.",F(null,null,null,25));
add('risky','escalation',"The monthly rent shall be Rs. 22,000 for the first year. For the renewal period, the Lessor may revise the rent at his discretion by up to fifteen percent, and the Lessee shall pay the revised rent from the first day of the renewed term.",F(null,null,null,15),true);
add('risky','escalation',"Rent shall escalate at 20% per annum, compounded, and in addition the Lessee shall pay a further one-time increase of Rs. 2,000 each time the Lessor pays property tax.",F(null,null,null,20));
add('risky','eviction',"The Lessor shall have the right to enter the premises at any time of day or night without notice, and to evict the Lessee immediately, without refund of rent already paid, if the Lessee delays the rent by even one day.",F());
add('risky','eviction',"If the Lessee is found to have any guest staying overnight without the written permission of the Lessor, the Lessor may treat this as a breach, cut off water and electricity and re-enter the premises forthwith.",F());
add('risky','eviction',"In the event of sale of the premises, the Lessee shall vacate within 48 hours of being informed, and the Lessee shall have no claim of any kind, including for refund of the security deposit until the sale deed is registered.",F());
add('risky','maintenance',"The Lessee shall bear all structural repairs, including leakage of roof, cracks in walls, and replacement of plumbing and electrical wiring, at the Lessee's cost, irrespective of the cause of the damage.",F());
add('risky','maintenance',"The Lessee shall pay a fixed maintenance charge of Rs. 8,000 per month to the Lessor, in addition to the amounts demanded by the association, and the Lessor shall not be required to produce any bills or receipts for such charge.",F());
add('risky','other',"The Lessee shall not be entitled to any receipt for rent paid in cash, and the Lessee acknowledges that the Lessor's own record shall be conclusive evidence of the rent paid or unpaid.",F());
add('risky','other',"The Lessee agrees that any dispute shall be decided solely by an arbitrator appointed by the Lessor, whose decision shall be final, and that the Lessee shall bear the entire cost of arbitration, even if the Lessee succeeds.",F());
// ---- OK (20)
add('ok',null,"Although the draft circulated earlier mentioned a security deposit of Rs. 50,000, the parties have now agreed that the deposit actually payable by the Lessee shall be Rs. 40,000, and this clause prevails over the draft.",F(40000),true);
add('ok',null,"The Lessor hereby lets out and the Lessee hereby takes on lease the residential flat bearing No. 402, Fourth Floor, Sunrise Apartments, Madhapur, Hyderabad, Telangana, for residential purposes only.");
add('ok',null,"The tenancy shall be for a period of eleven (11) months commencing from 1st December 2026 and ending on 31st October 2027, and may be renewed by mutual consent in writing.");
add('ok',null,"The Lessee shall pay a monthly rent of Rs. 20,000 (Rupees Twenty Thousand only) on or before the 5th day of each calendar month through bank transfer to the account of the Lessor.");
add('ok',null,"The Lessee has paid to the Lessor a refundable interest-free security deposit of Rs. 40,000, being two months' rent, by cheque. The Lessor shall refund the deposit within 15 days of the Lessee handing over vacant possession, after deducting only proven unpaid dues.",F(40000));
add('ok',null,"The Lessee shall pay an interest-free security deposit of Rs. 60,000. The Lessor shall return the same within thirty days of vacation of the premises, less any documented damage beyond normal wear and tear.",F(60000));
add('ok',null,"Either party may terminate this tenancy by giving the other party one month's (30 days) prior written notice. No penalty shall apply on such termination.",F(null,null,30));
add('ok',null,"There shall be a lock-in period of three months for both parties. After the lock-in period, either party may terminate by giving thirty days' notice in writing.",F(null,3,30));
add('ok',null,"The rent shall be increased by five percent (5%) at the time of renewal of this Agreement, and no other increase shall be made during the term.",F(null,null,null,5),true);
add('ok',null,"On renewal, the monthly rent shall be enhanced by 10% over the rent payable in the last month of the expiring term.",F(null,null,null,10));
add('ok',null,"The Lessee shall pay the electricity, water and gas charges as per the meter readings directly to the concerned authorities. The Lessor shall pay property tax and the building insurance.");
add('ok',null,"Minor day-to-day repairs such as replacing bulbs, tap washers and fuses shall be done by the Lessee at the Lessee's cost. Major repairs to the structure, roof and wiring, not caused by the Lessee, shall be carried out by the Lessor.");
add('ok',null,"The Lessee shall use the premises only for residential purposes and shall not sublet, assign or part with possession of the premises or any part thereof without the prior written consent of the Lessor.");
add('ok',null,"The Lessor or his authorised representative may inspect the premises once in a month between 10 a.m. and 6 p.m. after giving the Lessee at least 24 hours' prior intimation.");
add('ok',null,"The Lessee shall keep the premises in good and tenantable condition, and shall hand over the premises at the end of the tenancy in the same condition in which they were received, subject to normal wear and tear.");
add('ok',null,"Maintenance charges payable to the apartment owners' association, at present Rs. 2,500 per month, shall be paid by the Lessee on production of the association's receipt by the Lessor.");
add('ok',null,"If the Lessee fails to pay the rent for two consecutive months despite a written reminder with fifteen days to cure, the Lessor may terminate this Agreement by giving notice in writing.",F(null,null,15));
add('ok',null,"On renewal, the rent shall go up by two and a half percent over the last paid rent, and by no other amount.",F(null,null,null,2.5),true);
add('ok',null,"Any dispute arising out of this Agreement shall first be attempted to be settled amicably between the parties and, failing that, shall be subject to the jurisdiction of the civil courts at Hyderabad.");
add('ok',null,"The lock-in period shall be six months for both parties, after which either party may terminate this tenancy by giving thirty days' written notice.",F(null,6,30),true);
// ---- lengthen: 3 long (~150-250 words) and a couple very short (<25 words)
const long1=" The parties further agree that the Lessee shall maintain the common areas used by him in a clean manner, shall not store inflammable material, shall not keep pets that cause disturbance to neighbours, shall comply with the rules and bye-laws of the apartment owners' association, shall not carry out any structural alteration, shall not install any hoarding or signboard, shall permit the Lessor to display a 'To Let' board during the last month of the tenancy, shall promptly inform the Lessor in writing of any damage or defect noticed in the premises, shall be responsible for the conduct of his family members and guests, and shall pay any fine imposed by the association upon the Lessee for violation of its rules. The Lessor shall ensure peaceful and quiet enjoyment of the premises by the Lessee during the tenancy without any interruption by the Lessor or any person claiming under him, so long as the Lessee pays the rent and observes the terms of this Agreement.";
C[10].text+=long1.replace("Lessee shall maintain","Lessee shall at all times maintain");
C[28].text+=long1; C[28].tricky=false;
C[39-0].text=C[39].text; // no-op
// make one very risky long one
C[3].text+=" The Lessee further agrees that the Lessor may use the deposit to meet any liability of the Lessor to any third party, that the deposit shall stand forfeited if the Lessee is arrested or questioned by the police for any reason whatsoever, and that these conditions shall continue to bind the Lessee for three years after termination of the tenancy, notwithstanding anything stated elsewhere in this Agreement.";
const out=C.map((c,i)=>({id:i+1,text:c.text,label:c.label,risk_type:c.risk_type,fields:c.fields,tricky:c.tricky}));
// shuffle deterministically
let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
for(let i=out.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
out.forEach((c,i)=>c.id=i+1);
fs.writeFileSync('data/clauses.json',JSON.stringify(out,null,1));
const wc=t=>t.split(/\s+/).length;
console.log('n',out.length,'risky',out.filter(c=>c.label==='risky').length,'withfield',out.filter(c=>Object.values(c.fields).some(v=>v!==null)).length,'tricky',out.filter(c=>c.tricky).length,'words',Math.min(...out.map(c=>wc(c.text))),Math.max(...out.map(c=>wc(c.text))));
// ---- PII
const d=[[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const p=[[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
const inv=[0,4,3,2,1,5,6,7,8,9];
const vcheck=b=>{let c=0;const a=(b+'0').split('').reverse().map(Number).slice(1);a.unshift(0);const r=(b).split('').reverse().map(Number);c=0;r.forEach((x,i)=>{c=d[c][p[(i+1)%8][x]]});return inv[c];};
const AD=b=>b+vcheck(b); // b = 11 digits
const P0=[
["Tenant Suresh Babu Naidu can be reached on 9876501234; his Aadhaar is 1821 7365 9017.",["Suresh Babu Naidu"],["182173659017"],[]],
["The Lessor, Ms. Kavya Menon, holds PAN ABCPM1234K.",["Kavya Menon"],[],["ABCPM1234K"]],
["Aadhaar number of the Lessee: 134567890120. Witness: Mohammed Irfan.",["Mohammed Irfan"],["134567890120"],[]],
["Lessee Pooja Sharma (PAN: BNZPS5678L) shall pay the rent monthly.",["Pooja Sharma"],[],["BNZPS5678L"]],
["Signed by Venkata Ramana Rao, son of Late Subba Rao, Aadhaar 1456 7890 1237.",["Venkata Ramana Rao","Subba Rao"],["145678901237"],[]],
["The Lessor's PAN is CDEPK4321M and the Lessee's Aadhaar is 1678 9012 3453.",[],["167890123453"],["CDEPK4321M"]],
["Witness 1: Lakshmi Devi. Witness 2: Arjun Reddy. Both have verified the original documents.",["Lakshmi Devi","Arjun Reddy"],[],[]],
["Rent receipt issued to Imran Qureshi, Aadhaar 1789 0123 4567, for the month of January.",["Imran Qureshi"],["178901234567"],[]],
["Please contact the Lessor Mr. Gopal Krishna at the flat in Kondapur; PAN FGHPG7890N.",["Gopal Krishna"],[],["FGHPG7890N"]],
["The apartment is in Sunrise Heights, Gachibowli, and the rent is Rs. 18,000 per month.",[],[],[]],
["Tenant: Divya Prakash, Aadhaar 189012345674, PAN HJKPD2345Q.",["Divya Prakash"],["189012345674"],["HJKPD2345Q"]],
["The Lessee Mr. Sandeep Joshi has given a cheque drawn on a Hyderabad branch of the State Bank.",["Sandeep Joshi"],[],[]],
["Aadhaar 1901 2345 6789 belongs to Fatima Begum, the co-tenant.",["Fatima Begum"],["190123456789"],[]],
["Lessor's authorised signatory is Rajesh Iyer; company PAN KLMPR6789T.",["Rajesh Iyer"],[],["KLMPR6789T"]],
["This deed is made between Hari Prasad and Sunitha Reddy, with Aadhaar numbers 101234567895 and 1012 3456 7895 respectively.",["Hari Prasad","Sunitha Reddy"],["101234567895","101234567895"],[]],
];
const fix=t=>t.replace(/\b(\d{4})( ?)(\d{4})( ?)(\d{3})\d\b/g,(m,a,s1,b,s2,c)=>{const f=vcheck(a+b+c);return a+s1+b+s2+c+f;});
const fixAll=(text,list)=>{let t=fix(text);const m=t.match(/\b\d{4} ?\d{4} ?\d{4}\b/g)||[];return [t,m.map(x=>x.replace(/ /g,''))];};
const P=P0.map(([text,names,aa,pan])=>{const [t,m]=fixAll(text);return [t,names,m.filter(x=>!/^[6-9]\d{9}$/.test(x)),pan];});
fs.writeFileSync('data/pii.json',JSON.stringify(P.map(([text,names,aadhaar,pan],i)=>({id:i+1,text,names,aadhaar,pan})),null,1));
