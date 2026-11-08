/* Artist tools for site copy, favicon, prices, and InkShop products. */
let adminShopItems = [];

async function loadAdminShopItems() {
  try {
    const snapshot = await db.collection('shopProducts').get();
    adminShopItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error('Could not load InkShop products:', error);
    adminShopItems = [];
  }
}

function renderAdminTab(tab) {
  O.adminTab = tab;
  const content = $('#admin-section');
  if (!content) return;
  if (tab === 'site') content.innerHTML = renderSiteSettingsForm();
  else if (tab === 'pricing') renderOrderSettingsForm();
  else if (tab === 'shop') renderShopAdmin();
  else content.innerHTML = renderOrdersSection();
}

function renderSiteSettingsForm() {
  const heroPreview = /^(data:|https?:\/\/)/.test(SITE.hero || '') ? SITE.hero : BASE + SITE.hero;
  return `
    <h2>Website text &amp; appearance</h2>
    <p class="mu">Edit the words and contact details visitors see. Put one story paragraph or quote on each line. For About details, use one “label | value” pair per line.</p>
    <div class="settings-grid">
      <label>Website name<input id="site-name" maxlength="40" value="${esc(SITE.siteName)}"></label>
      <label>Artist name<input id="site-artist" maxlength="50" value="${esc(SITE.artist)}"></label>
      <label>Support email<input id="site-email" type="email" value="${esc(SITE.email)}"></label>
      <label>Instagram username<input id="site-insta" value="${esc(SITE.insta)}"></label>
      <label>Hero button text<input id="site-hero-cta" value="${esc(SITE.heroCta || '')}"></label>
      <label>Home navigation text<input id="site-nav-home" value="${esc(SITE.navHome || '')}"></label>
      <label>Gallery navigation text<input id="site-nav-gallery" value="${esc(SITE.navGallery || '')}"></label>
      <label>About navigation text<input id="site-nav-about" value="${esc(SITE.navAbout || '')}"></label>
      <label>Reviews navigation text<input id="site-nav-reviews" value="${esc(SITE.navReviews || '')}"></label>
      <label>Footer support label<input id="site-footer-support" value="${esc(SITE.footerSupport || '')}"></label>
      <label>Gallery heading<input id="site-gallery-heading" value="${esc(SITE.galleryHeading || '')}"></label>
      <label>All sketches button text<input id="site-all-sketches-cta" value="${esc(SITE.allSketchesCta || '')}"></label>
      <label>InkShop heading<input id="site-shop-heading" value="${esc(SITE.shopHeading || '')}"></label>
      <label>About heading<input id="site-about-heading" value="${esc(SITE.aboutHeading || '')}"></label>
      <label>About contact heading<input id="site-contact-heading" value="${esc(SITE.contactHeading || '')}"></label>
    </div>
    <label for="site-bio">Homepage introduction / bio</label>
    <textarea id="site-bio" rows="4" maxlength="2000">${esc(SITE.bio)}</textarea>
    <label for="site-story">About story (one paragraph per line)</label>
    <textarea id="site-story" rows="4">${esc((SITE.story || []).join('\n'))}</textarea>
    <label for="site-about">About details (one label | value per line)</label>
    <textarea id="site-about" rows="6">${esc((SITE.about || []).map(item => `${item.label} | ${item.value}`).join('\n'))}</textarea>
    <label for="site-quotes">Opening quotes (one per line)</label>
    <textarea id="site-quotes" rows="6">${esc((SITE.quotes || CFG.quotes).join('\n'))}</textarea>
    <label for="site-shop-intro">InkShop introduction</label>
    <textarea id="site-shop-intro" rows="2">${esc(SITE.shopIntro || '')}</textarea>
    <label for="site-shop-notice">InkShop reference notice</label>
    <textarea id="site-shop-notice" rows="3">${esc(SITE.shopNotice || '')}</textarea>
    <label for="site-order-notice">Order page note</label>
    <textarea id="site-order-notice" rows="3">${esc(SITE.orderNotice || '')}</textarea>
    <label for="site-shop-categories">InkShop categories (one per line)</label>
    <textarea id="site-shop-categories" rows="4">${esc((SITE.shopCategories || []).join('\n'))}</textarea>
    <label for="site-hero-image">Homepage featured image</label>
    <input id="site-hero-image" type="file" accept="image/*" onchange="pickSiteHero(this)">
    <div class="row">
      <img class="admin-logo-preview" id="site-hero-preview" src="${esc(heroPreview)}" alt="Homepage image preview">
      <label class="file-action">Favicon / browser bookmark logo<input id="site-favicon-file" type="file" accept="image/*" onchange="pickSiteFavicon(this)"></label>
      <img class="admin-logo-preview favicon-preview" id="site-favicon-preview" src="${SITE.favicon || ''}" alt="Favicon preview" ${SITE.favicon ? '' : 'hidden'}>
      <button class="btn o sm" type="button" onclick="clearSiteFavicon()">Use default icon</button>
    </div>
    <div class="row"><button class="btn" onclick="saveSiteSettings()">Save website settings</button></div>
  `;
}

