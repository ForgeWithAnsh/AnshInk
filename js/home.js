/* Home page content, gallery, review dialog, and quote entrance. */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

let reviewsBySketch = {};
let sketches = [];

function chooseQuote() {
  const storageKey = 'anshink-last-quote';
  let previousIndex = -1;

  try {
    previousIndex = Number(localStorage.getItem(storageKey));
  } catch (error) {
    // Local storage may be unavailable in private browsing modes.
  }

  let index = Math.floor(Math.random() * CFG.quotes.length);
  if (CFG.quotes.length > 1 && index === previousIndex) {
    index = (index + 1 + Math.floor(Math.random() * (CFG.quotes.length - 1))) % CFG.quotes.length;
  }

  try {
    localStorage.setItem(storageKey, String(index));
  } catch (error) {
    // The quote still works when it cannot be remembered.
  }

  return CFG.quotes[index];
}

$('#sq').textContent = `“${chooseQuote()}”`;
$('#hi').src = BASE + CFG.hero;
$('#hn').textContent = CFG.artist;
$('#hb').textContent = CFG.bio;

const today = new Date();
const birthDate = new Date(2008, 4, 11);
let age = today.getFullYear() - birthDate.getFullYear();
if (today.getMonth() < birthDate.getMonth()
  || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
  age--;
}

$('#about').innerHTML = `
  ${CFG.story.map(paragraph => `<p>${esc(paragraph)}</p>`).join('')}
  <ul class="det">
    ${CFG.about.map(([label, value]) => `
      <li><b>${label}:</b> ${esc(label === 'Age / City' ? `${age} · ${value}` : value)}</li>
    `).join('')}
  </ul>
  <p>
    <b>Questions or custom requests?</b><br>
    Email <a href="mailto:${CFG.email}">${CFG.email}</a> or DM
    <a href="https://instagram.com/${CFG.insta}" target="_blank" rel="noopener">@${CFG.insta}</a>
    on Instagram.
  </p>
`;

/* Start scroll reveals after the quote screen closes. */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add('in');
    revealObserver.unobserve(entry.target);
    setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1400);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -12% 0px' });

function reveal() {
  document.querySelectorAll('.rv:not(.in)').forEach((element, index) => {
    element.style.transitionDelay = `${(index % 3) * 100}ms`;
    revealObserver.observe(element);
  });
}

function go() {
  if (O.go) return;

  O.go = true;
  document.body.classList.add('go');
  reveal();

  if (location.hash) {
    setTimeout(() => goTo(location.hash.slice(1)), 700);
  }
}

function photoUrl(photo) {
  return /^(data:|https?:\/\/)/.test(photo || '') ? photo : BASE + (photo || '');
}

function reviewsFor(sketch) {
  const currentReviews = reviewsBySketch[sketch.id] || [];
  const previousReviews = sketch.legacyId ? reviewsBySketch[sketch.legacyId] || [] : [];
  return [...currentReviews, ...previousReviews];
}

