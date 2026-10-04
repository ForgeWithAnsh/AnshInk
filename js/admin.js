/* AnshInk - artist panel (only forgewithansh@gmail.com, logged in with Google) */
const main=$('#main');
onUser(async m=>{
  if(!m)return main.innerHTML='<div class="box"><h2>Artist panel</h2><p class="mu">Please log in with Google.</p><button class="btn" onclick="login()">Login / Sign up</button></div>';
  if(!isAdm())return main.innerHTML='<div class="box"><h2>Artist panel</h2><p class="mu">Artist access only. Log in with Google as '+esc(CFG.adminEmail)+'.</p></div>';
  main.innerHTML='<p class="mu">Loading…</p>';
  try{O.list=await ords(true);await sweep(O.list);render()}catch(e){console.error(e);main.innerHTML='<div class="box"><p>Could not load orders.</p></div>'}
});
function render(){const r=O.list.slice().sort((a,b)=>b.at-a.at);
  main.innerHTML='<h2>All orders</h2>'+(r.length?r.map(x=>`<div class="ord"><b>#${x.id}</b> <span class="badge ${x.st<0?'bad':''}">${stl(x)}</span><div class="mu">${esc(x.title||'')} · ${x.subj||'Person'} · ${x.style||'Realistic'} · ${x.size} · ${x.ppl} person(s) · ${x.items||0} item(s) · estimate ${rs(x.amt)}<br>${esc(x.name)}, ${esc(x.phone)}<br>${esc(x.addr)} – ${esc(x.pin)}<br>${esc(x.note||'')}</div><a href="${x.photo}" download="ref-${x.id}.jpg">Download reference photo</a>
${x.st==0?`<label>Final sketch price ₹</label><input id="f${x.id}" inputmode="numeric" value="${x.amt}"><label>Delivery charge ₹</label><input id="d${x.id}" inputmode="numeric" value="0"><label>Payment link (Razorpay, optional)</label><input id="l${x.id}"><div class="row" style="margin-top:8px"><button class="btn sm" onclick="accept('${x.id}')">Accept &amp; ask for payment</button><button class="btn o sm" onclick="decline('${x.id}')">Decline</button></div>`
:x.st>0?`<label>Status</label><select onchange="adu('${x.id}',{st:+this.value})">${STAT.map((s,i)=>i>=1?`<option value="${i}" ${i==x.st?'selected':''}>${s}</option>`:'').join('')}</select>${x.st==1?`<label>Payment link</label><input id="l${x.id}" value="${esc(x.link||'')}"><button class="btn o sm" style="margin-top:6px" onclick="adu('${x.id}',{link:$('#l${x.id}').value.trim()})">Save link</button>`:''}${x.rf=='req'?`<p><b>Refund requested</b></p><button class="btn sm" onclick="adu('${x.id}',{st:-3})">Mark refunded</button>`:''}<label>Sketch photo (progress / finished)</label><input type="file" accept="image/*" onchange="admPh('${x.id}',this)">`:''}</div>`).join(''):'<p class="mu">No orders yet.</p>')}
async function adu(id,d){try{await upo(id,d);render();toast('Saved')}catch(e){console.error(e);toast('Failed to save')}}
function accept(id){const g=p=>$('#'+p+id).value.trim(),fin=+g('f'),del=+g('d')||0;if(!fin)return toast('Enter the final price');adu(id,{fin,del,link:g('l'),st:1,acc:TS()})}
function decline(id){const r=prompt('Reason for declining (shown to customer)');if(r===null)return;adu(id,{st:-1,rej:r})}
function admPh(id,el){if(el.files[0])rz(el.files[0],d=>adu(id,{done:d}))}