let pendingHeroImage = '';
let pendingFavicon = null;

function pickSiteHero(input) {
  const file = input.files[0];
  if (!file) return;
  rz(file, data => {
    pendingHeroImage = data;
    $('#site-hero-preview').src = data;
  });
}

function pickSiteFavicon(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const size = Math.min(image.width, image.height);
      const context = canvas.getContext('2d');
      context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 96, 96);
      pendingFavicon = canvas.toDataURL('image/png');
      const preview = $('#site-favicon-preview');
      preview.src = pendingFavicon;
      preview.hidden = false;
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function clearSiteFavicon() {
  pendingFavicon = '';
  const preview = $('#site-favicon-preview');
  preview.removeAttribute('src');
  preview.hidden = true;
  $('#site-favicon-file').value = '';
}

async function saveSiteSettings() {
  if (!isAdm()) return;
  const value = id => $(`#${id}`).value.trim();
  const about = value('site-about').split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const splitAt = line.indexOf('|');
    return { label: splitAt < 0 ? line : line.slice(0, splitAt).trim(), value: splitAt < 0 ? '' : line.slice(splitAt + 1).trim() };
  });
  const settings = {
    siteName: value('site-name') || CFG.site,
    artist: value('site-artist') || CFG.artist,
    email: value('site-email') || CFG.email,
    insta: value('site-insta').replace(/^@/, '') || CFG.insta,
    heroCta: value('site-hero-cta'),
    navHome: value('site-nav-home'),
    navGallery: value('site-nav-gallery'),
    navAbout: value('site-nav-about'),
    navReviews: value('site-nav-reviews'),
    footerSupport: value('site-footer-support'),
    galleryHeading: value('site-gallery-heading'),
    allSketchesCta: value('site-all-sketches-cta'),
    shopHeading: value('site-shop-heading'),
    aboutHeading: value('site-about-heading'),
    contactHeading: value('site-contact-heading'),
    bio: value('site-bio'),
    story: value('site-story').split('\n').map(line => line.trim()).filter(Boolean),
    about,
    quotes: value('site-quotes').split('\n').map(line => line.trim()).filter(Boolean),
    shopIntro: value('site-shop-intro'),
    shopNotice: value('site-shop-notice'),
    orderNotice: value('site-order-notice'),
    shopCategories: [...new Set(value('site-shop-categories').split('\n').map(line => line.trim()).filter(Boolean))],
    hero: pendingHeroImage || SITE.hero,
    favicon: pendingFavicon === null ? SITE.favicon : pendingFavicon
  };
  if (settings.hero.startsWith('data:') && settings.hero.length > 900000) return toast('The homepage image is too large. Choose a smaller image.');
  try {
    await db.collection('siteSettings').doc('public').set(settings, { merge: true });
    SITE = normalizeSiteSettings(settings);
    pendingHeroImage = '';
    pendingFavicon = null;
    applyFavicon();
    if (typeof renderSharedLayout === 'function') await renderSharedLayout();
    if (typeof renderHomeContent === 'function') renderHomeContent();
    toast('Website settings saved');
    renderAdminTab('site');
  } catch (error) {
    console.error('Could not save website settings:', error);
    toast('Could not save. Publish the latest Firestore rules first.');
  }
}

