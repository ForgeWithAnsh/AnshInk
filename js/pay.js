/* Per-order UPI payment page. UPI success is manually verified by the artist. */
const main = $('#main');
const requestedOrderId = new URLSearchParams(location.search).get('id');

onUser(async user => {
  if (!user) {
    main.innerHTML = `
      <section class="payment-panel">
        <h1>Log in to continue</h1>
        <p class="mu">Please sign in with the account used to place this order.</p>
        <button class="btn" onclick="login()">Login / Sign up</button>
      </section>`;
    return;
  }

  main.innerHTML = '<section class="payment-panel"><p class="mu">Loading your order…</p></section>';
  try {
    const orders = await ords(false);
    const order = orders.find(item => item.id === requestedOrderId);
    if (!order || order.st !== 1) {
      main.innerHTML = `
        <section class="payment-panel">
          <h1>Payment is not available yet</h1>
          <p class="mu">This order may not be accepted, or it may not belong to your account.</p>
          <a class="btn" href="${PG('orders')}">Open My orders</a>
        </section>`;
      return;
    }

    const amount = Number(tot(order));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('This order does not have a payable total.');
    renderPayment(order, amount);
  } catch (error) {
    console.error('Could not load payment details:', error);
    main.innerHTML = `
      <section class="payment-panel">
        <h1>Could not load payment details</h1>
        <p class="mu">Please return to My orders and try again.</p>
        <a class="btn" href="${PG('orders')}">Open My orders</a>
      </section>`;
  }
});

function renderPayment(order, amount) {
  const amountText = amount.toFixed(2);
  const sketchId = String(order.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
  const params = new URLSearchParams({
    pa: 'anshink.shop@axl',
    pn: 'AnshInk',
    tr: `AI${sketchId}`.slice(0, 35),
    tn: `Sketch ID ${sketchId}`.slice(0, 80),
    am: amountText,
    cu: 'INR'
  });
  const upiUrl = `upi://pay?${params.toString()}`;

  main.innerHTML = `
    <section class="payment-panel">
      <p class="payment-eyebrow">AnshInk · Sketch ID ${esc(order.id)}</p>
      <h1>Complete your payment</h1>
      <p class="payment-total">${rs(amount)}</p>
      <p class="mu">This UPI payment is for Sketch ID <b>${esc(order.id)}</b>. Please keep the amount unchanged.</p>
      <div class="payment-options">
        <div class="upi-option app-option">
          <h2>Pay with a UPI app</h2>
          <p>Open this page on your phone, then choose a UPI app to pay.</p>
          <a class="btn big upi-open" href="${esc(upiUrl)}">Open UPI app</a>
          <p class="mu small-copy">If no app opens, use the QR code with your phone.</p>
        </div>
        <div class="upi-option qr-option">
          <h2>Scan the QR code</h2>
          <canvas id="payment-qr" width="240" height="240" aria-label="UPI payment QR code"></canvas>
          <p>Scan with any UPI app. Confirm the payee and amount before paying.</p>
        </div>
      </div>
      <div class="payment-actions">
        <a class="btn" href="${PG('thankyou')}?id=${encodeURIComponent(order.id)}">I’ve completed payment</a>
        <a class="btn o" href="${PG('orders')}?id=${encodeURIComponent(order.id)}">Back to My orders</a>
      </div>
      <p class="mu payment-manual-note">After payment, tap “I’ve completed payment”. Your payment will be manually verified, and My orders will show when it is confirmed.</p>
    </section>`;

  const canvas = document.getElementById('payment-qr');
  if (window.QRCode?.toCanvas) {
    QRCode.toCanvas(canvas, upiUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#3a2a1f', light: '#fffaf2' },
      errorCorrectionLevel: 'M'
    }, error => {
      if (error) showQrFallback(canvas, upiUrl);
    });
  } else {
    showQrFallback(canvas, upiUrl);
  }
}

function showQrFallback(canvas, upiUrl) {
  const wrapper = canvas?.parentElement;
  if (!wrapper) return;
  canvas.remove();
  const fallback = document.createElement('p');
  fallback.className = 'mu';
  fallback.textContent = 'The QR code could not load. You can try opening a UPI app directly.';
  wrapper.append(fallback);
  const directPay = document.createElement('a');
  directPay.className = 'btn sm upi-open';
  directPay.href = upiUrl;
  directPay.textContent = 'Try opening a UPI app';
  wrapper.append(directPay);
  console.error('QR code library did not load for this payment:', upiUrl);
}
