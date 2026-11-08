/* Sketch order form: design, customer details, review, and submit. */
const price = order => order.fixedPrice != null
  ? Number(order.fixedPrice)
  : orderOptionPrice(order.selections, order.priceBaseline, order.priceBase ?? ORDER_SETTINGS.basePrice);

const selectedLabel = (order, key) => optionById(key, order.selections?.[key])?.label || '';

function showOrderStep(content) {
  $('#ordpage').innerHTML = `<div class="box">${content}</div>`;
  scrollTo(0, 0);
}

onUser(async user => {
  if (!user) {
    showOrderStep(`
      <h2>Order a sketch</h2>
      <p class="mu">Please log in first, so you can track your order from any device.</p>
      <button class="btn" onclick="login()">Login / Sign up</button>
    `);
    return;
  }

  if (!O.order) await startOrder();
});

async function startOrder() {
  await siteDataReady;
  const params = new URLSearchParams(location.search);
  const shopId = params.get('shop');
  const sketchId = params.get('sketch');
  const selections = defaultOrderSelections();
  O.order = {
    sourceType: 'custom',
    selections,
    photo: '',
    title: '',
    name: me.name,
    phone: me.phone,
    address: me.address || '',
    pincode: me.pincode || '',
    note: ''
  };

  if (shopId) {
    try {
      const snapshot = await db.collection('shopProducts').doc(shopId).get();
      if (!snapshot.exists || snapshot.data().active === false) throw new Error('InkShop item unavailable');
      const product = snapshot.data();
      Object.assign(O.order, {
        sourceType: 'shop',
        shopProductId: shopId,
        title: product.title,
        photo: product.image,
        fixedPrice: Number(product.price),
        pinterestUrl: product.pinterestUrl || '',
        shopDescription: product.description || ''
      });
    } catch (error) {
      console.error('Could not load InkShop product:', error);
      showOrderStep('<h2>InkShop item unavailable</h2><p class="mu">This item may have been removed. Please return to InkShop and choose another design.</p><a class="btn" href="shop.html">Open InkShop</a>');
      return;
    }
  } else if (sketchId) {
    try {
      const snapshot = await db.collection('gallery').doc(sketchId).get();
      if (!snapshot.exists) throw new Error('Sketch not found');
      const sketch = snapshot.data();
      O.order.sourceType = 'gallery';
      O.order.gallerySketchId = sketchId;
      O.order.title = `Sketch like ${sketch.title || 'this'}`;
      O.order.photo = (sketch.photos || [sketch.photo]).filter(Boolean)[0] || '';
      const hasSpecificPrice = Number.isFinite(Number(sketch.orderPrice)) && sketch.orderPrice !== null;
      O.order.priceBase = hasSpecificPrice ? Number(sketch.orderPrice) : ORDER_SETTINGS.basePrice;
      O.order.priceBaseline = hasSpecificPrice ? (sketch.orderPreset || {}) : null;
      O.order.selections = { ...selections };
      Object.entries(sketch.orderPreset || {}).forEach(([categoryId, optionId]) => {
        if (optionById(categoryId, optionId)?.available) O.order.selections[categoryId] = optionId;
      });
    } catch (error) {
      console.error('Could not load sketch preset:', error);
      toast('Could not load this sketch preset. Please try again.');
    }
  }
  showDesignStep();
}