function renderOrderSettingsForm() {
  if (!O.orderSettingsDraft) O.orderSettingsDraft = copyData(ORDER_SETTINGS);
  const content = $('#admin-section');
  content.innerHTML = `
    <h2>Order options &amp; prices</h2>
    <p class="mu">Set the standard starting price. Each option price is added to that amount. Negative option prices are allowed for simpler styles. Unavailable choices remain visible but cannot be selected.</p>
    <label for="order-base-price">Starting price ₹</label>
    <input id="order-base-price" type="number" min="0" step="10" value="${O.orderSettingsDraft.basePrice}">
    ${O.orderSettingsDraft.categories.map((category, categoryIndex) => `
      <section class="option-editor" data-cat-index="${categoryIndex}">
        <div class="row option-category-heading">
          <input aria-label="Category name" data-cat-label value="${esc(category.label)}">
          <button class="btn o sm" type="button" onclick="removeOrderCategory(${categoryIndex})">Delete category</button>
        </div>
        ${category.options.map((option, optionIndex) => `
          <div class="option-row" data-opt-index="${optionIndex}">
            <input aria-label="Option name" data-opt-label value="${esc(option.label)}" placeholder="Option name">
            <label>Price change ₹<input data-opt-price type="number" step="10" value="${Number(option.price) || 0}"></label>
            <label class="availability"><input data-opt-available type="checkbox" ${option.available ? 'checked' : ''}> Available</label>
            <button class="btn o sm" type="button" onclick="removeOrderOption(${categoryIndex},${optionIndex})">Delete</button>
          </div>
        `).join('')}
        <button class="btn o sm" type="button" onclick="addOrderOption(${categoryIndex})">+ Add option</button>
      </section>
    `).join('')}
    <div class="row"><button class="btn o" type="button" onclick="addOrderCategory()">+ Add category</button><button class="btn" type="button" onclick="saveOrderSettings()">Save prices &amp; options</button></div>
  `;
}

function captureOrderSettingsForm() {
  const draft = O.orderSettingsDraft;
  if (!draft || !$('#order-base-price')) return;
  draft.basePrice = Number($('#order-base-price').value) || 0;
  document.querySelectorAll('.option-editor').forEach(categoryElement => {
    const category = draft.categories[Number(categoryElement.dataset.catIndex)];
    if (!category) return;
    category.label = categoryElement.querySelector('[data-cat-label]').value.trim();
    category.options = [...categoryElement.querySelectorAll('.option-row')].map((optionElement, index) => ({
      id: category.options[index]?.id || `option-${Date.now()}-${index}`,
      label: optionElement.querySelector('[data-opt-label]').value.trim(),
      price: Number(optionElement.querySelector('[data-opt-price]').value) || 0,
      available: optionElement.querySelector('[data-opt-available]').checked
    }));
  });
}

function addOrderCategory() {
  captureOrderSettingsForm();
  O.orderSettingsDraft.categories.push({ id: `category-${Date.now()}`, label: 'New category', options: [{ id: `option-${Date.now()}`, label: 'New option', price: 0, available: true }] });
  renderOrderSettingsForm();
}

function removeOrderCategory(index) {
  captureOrderSettingsForm();
  O.orderSettingsDraft.categories.splice(index, 1);
  renderOrderSettingsForm();
}

function addOrderOption(categoryIndex) {
  captureOrderSettingsForm();
  O.orderSettingsDraft.categories[categoryIndex].options.push({ id: `option-${Date.now()}`, label: 'New option', price: 0, available: true });
  renderOrderSettingsForm();
}

function removeOrderOption(categoryIndex, optionIndex) {
  captureOrderSettingsForm();
  O.orderSettingsDraft.categories[categoryIndex].options.splice(optionIndex, 1);
  renderOrderSettingsForm();
}

async function saveOrderSettings() {
  if (!isAdm()) return;
  captureOrderSettingsForm();
  const draft = O.orderSettingsDraft;
  if (draft.basePrice < 0) return toast('Starting price cannot be negative');
  if (draft.categories.some(category => !category.label || !category.options.length || !category.options.some(option => option.available && option.label))) {
    return toast('Each category needs a name and at least one available option');
  }
  if (draft.categories.some(category => category.options.some(option => !option.label))) return toast('Every option needs a name');
  try {
    const savedSettings = normalizeOrderSettings(draft);
    await db.collection('orderSettings').doc('public').set(savedSettings);
    ORDER_SETTINGS = savedSettings;
    O.orderSettingsDraft = copyData(ORDER_SETTINGS);
    toast('Order options and prices saved. New orders use these prices.');
    renderOrderSettingsForm();
  } catch (error) {
    console.error('Could not save order settings:', error);
    toast('Could not save. Publish the latest Firestore rules first.');
  }
}

function renderShopAdmin() {
  const content = $('#admin-section');
  content.innerHTML = `
    <div class="admin-shop-heading"><div><h2>InkShop products</h2><p class="mu">Add a reference image you uploaded, its Pinterest link and the fixed price.</p></div><button class="btn" onclick="showShopProductForm()">+ Add InkShop card</button></div>
    ${adminShopItems.length ? `<div class="admin-shop-grid">${adminShopItems.map(item => `
      <article class="admin-shop-card">
        <img src="${esc(item.image || '')}" alt="">
        <div><b>${esc(item.title || 'Untitled')}</b><div class="mu">${esc(item.category || '')} · ₹${Number(item.price || 0).toLocaleString('en-IN')} · ${item.active === false ? 'Hidden' : 'Published'}</div></div>
        <div class="row"><button class="btn o sm" onclick="showShopProductForm('${item.id}')">Edit</button><button class="btn o sm" onclick="deleteShopProduct('${item.id}')">Delete</button></div>
      </article>
    `).join('')}</div>` : '<p class="mu">No InkShop cards yet.</p>'}
  `;
}

