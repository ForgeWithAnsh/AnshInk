/* Sketch catalogue and artist-only sketch management. */
const CATS = {
  home: 'Homepage picks',
  human: 'Human sketches',
  other: 'Other sketches'
};

const box = $('#list');
let items = [];
let tab = 'human';
let isLoading = true;
let sketchReviews = {};

function reviewsForSketch(item) {
  return [
    ...(sketchReviews[item.id] || []),
    ...(item.legacyId ? sketchReviews[item.legacyId] || [] : [])
  ];
}

function sketchRatingSummary(item) {
  const reviews = reviewsForSketch(item);
  if (!reviews.length) return '<span class="mu">No ratings yet</span>';
  const average = reviews.reduce((sum, review) => sum + Number(review.s || 0), 0) / reviews.length;
  return `<span class="st">${stars(average)}</span> <span class="mu">${average.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? '' : 's'}</span>`;
}

async function loadSketchReviews() {
  try {
    const snapshot = await db.collection('reviews').get();
    sketchReviews = {};
    snapshot.forEach(document => {
      const review = { ...document.data(), id: document.id };
      (sketchReviews[review.sk] ||= []).push(review);
    });
    Object.values(sketchReviews).forEach(reviews => reviews.sort((a, b) => a.t - b.t));
    if (!isLoading) render();
  } catch (error) {
    console.error('Could not load sketch reviews:', error);
  }
}

function compareByOrder(first, second, field) {
  const firstOrder = Number.isFinite(first[field]) ? first[field] : null;
  const secondOrder = Number.isFinite(second[field]) ? second[field] : null;
  if (firstOrder !== null && secondOrder !== null) return firstOrder - secondOrder;
  if (firstOrder !== null) return -1;
  if (secondOrder !== null) return 1;
  return (second.createdAt || 0) - (first.createdAt || 0);
}

function visibleSketches() {
  const selected = tab === 'home'
    ? items.filter(item => item.featured)
    : items.filter(item => item.category === tab);
  const orderField = tab === 'home' ? 'homeOrder' : 'displayOrder';
  return selected.slice().sort((first, second) => compareByOrder(first, second, orderField));
}

function renderSketchCardPrice(item) {
  const { size, price: amount } = cardPaperPrice(item);
  if (!size) return '';
  return `<div class="sketch-card-price">${esc(size.label)} · ₹${amount.toLocaleString('en-IN')}</div>`;
}

box.innerHTML = '<div class="shead"><h1>All sketches</h1></div><p class="mu">Loading sketches…</p>';

function photoUrl(photo) {
  if (!photo) return '';
  return /^(data:|https?:\/\/)/.test(photo) ? photo : BASE + photo;
}

async function load() {
  isLoading = true;
  box.innerHTML = '<div class="shead"><h1>All sketches</h1></div><p class="mu">Loading sketches…</p>';

  try {
    const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
    items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        legacyId: data.legacyId || legacySketchIdForTitle(data.title),
        featured: data.featured === true,
        photos: (data.photos || [data.photo]).filter(Boolean),
        builtIn: false
      };
    }).filter(item => item.photos.length > 0);
    isLoading = false;
    render();
  } catch (error) {
    isLoading = false;
    console.error('Could not load gallery:', error);
    box.innerHTML = '<div class="shead"><h1>All sketches</h1></div><p class="mu">Could not load sketches. Please refresh the page.</p>';
  }
}

