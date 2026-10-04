/* AnshInk - my account: see and edit your details */
const box=$('#acc');
onUser(m=>{
  if(!m)return box.innerHTML='<h2>My account</h2><p class="mu">Please log in to see your account.</p><button class="btn" onclick="login()">Login / Sign up</button>';
  const first=new URLSearchParams(location.search).has('first');
  first||!m.done?form(true):view();
});
function view(){box.innerHTML=`<h2>My account</h2><div class="acc"><p><b>${esc(me.name||'')}</b></p><p>Mobile: ${esc(me.phone||'-')}<br>Email: ${esc(me.email||'-')}<br>Address: ${esc(me.addr||'-')} ${esc(me.pin||'')}</p></div><div class="row"><button class="btn" onclick="form(false)">Edit details</button><a class="btn o" href="${PG('orders')}">My orders</a></div>`}
function form(first){const u=me;box.innerHTML=`<h2>${first?'Complete your profile':'Edit details'}</h2><label>Full name</label><input id="pn" value="${esc(u.name||'')}"><label>Mobile</label><input id="pp" inputmode="tel" value="${esc(u.phone||'')}"><label>Email</label><input id="pe" type="email" value="${esc(u.email||'')}"><label>Address</label><textarea id="pa" rows="2">${esc(u.addr||'')}</textarea><label>Pincode</label><input id="pz" inputmode="numeric" value="${esc(u.pin||'')}"><div class="row" style="margin-top:12px"><button class="btn" onclick="save(${!!first})">Save</button>${first?'':'<button class="btn o" onclick="view()">Cancel</button>'}</div>`}
async function save(first){const g=i=>$(i).value.trim();
  if(!g('#pn'))return toast('Enter your name');if(!/^\d{10}$/.test(g('#pp')))return toast('Enter a 10-digit mobile number');
  if(g('#pe')&&!/^\S+@\S+\.\S+$/.test(g('#pe')))return toast('Enter a valid email');if(g('#pz')&&!/^\d{6}$/.test(g('#pz')))return toast('Pincode must be 6 digits');
  const d={name:g('#pn'),phone:g('#pp'),email:g('#pe'),addr:g('#pa'),pin:g('#pz'),done:true};
  try{await db.collection('users').doc(me.id).set(d,{merge:true});Object.assign(me,d);toast('Saved');
    if(first){let n=null;try{n=sessionStorage.getItem('ai_next');sessionStorage.removeItem('ai_next')}catch(e){}location.href=n||PG('index')}else view()}
  catch(e){console.error(e);toast('Could not save')}}
