/* Public InkShop catalogue. */
const shopList = $('#shop-list');
let shopProducts = [];
let selectedShopCategory = 'All';
let shopFavoriteIds = new Set();
let shopFavoritesReady = Promise.resolve();
const shopFavoriteWrites = new Set();

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

async function loadShopFavorites(user) {
  shopFavoriteIds = new Set();
  if (!user) return;
  try {
    const profile = await db.collection('users').doc(user.id).get();
    shopFavoriteIds = new Set(profile.exists && Array.isArray(profile.data().favoriteShopIds) ? profile.data().favoriteShopIds : []);
  } catch (error) {
    console.error('Could not load InkShop favorites:', error);
  }
}

async function toggleShopFavorite(id) {
  if (!me) return login(() => toggleShopFavorite(id));
  if (shopFavoriteWrites.has(id)) return;
  shopFavoriteWrites.add(id);
  try {
    await shopFavoritesReady;
    const profileRef = db.collection('users').doc(me.id);
    const profile = await profileRef.get();
    const favoriteIds = new Set(profile.exists && Array.isArray(profile.data().favoriteShopIds) ? profile.data().favoriteShopIds : []);
    if (favoriteIds.has(id)) favoriteIds.delete(id);
    else favoriteIds.add(id);
    await profileRef.set({ favoriteShopIds: [...favoriteIds] }, { merge: true });
    shopFavoriteIds = favoriteIds;
  } catch (error) {
    console.error('Could not update InkShop favorites:', error);
    toast('Could not save this favorite. Please try again.');
  } finally {
    shopFavoriteWrites.delete(id);
    if ($('#m').classList.contains('on') && $('#mb').classList.contains('shop-detail-box')) openShopProduct(id);
    else renderShop();
  }
}

function renderShop() {
  if (selectedShopCategory === 'Favorites' && !me) selectedShopCategory = 'All';
  $('#shop-heading').textContent = SITE.shopHeading || 'InkShop';
  $('#shop-intro').textContent = SITE.shopIntro || '';
  $('#shop-notice').textContent = SITE.shopNotice || '';
  $('#shop-admin-tools').innerHTML = isAdm() ? '<div class="shop-admin-add"><button class="btn" onclick="showShopProductForm()">＋ Add InkShop card</button></div>' : '';
  if (isAdm()) adminShopItems = shopProducts.slice();
  const categories = ['All', ...(me ? ['Favorites'] : []), ...(SITE.shopCategories || []).filter(category => category !== 'Favorites')];
  $('#shop-categories').innerHTML = `
    <div class="category-track">
      ${categories.map(category => `
        <button class="btn ${category === selectedShopCategory ? '' : 'o'} sm" data-category="${esc(category)}" onclick="selectShopCategory(this.dataset.category)">${esc(category)}</button>
      `).join('')}
    </div>
    <span class="category-fade category-fade-left" aria-hidden="true"></span>
    <span class="category-fade category-fade-right" aria-hidden="true"></span>
  `;
  initCategoryStrip($('#shop-categories'));
  const visible = shopProducts.filter(product => selectedShopCategory === 'Favorites'
    ? shopFavoriteIds.has(product.id)
    : selectedShopCategory === 'All' || product.category === selectedShopCategory);
  shopList.innerHTML = visible.length ? visible.map((product, index) => {
    const pinUrl = safeExternalUrl(product.pinterestUrl || '');
    const cardPrice = cardPaperPrice(product, 'shop');
    return `
      <article class="shop-card ${product.active === false ? 'shop-card-hidden' : ''}" data-shop-id="${esc(product.id)}" style="--shop-index:${Math.min(index, 8)}" tabindex="0" aria-label="View ${esc(product.title || 'sketch design')} details" onclick="if (!event.target.closest('a,button')) openShopProduct('${product.id}')" onkeydown="if(event.target===this&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openShopProduct('${product.id}')} ">
        ${isAdm() ? `<button class="shop-drag-handle" type="button" title="Hold and drag to reorder" aria-label="Hold and drag ${esc(product.title || 'card')} to reorder" onpointerdown="event.stopPropagation();startShopProductDrag(event,'${product.id}')">⠿</button>` : ''}
        <img src="${esc(product.image || '')}" alt="Pinterest reference: ${esc(product.title || '')}" loading="lazy">
        <button class="shop-favorite ${shopFavoriteIds.has(product.id) ? 'is-favorite' : ''}" type="button" onclick="event.stopPropagation();toggleShopFavorite('${product.id}')" aria-label="${shopFavoriteIds.has(product.id) ? 'Remove from' : 'Add to'} favorites" aria-pressed="${shopFavoriteIds.has(product.id)}" ${shopFavoriteWrites.has(product.id) ? 'disabled' : ''}>${shopFavoriteIds.has(product.id) ? '★' : '☆'}</button>
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
          ${isAdm() ? `<div class="row shop-admin-actions"><button class="btn o sm" onclick="event.stopPropagation();showShopProductForm('${product.id}')">Edit card</button><button class="btn o sm" onclick="event.stopPropagation();deleteShopProduct('${product.id}')">Delete</button></div>` : ''}
        </div>
      </article>
    `;
  }).join('') : `<p class="mu shop-empty">${selectedShopCategory === 'Favorites' ? 'No favorites yet. Tap the star on a design to save it here.' : 'No designs are listed in this category yet.'}</p>`;
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
          <button class="btn o" onclick="toggleShopFavorite('${product.id}')" aria-pressed="${shopFavoriteIds.has(product.id)}">${shopFavoriteIds.has(product.id) ? '★ Saved to favorites' : '☆ Add to favorites'}</button>
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

onUser(user => {
  shopFavoritesReady = loadShopFavorites(user);
  shopFavoritesReady.then(loadShop);
});