function render() {
  if (isLoading) {
    box.innerHTML = '<div class="shead"><h1>All sketches</h1></div><p class="mu">Loading sketches…</p>';
    return;
  }
  const tabs = isAdm() ? CATS : { human: CATS.human, other: CATS.other };
  if (!(tab in tabs)) tab = 'human';
  const count = category => category === 'home'
    ? items.filter(item => item.featured).length
    : items.filter(item => item.category === category).length;
  const visibleItems = visibleSketches();

  disposeCategoryStrip(box.querySelector('.category-strip'));
  box.innerHTML = `
    <div class="shead"><h1>All sketches</h1></div>
    <div class="category-strip">
      <div class="tabs2 category-track">
        ${Object.entries(tabs).map(([key, label]) => `
          <button class="tab2 ${tab === key ? 'on' : ''}" onclick="tab='${key}';render()">
            ${label} <span>${count(key)}</span>
          </button>
        `).join('')}
      </div>
      <span class="category-fade category-fade-left" aria-hidden="true"></span>
      <span class="category-fade category-fade-right" aria-hidden="true"></span>
    </div>
    ${isAdm() ? '<div class="abar"><button class="btn cta" onclick="addForm()">+ Add a sketch</button></div>' : ''}
    ${visibleItems.length ? `
      <div class="sgrid">
        ${visibleItems.map(item => `
          <article class="scard" onclick="openS('${item.id}')">
            <img src="${photoUrl(item.photos[0])}" alt="${esc(item.title)}" loading="lazy">
            ${isAdm() ? `
              <div class="sketch-reorder" onclick="event.stopPropagation()">
                <button type="button" aria-label="Move up" title="Move up"
                  onclick="moveSketch('${item.id}',-1)">↑</button>
                <button type="button" aria-label="Move down" title="Move down"
                  onclick="moveSketch('${item.id}',1)">↓</button>
              </div>
            ` : ''}
            ${isAdm() ? `
              <button class="x" onclick="event.stopPropagation();delS('${item.id}')">Remove</button>
              <button class="feature-toggle ${item.featured ? 'is-featured' : ''}"
                onclick="event.stopPropagation();toggleFeatured('${item.id}',${!item.featured})">
                ${item.featured ? '★ On home' : '☆ Feature on home'}
              </button>
            ` : ''}
            <div class="t">${esc(item.title)}</div>
            ${renderSketchCardPrice(item)}
            <div class="sketch-card-rating">${sketchRatingSummary(item)}</div>
            <div class="row sketch-card-buttons">
              ${isAdm() ? `<button class="btn o sm" onclick="event.stopPropagation();editSketchPreset('${item.id}')">Edit sketch</button>` : ''}
              <button class="btn o sm sketch-review-button" onclick="event.stopPropagation();openSketchReviews('${item.id}')">Reviews &amp; rate</button>
            </div>
          </article>
        `).join('')}
      </div>
    ` : '<div class="none">No sketches here yet.</div>'}
  `;
  initCategoryStrip(box.querySelector('.category-strip'));
}

onUser(() => render());
load();
loadSketchReviews();