function showShopProductForm(id = '') {
  const product = adminShopItems.find(item => item.id === id) || {};
  const categories = [...new Set([...(SITE.shopCategories || []), product.category].filter(Boolean))];
  O.shopPhoto = product.image || '';
  show(`
    <h2>${id ? 'Edit' : 'Add'} InkShop card</h2>
    <label for="shop-title">Name</label><input id="shop-title" maxlength="80" value="${esc(product.title || '')}">
    <label for="shop-category">Category</label><select id="shop-category">${categories.map(category => `<option ${product.category === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}</select>
    <label for="shop-description">Description</label><textarea id="shop-description" rows="3" maxlength="500">${esc(product.description || '')}</textarea>
    <label for="shop-price">Price ₹</label><input id="shop-price" type="number" min="1" step="10" value="${Number(product.price) || ''}">
    <label for="shop-pinterest">Exact Pinterest URL</label><input id="shop-pinterest" type="url" value="${esc(product.pinterestUrl || '')}" placeholder="https://www.pinterest.com/pin/...">
    <label for="shop-image">Reference image (upload a copy you may display)</label><input id="shop-image" type="file" accept="image/*" onchange="pickShopImage(this)">
    <img class="pre" id="shop-image-preview" src="${esc(product.image || '')}" alt="Image preview" ${product.image ? '' : 'hidden'}>
    <label class="availability"><input id="shop-active" type="checkbox" ${product.active === false ? '' : 'checked'}> Show this card in InkShop</label>
    <div class="row"><button class="btn" onclick="saveShopProduct('${id}')">Save card</button><button class="btn o" onclick="hide()">Cancel</button></div>
  `);
}

function pickShopImage(input) {
  if (!input.files[0]) return;
  rz(input.files[0], data => {
    O.shopPhoto = data;
    $('#shop-image-preview').src = data;
    $('#shop-image-preview').hidden = false;
  });
}

async function saveShopProduct(id) {
  if (!isAdm()) return;
  const title = $('#shop-title').value.trim();
  const price = Number($('#shop-price').value);
  const pinterestUrl = $('#shop-pinterest').value.trim();
  if (!title || !price || price < 1) return toast('Enter a title and a price greater than zero');
  if (!O.shopPhoto) return toast('Upload a reference image');
  if (pinterestUrl) {
    try {
      const hostname = new URL(pinterestUrl).hostname.toLowerCase();
      if (new URL(pinterestUrl).protocol !== 'https:' || !(hostname === 'pin.it' || hostname === 'pinterest.com' || hostname.endsWith('.pinterest.com'))) {
        return toast('Enter the exact HTTPS Pinterest URL');
      }
    } catch {
      return toast('Enter a valid Pinterest URL');
    }
  }
  const data = {
    title,
    category: $('#shop-category').value,
    description: $('#shop-description').value.trim(),
    price,
    image: O.shopPhoto,
    pinterestUrl,
    active: $('#shop-active').checked,
    updatedAt: TS()
  };
  if (data.image.length > 900000) return toast('Choose a smaller image for Firebase');
  try {
    const ref = id ? db.collection('shopProducts').doc(id) : db.collection('shopProducts').doc();
    if (!id) data.createdAt = TS();
    await ref.set(data, { merge: true });
    await loadAdminShopItems();
    hide();
    if ($('#admin-section')) renderShopAdmin();
    else if ($('#shop-list')) await loadShop();
    toast('InkShop card saved');
  } catch (error) {
    console.error('Could not save InkShop product:', error);
    toast('Could not save. Publish the latest Firestore rules first.');
  }
}

async function deleteShopProduct(id) {
  if (!isAdm() || !confirm('Delete this InkShop card?')) return;
  try {
    await db.collection('shopProducts').doc(id).delete();
    adminShopItems = adminShopItems.filter(item => item.id !== id);
    if ($('#admin-section')) renderShopAdmin();
    else if ($('#shop-list')) await loadShop();
    toast('InkShop card deleted');
  } catch (error) {
    console.error('Could not delete InkShop product:', error);
    toast('Could not delete this card');
  }
}
