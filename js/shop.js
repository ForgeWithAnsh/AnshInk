/* Public InkShop catalogue. */
const shopList = $('#shop-list');
let shopProducts = [];
let selectedShopCategory = 'All';

function selectShopCategory(category) {
  selectedShopCategory = category;
  renderShop();
}

function safeExternalUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === 'https:' && (host === 'pin.it' || host === 'pinterest.com' || host.endsWith('.pinterest.com')) ? parsed.href : '';
  } catch {
    return '';
  }
}

function sortShopProducts(products) {
  return products.sort((first, second) => {
    const firstOrder = Number.isFinite(Number(first.shopOrder)) ? Number(first.shopOrder) : null;
    const secondOrder = Number.isFinite(Number(second.shopOrder)) ? Number(second.shopOrder) : null;
    if (firstOrder !== null && secondOrder !== null) return firstOrder - secondOrder;
    if (firstOrder !== null) return -1;
    if (secondOrder !== null) return 1;
    return Number(second.createdAt || 0) - Number(first.createdAt || 0);
  });
}

function renderShop() {
  $('#shop-heading').textContent = SITE.shopHeading || 'InkShop';
  $('#shop-intro').textContent = SITE.shopIntro || '';
  $('#shop-notice').textContent = SITE.shopNotice || '';
  $('#shop-admin-tools').innerHTML = isAdm() ? '<div class="shop-admin-add"><button class="btn" onclick="showShopProductForm()">＋ Add InkShop card</button></div>' : '';
  if (isAdm()) adminShopItems = shopProducts.slice();
  const categories = ['All', ...(SITE.shopCategories || [])];
  $('#shop-categories').innerHTML = categories.map(category => `
    <button class="btn ${category === selectedShopCategory ? '' : 'o'} sm" data-category="${esc(category)}" onclick="selectShopCategory(this.dataset.category)">${esc(category)}</button>
  `).join('');
  const visible = shopProducts.filter(product => selectedShopCategory === 'All' || product.category === selectedShopCategory);
  shopList.innerHTML = visible.length ? visible.map((product, index) => {
    const pinUrl = safeExternalUrl(product.pinterestUrl || '');
    const cardPrice = cardPaperPrice(product, 'shop');
    const productIndex = visible.findIndex(item => item.id === product.id);
    return `
      <article class="shop-card ${product.active === false ? 'shop-card-hidden' : ''}" style="--shop-index:${Math.min(index, 8)}" tabindex="0" aria-label="View ${esc(product.title || 'sketch design')} details" onclick="if (!event.target.closest('a,button')) openShopProduct('${product.id}')" onkeydown="if(event.target===this&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openShopProduct('${product.id}')} ">
        <img src="${esc(product.image || '')}" alt="Pinterest reference: ${esc(product.title || '')}" loading="lazy">
        <div class="shop-card-body">
          <div class="shop-category">${esc(product.category || 'InkShop')}</div>
          ${product.active === false ? '<span class="badge bad">Hidden</span>' : ''}
          <h2>${esc(product.title || 'Sketch design')}</h2>
          <p>${esc(product.description || '')}</p>
          <div class="shop-price">${esc(cardPrice.size?.label || 'Paper size')} · ₹${cardPrice.price.toLocaleString('en-IN')}</div>
          <div class="row">
            <a class="btn" href="${PG('order')}?shop=${encodeURIComponent(product.id)}" onclick="event.stopPropagation()">Order this design</a>
            ${pinUrl ? `<a class="btn o" href="${esc(pinUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">View on Pinterest</a>` : ''}
          </div>
          ${isAdm() ? `<div class="row shop-admin-actions"><button class="btn o sm" onclick="event.stopPropagation();moveShopProduct('${product.id}',-1)" aria-label="Move ${esc(product.title || 'card')} earlier" ${productIndex === 0 ? 'disabled' : ''}>↑</button><button class="btn o sm" onclick="event.stopPropagation();moveShopProduct('${product.id}',1)" aria-label="Move ${esc(product.title || 'card')} later" ${productIndex === visible.length - 1 ? 'disabled' : ''}>↓</button><button class="btn o sm" onclick="event.stopPropagation();showShopProductForm('${product.id}')">Edit card</button><button class="btn o sm" onclick="event.stopPropagation();deleteShopProduct('${product.id}')">Delete</button></div>` : ''}
        </div>
      </article>
    `;
  }).join('') : '<p class="mu shop-empty">No designs are listed in this category yet.</p>';
}

function openShopProduct(id) {
  const product = shopProducts.find(item => item.id === id);
  if (!product) return;
  const pinUrl = safeExternalUrl(product.pinterestUrl || '');
  const cardPrice = cardPaperPrice(product, 'shop');
  $('#mb').classList.add('shop-detail-box');
  show(`
    <div class="shop-detail-layout">
      <div class="shop-detail-media"><img class="shop-detail-image" src="${esc(product.image || '')}" alt="Pinterest reference: ${esc(product.title || '')}"></div>
      <div class="shop-detail-info">
        <div class="shop-category">${esc(product.category || 'InkShop')}</div>
        <h2>${esc(product.title || 'Sketch design')}</h2>
        <p>${esc(product.description || '')}</p>
        <div class="shop-price">${esc(cardPrice.size?.label || 'Paper size')} · ₹${cardPrice.price.toLocaleString('en-IN')}</div>
        <p class="mu">Choose a paper size after continuing; its price will be shown on the order page.</p>
        <div class="row shop-detail-actions">
          <a class="btn" href="${PG('order')}?shop=${encodeURIComponent(product.id)}">Order this design</a>
          ${pinUrl ? `<a class="btn o" href="${esc(pinUrl)}" target="_blank" rel="noopener noreferrer">View on Pinterest</a>` : ''}
          <button class="btn o" onclick="hide()">Close</button>
        </div>
      </div>
    </div>
  `);
}

async function loadShop() {
  await siteDataReady;
  try {
    const snapshot = isAdm()
      ? await db.collection('shopProducts').get()
      : await db.collection('shopProducts').where('active', '==', true).get();
    shopProducts = sortShopProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  } catch (error) {
    console.error('Could not load InkShop:', error);
    shopList.innerHTML = '<p class="mu shop-empty">InkShop could not load. Please refresh the page.</p>';
    return;
  }
  renderShop();
}

onUser(() => loadShop());
