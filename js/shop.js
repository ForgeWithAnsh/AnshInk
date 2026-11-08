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

function renderShop() {
  $('#shop-heading').textContent = SITE.shopHeading || 'InkShop';
  $('#shop-intro').textContent = SITE.shopIntro || '';
  $('#shop-notice').textContent = SITE.shopNotice || '';
  const categories = ['All', ...(SITE.shopCategories || [])];
  $('#shop-categories').innerHTML = categories.map(category => `
    <button class="btn ${category === selectedShopCategory ? '' : 'o'} sm" data-category="${esc(category)}" onclick="selectShopCategory(this.dataset.category)">${esc(category)}</button>
  `).join('');
  const visible = shopProducts.filter(product => selectedShopCategory === 'All' || product.category === selectedShopCategory);
  shopList.innerHTML = visible.length ? visible.map(product => {
    const pinUrl = safeExternalUrl(product.pinterestUrl || '');
    return `
      <article class="shop-card">
        <img src="${esc(product.image || '')}" alt="Pinterest reference: ${esc(product.title || '')}" loading="lazy">
        <div class="shop-card-body">
          <div class="shop-category">${esc(product.category || 'InkShop')}</div>
          <h2>${esc(product.title || 'Sketch design')}</h2>
          <p>${esc(product.description || '')}</p>
          <div class="shop-price">₹${Number(product.price || 0).toLocaleString('en-IN')}</div>
          <div class="row">
            <a class="btn" href="${PG('order')}?shop=${encodeURIComponent(product.id)}">Order this design</a>
            ${pinUrl ? `<a class="btn o" href="${esc(pinUrl)}" target="_blank" rel="noopener noreferrer">View on Pinterest</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('') : '<p class="mu shop-empty">No designs are listed in this category yet.</p>';
}

async function loadShop() {
  await siteDataReady;
  try {
    const snapshot = await db.collection('shopProducts').where('active', '==', true).get();
    shopProducts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      .sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0));
  } catch (error) {
    console.error('Could not load InkShop:', error);
    shopList.innerHTML = '<p class="mu shop-empty">InkShop could not load. Please refresh the page.</p>';
    return;
  }
  renderShop();
}

loadShop();
