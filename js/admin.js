/* Artist panel for reviewing orders and recording sketch progress. */
const main = $('#main');

onUser(async user => {
  if (!user) {
    main.innerHTML = `
      <div class="box">
        <h2>Artist panel</h2>
        <p class="mu">Please log in with Google.</p>
        <button class="btn" onclick="artistGoogleLogin()">Continue with Google</button>
      </div>
    `;
    return;
  }

  if (!isAdm()) {
    const signedInEmail = (user.email || '').trim().toLowerCase();
    const intendedArtist = CFG.adminEmail.toLowerCase();
    const hasGoogleIdentity = user.providerData.some(item => item.providerId === 'google.com');
    const accessHelp = signedInEmail === intendedArtist && !user.emailVerified && !hasGoogleIdentity
      ? `This email/password account has not been verified yet. Verify ${esc(CFG.adminEmail)}, then reload. You can also sign out and continue with Google using that same account.`
      : `Artist access requires the verified Google account ${esc(CFG.adminEmail)}. The currently signed-in account does not match.`;
    main.innerHTML = `
      <div class="box">
        <h2>Artist panel</h2>
        <p class="mu">${accessHelp}</p>
        ${signedInEmail === intendedArtist && !user.emailVerified && !hasGoogleIdentity
          ? '<button class="btn sm" onclick="sendArtistVerification()">Send verification email</button>'
          : ''}
        <button class="btn o" onclick="auth.signOut()">Log out and switch account</button>
      </div>
    `;
    return;
  }

  main.innerHTML = '<p class="mu">Loading orders…</p>';

  try {
    O.list = await ords(true);
    await sweep(O.list);
    render();
  } catch (error) {
    console.error('Could not load orders:', error);
    const code = error.code || 'unknown error';
    const message = code.includes('permission-denied')
      ? 'Firebase denied access. Confirm you are signed in with the verified admin Google account and publish the current firestore.rules file.'
      : 'Could not load orders. Check your connection and reload the page.';
    main.innerHTML = `
      <div class="box">
        <h2>Artist panel could not load</h2>
        <p>${esc(message)}</p>
        <p class="mu">Error: ${esc(code)}</p>
        <button class="btn" onclick="location.reload()">Try again</button>
      </div>
    `;
  }
});

function artistGoogleLogin() {
  O.tab = 'g';
  login();
}

async function sendArtistVerification() {
  try {
    await auth.currentUser.sendEmailVerification();
    toast('Verification email sent. Verify your address, then reload this page.', 6000);
  } catch (error) {
    console.error('Could not send artist verification email:', error);
    toast(`Could not send the verification email: ${error.code || 'unknown error'}`, 7000);
  }
}

function render() {
  const orders = O.list.slice().sort((a, b) => b.at - a.at);

  main.innerHTML = `
    <h2>All orders</h2>
    ${orders.length ? orders.map(renderOrder).join('') : '<p class="mu">No orders yet.</p>'}
  `;
}

function renderOrder(order) {
  const sketchId = /^\d+$/.test(order.id)
    ? String(order.id).padStart(4, '0')
    : esc(order.id);

  return `
    <details class="ord">
      <summary>
        <img class="admin-thumb" src="${order.done || order.photo || ''}" alt="">
        <div>
          <b>Sketch #${sketchId} · ${esc(order.title || 'Untitled sketch')}</b>
          <div class="mu">${esc(order.name || '')} · ${esc(order.size || '')} · Estimate ${rs(order.amt)}</div>
          <span class="badge ${order.st < 0 ? 'bad' : ''}">${stl(order)}</span>
        </div>
      </summary>
      <div class="ord-body">
        <p class="mu">
          ${esc(order.subj || 'Person')} · ${esc(order.style || 'Realistic')} · ${order.ppl} person(s) · ${order.items || 0} detail items<br>
          ${esc(order.name)}, ${esc(order.phone)}<br>
          ${esc(order.addr)} – ${esc(order.pin)}<br>
          ${esc(order.note || '')}
        </p>
        <a href="${order.photo || '#'}" download="ref-${esc(order.id)}.jpg">Download reference photo</a>
        ${order.st === 0 ? renderNewOrderActions(order) : renderActiveOrderActions(order)}
      </div>
    </details>
  `;
}

