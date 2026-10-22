/* Account details and first-time profile completion. */
const box = $('#acc');

onUser(user => {
  if (!user) {
    box.innerHTML = `
      <h2>My account</h2>
      <p class="mu">Please log in to see your account.</p>
      <button class="btn" onclick="login()">Login / Sign up</button>
    `;
    return;
  }

  const firstLogin = new URLSearchParams(location.search).has('first');
  if (firstLogin || !user.done) {
    form(true);
  } else if (location.pathname.endsWith('edit-details.html')) {
    form(false);
  } else {
    view();
  }
});

function view() {
  box.innerHTML = `
    <h2>My account</h2>
    <div class="acc">
      <p><b>${esc(me.name || '')}</b></p>
      <p>
        Mobile: ${esc(me.phone || '-')}<br>
        Email: ${esc(me.email || '-')}<br>
        Address: ${esc(me.address || '-')} ${esc(me.pincode || '')}
      </p>
    </div>
    <div class="row">
      <a class="btn" href="${PG('edit-details')}">Edit details</a>
      <a class="btn o" href="${PG('orders')}">My orders</a>
    </div>
  `;
}

function form(firstLogin) {
  const user = me;
  const hasPassword = auth.currentUser?.providerData.some(provider => provider.providerId === 'password');
  const passwordField = firstLogin && !hasPassword
    ? `
      <label for="pw">Create a password (at least 6 characters)</label>
      <input id="pw" type="password" autocomplete="new-password">
    `
    : '';
  const cancelButton = firstLogin
    ? ''
    : '<button class="btn o" onclick="view()">Cancel</button>';

  box.innerHTML = `
    <h2>${firstLogin ? 'Complete your profile' : 'Edit details'}</h2>
    <label for="pn">Full name</label>
    <input id="pn" value="${esc(user.name || '')}">
    <label for="pp">Mobile</label>
    <input id="pp" inputmode="tel" value="${esc(user.phone || '')}">
    <label for="pe">Email</label>
    <input id="pe" type="email" value="${esc(user.email || '')}">
    ${passwordField}
    <label for="pa">Address</label>
    <textarea id="pa" rows="2">${esc(user.address || '')}</textarea>
    <label for="pz">Pincode</label>
    <input id="pz" inputmode="numeric" value="${esc(user.pincode || '')}">
    <button class="btn o sm" type="button" onclick="locateProfile()">Use my location</button>
    <div class="row account-actions">
      <button class="btn" onclick="save(${!!firstLogin})">Save</button>
      ${cancelButton}
    </div>
  `;
}

function locateProfile() {
  if (!navigator.geolocation) return toast('Location is unavailable in this browser');

  toast('Choose precise or approximate location if your device asks');
  navigator.geolocation.getCurrentPosition(async position => {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.search = new URLSearchParams({
        format: 'jsonv2',
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }).toString();
      const response = await fetch(url);
      const result = await response.json();
      $('#pa').value = result.display_name || '';
      $('#pz').value = result.address?.postcode || '';
    } catch (error) {
      console.error('Could not look up location:', error);
      toast('Could not look up this location');
    }
  }, () => toast('Location permission was not granted'), {
    enableHighAccuracy: true,
    timeout: 12000
  });
}

async function save(firstLogin) {
  const value = selector => $(selector).value.trim();
  const name = value('#pn');
  const phone = value('#pp');
  const email = value('#pe');
  const pincode = value('#pz');

  if (!name) return toast('Enter your name');
  if (!/^\d{10}$/.test(phone)) return toast('Enter a 10-digit mobile number');
  if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Enter a valid email');
  if (pincode && !/^\d{6}$/.test(pincode)) return toast('Pincode must be 6 digits');

  const password = $('#pw');
  if (password) {
    if (password.value.length < 6) return toast('Create a password with at least 6 characters');

    try {
      const credential = firebase.auth.EmailAuthProvider.credential(email, password.value);
      await auth.currentUser.linkWithCredential(credential);
    } catch (error) {
      console.error('Could not add email/password sign-in:', error);
      const message = error.code === 'auth/email-already-in-use'
        ? 'That email is already attached to another account.'
        : 'Could not add email and password sign-in.';
      return toast(message);
    }
  }

  const profile = {
    name,
    phone,
    email,
    address: value('#pa'),
    pincode,
    done: true
  };

  try {
    await db.collection('users').doc(me.id).set(profile, { merge: true });
    Object.assign(me, profile);
    toast('Saved');

    if (firstLogin) {
      let nextPage = null;
      try {
        nextPage = sessionStorage.getItem('ai_next');
        sessionStorage.removeItem('ai_next');
      } catch (error) {
        // Continue to the home page if session storage is unavailable.
      }
      location.href = nextPage || PG('index');
    } else {
      view();
    }
  } catch (error) {
    console.error('Could not save profile:', error);
    toast('Could not save');
  }
}
