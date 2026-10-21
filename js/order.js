/* AnshInk - order page: choose options, upload photo, send request */
const price=o=>Math.round((CFG.sizes[o.size]*(1+CFG.extraPerson*(o.ppl-1))*CFG.styles[o.style]+CFG.itemPrice*o.items)/10)*10;
const pshow=h=>{$('#ordpage').innerHTML='<div class="box">'+h+'</div>';scrollTo(0,0)};
onUser(m=>{
  if(!m)return pshow('<h2>Order a sketch</h2><p class="mu">Please log in first, so you can track your order from any device.</p><button class="btn" onclick="login()">Login / Sign up</button>');
  if(!O.o)start();
});
function start(){O.o={subj:'Person',style:'Realistic',size:Object.keys(CFG.sizes)[1],ppl:1,items:0,photo:'',title:'',name:me.name,phone:me.phone,address:me.address||'',pincode:me.pincode||'',note:''};ord1()}
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
<label>Address</label><textarea id="ad" rows="2">${esc(o.address)}</textarea><button class="btn o sm" type="button" onclick="locateOrder()">Use my location</button><label>Pincode</label><input id="pc" inputmode="numeric" value="${esc(o.pincode)}">
<label>Notes (optional)</label><input id="no" value="${esc(o.note)}">
<div class="row" style="margin-top:12px"><button class="btn" onclick="ord3()">Next</button><button class="btn o" onclick="sv();ord1()">Back</button></div>`)}
function ldPh(el){const f=el.files[0];if(!f)return;sv();rz(f,d=>{O.o.photo=d;ord2()})}
function sv(){const o=O.o,g=i=>($(i)||{}).value;if($('#n')){o.title=g('#ti');o.name=g('#n');o.phone=g('#p');o.address=g('#ad');o.pincode=g('#pc');o.note=g('#no')}}
function locateOrder(){if(!navigator.geolocation)return toast('Location is unavailable in this browser');toast('Choose precise or approximate location if your device asks');navigator.geolocation.getCurrentPosition(async p=>{try{const q=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+p.coords.latitude+'&lon='+p.coords.longitude);const d=await q.json();$('#ad').value=d.display_name||'';$('#pc').value=d.address?.postcode||'';sv()}catch(e){toast('Could not look up this location')}},()=>toast('Location permission was not granted'),{enableHighAccuracy:true,timeout:12000})}
function ord3(){sv();const o=O.o;
  if(!o.photo)return toast('Please upload a reference photo');
  if(!o.name||!/^\d{10}$/.test(o.phone)||!o.address||!/^\d{6}$/.test(o.pincode))return toast('Fill name, 10-digit mobile, address and 6-digit pincode');
  pshow(`<h2>Review &amp; send</h2><p>${o.subj} · ${o.style} · ${o.size} · ${o.ppl} person(s) · ${o.items} detail item(s)<br><span class="mu">${esc(o.name)}, ${esc(o.address)} – ${esc(o.pincode)}</span></p><div class="tot">Estimate ₹${price(o)}</div><div class="mu">+ delivery charges. <b>Your photo will be checked, and the final price and delivery charge will be confirmed.</b> Once the order is accepted, a Pay button will appear in ‘My orders’.</div>
<div class="row" style="margin-top:12px"><button class="btn" onclick="place()">Send order request</button><button class="btn o" onclick="ord2()">Back</button></div>`)}
async function place(){const o=O.o,counter=db.collection('metadata').doc('orderCounter');
  try{const id=await db.runTransaction(async tx=>{const snap=await tx.get(counter),n=(snap.exists?(snap.data().value||0):0)+1,orderId=String(n).padStart(4,'0');tx.set(counter,{value:n});tx.set(db.collection('orders').doc(orderId),{...o,title:o.title||o.style+' '+o.subj.toLowerCase(),id:orderId,uid:me.id,email:me.email,amount:price(o),st:0,at:TS()});return orderId});const placed=O.o;O.o=null;try{await db.collection('mail').doc('order-'+id).set({to:CFG.adminEmail,orderId:id,message:{subject:'New sketch order #'+id+' — '+(placed.title||placed.name),text:'A new sketch order was placed by '+placed.name+' ('+me.email+'). Review it in the AnshInk artist panel.',html:'<p>A new sketch order was placed.</p><p><b>Sketch ID:</b> '+esc(id)+'<br><b>Customer:</b> '+esc(placed.name)+'<br><b>Email:</b> '+esc(me.email)+'</p><p>Review it in the AnshInk artist panel.</p>'}})}catch(mailError){console.error('Order email could not be queued:',mailError);toast('Order placed, but the email could not be queued. Check Firebase email setup.',7000)}location.href=PG('orders')+'?id='+id}catch(e){console.error(e);toast('Could not send order. Try again')}}