function renderNewOrderActions(order) {
  return `
    <label for="f${order.id}">Final sketch price ₹</label>
    <input id="f${order.id}" inputmode="numeric" value="${order.amt}">
    <label for="d${order.id}">Delivery charge ₹</label>
    <input id="d${order.id}" inputmode="numeric" value="0">
    <label for="l${order.id}">Razorpay Payment Link</label>
    <input id="l${order.id}" type="url" placeholder="https://rzp.io/i/...">
    <div class="row admin-actions">
      <button class="btn sm" onclick="accept('${order.id}')">Accept &amp; ask for payment</button>
      <button class="btn o sm" onclick="decline('${order.id}')">Decline</button>
    </div>
  `;
}

function renderActiveOrderActions(order) {
  const statuses = STAT.map((status, index) => index >= 1
    ? `<option value="${index}" ${index === order.st ? 'selected' : ''}>${status}</option>`
    : '').join('');

  return `
    <label for="status-${order.id}">Status</label>
    <select id="status-${order.id}" onchange="adu('${order.id}',{st:+this.value})">
      ${statuses}
    </select>
    ${order.st === 1 ? `
      <label for="l${order.id}">Razorpay Payment Link</label>
      <input id="l${order.id}" type="url" value="${esc(order.link || '')}" placeholder="https://rzp.io/i/...">
      <button class="btn sm" onclick="savePaymentLink('${order.id}')">Save link</button>
    ` : ''}
    ${order.rf === 'req' ? `
      <p><b>Refund requested</b></p>
      <button class="btn sm" onclick="adu('${order.id}',{st:-3})">Mark refunded</button>
    ` : ''}
    <label for="progress-${order.id}">Sketch photo (progress / finished)</label>
    <input id="progress-${order.id}" type="file" accept="image/*" onchange="admPh('${order.id}',this)">
  `;
}

async function adu(id, changes) {
  const current = (O.list || []).find(order => order.id == id);
  const previousStatus = current?.st;

  try {
    await upo(id, changes);
    render();
    toast('Saved');

    if (!current || ![3, 4].includes(changes.st) || previousStatus === changes.st) return;

    const label = changes.st === 3 ? 'Sketching started' : 'Sketching finished';
    try {
      let recipient = current.email;
      if (!recipient && current.uid) {
        const profile = await db.collection('users').doc(current.uid).get();
        recipient = profile.exists ? profile.data().email : '';
      }
      if (!recipient) throw new Error('No customer email is saved for this order');

      await db.collection('mail').add({
        to: recipient,
        orderId: id,
        message: {
          subject: `AnshInk order #${id}: ${label}`,
          text: `Hello ${current.name || 'there'}, your sketch order ${id} is now marked “${label}”. View your order at ${location.origin + PG('orders')}?id=${encodeURIComponent(id)}`,
          html: `<p>Hello ${esc(current.name || 'there')},</p><p>Your sketch order <b>#${esc(id)}</b> is now marked <b>${label}</b>.</p><p><a href="${location.origin + PG('orders')}?id=${encodeURIComponent(id)}">View your order</a></p>`
        }
      });
    } catch (error) {
      console.error('Progress email could not be queued:', error);
      toast('Status saved, but customer email could not be queued.', 7000);
    }
  } catch (error) {
    console.error('Could not save order:', error);
    toast('Failed to save');
  }
}

function accept(id) {
  const value = field => $(`#${field}${id}`).value.trim();
  const finalPrice = Number(value('f'));
  const deliveryCharge = Number(value('d')) || 0;
  const link = value('l');

  if (!finalPrice) return toast('Enter the final price');
  if (link && !/^https:\/\//i.test(link)) return toast('Enter a valid HTTPS payment link');

  adu(id, {
    finalPrice,
    deliveryCharge,
    link,
    st: 1,
    acc: TS()
  });
}

function savePaymentLink(id) {
  const link = $(`#l${id}`).value.trim();
  if (!/^https:\/\//i.test(link)) return toast('Enter a valid HTTPS payment link');
  adu(id, { link });
}

function decline(id) {
  const reason = prompt('Reason for declining (shown to customer)');
  if (reason === null) return;
  adu(id, { st: -1, rej: reason });
}

function admPh(id, input) {
  if (!input.files[0]) return;
  rz(input.files[0], dataUrl => adu(id, { done: dataUrl }));
}
