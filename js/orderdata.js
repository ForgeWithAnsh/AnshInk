/* Firestore order helpers shared by My Orders and the artist panel. */
const tot = order => (order.finalPrice ?? order.fin ?? order.amt)
  + (order.deliveryCharge ?? order.del ?? 0);

function stl(order) {
  if (order.st === -1) return 'Declined';
  if (order.st === -2) return 'Cancelled (not paid in 3 days)';
  if (order.st === -3) return 'Refunded';
  if (order.st === -4) return 'Cancelled by you';
  if (order.rf === 'req') return 'Refund requested';
  return STAT[order.st];
}

function trk(status) {
  return `
    <div class="trk">
      ${STAT.map((label, index) => `
        <div class="${index <= status ? 'd' : ''}">${label}</div>
      `).join('')}
    </div>
  `;
}

async function ords(includeAll) {
  const query = includeAll
    ? db.collection('orders')
    : db.collection('orders').where('uid', '==', me.id);
  const snapshot = await query.get();

  return snapshot.docs.map(document => {
    const data = document.data();
    return {
      ...data,
      id: document.id,
      st: data.status ?? data.st ?? 0,
      addr: data.address || data.addr || '',
      pin: data.pincode || data.pin || '',
      amt: data.amount ?? data.amt ?? 0,
      fin: data.finalPrice ?? data.fin,
      del: data.deliveryCharge ?? data.del ?? 0
    };
  });
}

async function upo(id, changes) {
  await db.collection('orders').doc(id).update(changes);
  Object.assign((O.list || []).find(order => order.id === id) || {}, changes);
}

/* Cancel accepted orders that have remained unpaid for three days. */
async function sweep(orders) {
  const now = Date.now();

  for (const order of orders) {
    const unpaidTooLong = order.st === 1 && order.acc && now - order.acc > 3 * 864e5;
    if (!unpaidTooLong) continue;

    try {
      await db.collection('orders').doc(order.id).update({ st: -2 });
      order.st = -2;
    } catch (error) {
      console.error('Could not expire unpaid order:', error);
    }
  }
}
