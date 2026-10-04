/* AnshInk - order page: choose options, upload photo, send request */
const price=o=>Math.round((CFG.sizes[o.size]*(1+CFG.extraPerson*(o.ppl-1))*CFG.styles[o.style]+CFG.itemPrice*o.items)/10)*10;
const pshow=h=>{$('#ordpage').innerHTML='<div class="box">'+h+'</div>';scrollTo(0,0)};
onUser(m=>{
  if(!m)return pshow('<h2>Order a sketch</h2><p class="mu">Please log in first, so you can track your order from any device.</p><button class="btn" onclick="login()">Login / Sign up</button>');
  if(!O.o)start();
});
function start(){O.o={subj:'Person',style:'Realistic',size:Object.keys(CFG.sizes)[1],ppl:1,items:0,photo:'',title:'',name:me.name,phone:me.phone,addr:me.addr||'',pin:me.pin||'',note:''};ord1()}
const pick=(k,items)=>`<div class="opt">${items.map(([v,l])=>`<div class="${O.o[k]==v?'on':''}" onclick="O.o['${k}']=${typeof v=='number'?v:`'${v}'`};ord1()">${l}</div>`).join('')}</div>`;
function ord1(){const o=O.o;pshow(`<h2>Design your sketch</h2><label>What should I draw?</label>${pick('subj',['Person','Pet / animal','Object / scene'].map(v=>[v,v]))}
<label>Style</label>${pick('style',Object.keys(CFG.styles).map(v=>[v,v]))}
<label>Paper size</label>${pick('size',Object.entries(CFG.sizes).map(([k,v])=>[k,k+'<br><span class=mu>from ₹'+v+'</span>']))}
<label>Number of people</label>${pick('ppl',[1,2,3,4].map(n=>[n,n+(n>1?' people':' person')]))}
<label>Extra detailed items (jewellery, necklace…)</label>${pick('items',[0,1,2,3].map(n=>[n,n?n+' (+₹'+n*CFG.itemPrice+')':'None']))}
<p class="mu">Charcoal pencils. Realistic is my most detailed style; the others are quicker, so they cost a little less. Ready in about 3–4 days (6–9 hours of work). Delivery charges are paid by you and confirmed after you order. For very detailed photos the price may change slightly; I'll confirm before I start.</p><div class="tot">₹${price(o)}</div>
<div class="row" style="margin-top:10px"><button class="btn" onclick="ord2()">Next</button><a class="btn o" href="${PG('index')}">Cancel</a></div>`)}
function ord2(){const o=O.o;pshow(`<h2>Your details</h2><label>Reference photo (clear, well-lit)</label><input type="file" accept="image/*" onchange="ldPh(this)">${o.photo?`<img class="pre" src="${o.photo}" alt="">`:''}
<label>Name this sketch (optional)</label><input id="ti" value="${esc(o.title||'')}" placeholder="e.g. Mom's portrait">
<label>Full name</label><input id="n" value="${esc(o.name||'')}"><label>Mobile</label><input id="p" inputmode="tel" value="${esc(o.phone||'')}">
<label>Address</label><textarea id="ad" rows="2">${esc(o.addr)}</textarea><label>Pincode</label><input id="pc" inputmode="numeric" value="${esc(o.pin)}">
<label>Notes (optional)</label><input id="no" value="${esc(o.note)}">
<div class="row" style="margin-top:12px"><button class="btn" onclick="ord3()">Next</button><button class="btn o" onclick="sv();ord1()">Back</button></div>`)}
function ldPh(el){const f=el.files[0];if(!f)return;sv();rz(f,d=>{O.o.photo=d;ord2()})}
function sv(){const o=O.o,g=i=>($(i)||{}).value;if($('#n')){o.title=g('#ti');o.name=g('#n');o.phone=g('#p');o.addr=g('#ad');o.pin=g('#pc');o.note=g('#no')}}
function ord3(){sv();const o=O.o;
  if(!o.photo)return toast('Please upload a reference photo');
  if(!o.name||!/^\d{10}$/.test(o.phone)||!o.addr||!/^\d{6}$/.test(o.pin))return toast('Fill name, 10-digit mobile, address and 6-digit pincode');
  pshow(`<h2>Review &amp; send</h2><p>${o.subj} · ${o.style} · ${o.size} · ${o.ppl} person(s) · ${o.items} detail item(s)<br><span class="mu">${esc(o.name)}, ${esc(o.addr)} – ${esc(o.pin)}</span></p><div class="tot">Estimate ₹${price(o)}</div><div class="mu">+ delivery charges. <b>No payment now.</b> I'll check your photo and confirm the final price and delivery charge. Once I accept, a Pay button appears in My orders.</div>
<div class="row" style="margin-top:12px"><button class="btn" onclick="place()">Send order request</button><button class="btn o" onclick="ord2()">Back</button></div>`)}
async function place(){const o=O.o,id='AS'+Math.random().toString(36).slice(2,8).toUpperCase();
  const od={...o,title:o.title||o.style+' '+o.subj.toLowerCase(),id,uid:me.id,amt:price(o),st:0,at:TS()};
  try{await db.collection('orders').doc(id).set(od);O.o=null;location.href=PG('orders')+'?id='+id}catch(e){console.error(e);toast('Could not send order. Try again')}}
