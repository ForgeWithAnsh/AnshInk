/* AnshInk - all sketches: two categories. Everyone can look; only the artist can add or remove sketches. */
const CATS={human:'Human sketches',other:'Other sketches'};
const box=$('#list');let items=[],tab='human',loaded=false;
$('#list').innerHTML='<div class="shead"><h1>All sketches</h1></div><div class="skl"></div><div class="skl"></div>';

/* the sketches already on the home page are all human sketches */
const builtIn=()=>SK.map(k=>({id:'b-'+k.id,title:k.t,category:'human',description:k.d,photos:k.img.map(p=>BASE+p),builtIn:true}));
async function load(){
  let up=[];
  try{const q=await db.collection('gallery').orderBy('createdAt','desc').get();up=q.docs.map(d=>({...d.data(),id:d.id,photos:[d.data().photo]}))}catch(e){console.error(e)}
  items=up.concat(builtIn());loaded=true;render()}
function render(){
  const n=c=>items.filter(x=>x.category==c).length,list=items.filter(x=>x.category==tab);
  box.innerHTML=`<div class="shead"><h1>All sketches</h1></div>
<div class="tabs2">${Object.entries(CATS).map(([k,v])=>`<button class="tab2 ${tab==k?'on':''}" onclick="tab='${k}';render()">${v} <span>${n(k)}</span></button>`).join('')}</div>
${isAdm()?'<div class="abar"><button class="btn cta" onclick="addForm()">+ Add a sketch</button></div>':''}
${list.length?`<div class="sgrid">${list.map((x,i)=>`<div class="scard" style="--i:${i}" onclick="openS('${x.id}')"><img src="${x.photos[0]}" alt="${esc(x.title)}" loading="lazy">${isAdm()&&!x.builtIn?`<button class="x" onclick="event.stopPropagation();delS('${x.id}')">Remove</button>`:''}<div class="t">${esc(x.title)}</div></div>`).join('')}</div>`:'<div class="none">No sketches here yet.</div>'}`}
onUser(()=>{if(loaded)render()});
load();

function openS(id){const x=items.find(o=>o.id==id);
  show(`<h2>${esc(x.title)}</h2><img class="sbig" id="sbig" src="${x.photos[0]}" alt="">
${x.photos.length>1?`<div class="sth">${x.photos.map((p,i)=>`<img src="${p}" class="${i?'':'on'}" onclick="$('#sbig').src=this.src;document.querySelectorAll('.sth img').forEach(e=>e.classList.remove('on'));this.classList.add('on')" alt="">`).join('')}</div>`:''}
<p class="mu">${esc(x.description||'')}</p><div class="row"><a class="btn cta" href="${PG('order')}">Order like this</a><button class="btn o" onclick="hide()">Close</button></div>`)}

/* ---- artist only ---- */
function addForm(){if(!isAdm())return;O.np='';
  show(`<h2>Add a sketch</h2><label>Title</label><input id="st" maxlength="60"><label>Category</label><select id="sc"><option value="human">Human sketches</option><option value="other">Other sketches</option></select>
<label>Short description (optional)</label><input id="sd" maxlength="120" placeholder="e.g. Charcoal pencil on paper"><label>Photo</label><input type="file" accept="image/*" onchange="pickS(this)"><div id="sp"></div>
<div class="row" style="margin-top:12px"><button class="btn" onclick="saveS()">Save</button><button class="btn o" onclick="hide()">Cancel</button></div>`)}
function pickS(el){if(el.files[0])rz(el.files[0],d=>{O.np=d;$('#sp').innerHTML='<img class="pre" src="'+d+'" alt="">'})}
async function saveS(){if(!isAdm())return;const t=$('#st').value.trim();if(!t)return toast('Enter a title');if(!O.np)return toast('Choose a photo');
  try{await db.collection('gallery').add({title:t,category:$('#sc').value,description:$('#sd').value.trim(),photo:O.np,createdAt:TS()});hide();toast('Sketch added');await load()}
  catch(e){console.error(e);toast('Could not save. Check the Firebase rules.',6000)}}
async function delS(id){if(!isAdm()||!confirm('Remove this sketch from the website?'))return;try{await db.collection('gallery').doc(id).delete();toast('Removed');await load()}catch(e){console.error(e);toast('Could not remove')}}
