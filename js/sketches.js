/* Sketch catalogue and artist-only sketch management. */
const CATS = {
  human: 'Human sketches',
  other: 'Other sketches'
};

const box = $('#list');
let items = [];
let tab = 'human';
let isLoading = true;

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
  const count = category => items.filter(item => item.category === category).length;
  const visibleItems = items.filter(item => item.category === tab);

  box.innerHTML = `
    <div class="shead"><h1>All sketches</h1></div>
    <div class="tabs2">
      ${Object.entries(CATS).map(([key, label]) => `
        <button class="tab2 ${tab === key ? 'on' : ''}" onclick="tab='${key}';render()">
          ${label} <span>${count(key)}</span>
        </button>
      `).join('')}
    </div>
    ${isAdm() ? '<div class="abar"><button class="btn cta" onclick="addForm()">+ Add a sketch</button></div>' : ''}
    ${visibleItems.length ? `
      <div class="sgrid">
        ${visibleItems.map(item => `
          <article class="scard" onclick="openS('${item.id}')">
            <img src="${photoUrl(item.photos[0])}" alt="${esc(item.title)}" loading="lazy">
            ${isAdm() ? `
              <button class="x" onclick="event.stopPropagation();delS('${item.id}')">Remove</button>
              <button class="feature-toggle ${item.featured ? 'is-featured' : ''}"
                onclick="event.stopPropagation();toggleFeatured('${item.id}',${!item.featured})">
                ${item.featured ? '★ On home' : '☆ Feature on home'}
              </button>
            ` : ''}
            <div class="t">${esc(item.title)}</div>
          </article>
        `).join('')}
      </div>
    ` : '<div class="none">No sketches here yet.</div>'}
  `;
}

onUser(() => render());
load();

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
    <div class="row">
      <a class="btn cta" href="${PG('order')}">Order like this</a>
      <button class="btn o" onclick="hide()">Close</button>
    </div>
  `);
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

  const button = document.querySelector('.form-actions .btn');
  button.disabled = true;

  try {
    await db.collection('gallery').add({
      title,
      category: $('#sc').value,
      description: $('#sd').value.trim(),
      photos: O.np,
      featured: $('#sf-home').checked,
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
