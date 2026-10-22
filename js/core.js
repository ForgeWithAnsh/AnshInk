/* Shared page helpers, Firebase setup, authentication, and loading indicator. */
const BASE = document.body.dataset.base || '';
const PG = page => page === 'index'
  ? `${BASE}index.html`
  : `${BASE ? '' : 'html/'}${page}.html`;

firebase.initializeApp(CFG.firebase);

const auth = firebase.auth();
const db = firebase.firestore();
const TS = () => Date.now();
const $ = selector => document.querySelector(selector);

let me = null;
let O = {};

/* Keep the startup indicator at the top so it does not cover the page footer. */
const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'page-loading';
loadingIndicator.setAttribute('role', 'status');
loadingIndicator.setAttribute('aria-live', 'polite');
loadingIndicator.innerHTML = '<span class="loading-spinner" aria-hidden="true"></span>Loading…';
document.body.appendChild(loadingIndicator);

let authStateReady = false;
let pageAssetsReady = document.readyState === 'complete';

function updateLoadingIndicator() {
  if (authStateReady && pageAssetsReady) {
    setTimeout(() => loadingIndicator.classList.add('done'), 180);
  }
}

window.addEventListener('load', () => {
  pageAssetsReady = true;
  updateLoadingIndicator();
}, { once: true });

setTimeout(() => loadingIndicator.classList.add('done'), 15000);

const esc = value => String(value).replace(/[&<>"]/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[character]));

function toast(message, duration = 3200) {
  const element = $('#t');
  element.textContent = message;
  element.style.display = 'block';
  clearTimeout(O.tt);
  O.tt = setTimeout(() => { element.style.display = 'none'; }, duration);
}

function show(content) {
  $('#mb').innerHTML = content;
  $('#m').classList.add('on');
}

function hide() {
  $('#m').classList.remove('on');
}

$('#m').addEventListener('click', event => {
  if (event.target.id === 'm') hide();
});

const rs = amount => `₹${Number(amount).toLocaleString('en-IN')}`;
const err = error => error?.code
  ? error.code.replace('auth/', '').replace(/-/g, ' ')
  : 'error';
const isAdm = () => Boolean(me && me.adm);
const stars = rating => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

/* Resize uploaded photos before writing them to Firestore. */
function rz(file, callback) {
  const reader = new FileReader();

  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 800 / Math.max(image.width, image.height));
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.65));
    };
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
}

/* Run page callbacks once Firebase knows the signed-in user. */
const userCallbacks = [];
let authReady = false;

function onUser(callback) {
  userCallbacks.push(callback);
  if (authReady) callback(me);
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    me = null;
  } else {
    let profile = {};
    try {
      const snapshot = await db.collection('users').doc(user.uid).get();
      profile = snapshot.exists ? snapshot.data() : {};
    } catch (error) {
      console.error('Could not load user profile:', error);
    }

    const provider = user.providerData[0] || {};
    me = {
      id: user.uid,
      email: user.email || profile.email || '',
      phone: user.phoneNumber ? user.phoneNumber.replace('+91', '') : (profile.phone || ''),
      name: profile.name || user.displayName || '',
      address: profile.address || profile.addr || '',
      pincode: profile.pincode || profile.pin || '',
      done: Boolean(profile.done),
      adm: (user.email || '').trim().toLowerCase() === CFG.adminEmail.toLowerCase()
        && user.emailVerified,
      providerId: provider.providerId || ''
    };
  }

  authReady = true;
  authStateReady = true;
  updateLoadingIndicator();

  // The artist should be able to reach the admin panel even without a customer profile.
  if (me && !me.adm && !me.done && !location.pathname.endsWith('account.html')) {
    try {
      sessionStorage.setItem('ai_next', location.href);
    } catch (error) {
      // The profile page can still be completed without session storage.
    }
    location.href = `${PG('account')}?first=1`;
    return;
  }

  if (me && O.ao) {
    O.ao = 0;
    hide();
    toast('Logged in');
  }

  userCallbacks.forEach(callback => callback(me));

  if (me && O.cb) {
    const callback = O.cb;
    O.cb = null;
    callback();
  }
});
