/* Public reviews page, with the associated sketch from the Firestore gallery. */
const grid = document.querySelector('#review-grid');
const summary = document.querySelector('#reviews');

function photoUrl(photo) {
  if (!photo) return '';
  return /^(data:|https?:\/\/)/.test(photo) ? photo : BASE + photo;
}

async function showReviews() {
  try {
    const [reviewSnapshot, sketchSnapshot] = await Promise.all([
      db.collection('reviews').get(),
      db.collection('gallery').get()
    ]);

    const sketches = new Map();
    sketchSnapshot.forEach(doc => {
      const data = doc.data();
      const sketch = {
        id: doc.id,
        title: data.title || 'Sketch',
        photo: (data.photos || [data.photo]).filter(Boolean)[0] || '',
        legacyId: data.legacyId || legacySketchIdForTitle(data.title)
      };
      sketches.set(sketch.id, sketch);
      if (sketch.legacyId) sketches.set(sketch.legacyId, sketch);
    });

    const reviews = reviewSnapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => (b.t || 0) - (a.t || 0));

    if (!reviews.length) {
      summary.textContent = 'No reviews yet.';
      grid.innerHTML = '<div class="review-empty">Reviews will appear here after customers share them.</div>';
      return;
    }

    summary.textContent = `${reviews.length} customer ${reviews.length === 1 ? 'review' : 'reviews'}`;
    grid.innerHTML = reviews.map(review => {
      const sketch = sketches.get(review.sk);
      const image = sketch?.photo
        ? `<img src="${photoUrl(sketch.photo)}" alt="${esc(sketch.title)}" loading="lazy">`
        : '';

      return `
        <article class="review-card">
          ${image}
          <div class="review-copy">
            <b>${esc(sketch?.title || 'Sketch')}</b>
            <div class="review-stars">${stars(review.s)}</div>
            <p>${esc(review.x || '')}</p>
            <div class="mu">${esc(review.n || 'Customer')}</div>
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    console.error('Could not load reviews:', error);
    summary.textContent = 'Could not load reviews right now.';
  }
}

showReviews();
