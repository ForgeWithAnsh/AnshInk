/* AnshInk - shared helpers, Firebase setup, login state (loaded on every page) */
const BASE=document.body.dataset.base||'';            // '' on index.html, '../' inside html/
const PG=p=>p=='index'?BASE+'index.html':(BASE?'':'html/')+p+'.html';
firebase.initializeApp(CFG.firebase);
const auth=firebase.auth(),db=firebase.firestore(),TS=()=>Date.now();
let me=null,O={};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=m=>{const t=$('#t');t.textContent=m;t.style.display='block';clearTimeout(O.tt);O.tt=setTimeout(()=>t.style.display='none',3200)};
const show=h=>{$('#mb').innerHTML=h;$('#m').classList.add('on')},hide=()=>$('#m').classList.remove('on');
$('#m').addEventListener('click',e=>{if(e.target.id=='m')hide()});
const rs=n=>'₹'+Number(n).toLocaleString('en-IN');
const err=e=>(e&&e.code?e.code.replace('auth/','').replace(/-/g,' '):'error');
const isAdm=()=>!!me&&me.adm;
const stars=n=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n));

/* resize a photo before saving it (keeps database small) */
function rz(f,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),k=Math.min(1,800/Math.max(im.width,im.height));c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.65))};im.src=r.result};r.readAsDataURL(f)}

/* pages call onUser(fn): fn(me) runs once login state is known, and again whenever it changes */
const cbs=[];let ready=false;
function onUser(fn){cbs.push(fn);if(ready)fn(me)}
auth.onAuthStateChanged(async u=>{
  if(!u){me=null}else{
    let p={};try{const d=await db.collection('users').doc(u.uid).get();p=d.exists?d.data():{}}catch(e){console.error(e)}
    me={id:u.uid,email:u.email||p.email||'',phone:u.phoneNumber?u.phoneNumber.replace('+91',''):(p.phone||''),name:p.name||u.displayName||'',addr:p.addr||'',pin:p.pin||'',done:!!p.done,adm:u.email==CFG.adminEmail&&u.emailVerified};
  }
  ready=true;
  // new users must finish their profile first
  if(me&&!me.done&&!location.pathname.endsWith('account.html')){try{sessionStorage.setItem('ai_next',location.href)}catch(e){}location.href=PG('account')+'?first=1';return}
  if(me&&O.ao){O.ao=0;hide();toast('Logged in')}
  cbs.forEach(f=>f(me));
  if(me&&O.cb){const f=O.cb;O.cb=null;f()}
});
