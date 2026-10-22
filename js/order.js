/* Sketch order form: design, customer details, review, and submit. */
const price = options => Math.round((
  CFG.sizes[options.size]
    * (1 + CFG.extraPerson * (options.ppl - 1))
    * CFG.styles[options.style]
    + CFG.itemPrice * options.items
) / 10) * 10;

function showOrderStep(content) {
  $('#ordpage').innerHTML = `<div class="box">${content}</div>`;
  scrollTo(0, 0);
}

onUser(user => {
  if (!user) {
    showOrderStep(`
      <h2>Order a sketch</h2>
      <p class="mu">Please log in first, so you can track your order from any device.</p>
      <button class="btn" onclick="login()">Login / Sign up</button>
    `);
    return;
  }

  if (!O.order) startOrder();
});

function startOrder() {
  O.order = {
    subj: 'Person',
    style: 'Realistic',
    size: Object.keys(CFG.sizes)[1],
    ppl: 1,
    items: 0,
    photo: '',
    title: '',
    name: me.name,
    phone: me.phone,
    address: me.address || '',
    pincode: me.pincode || '',
    note: ''
  };
  showDesignStep();
}

function optionCards(key, options) {
  return `
    <div class="opt">
      ${options.map(([value, label]) => `
        <button class="${O.order[key] === value ? 'on' : ''}"
          onclick="O.order['${key}']=${typeof value === 'number' ? value : `'${value}'`};showDesignStep()">
          ${label}
        </button>
      `).join('')}
    </div>
  `;
}

function showDesignStep() {
  const order = O.order;
  showOrderStep(`
    <h2>Design your sketch</h2>
    <label>What should I draw?</label>
    ${optionCards('subj', ['Person', 'Pet / animal', 'Object / scene'].map(value => [value, value]))}
    <label>Style</label>
    ${optionCards('style', Object.keys(CFG.styles).map(value => [value, value]))}
    <label>Paper size</label>
    ${optionCards('size', Object.entries(CFG.sizes).map(([value, amount]) => [value, `${value}<br><span class="mu">from ₹${amount}</span>`]))}
    <label>Number of people</label>
    ${optionCards('ppl', [1, 2, 3, 4].map(count => [count, `${count}${count > 1 ? ' people' : ' person'}`]))}
    <label>Extra detailed items (jewellery, necklace…)</label>
    ${optionCards('items', [0, 1, 2, 3].map(count => [count, count ? `${count} (+₹${count * CFG.itemPrice})` : 'None']) )}
    <p class="mu">
      Charcoal pencils. Realistic is my most detailed style; the others are quicker, so they cost a little less.
      Ready in about 3–4 days (6–9 hours of work). Delivery charges are paid by you and confirmed after you order.
      For very detailed photos the price may change slightly; I'll confirm before I start.
    </p>
    <div class="tot">₹${price(order)}</div>
    <div class="row order-actions">
      <button class="btn" onclick="showDetailsStep()">Next</button>
      <a class="btn o" href="${PG('index')}">Cancel</a>
    </div>
  `);
}

function showDetailsStep() {
  const order = O.order;

  showOrderStep(`
    <h2>Your details</h2>
    <label for="photo">Reference photo (clear, well-lit)</label>
    <label class="photo-upload" for="photo">
      <span class="photo-upload-icon" aria-hidden="true">↑</span>
      <span class="photo-upload-copy"><strong>Choose a photo</strong><small>JPG, PNG or another image format</small></span>
      <input id="photo" class="photo-upload-input" type="file" accept="image/*" onchange="loadOrderPhoto(this)">
    </label>
    ${order.photo ? `<img class="pre" src="${order.photo}" alt="Reference photo preview">` : ''}
    <label for="title">Name this sketch (optional)</label>
    <input id="title" value="${esc(order.title)}" placeholder="e.g. Mom's portrait">
    <label for="name">Full name</label>
    <input id="name" value="${esc(order.name || '')}">
    <label for="phone">Mobile</label>
    <input id="phone" inputmode="tel" value="${esc(order.phone || '')}">
    <label for="address">Address</label>
    <textarea id="address" rows="2">${esc(order.address)}</textarea>
    <button class="btn o sm" type="button" onclick="locateOrder()">Use my location</button>
    <label for="pincode">Pincode</label>
    <input id="pincode" inputmode="numeric" value="${esc(order.pincode)}">
    <label for="note">Notes (optional)</label>
    <input id="note" value="${esc(order.note)}">
    <div class="row order-actions">
      <button class="btn" onclick="showReviewStep()">Next</button>
      <button class="btn o" onclick="saveOrderFields();showDesignStep()">Back</button>
    </div>
  `);
}

