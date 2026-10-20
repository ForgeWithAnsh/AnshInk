/* AnshInk - my account: see and edit your details */
const box=$('#acc');
onUser(m=>{
  if(!m)return box.innerHTML='<h2>My account</h2><p class="mu">Please log in to see your account.</p><button class="btn" onclick="login()">Login / Sign up</button>';
  const first=new URLSearchParams(location.search).has('first');
  first||!m.done?form(true):(location.pathname.endsWith('edit-details.html')?form(false):view());
});
function view(){box.innerHTML=`<h2>My account</h2><div class="acc"><p><b>${esc(me.name||'')}</b></p><p>Mobile: ${esc(me.phone||'-')}<br>Email: ${esc(me.email||'-')}<br>Address: ${esc(me.address||'-')} ${esc(me.pincode||'')}</p></div><div class="row"><a class="btn" href="${PG('edit-details')}">Edit details</a><a class="btn o" href="${PG('orders')}">My orders</a></div>`}
function form(first){const u=me,hasPassword=auth.currentUser?.providerData.some(p=>p.providerId==='password');box.innerHTML=`<h2>${first?'Complete your profile':'Edit details'}</h2><label>Full name</label><input id="pn" value="${esc(u.name||'')}"><label>Mobile</label><input id="pp" inputmode="tel" value="${esc(u.phone||'')}"><label>Email</label><input id="pe" type="email" value="${esc(u.email||'')}">${first&&!hasPassword?'<label>Create a password (at least 6 characters)</label><input id="pw" type="password" autocomplete="new-password">':''}<label>Address</label><textarea id="pa" rows="2">${esc(u.address||'')}</textarea><label>Pincode</label><input id="pz" inputmode="numeric" value="${esc(u.pincode||'')}"><button class="btn o sm" type="button" onclick="locateProfile()">Use my location</button><div class="row" style="margin-top:12px"><button class="btn" onclick="save(${!!first})">Save</button>${first?'':'<button class="btn o" onclick="view()">Cancel</button>'}</div>`}
function locateProfile(){if(!navigator.geolocation)return toast('Location is unavailable in this browser');toast('Choose precise or approximate location if your device asks');navigator.geolocation.getCurrentPosition(async p=>{try{const q=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+p.coords.latitude+'&lon='+p.coords.longitude);const d=await q.json();$('#pa').value=d.display_name||'';$('#pz').value=d.address?.postcode||''}catch(e){toast('Could not look up this location')}},()=>toast('Location permission was not granted'),{enableHighAccuracy:true,timeout:12000})}
async function save(first){const g=i=>$(i).value.trim();
  if(!g('#pn'))return toast('Enter your name');if(!/^\d{10}$/.test(g('#pp')))return toast('Enter a 10-digit mobile number');
  if(!/^\S+@\S+\.\S+$/.test(g('#pe')))return toast('Enter a valid email');if(g('#pz')&&!/^\d{6}$/.test(g('#pz')))return toast('Pincode must be 6 digits');
  const pw=$('#pw');if(pw){if(pw.value.length<6)return toast('Create a password with at least 6 characters');try{await auth.currentUser.linkWithCredential(firebase.auth.EmailAuthProvider.credential(g('#pe'),pw.value))}catch(e){console.error(e);return toast(e.code==='auth/email-already-in-use'?'That email is already attached to another account.':'Could not add email and password sign-in.')}}
  const d={name:g('#pn'),phone:g('#pp'),email:g('#pe'),address:g('#pa'),pincode:g('#pz'),done:true};
  try{await db.collection('users').doc(me.id).set(d,{merge:true});Object.assign(me,d);toast('Saved');
    if(first){let n=null;try{n=sessionStorage.getItem('ai_next');sessionStorage.removeItem('ai_next')}catch(e){}location.href=n||PG('index')}else view()}
  catch(e){console.error(e);toast('Could not save')}}
