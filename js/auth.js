/* Sign in with Google or email/password. */
const AUTH_MESSAGES = {
  'invalid-credential': 'Wrong email or password. If you are new, tap Create account.',
  'wrong-password': 'Wrong password.',
  'user-not-found': 'No account with this email. Tap Create account.',
  'email-already-in-use': 'This email already has an account. Tap Log in or use Google.',
  'weak-password': 'Password must be at least 6 characters.',
  'invalid-email': 'That email address looks wrong.',
  'operation-not-allowed': 'This login method is not turned on in Firebase yet.',
  'unauthorized-domain': 'Add this website address under Firebase Authorized domains.',
  'too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'popup-blocked': 'Your browser blocked the Google popup. Allow popups and try again.',
  'popup-closed-by-user': 'Google login was closed before finishing.',
  'network-request-failed': 'No internet connection.'
};

function authFail(error) {
  console.error('Firebase authentication error:', error);
  const code = (error.code || '').replace('auth/', '');
  toast(`${AUTH_MESSAGES[code] || 'Login failed'} [${code}]`, 8000);
}

function login(callback) {
  O.cb = callback;
  O.tab = O.tab || 'g';
  authUI();
}

function authUI() {
  O.ao = 1;
  const tab = O.tab;
  const tabs = [
    ['g', 'Google'],
    ['em', 'Email']
  ];

  show(`
    <h2>Login / Sign up</h2>
    <div class="tabs">
      ${tabs.map(([key, label]) => `
        <button class="btn ${tab === key ? '' : 'o'} sm" onclick="O.tab='${key}';authUI()">
          ${label}
        </button>
      `).join('')}
    </div>
    ${tab === 'em' ? `
      <label for="a1">Email</label>
      <input id="a1" type="email" autocomplete="email">
      <label for="a3">Password</label>
      <input id="a3" type="password" autocomplete="current-password">
      <p class="mu">
        New here? Enter an email and a password, then tap <b>Create account</b>.<br>
        <a href="#" onclick="forgot();return false">Forgot password?</a>
      </p>
    ` : '<p class="mu">Continue with your Google account.</p>'}
    <div class="row auth-actions">
      ${tab === 'em' ? `
        <button class="btn" onclick="emailGo('in')">Log in</button>
        <button class="btn o" onclick="emailGo('up')">Create account</button>
      ` : '<button class="btn" onclick="authGo()">Continue with Google</button>'}
      <button class="btn o" onclick="O.ao=0;hide()">Cancel</button>
    </div>
  `);
}

async function authGo() {
  try {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  } catch (error) {
    authFail(error);
  }
}

async function emailGo(mode) {
  const email = $('#a1').value.trim();
  const password = $('#a3').value;

  if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Enter a valid email');
  if (password.length < 6) return toast('Password: at least 6 characters');

  try {
    if (mode === 'up') {
      const credential = await auth.createUserWithEmailAndPassword(email, password);
      try {
        await credential.user.sendEmailVerification();
        toast('Verification link sent to your email', 6000);
      } catch (error) {
        console.error('Could not send verification email:', error);
      }
    } else {
      await auth.signInWithEmailAndPassword(email, password);
    }
  } catch (error) {
    authFail(error);
  }
}

async function forgot() {
  const email = ($('#a1') || {}).value;
  if (!email) return toast('Enter your email first');

  try {
    await auth.sendPasswordResetEmail(email.trim());
    toast('Reset link sent to your email', 6000);
  } catch (error) {
    authFail(error);
  }
}