function loadOrderPhoto(input) {
  const file = input.files[0];
  if (!file) return;

  saveOrderFields();
  rz(file, dataUrl => {
    O.order.photo = dataUrl;
    showDetailsStep();
  });
}

function saveOrderFields() {
  const order = O.order;
  const value = selector => ($(selector) || {}).value || '';
  if (!$('#name')) return;

  order.title = value('#title');
  order.name = value('#name');
  order.phone = value('#phone');
  order.address = value('#address');
  order.pincode = value('#pincode');
  order.note = value('#note');
}

function locateOrder() {
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
      $('#address').value = result.display_name || '';
      $('#pincode').value = result.address?.postcode || '';
      saveOrderFields();
    } catch (error) {
      console.error('Could not look up location:', error);
      toast('Could not look up this location');
    }
  }, () => toast('Location permission was not granted'), {
    enableHighAccuracy: true,
    timeout: 12000
  });
}

function showReviewStep() {
  saveOrderFields();
  const order = O.order;

  if (!order.photo) return toast('Please upload a reference photo');
  if (!order.name || !/^\d{10}$/.test(order.phone) || !order.address || !/^\d{6}$/.test(order.pincode)) {
    return toast('Fill name, 10-digit mobile, address and 6-digit pincode');
  }

  showOrderStep(`
    <h2>Review &amp; send</h2>
    <p>
      ${order.subj} · ${order.style} · ${order.size} · ${order.ppl} person(s) · ${order.items} detail item(s)<br>
      <span class="mu">${esc(order.name)}, ${esc(order.address)} – ${esc(order.pincode)}</span>
    </p>
    <div class="tot">Estimate ₹${price(order)}</div>
    <div class="mu">
      + delivery charges.
      <b>Your photo will be checked, and the final price and delivery charge will be confirmed.</b>
      Once the order is accepted, a Pay button will appear in ‘My orders’.
    </div>
    <div class="row order-actions">
      <button class="btn" onclick="placeOrder()">Send order request</button>
      <button class="btn o" onclick="showDetailsStep()">Back</button>
    </div>
  `);
}

async function placeOrder() {
  const order = O.order;
  const counter = db.collection('metadata').doc('orderCounter');

  try {
    const id = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(counter);
      const nextNumber = (snapshot.exists ? snapshot.data().value || 0 : 0) + 1;
      const orderId = String(nextNumber).padStart(4, '0');
      const orderData = {
        ...order,
        title: order.title || `${order.style} ${order.subj.toLowerCase()}`,
        id: orderId,
        uid: me.id,
        email: me.email,
        amount: price(order),
        st: 0,
        at: TS()
      };

      transaction.set(counter, { value: nextNumber });
      transaction.set(db.collection('orders').doc(orderId), orderData);
      return orderId;
    });

    try {
      await db.collection('mail').doc(`order-${id}`).set({
        to: CFG.adminEmail,
        orderId: id,
        message: {
          subject: `New sketch order #${id} — ${order.title || order.name}`,
          text: `A new sketch order was placed by ${order.name} (${me.email}). Review it in the AnshInk artist panel.`,
          html: `<p>A new sketch order was placed.</p><p><b>Sketch ID:</b> ${esc(id)}<br><b>Customer:</b> ${esc(order.name)}<br><b>Email:</b> ${esc(me.email)}</p><p>Review it in the AnshInk artist panel.</p>`
        }
      });
    } catch (error) {
      console.error('Order email could not be queued:', error);
      toast('Order placed, but the email could not be queued. Check email setup.', 7000);
    }

    O.order = null;
    location.href = `${PG('orders')}?id=${id}`;
  } catch (error) {
    console.error('Could not submit order:', error);
    toast('Could not send order. Try again');
  }
}