async function moveSketch(id, direction) {
  if (!isAdm()) return;

  const ordered = visibleSketches();
  const index = ordered.findIndex(item => item.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return;

  const [moved] = ordered.splice(index, 1);
  ordered.splice(nextIndex, 0, moved);
  const orderField = tab === 'home' ? 'homeOrder' : 'displayOrder';

  try {
    const batch = db.batch();
    ordered.forEach((item, position) => {
      batch.update(db.collection('gallery').doc(item.id), { [orderField]: position });
    });
    await batch.commit();
    items.forEach(item => {
      const position = ordered.findIndex(orderedItem => orderedItem.id === item.id);
      if (position >= 0) item[orderField] = position;
    });
    render();
  } catch (error) {
    console.error('Could not reorder sketches:', error);
    toast('Could not save the new order. Confirm the latest Firestore rules are published.');
  }
}

function openS(id) {
  const item = items.find(sketch => sketch.id === id);
  if (!item) return;

  show(`
    <h2>${esc(item.title)}</h2>
    <img class="sbig" id="sbig" src="${photoUrl(item.photos[0])}" alt="${esc(item.title)}">
    ${item.photos.length > 1 ? `
      <div class="sth">
        ${item.photos.map((photo, index) => `
          <img src="${photoUrl(photo)}" class="${index ? '' : 'on'}" onclick="selectSketchPhoto(this)" alt="">
        `).join('')}
      </div>
    ` : ''}
    <p class="mu">${esc(item.description || '')}</p>
    <div class="sketch-detail-rating">${sketchRatingSummary(item)}</div>
    <div class="row">
      <a class="btn cta" href="${PG('order')}?sketch=${encodeURIComponent(item.id)}">Order like this</a>
      ${isAdm() ? `<button class="btn o" onclick="editSketchPreset('${item.id}')">Edit sketch &amp; size prices</button>` : ''}
      <button class="btn o" onclick="openSketchReviews('${item.id}')">Reviews &amp; rate</button>
      <button class="btn o" onclick="hide()">Close</button>
    </div>
  `);
}

function editSketchPreset(id) {
  if (!isAdm()) return;
  const item = items.find(sketch => sketch.id === id);
  if (!item) return;
  const prices = paperSizePrices(item);
  const displayedSize = cardPaperSize(item);
  O.sketchEditPhotos = null;
  show(`
    <h2>Edit sketch · ${esc(item.title)}</h2>
    <p class="mu">Customers ordering this sketch can choose only the paper size. Set the price for each size and choose which size price appears on its card.</p>
    <label for="sketch-edit-title">Sketch title</label>
    <input id="sketch-edit-title" maxlength="60" value="${esc(item.title)}">
    <label for="sketch-edit-description">Sketch description</label>
    <textarea id="sketch-edit-description" rows="2" maxlength="120">${esc(item.description || '')}</textarea>
    <label for="sketch-edit-category">Gallery category</label>
    <select id="sketch-edit-category"><option value="human" ${item.category === 'human' ? 'selected' : ''}>Human sketches</option><option value="other" ${item.category === 'other' ? 'selected' : ''}>Other sketches</option></select>
    <label for="sketch-edit-photos">Replace gallery photos (up to 4)</label>
    <input id="sketch-edit-photos" type="file" accept="image/*" multiple onchange="pickSketchPresetPhotos(this)">
    <div id="sketch-edit-photo-preview" class="sth">${item.photos.map(photo => `<img src="${photoUrl(photo)}" alt="Current sketch image">`).join('')}</div>
    ${paperSizeOptions().map(option => `
      <label for="sketch-size-price-${esc(option.id)}">${esc(option.label)} price ₹</label>
      <input id="sketch-size-price-${esc(option.id)}" data-sketch-size-price="${esc(option.id)}" type="number" min="1" step="10" value="${Number(prices[option.id] || 0)}">
    `).join('')}
    <label for="sketch-card-price-size">Show this size price on the sketch card</label>
    <select id="sketch-card-price-size">${paperSizeOptions().map(option => `<option value="${esc(option.id)}" ${displayedSize?.id === option.id ? 'selected' : ''} ${option.available ? '' : 'disabled'}>${esc(option.label)}${option.available ? '' : ' — Unavailable'}</option>`).join('')}</select>
    <div class="row"><button class="btn" onclick="saveSketchPreset('${id}')">Save</button><button class="btn o" onclick="openS('${id}')">Cancel</button></div>
  `);
}

function pickSketchPresetPhotos(input) {
  const files = Array.from(input.files).slice(0, 4);
  if (!files.length) return;
  Promise.all(files.map(file => new Promise(resolve => rz(file, resolve)))).then(photos => {
    if (photos.reduce((sum, photo) => sum + photo.length, 0) > 900000) {
      O.sketchEditPhotos = null;
      input.value = '';
      return toast('These photos are too large together. Choose fewer or smaller photos.');
    }
    O.sketchEditPhotos = photos;
    $('#sketch-edit-photo-preview').innerHTML = photos.map(photo => `<img src="${photo}" alt="New sketch image preview">`).join('');
  });
}

async function saveSketchPreset(id) {
  if (!isAdm()) return;
  const item = items.find(sketch => sketch.id === id);
  const title = $('#sketch-edit-title').value.trim();
  const description = $('#sketch-edit-description').value.trim();
  const category = $('#sketch-edit-category').value;
  const sizePrices = Object.fromEntries(paperSizeOptions().map(option => [
    option.id,
    Number($(`[data-sketch-size-price="${CSS.escape(option.id)}"]`).value)
  ]));
  const cardPriceSize = $('#sketch-card-price-size').value;
  if (!title) return toast('Enter a sketch title');
  if (Object.values(sizePrices).some(amount => !Number.isFinite(amount) || amount < 1)) return toast('Enter a price of at least ₹1 for every paper size');
  if (!cardPriceSize) return toast('Choose which paper size price to show on the card');
  try {
    const changes = { title, description, category, sizePrices, cardPriceSize };
    if (O.sketchEditPhotos) changes.photos = O.sketchEditPhotos;
    await db.collection('gallery').doc(id).update(changes);
    item.title = title;
    item.description = description;
    item.category = category;
    if (O.sketchEditPhotos) item.photos = O.sketchEditPhotos;
    item.sizePrices = sizePrices;
    item.cardPriceSize = cardPriceSize;
    hide();
    render();
    toast('Sketch details and paper-size prices saved');
  } catch (error) {
    console.error('Could not save sketch order preset:', error);
    toast('Could not save order details');
  }
}

function openSketchReviews(id) {
  const item = items.find(sketch => sketch.id === id);
  if (!item) return;
  const reviews = reviewsForSketch(item);
  O.sketchReviewRating = 5;

  show(`
    <h2>${esc(item.title)} · Reviews</h2>
    <div class="sketch-detail-rating">${sketchRatingSummary(item)}</div>
    <div class="sketch-reviews-list">
      ${reviews.length ? reviews.slice().reverse().map(review => `
        <article class="sketch-review">
          <b>${esc(review.n || 'Customer')}</b>
          <div class="st">${stars(review.s)}</div>
          <p>${esc(review.x || '')}</p>
          ${sketchReviewActions(review, id)}
        </article>
      `).join('') : '<p class="mu">Be the first to review this sketch.</p>'}
    </div>
    <label>Your rating</label>
    <div class="st rating-input" id="sketch-rs">
      ${[1, 2, 3, 4, 5].map(value => `<span onclick="setSketchReviewRating(${value})">★</span>`).join('')}
    </div>
    <label for="sketch-rx">Your review</label>
    <textarea id="sketch-rx" rows="3" maxlength="500" placeholder="Share what you think about this sketch"></textarea>
    <div class="row review-actions">
      <button class="btn" onclick="postSketchReview('${id}')">Post review</button>
      <button class="btn o" onclick="openS('${id}')">Back to sketch</button>
    </div>
  `);
  setSketchReviewRating(5);
}

function sketchReviewActions(review, sketchId) {
  const isOwner = me && review.uid === me.id;
  if (!isOwner && !isAdm()) return '';
  const canEdit = isOwner && Date.now() - review.t <= 15 * 60 * 1000;
  return `<div class="row review-actions">
    ${canEdit ? `<button class="btn o sm" onclick="editSketchReview('${review.id}','${sketchId}')">Edit</button>` : ''}
    <button class="btn o sm" onclick="deleteSketchReview('${review.id}','${sketchId}')">Delete</button>
  </div>`;
}

function setSketchReviewRating(value) {
  O.sketchReviewRating = value;
  const picker = $('#sketch-rs');
  if (picker) [...picker.children].forEach((star, index) => { star.style.opacity = index < value ? 1 : 0.25; });
}

async function postSketchReview(id) {
  if (!me) return login(() => openSketchReviews(id));
  const reviewText = $('#sketch-rx').value.trim();
  if (!reviewText) return toast('Write a few words first');
  try {
    await db.collection('reviews').add({ sk: id, uid: me.id, n: me.name || 'Customer', s: O.sketchReviewRating || 5, x: reviewText, t: TS() });
    await loadSketchReviews();
    openSketchReviews(id);
    toast('Thanks for your review!');
  } catch (error) {
    console.error('Could not post review:', error);
    toast('Could not post review. Please sign in and try again.');
  }
}

function editSketchReview(reviewId, sketchId) {
  const review = Object.values(sketchReviews).flat().find(item => item.id === reviewId);
  if (!review || !me || review.uid !== me.id || Date.now() - review.t > 15 * 60 * 1000) {
    return toast('Reviews can only be edited by their author for 15 minutes after posting');
  }
  show(`<h2>Edit your review</h2>
    <label for="edit-sketch-rating">Rating</label>
    <select id="edit-sketch-rating">${[5, 4, 3, 2, 1].map(value => `<option value="${value}" ${review.s === value ? 'selected' : ''}>${value} star${value === 1 ? '' : 's'}</option>`).join('')}</select>
    <label for="edit-sketch-text">Review</label>
    <textarea id="edit-sketch-text" rows="4" maxlength="500">${esc(review.x)}</textarea>
    <div class="row review-actions"><button class="btn" onclick="saveSketchReview('${reviewId}','${sketchId}')">Save changes</button><button class="btn o" onclick="openSketchReviews('${sketchId}')">Cancel</button></div>`);
}

async function saveSketchReview(reviewId, sketchId) {
  const text = $('#edit-sketch-text').value.trim();
  if (!text) return toast('Write a few words first');
  try {
    await db.collection('reviews').doc(reviewId).update({ s: Number($('#edit-sketch-rating').value), x: text });
    await loadSketchReviews();
    openSketchReviews(sketchId);
    toast('Review updated');
  } catch (error) {
    console.error('Could not update review:', error);
    toast('Could not update review. The 15-minute edit window may have ended.');
  }
}

async function deleteSketchReview(reviewId, sketchId) {
  if (!confirm('Delete this review?')) return;
  try {
    await db.collection('reviews').doc(reviewId).delete();
    await loadSketchReviews();
    openSketchReviews(sketchId);
    toast('Review deleted');
  } catch (error) {
    console.error('Could not delete review:', error);
    toast('Could not delete review');
  }
}

function selectSketchPhoto(thumbnail) {
  $('#sbig').src = thumbnail.src;
  document.querySelectorAll('.sth img').forEach(image => image.classList.remove('on'));
  thumbnail.classList.add('on');
}

/* Artist-only upload and removal. */
function addForm() {
  if (!isAdm()) return;
  O.np = [];
  const initialPrices = suggestedPaperSizePrices();
  const defaultCardSize = defaultCardPaperSize();

  const legacyOptions = Object.entries(LEGACY_SKETCHES).map(([id, title]) =>
    `<option value="${id}">${esc(title)}</option>`
  ).join('');

  show(`
    <h2>Add a sketch</h2>
    <label for="st">Title</label>
    <input id="st" maxlength="60">
    <label for="sc">Category</label>
    <select id="sc">
      <option value="human">Human sketches</option>
      <option value="other">Other sketches</option>
    </select>
    <label for="sd">Short description (optional)</label>
    <input id="sd" maxlength="120" placeholder="e.g. Charcoal pencil on paper">
    <label class="feature-choice"><input id="sf-home" type="checkbox"> Show this sketch on the home page</label>
    ${paperSizeOptions().map(option => `
      <label for="new-sketch-size-price-${esc(option.id)}">${esc(option.label)} price ₹</label>
      <input id="new-sketch-size-price-${esc(option.id)}" data-new-sketch-size-price="${esc(option.id)}" type="number" min="1" step="10" value="${Number(initialPrices[option.id] || 0) || ''}">
    `).join('')}
    <label for="new-sketch-card-price-size">Show this size price on the sketch card</label>
    <select id="new-sketch-card-price-size">${paperSizeOptions().map(option => `<option value="${esc(option.id)}" ${defaultCardSize?.id === option.id ? 'selected' : ''} ${option.available ? '' : 'disabled'}>${esc(option.label)}${option.available ? '' : ' — Unavailable'}</option>`).join('')}</select>
    <label for="sl">Link any existing reviews (optional)</label>
    <select id="sl">
      <option value="">This is a new sketch</option>
      ${legacyOptions}
    </select>
    <label for="sf">Sketch photos (select up to 4)</label>
    <input id="sf" type="file" accept="image/*" multiple onchange="pickS(this)">
    <div id="sp"></div>
    <div class="row form-actions">
      <button class="btn" onclick="saveS()">Save sketch</button>
      <button class="btn o" onclick="hide()">Cancel</button>
    </div>
  `);
}

function pickS(input) {
  const files = Array.from(input.files).slice(0, 4);
  if (!files.length) return;
  if (input.files.length > 4) toast('Choose up to 4 photos');
  O.np = [];

  Promise.all(files.map(file => new Promise(resolve => rz(file, resolve))))
    .then(photos => {
      const totalSize = photos.reduce((sum, photo) => sum + photo.length, 0);
      if (totalSize > 900000) {
        O.np = [];
        $('#sp').textContent = 'These photos are too large together for Firebase. Choose fewer or smaller photos.';
        input.value = '';
        return;
      }

      O.np = photos;
      $('#sp').innerHTML = photos.map((photo, index) =>
        `<img class="pre sketch-preview" src="${photo}" alt="Sketch photo ${index + 1} preview">`
      ).join('');
    });
}

async function saveS() {
  if (!isAdm()) return;

  const title = $('#st').value.trim();
  if (!title) return toast('Enter a title');
  if (!O.np.length) return toast('Choose at least one photo');
  const sizePrices = Object.fromEntries(paperSizeOptions().map(option => [
    option.id,
    Number($(`[data-new-sketch-size-price="${CSS.escape(option.id)}"]`).value)
  ]));
  const cardPriceSize = $('#new-sketch-card-price-size').value;
  if (Object.values(sizePrices).some(amount => !Number.isFinite(amount) || amount < 1)) return toast('Enter a price of at least ₹1 for every paper size');
  if (!cardPriceSize) return toast('Choose which paper size price to show on the card');

  const button = document.querySelector('.form-actions .btn');
  button.disabled = true;

  try {
    await db.collection('gallery').add({
      title,
      category: $('#sc').value,
      description: $('#sd').value.trim(),
      photos: O.np,
      sizePrices,
      cardPriceSize,
      featured: $('#sf-home').checked,
      displayOrder: items.filter(item => item.category === $('#sc').value)
        .reduce((highest, item) => Math.max(highest, Number.isFinite(item.displayOrder) ? item.displayOrder : -1), -1) + 1,
      ...( $('#sf-home').checked ? {
        homeOrder: items.filter(item => item.featured)
          .reduce((highest, item) => Math.max(highest, Number.isFinite(item.homeOrder) ? item.homeOrder : -1), -1) + 1
      } : {}),
      legacyId: $('#sl').value || null,
      createdAt: TS()
    });
    hide();
    toast('Sketch added');
    await load();
  } catch (error) {
    console.error('Could not save sketch:', error);
    button.disabled = false;
    toast('Could not save. Check the photo size and publish the gallery rules in firestore.rules.', 6500);
  }
}

async function toggleFeatured(id, featured) {
  if (!isAdm()) return;

  try {
    await db.collection('gallery').doc(id).update({ featured });
    const item = items.find(sketch => sketch.id === id);
    if (item) item.featured = featured;
    render();
    toast(featured ? 'Added to the home page' : 'Removed from the home page');
  } catch (error) {
    console.error('Could not update home page selection:', error);
    toast('Could not update this sketch');
  }
}

async function delS(id) {
  if (!isAdm() || !confirm('Remove this sketch from the website?')) return;

  try {
    await db.collection('gallery').doc(id).delete();
    toast('Sketch removed');
    await load();
  } catch (error) {
    console.error('Could not remove sketch:', error);
    toast('Could not remove this sketch');
  }
}
