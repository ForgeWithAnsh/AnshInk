/* Reviews page: responsive review cards and owner/admin review actions. */
(function () {
  const main = $('#main');
  let reviews = [];
  let sketchesById = new Map();

  function photoUrl(photo) {
    if (!photo) return '';
    return /^(data:|https?:\/\/)/.test(photo) ? photo : BASE + photo;
  }

  function reviewSketch(review) {
    return sketchesById.get(review.sk) || null;
  }

  function canEdit(review) {
    return Boolean(me && review.uid === me.id && Date.now() - Number(review.t) <= 900000);
  }

  function actions(review) {
    const ownReview = Boolean(me && review.uid === me.id);
    if (!ownReview && !isAdm()) return '';

    return `
      <div class="review-card-actions">
        ${canEdit(review) ? `<button class="btn o sm" onclick="editPublicReview('${review.id}')">Edit</button>` : ''}
        <button class="btn o sm" onclick="deletePublicReview('${review.id}')">Delete</button>
      </div>
    `;
  }

  function render() {
    if (!reviews.length) {
      main.innerHTML = `
        <div class="reviews-heading"><h1>Reviews</h1></div>
        <p class="mu reviews-empty">No reviews yet. Be the first to share your experience.</p>
      `;
      return;
    }

    main.innerHTML = `
      <div class="reviews-heading"><h1>Reviews</h1></div>
      <section class="review-grid" aria-label="Customer reviews">
        ${reviews.map(review => {
          const sketch = reviewSketch(review);
          const photo = sketch?.photo ? `
            <img class="review-sketch-photo" src="${photoUrl(sketch.photo)}" alt="${esc(sketch.title)}" loading="lazy">
          ` : '';

          return `
            <article class="review-card">
              ${photo}
              <div class="review-card-body">
                ${sketch ? `<div class="review-sketch-title">${esc(sketch.title)}</div>` : ''}
                <div class="review-card-top">
                  <b>${esc(review.n || 'Customer')}</b>
                  <span class="st" aria-label="${review.s} out of 5 stars">${stars(review.s)}</span>
                </div>
                <p class="review-card-text">${esc(review.x)}</p>
                <time class="mu" datetime="${new Date(review.t).toISOString()}">
                  ${new Date(review.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
                ${actions(review)}
              </div>
            </article>
          `;
        }).join('')}
      </section>
    `;
  }

  async function load() {
    main.innerHTML = '<p class="mu">Loading reviews…</p>';
    const slowLoadTimer = setTimeout(() => {
      main.innerHTML = `
        <p class="mu reviews-empty">Reviews are taking longer than expected.</p>
        <div class="reviews-retry"><button class="btn" onclick="reloadReviews()">Try again</button></div>
      `;
    }, 12000);

    try {
      sketchesById = new Map();
      const reviewSnapshot = await db.collection('reviews').get();

      try {
        const sketchSnapshot = await db.collection('gallery').get();
        sketchSnapshot.forEach(document => {
          const data = document.data();
          const sketch = {
            id: document.id,
            title: data.title || 'Sketch',
            photo: (data.photos || [data.photo]).filter(Boolean)[0] || ''
          };
          sketchesById.set(document.id, sketch);
          const legacyId = data.legacyId || legacySketchIdForTitle(data.title);
          if (legacyId) sketchesById.set(legacyId, sketch);
        });
      } catch (galleryError) {
        console.warn('Could not load gallery details for reviews:', galleryError);
      }

      reviews = reviewSnapshot.docs.map(document => ({ id: document.id, ...document.data() }))
        .sort((first, second) => Number(second.t) - Number(first.t));
      render();
    } catch (error) {
      console.error('Could not load reviews:', error);
      main.innerHTML = `
        <p class="mu reviews-empty">Could not load reviews. Check your connection or Firebase access, then try again.</p>
        <div class="reviews-retry"><button class="btn" onclick="reloadReviews()">Try again</button></div>
      `;
    } finally {
      clearTimeout(slowLoadTimer);
    }
  }

  window.reloadReviews = load;

  window.editPublicReview = reviewId => {
    const review = reviews.find(item => item.id === reviewId);
    if (!review || !me || review.uid !== me.id || !canEdit(review)) {
      return toast('You can edit your review for 15 minutes after posting it');
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
        <button class="btn" onclick="savePublicReview('${reviewId}')">Save changes</button>
        <button class="btn o" onclick="hide()">Cancel</button>
      </div>
    `);
  };

  window.savePublicReview = async reviewId => {
    const review = reviews.find(item => item.id === reviewId);
    const text = $('#edit-review-text').value.trim();
    if (!review || !me || review.uid !== me.id || !canEdit(review)) {
      return toast('You can edit your review for 15 minutes after posting it');
    }
    if (!text) return toast('Write a few words first');

    try {
      await db.collection('reviews').doc(reviewId).update({
        s: Number($('#edit-review-rating').value),
        x: text
      });
      hide();
      toast('Review updated');
      await load();
    } catch (error) {
      console.error('Could not update review:', error);
      toast('Could not update review. The 15-minute edit window may have ended.');
    }
  };

  window.deletePublicReview = async reviewId => {
    const review = reviews.find(item => item.id === reviewId);
    if (!review || (!isAdm() && (!me || review.uid !== me.id))) return;
    if (!confirm('Delete this review?')) return;

    try {
      await db.collection('reviews').doc(reviewId).delete();
      toast('Review deleted');
      await load();
    } catch (error) {
      console.error('Could not delete review:', error);
      toast('Could not delete review');
    }
  };

  onUser(render);
  load();
})();