async function loadGallery() {
  const grid = $('#grid');
  grid.innerHTML = '<p class="mu gallery-loading">Loading sketches…</p>';

  try {
    const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
    sketches = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        featured: data.featured === true,
        homeOrder: data.homeOrder,
        createdAt: data.createdAt || 0,
        legacyId: data.legacyId || legacySketchIdForTitle(data.title),
        title: data.title || 'Sketch',
        description: data.description || '',
        photos: (data.photos || [data.photo]).filter(Boolean)
      };
    }).filter(sketch => sketch.photos.length > 0 && sketch.featured)
      .sort((first, second) => {
        const firstOrder = Number.isFinite(first.homeOrder) ? first.homeOrder : null;
        const secondOrder = Number.isFinite(second.homeOrder) ? second.homeOrder : null;
        if (firstOrder !== null && secondOrder !== null) return firstOrder - secondOrder;
        if (firstOrder !== null) return -1;
        if (secondOrder !== null) return 1;
        return second.createdAt - first.createdAt;
      });

    if (!sketches.length) {
      grid.innerHTML = '<p class="mu gallery-empty">Selected sketches will appear here soon.</p>';
      return;
    }

    grid.innerHTML = sketches.map(sketch => `
      <article class="card rv">
        <img class="main" src="${photoUrl(sketch.photos[0])}" alt="${esc(sketch.title)}" loading="lazy">
        ${sketch.photos.length > 1 ? `
          <div class="th">
            ${sketch.photos.map((photo, index) => `
              <img
                src="${photoUrl(photo)}"
                class="${index ? '' : 'on'}"
                onclick="selectHomePhoto(this)"
                alt=""
              >
            `).join('')}
          </div>
        ` : ''}
        <div class="cb">
          <h3>${esc(sketch.title)}</h3>
          <div class="mu">${esc(sketch.description)}</div>
          <div class="row card-rating">
            <span class="st" id="st-${sketch.id}"></span>
            <span class="mu" id="rc-${sketch.id}"></span>
          </div>
          <div class="row">
            <button class="btn o sm" onclick="openRev('${sketch.id}')">Reviews &amp; rate</button>
            <a class="btn sm" href="${PG('order')}">Order like this</a>
          </div>
        </div>
      </article>
    `).join('');

    ratings();
    reveal();
  } catch (error) {
    console.error('Could not load gallery:', error);
    grid.innerHTML = '<p class="mu gallery-empty">Could not load sketches right now.</p>';
  }
}

function selectHomePhoto(thumbnail) {
  thumbnail.closest('.card').querySelector('.main').src = thumbnail.src;
  thumbnail.parentNode.querySelectorAll('img').forEach(image => image.classList.remove('on'));
  thumbnail.classList.add('on');
}

onUser(() => {
  $('#home-gallery-admin').hidden = !isAdm();
});

/* Gallery review ratings and review form. */
function averageRating(sketch) {
  const reviews = reviewsFor(sketch);
  if (!reviews.length) return 0;
  return reviews.reduce((total, review) => total + review.s, 0) / reviews.length;
}

function ratings() {
  sketches.forEach(sketch => {
    const reviews = reviewsFor(sketch);
    const average = averageRating(sketch);
    $(`#st-${sketch.id}`).textContent = stars(average);
    $(`#rc-${sketch.id}`).textContent = reviews.length
      ? `${average.toFixed(1)} (${reviews.length})`
      : 'No ratings yet';
  });
}

async function loadReviews() {
  try {
    const snapshot = await db.collection('reviews').get();
    reviewsBySketch = {};

    snapshot.forEach(document => {
      const review = document.data();
      review.id = document.id;
      (reviewsBySketch[review.sk] ||= []).push(review);
    });

    Object.values(reviewsBySketch).forEach(reviews => {
      reviews.sort((first, second) => first.t - second.t);
    });
  } catch (error) {
    console.error('Could not load sketch reviews:', error);
  }

  ratings();
}

function openRev(id) {
  const sketch = sketches.find(item => item.id === id);
  if (!sketch) return;

  const reviews = reviewsFor(sketch);
  O.rs = 5;

  show(`
    <h2>${esc(sketch.title)}</h2>
    <div class="st">${stars(averageRating(sketch))}</div>
    <div>
      ${reviews.length ? reviews.slice().reverse().map(review => `
        <div class="rev">
          <b>${esc(review.n)}</b>
          <span class="st">${stars(review.s)}</span>
          <div>${esc(review.x)}</div>
          ${reviewActions(review, id)}
        </div>
      `).join('') : '<p class="mu">Be the first to review.</p>'}
    </div>
    <label>Your rating</label>
    <div class="st rating-input" id="rs">
      ${[1, 2, 3, 4, 5].map(value => `<span onclick="setR(${value})">★</span>`).join('')}
    </div>
    <label for="rx">Your opinion</label>
    <textarea id="rx" rows="3" maxlength="500"></textarea>
    <div class="row review-actions">
      <button class="btn" onclick="postRev('${id}')">Post</button>
      <button class="btn o" onclick="hide()">Close</button>
    </div>
  `);

  setR(5);
}

