/* My Orders list and order detail view. */
const main = $('#main');

onUser(async user => {
  if (!user) {
    main.innerHTML = `
      <div class="box">
        <h2>My orders</h2>
        <p class="mu">Please log in to see your orders.</p>
        <button class="btn" onclick="login()">Login / Sign up</button>
      </div>
    `;
    return;
  }

  main.innerHTML = '<p class="mu">Loading orders…</p>';

  try {
    O.list = await ords(false);
    await sweep(O.list);
  } catch (error) {
    console.error('Could not load orders:', error);
    main.innerHTML = '<div class="box"><p>Could not load your orders. Please try again.</p></div>';
    return;
  }

  const orderId = new URLSearchParams(location.search).get('id');
  const orderExists = orderId && O.list.some(order => order.id === orderId);
  if (orderExists) view(orderId);
  else list();
});

function list() {
  const orders = O.list.slice().sort((first, second) => second.at - first.at);
  const orderCards = orders.map(order => `
    <a class="ocard order-enter" href="${PG('orders')}?id=${order.id}">
      <img src="${order.done || order.photo}" alt="">
      <div>
        <b>${esc(order.title || 'Sketch')}</b>
        <div class="mu">Sketch ID ${/^\d+$/.test(order.id) ? String(order.id).padStart(4, '0') : esc(order.id)}</div>
        <span class="badge ${order.st < 0 ? 'bad' : ''}">${stl(order)}</span>
      </div>
    </a>
  `).join('');

  main.innerHTML = `
    <div class="orders-heading">
      <h2>My orders</h2>
      ${orders.length ? `<a class="btn order-cta" href="${PG('order')}">＋ Order another sketch</a>` : ''}
    </div>
    ${orders.length ? orderCards : `
      <div class="empty-orders">
        <div class="empty-art">✎</div>
        <h3>Your sketch story starts here</h3>
        <p class="mu">Share a photo and I’ll turn it into a hand-drawn keepsake.</p>
        <a class="btn order-cta" href="${PG('order')}">Order your first sketch</a>
      </div>
    `}
  `;
}

function view(id) {
  const order = O.list.find(item => item.id === id);
  if (!order) return list();

  const paymentDueDate = order.acc
    ? new Date(order.acc + 3 * 864e5).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';
  const amountSummary = order.fin == null
    ? `Estimate ${rs(order.amt)} (final price after review)`
    : `Sketch ${rs(order.fin)} + delivery ${rs(order.del || 0)} = <b>${rs(tot(order))}</b>`;
  const deliveryNotes = order.note ? `<br>Notes: ${esc(order.note)}` : '';
  const paymentNotice = order.st === 1
    ? order.link
      ? `
        <p class="mu">Please pay by ${paymentDueDate}, or the order is cancelled automatically.</p>
        <button class="btn" onclick="payNow('${order.id}')">Pay ${rs(tot(order))}</button>
      `
      : `<p class="mu">Accepted. Your payment link is being prepared; it will appear here soon. Pay by ${paymentDueDate}.</p>`
    : '';
  const cancelButton = order.st === 0
    ? `<button class="btn o sm" onclick="cancelOrder('${order.id}')">Cancel order</button>`
    : '';
  const refundButton = order.st === 2 && order.rf !== 'req'
    ? `<button class="btn o sm" onclick="refund('${order.id}')">Request refund</button>`
    : '';
  const refundNotice = order.rf === 'req'
    ? '<p class="mu">Refund requested. I will get back to you.</p>'
    : '';
  const rejectionNotice = order.st < 0
    ? `<p><span class="badge bad">${stl(order)}</span> ${esc(order.rej || '')}</p>`
    : trk(order.st);

  main.innerHTML = `
    <div class="box">
      <h2>${esc(order.title || 'Sketch')}</h2>
      <img class="oimg" src="${order.done || order.photo}" alt="">
      <div class="mu">Sketch ID ${esc(order.id)} · ordered ${new Date(order.at).toLocaleDateString('en-IN')}</div>
      <p>
        ${esc(order.subj || 'Person')} · ${esc(order.style || 'Realistic')}<br>
        Paper: ${esc(order.size || '')}<br>
        People: ${order.ppl} · Detail items: ${order.items || 0}<br>
        Material: charcoal pencils
      </p>
      <p>${amountSummary}</p>
      <p class="mu">
        Deliver to: ${esc(order.name)}, ${esc(order.phone)}<br>
        ${esc(order.addr)} – ${esc(order.pin)}${deliveryNotes}
      </p>
      ${rejectionNotice}
      ${paymentNotice}
      ${cancelButton}
      ${refundButton}
      ${refundNotice}
      <p class="mu">Refunds are possible only before sketching starts, and not after the sketch is finished.</p>
      <div class="row">
        <a class="btn order-cta" href="${PG('order')}">Order another sketch</a>
        <a class="btn o" href="${PG('orders')}">← All orders</a>
      </div>
    </div>
  `;
}

function payNow(id) {
  const order = O.list.find(item => item.id === id);
  if (!order?.link) return;

  window.open(order.link, '_blank', 'noopener');
  toast('Once your payment is confirmed, your order moves forward');
}

async function cancelOrder(id) {
  if (!confirm('Cancel this order?')) return;

  try {
    await upo(id, { st: -4 });
    view(id);
  } catch (error) {
    console.error('Could not cancel order:', error);
    toast('Could not cancel. Please try again');
  }
}

async function refund(id) {
  if (!confirm('Request a refund? The order will not be started.')) return;

  try {
    await upo(id, { rf: 'req' });
    view(id);
  } catch (error) {
    console.error('Could not request refund:', error);
    toast('Could not send request');
  }
}
