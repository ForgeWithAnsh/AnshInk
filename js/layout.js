/* AnshInk - header, footer and account menu shared by every page */
function goTo(id){const el=document.getElementById(id);if(!el)return;const t0=scrollY,s0=performance.now();(function f(n){const p=Math.min(1,(n-s0)/800),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,y=el.getBoundingClientRect().top+scrollY-70;scrollTo(0,t0+(y-t0)*e);if(p<1)requestAnimationFrame(f)})(s0)}
(function(){
  const home=document.body.dataset.page=='home';
  const icon='<svg viewBox="0 0 40 40"><clipPath id="pfc"><circle cx="20" cy="20" r="20"/></clipPath><circle cx="20" cy="20" r="20" fill="#6b4a34"/><g clip-path="url(#pfc)" fill="#f2e8da"><circle cx="20" cy="15" r="6.5"/><path d="M5 41c1-9.5 7-14.5 15-14.5S34 31.5 35 41z"/></g></svg>';
  $('#hdr').innerHTML=`<header><a class="logo" href="${PG('index')}">✏ Ansh<i>Ink</i></a><nav><a href="${PG('index')}#gal" data-go="gal">Gallery</a><a href="${PG('index')}#abt" data-go="abt">About</a><div class="pfw"><button class="pfb" id="pf" aria-label="Account">${icon}</button><div class="pmenu" id="pm"></div></div></nav></header>`;
  $('#ftr').innerHTML=`<footer>Support: <a href="mailto:${CFG.email}">${CFG.email}</a> · Instagram <a href="https://instagram.com/${CFG.insta}">@${CFG.insta}</a><br><a id="al" href="${PG('admin')}" style="display:none">Artist panel</a><div class="mu">© ${CFG.site}</div></footer>`;
  if(!home)document.body.classList.add('go');
  document.querySelectorAll('[data-go]').forEach(a=>a.addEventListener('click',e=>{if(home){e.preventDefault();goTo(a.dataset.go)}}));
  $('#pf').addEventListener('click',e=>{e.stopPropagation();$('#pm').classList.toggle('on')});
  document.addEventListener('click',()=>$('#pm').classList.remove('on'));
  onUser(()=>{
    $('#pm').innerHTML=me?`<div class="mu">Hi, ${esc(me.name||'there')}</div><a href="${PG('account')}">My account</a><a href="${PG('orders')}">My orders</a>${isAdm()?`<a href="${PG('admin')}">Artist panel</a>`:''}<a href="#" id="lo">Logout</a>`:`<a href="#" id="li">Login / Sign up</a>`;
    const lo=$('#lo'),li=$('#li');
    if(lo)lo.onclick=e=>{e.preventDefault();auth.signOut();toast('Logged out')};
    if(li)li.onclick=e=>{e.preventDefault();login()};
    $('#al').style.display=isAdm()?'':'none';
  });
})();