function reviewActions(review, sketchId) {
  const ownReview = me && review.uid === me.id;
  if (!ownReview && !isAdm()) return '';

  const canEdit = ownReview && Date.now() - review.t <= 15 * 60 * 1000;
  return `
    <div class="row review-actions">
      ${canEdit ? `<button class="btn o sm" onclick="editHomeReview('${review.id}','${sketchId}')">Edit</button>` : ''}
      <button class="btn o sm" onclick="deleteHomeReview('${review.id}','${sketchId}')">Delete</button>
    </div>
  `;
}

function editHomeReview(reviewId, sketchId) {
  const review = Object.values(reviewsBySketch).flat().find(item => item.id === reviewId);
  if (!review || !me || review.uid !== me.id || Date.now() - review.t > 15 * 60 * 1000) {
    return toast('Reviews can only be edited by their author for 15 minutes after posting');
  }

  show(`
    <h2>Edit your review</h2>
    <label for="edit-review-rating">Rating</label>
    <select id="edit-review-rating">
      ${[5, 4, 3, 2, 1].map(value => `<option value="${value}" ${review.s === value ? 'selected' : ''}>${value} star${value === 1 ? '' : 's'}</option>`).join('')}
    </select>
    <label for="edit-review-text">Review</label>
    <textarea id="edit-review-text" rows="4" maxlength="500">${esc(review.x)}</textarea>
    <div class="row review-actions">
      <button class="btn" onclick="saveHomeReview('${reviewId}','${sketchId}')">Save changes</button>
      <button class="btn o" onclick="openRev('${sketchId}')">Cancel</button>
    </div>
  `);
}

async function saveHomeReview(reviewId, sketchId) {
  const text = $('#edit-review-text').value.trim();
  if (!text) return toast('Write a few words first');

  try {
    await db.collection('reviews').doc(reviewId).update({
      s: Number($('#edit-review-rating').value),
      x: text
    });
    await loadReviews();
    openRev(sketchId);
    toast('Review updated');
  } catch (error) {
    console.error('Could not update review:', error);
    toast('Could not update review. The 15-minute edit window may have ended.');
  }
}

async function deleteHomeReview(reviewId, sketchId) {
  if (!confirm('Delete this review?')) return;

  try {
    await db.collection('reviews').doc(reviewId).delete();
    await loadReviews();
    openRev(sketchId);
    toast('Review deleted');
  } catch (error) {
    console.error('Could not delete review:', error);
    toast('Could not delete review');
  }
}

function setR(value) {
  O.rs = value;
  [...$('#rs').children].forEach((star, index) => {
    star.style.opacity = index < value ? 1 : 0.25;
  });
}

async function postRev(id) {
  if (!me) return login(() => openRev(id));

  const reviewText = $('#rx').value.trim();
  if (!reviewText) return toast('Write a few words first');

  try {
    await db.collection('reviews').add({
      sk: id,
      uid: me.id,
      n: me.name || 'Customer',
      s: O.rs,
      x: reviewText,
      t: TS()
    });
    await loadReviews();
    openRev(id);
    toast('Thanks for your review!');
  } catch (error) {
    console.error('Could not post review:', error);
    toast('Could not post review');
  }
}

loadReviews();
loadGallery();

/* Show the quote on first arrival or reload, and skip it for internal navigation. */
const splash = $('#splash');

function arrivedFromAnotherPage() {
  const navigation = performance.getEntriesByType('navigation')[0];
  const navigationType = navigation && navigation.type;
  const cameFromThisSite = document.referrer.startsWith(location.origin);
  return navigationType === 'back_forward'
    || (navigationType === 'navigate' && cameFromThisSite);
}

function closeSplash() {
  if (!splash.isConnected) return;
  splash.style.opacity = 0;
  setTimeout(go, 500);
  setTimeout(() => splash.remove(), 900);
}

if (arrivedFromAnotherPage()) {
  splash.remove();
  go();
} else {
  splash.addEventListener('click', closeSplash);
  setTimeout(closeSplash, 4600);
}
