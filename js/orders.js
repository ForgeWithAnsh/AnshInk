/* AnshInk - my orders: list, and details when ?id=... is in the address */
const main=$('#main');
onUser(async m=>{
  if(!m)return main.innerHTML='<div class="box"><h2>My orders</h2><p class="mu">Please log in to see your orders.</p><button class="btn" onclick="login()">Login / Sign up</button></div>';
  main.innerHTML='<p class="mu">Loading…</p>';
  try{O.list=await ords(false);await sweep(O.list)}catch(e){console.error(e);return main.innerHTML='<div class="box"><p>Could not load your orders. Please try again.</p></div>'}
  const id=new URLSearchParams(location.search).get('id');
  id&&O.list.find(o=>o.id==id)?view(id):list();
});
function list(){const r=O.list.slice().sort((a,b)=>b.at-a.at);
  main.innerHTML='<h2>My orders</h2>'+(r.length?r.map(x=>`<a class="ocard" href="${PG('orders')}?id=${x.id}"><img src="${x.done||x.photo}" alt=""><div><b>${esc(x.title||'Sketch')}</b><div class="mu">Sketch ID ${x.id}</div><span class="badge ${x.st<0?'bad':''}">${stl(x)}</span></div></a>`).join(''):'<p class="mu">No orders yet. <a href="'+PG('order')+'">Order your first sketch</a></p>')}
function view(id){const x=O.list.find(o=>o.id==id);const dl=x.acc?new Date(x.acc+3*864e5).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'';
  main.innerHTML=`<div class="box"><h2>${esc(x.title||'Sketch')}</h2><img class="oimg" src="${x.done||x.photo}" alt=""><div class="mu">Sketch ID ${x.id} · ordered ${new Date(x.at).toLocaleDateString('en-IN')}</div>
<p>${x.subj||'Person'} · ${x.style||'Realistic'}<br>Paper: ${x.size}<br>People: ${x.ppl} · Detail items: ${x.items||0}<br>Material: charcoal pencils</p>
<p>${x.fin==null?'Estimate '+rs(x.amt)+' (final price after review)':'Sketch '+rs(x.fin)+' + delivery '+rs(x.del||0)+' = <b>'+rs(tot(x))+'</b>'}</p>
<p class="mu">Deliver to: ${esc(x.name)}, ${esc(x.phone)}<br>${esc(x.addr)} – ${esc(x.pin)}${x.note?'<br>Notes: '+esc(x.note):''}</p>
${x.st<0?`<p><span class="badge bad">${stl(x)}</span> ${esc(x.rej||'')}</p>`:trk(x.st)}
${x.st==1?(x.link?`<p class="mu">Please pay by ${dl}, or the order is cancelled automatically.</p><button class="btn" onclick="payNow('${x.id}')">Pay ${rs(tot(x))}</button>`:`<p class="mu">Accepted. Your payment link is being prepared; it will appear here soon. Pay by ${dl}.</p>`):''}
${x.st==0?`<button class="btn o sm" onclick="cancelOrder('${x.id}')">Cancel order</button>`:''}${x.st==2&&x.rf!='req'?`<button class="btn o sm" onclick="refund('${x.id}')">Request refund</button>`:''}${x.rf=='req'?'<p class="mu">Refund requested. I will get back to you.</p>':''}
<p class="mu">Refunds are possible only before sketching starts, and not after the sketch is finished.</p><a class="btn o" href="${PG('orders')}">← All orders</a></div>`}
function payNow(id){const x=O.list.find(o=>o.id==id);if(x&&x.link){window.open(x.link,'_blank');toast('Once your payment is confirmed, your order moves forward')}}
async function cancelOrder(id){if(!confirm('Cancel this order?'))return;try{await upo(id,{st:-4});view(id)}catch(e){toast('Could not cancel. Please try again')}}
async function refund(id){if(!confirm('Request a refund? The order will not be started.'))return;try{await upo(id,{rf:'req'});view(id)}catch(e){toast('Could not send request')}}