function optionCards(category, order) {
  return `
    <div class="opt">
      ${category.options.map(option => `
        <button class="${order.selections[category.id] === option.id ? 'on' : ''} ${option.available ? '' : 'unavailable'}"
          ${option.available ? `onclick="O.order.selections['${esc(category.id)}']='${esc(option.id)}';showDesignStep()"` : 'disabled'}>
          ${esc(option.label)}<br><span class="mu">${option.price >= 0 ? '+' : '−'}₹${Math.abs(Number(option.price) || 0)}${option.available ? '' : ' · ⛔ Unavailable'}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function showDesignStep() {
  const order = O.order;
  if (order.sourceType === 'shop') {
    showOrderStep(`
      <h2>Order from InkShop</h2>
      <img class="pre" src="${esc(order.photo)}" alt="Pinterest reference for ${esc(order.title)}">
      <h3>${esc(order.title)}</h3>
      <p class="mu">${esc(order.shopDescription || '')}</p>
      <p>${esc(SITE.shopNotice)}</p>
      ${order.pinterestUrl ? `<a href="${esc(order.pinterestUrl)}" target="_blank" rel="noopener">Open this reference on Pinterest</a>` : ''}
      <div class="tot">₹${price(order).toLocaleString('en-IN')}</div>
      <div class="row order-actions"><button class="btn" onclick="showDetailsStep()">Next</button><a class="btn o" href="${PG('shop')}">Cancel</a></div>
    `);
    return;
  }
  const sketchPreset = order.sourceType === 'gallery';
  showOrderStep(`
    <h2>${sketchPreset ? 'Order this sketch style' : 'Design your sketch'}</h2>
    ${sketchPreset ? `<p class="mu">The sketch details and price are preselected. You can continue as-is or change an available option.</p><img class="pre" src="${esc(order.photo)}" alt="Sketch reference">` : ''}
    ${ORDER_SETTINGS.categories.map(category => `<label>${esc(category.label)}</label>${optionCards(category, order)}`).join('')}
    <p class="mu">
      ${esc(SITE.orderNotice || 'Delivery charges are confirmed after you order. The final price is confirmed before I start.')}
    </p>
    <div class="tot">₹${price(order).toLocaleString('en-IN')}</div>
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
    ${order.sourceType === 'shop' ? '<p class="mu">The Pinterest reference will be used to make your hand-drawn sketch.</p>' : `
      <label for="photo">${order.photo ? 'Reference image (you can replace it)' : 'Reference photo (clear, well-lit)'}</label>
      <label class="photo-upload" for="photo">
        <span class="photo-upload-icon" aria-hidden="true">↑</span>
        <span class="photo-upload-copy"><strong>${order.photo ? 'Replace reference photo' : 'Choose a photo'}</strong><small>JPG, PNG or another image format</small></span>
        <input id="photo" class="photo-upload-input" type="file" accept="image/*" onchange="loadOrderPhoto(this)">
      </label>
      ${order.photo ? `<img class="pre" src="${esc(order.photo)}" alt="Reference photo preview">` : ''}
    `}
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
  const unavailableSelection = ORDER_SETTINGS.categories.find(category => {
    const selected = category.options.find(option => option.id === order.selections[category.id]);
    return selected && !selected.available;
  });
  if (unavailableSelection) return toast(`Choose an available option for ${unavailableSelection.label}`);
  if (!order.name || !/^\d{10}$/.test(order.phone) || !order.address || !/^\d{6}$/.test(order.pincode)) {
    return toast('Fill name, 10-digit mobile, address and 6-digit pincode');
  }

  showOrderStep(`
    <h2>Review &amp; send</h2>
    <p>
      ${esc(order.title || ORDER_SETTINGS.categories.map(category => selectedLabel(order, category.id)).filter(Boolean).join(' · '))}<br>
      ${order.sourceType === 'shop' ? `<span class="mu">Pinterest reference · ${esc(order.shopDescription || '')}</span><br>` : `<span class="mu">${esc(ORDER_SETTINGS.categories.map(category => `${category.label}: ${selectedLabel(order, category.id)}`).filter(Boolean).join(' · '))}</span><br>`}
      <span class="mu">${esc(order.name)}, ${esc(order.address)} – ${esc(order.pincode)}</span>
    </p>
    <div class="tot">${order.fixedPrice != null ? 'Price' : 'Estimate'} ₹${price(order).toLocaleString('en-IN')}</div>
    <div class="mu">
      + delivery charges.
      ${order.sourceType === 'shop'
        ? '<b>This Pinterest reference will be made into a hand-drawn sketch.</b> Delivery charges will be confirmed before payment.'
        : '<b>Your photo will be checked, and the final price and delivery charge will be confirmed.</b> Once the order is accepted, a Pay button will appear in ‘My orders’.'}
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
        title: order.title || ORDER_SETTINGS.categories.map(category => selectedLabel(order, category.id)).filter(Boolean).join(' '),
        subj: selectedLabel(order, 'subject') || 'Person',
        style: selectedLabel(order, 'style') || 'Realistic',
        size: selectedLabel(order, 'size'),
        ppl: Number(order.selections?.people || 1),
        items: Number(order.selections?.details || 0),
        id: orderId,
        uid: me.id,
        email: me.email,
        amount: price(order),
        selections: order.selections || {},
        optionSummary: ORDER_SETTINGS.categories.map(category => `${category.label}: ${selectedLabel(order, category.id)}`).filter(Boolean),
        optionPrices: ORDER_SETTINGS.categories.map(category => ({
          category: category.label,
          option: selectedLabel(order, category.id),
          priceChange: optionById(category.id, order.selections?.[category.id])?.price || 0
        })),
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
