/* AnshInk - login / sign-up popup (Google, mobile OTP, email) */
const MSG={'invalid-credential':'Wrong email or password. If you are new, tap Create account.','wrong-password':'Wrong password.','user-not-found':'No account with this email. Tap Create account.','email-already-in-use':'This email already has an account. Tap Log in (or use Google if you signed up with Google).','weak-password':'Password must be at least 6 characters.','invalid-email':'That email address looks wrong.','operation-not-allowed':'This login method is not turned on in Firebase yet.','unauthorized-domain':'This website address is not allowed in Firebase (add it under Authorized domains).','too-many-requests':'Too many attempts. Please wait a few minutes and try again.','invalid-phone-number':'Enter a valid 10-digit mobile number.','captcha-check-failed':'Security check failed. Refresh the page and try again.','invalid-app-credential':'Security check failed. Refresh the page and try again.','billing-not-enabled':'Real SMS needs Firebase billing (Blaze plan). Use a test number for now.','quota-exceeded':'SMS limit reached. Try again later.','invalid-verification-code':'Wrong OTP. Please check and try again.','code-expired':'OTP expired. Send a new one.','popup-blocked':'Your browser blocked the Google popup. Allow popups and try again.','popup-closed-by-user':'Google login was closed before finishing.','network-request-failed':'No internet connection.'};
function resetCap(){try{window.RCV&&window.RCV.clear()}catch(x){}window.RCV=null}
function fail(e){console.error(e);const c=(e.code||'').replace('auth/','');toast((MSG[c]||'Login failed')+' ['+c+']',8000);resetCap();if(c=='code-expired'){O.conf=null;authUI()}}

function login(cb){O.cb=cb;O.tab=O.tab||'g';authUI()}
function authUI(){O.ao=1;const T=O.tab;show(`<h2>Login / Sign up</h2><div class="tabs">${[['g','Google'],['ph','Mobile OTP'],['em','Email']].map(([k,n])=>`<button class="btn ${T==k?'':'o'} sm" onclick="O.tab='${k}';O.conf=null;authUI()">${n}</button>`).join('')}</div>
${T=='ph'?`<label>Mobile number (India)</label><input id="a1" inputmode="tel" placeholder="10-digit number" value="${esc(O.ph||'')}" ${O.conf?'disabled':''}>${O.conf?`<label>Enter OTP</label><input id="a2" inputmode="numeric">`:''}`:''}
${T=='em'?`<label>Email</label><input id="a1" type="email" autocomplete="email"><label>Password</label><input id="a3" type="password" autocomplete="current-password"><p class="mu">New here? Enter an email and a password, then tap <b>Create account</b>.<br><a href="#" onclick="forgot();return false">Forgot password?</a></p>`:''}
${T=='g'?`<p class="mu">Continue with your Google account.</p>`:''}
<div class="row" style="margin-top:12px">${T=='em'?`<button class="btn" onclick="emailGo('in')">Log in</button><button class="btn o" onclick="emailGo('up')">Create account</button>`:`<button class="btn" onclick="authGo()">${T=='g'?'Continue with Google':(O.conf?'Verify OTP':'Send OTP')}</button>`}<button class="btn o" onclick="O.conf=null;O.ao=0;hide()">Cancel</button></div>`)}

async function authGo(){const T=O.tab;try{
  if(T=='g'){await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());return}
  if(!O.conf){const v=$('#a1').value.trim();if(!/^\d{10}$/.test(v))return toast('Enter a valid 10-digit number');O.ph=v;
    resetCap();window.RCV=new firebase.auth.RecaptchaVerifier('rc',{size:'invisible'});
    O.conf=await auth.signInWithPhoneNumber('+91'+v,window.RCV);authUI();return toast('OTP sent')}
  const c=$('#a2').value.trim();if(!c)return toast('Enter the OTP');await O.conf.confirm(c);O.conf=null;
}catch(e){fail(e)}}

async function emailGo(mode){try{
  const em=$('#a1').value.trim(),pw=$('#a3').value;
  if(!/^\S+@\S+\.\S+$/.test(em))return toast('Enter a valid email');if(pw.length<6)return toast('Password: at least 6 characters');
  if(mode=='up'){const c=await auth.createUserWithEmailAndPassword(em,pw);try{await c.user.sendEmailVerification();toast('Verification link sent to your email',6000)}catch(e){}}
  else await auth.signInWithEmailAndPassword(em,pw);
}catch(e){fail(e)}}

async function forgot(){const em=($('#a1')||{}).value;if(!em)return toast('Enter your email first');try{await auth.sendPasswordResetEmail(em.trim());toast('Reset link sent to your email',6000)}catch(e){fail(e)}}
