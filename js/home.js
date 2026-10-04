/* AnshInk - home page: quote screen, hero, gallery, reviews, about */
let RV={};
$('#sq').textContent='\u201c'+CFG.quote+'\u201d';
$('#hi').src=BASE+SK.find(k=>k.id=='e').img[0];
$('#hn').textContent=CFG.artist;$('#hb').textContent=CFG.bio;
$('#about').innerHTML='<p>'+esc(CFG.story)+'</p><ul>'+CFG.about.map(x=>'<li><b>'+x[0]+':</b> '+esc(x[1])+'</li>').join('')+'</ul><p>Questions? Email <a href="mailto:'+CFG.email+'">'+CFG.email+'</a> or DM @'+CFG.insta+' on Instagram.</p>';

/* scroll animations start only after the quote screen is gone */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const t=e.target;t.classList.add('in');io.unobserve(t);setTimeout(()=>t.style.transitionDelay='',1400)}}),{threshold:.15,rootMargin:'0px 0px -12% 0px'});
function reveal(){document.querySelectorAll('.rv:not(.in)').forEach((el,i)=>{el.style.transitionDelay=(i%3)*100+'ms';io.observe(el)})}
function go(){if(O.go)return;O.go=1;document.body.classList.add('go');reveal();if(location.hash)setTimeout(()=>goTo(location.hash.slice(1)),700)}

/* quote screen: tap to enter, or it continues by itself (shown once per visit) */
const sp=$('#splash');let seen=false;try{seen=sessionStorage.getItem('ai_seen')}catch(e){}
function closeSplash(){if(!sp.isConnected)return;try{sessionStorage.setItem('ai_seen',1)}catch(e){}sp.style.opacity=0;setTimeout(go,500);setTimeout(()=>sp.remove(),900)}
if(seen){sp.remove();go()}else{sp.addEventListener('click',closeSplash);setTimeout(closeSplash,4600)}

/* gallery */
$('#grid').innerHTML=SK.map(k=>`<div class="card rv"><img class="main" id="mi${k.id}" src="${BASE+k.img[0]}" alt="${esc(k.t)}">
${k.img.length>1?`<div class="th">${k.img.map((s,i)=>`<img src="${BASE+s}" class="${i?'':'on'}" onclick="sw('${k.id}',${i},this)" alt="">`).join('')}</div>`:''}
<div class="cb"><h3>${esc(k.t)}</h3><div class="mu">${esc(k.d)}</div><div class="row" style="margin:6px 0"><span class="st" id="st-${k.id}"></span><span class="mu" id="rc-${k.id}"></span></div>
<div class="row"><button class="btn o sm" onclick="openRev('${k.id}')">Reviews &amp; rate</button><a class="btn sm" href="${PG('order')}">Order like this</a></div></div></div>`).join('');
function sw(id,i,el){$('#mi'+id).src=BASE+SK.find(k=>k.id==id).img[i];el.parentNode.querySelectorAll('img').forEach(x=>x.classList.remove('on'));el.classList.add('on')}

/* reviews */
const avg=id=>{const r=RV[id]||[];return r.length?r.reduce((a,b)=>a+b.s,0)/r.length:0};
function ratings(){SK.forEach(k=>{const r=(RV[k.id]||[]).length;$('#st-'+k.id).textContent=stars(avg(k.id));$('#rc-'+k.id).textContent=r?avg(k.id).toFixed(1)+' ('+r+')':'No ratings yet'})}
async function loadRevs(){try{const q=await db.collection('reviews').get();RV={};q.forEach(d=>{const r=d.data();(RV[r.sk]=RV[r.sk]||[]).push(r)});Object.values(RV).forEach(a=>a.sort((x,y)=>x.t-y.t))}catch(e){console.error(e)}ratings()}
function openRev(id){const k=SK.find(x=>x.id==id),r=RV[id]||[];O.rs=5;
show(`<h2>${esc(k.t)}</h2><div class="st">${stars(avg(id))}</div>
<div>${r.length?r.slice().reverse().map(x=>`<div class="rev"><b>${esc(x.n)}</b> <span class="st">${stars(x.s)}</span><div>${esc(x.x)}</div></div>`).join(''):'<p class="mu">Be the first to review.</p>'}</div>
<label>Your rating</label><div class="st" id="rs" style="font-size:28px;cursor:pointer">${[1,2,3,4,5].map(n=>`<span onclick="setR(${n})">★</span>`).join('')}</div>
<label>Your opinion</label><textarea id="rx" rows="3" maxlength="500"></textarea><div class="row" style="margin-top:12px"><button class="btn" onclick="postRev('${id}')">Post</button><button class="btn o" onclick="hide()">Close</button></div>`);setR(5)}
function setR(n){O.rs=n;[...$('#rs').children].forEach((s,i)=>s.style.opacity=i<n?1:.25)}
async function postRev(id){if(!me)return login(()=>openRev(id));const x=$('#rx').value.trim();if(!x)return toast('Write a few words first');
  try{await db.collection('reviews').add({sk:id,uid:me.id,n:me.name||'Customer',s:O.rs,x,t:TS()});await loadRevs();openRev(id);toast('Thanks for your review!')}catch(e){console.error(e);toast('Could not post review')}}
loadRevs();
