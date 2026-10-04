/* AnshInk - login / sign-up popup (Google, mobile OTP, email) */
function login(cb){O.cb=cb;O.tab=O.tab||'g';O.mode=O.mode||'in';authUI()}
function authUI(){O.ao=1;const T=O.tab;show(`<h2>Login / Sign up</h2><div class="tabs">${[['g','Google'],['ph','Mobile OTP'],['em','Email']].map(([k,n])=>`<button class="btn ${T==k?'':'o'} sm" onclick="O.tab='${k}';O.conf=null;authUI()">${n}</button>`).join('')}</div>
${T=='ph'?`<label>Mobile number (India)</label><input id="a1" inputmode="tel" placeholder="10-digit number" value="${esc(O.ph||'')}" ${O.conf?'disabled':''}>${O.conf?`<label>Enter OTP</label><input id="a2" inputmode="numeric">`:''}`:''}
${T=='em'?`<label>Email</label><input id="a1" type="email"><label>Password</label><input id="a3" type="password"><p class="mu"><a href="#" onclick="forgot();return false">Forgot password?</a> · <a href="#" onclick="O.mode=O.mode=='in'?'up':'in';authUI();return false">${O.mode=='in'?'New here? Create account':'Have an account? Log in'}</a></p>`:''}
${T=='g'?`<p class="mu">Continue with your Google account.</p>`:''}
<div class="row" style="margin-top:12px"><button class="btn" onclick="authGo()">${T=='g'?'Continue with Google':T=='ph'?(O.conf?'Verify OTP':'Send OTP'):(O.mode=='in'?'Log in':'Create account')}</button><button class="btn o" onclick="O.conf=null;O.ao=0;hide()">Cancel</button></div>`)}
async function authGo(){const T=O.tab;try{
  if(T=='g'){await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());return}
  if(T=='ph'){
    if(!O.conf){const v=$('#a1').value.trim();if(!/^\d{10}$/.test(v))return toast('Enter a valid 10-digit number');O.ph=v;
      window.RCV=window.RCV||new firebase.auth.RecaptchaVerifier('rc',{size:'invisible'});
      O.conf=await auth.signInWithPhoneNumber('+91'+v,window.RCV);authUI();return toast('OTP sent')}
    const c=$('#a2').value.trim();if(!c)return toast('Enter the OTP');await O.conf.confirm(c);O.conf=null;return}
  const em=$('#a1').value.trim(),pw=$('#a3').value;
  if(!/^\S+@\S+\.\S+$/.test(em))return toast('Enter a valid email');if(pw.length<6)return toast('Password: at least 6 characters');
  if(O.mode=='up'){const c=await auth.createUserWithEmailAndPassword(em,pw);try{await c.user.sendEmailVerification();toast('Verification link sent to your email')}catch(e){}}
  else await auth.signInWithEmailAndPassword(em,pw);
}catch(e){console.error(e);toast('Failed: '+err(e))}}
async function forgot(){const em=($('#a1')||{}).value;if(!em)return toast('Enter your email first');try{await auth.sendPasswordResetEmail(em.trim());toast('Reset link sent to your email')}catch(e){toast('Failed: '+err(e))}}
