/* AnshInk - order helpers shared by orders.html and admin.html */
const tot=x=>(x.fin??x.amt)+(x.del||0);
const stl=x=>x.st==-1?'Declined':x.st==-2?'Cancelled (not paid in 3 days)':x.st==-3?'Refunded':x.st==-4?'Cancelled by you':x.rf=='req'?'Refund requested':STAT[x.st];
const trk=st=>`<div class="trk">${STAT.map((s,i)=>`<div class="${i<=st?'d':''}">${s}</div>`).join('')}</div>`;
async function ords(all){const q=all?db.collection('orders'):db.collection('orders').where('uid','==',me.id);const sn=await q.get();return sn.docs.map(d=>({...d.data(),id:d.id}))}
async function upo(id,data){await db.collection('orders').doc(id).update(data);Object.assign((O.list||[]).find(o=>o.id==id)||{},data)}
/* accepted orders that stay unpaid for 3 days are cancelled */
async function sweep(l){const n=Date.now();for(const x of l){if(x.st==1&&x.acc&&n-x.acc>3*864e5){try{await db.collection('orders').doc(x.id).update({st:-2});x.st=-2}catch(e){}}}}
