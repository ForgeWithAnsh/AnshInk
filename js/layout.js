/* Shared header, footer, navigation, and profile menu. */
function goTo(id) {
  const target = document.getElementById(id);
  if (!target) return;

  const startY = scrollY;
  const startTime = performance.now();

  function animateScroll(time) {
    const progress = Math.min(1, (time - startTime) / 800);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const targetY = target.getBoundingClientRect().top + scrollY - 70;

    scrollTo(0, startY + (targetY - startY) * eased);
    if (progress < 1) requestAnimationFrame(animateScroll);
  }

  requestAnimationFrame(animateScroll);
}

(function renderSharedLayout() {
  const isHome = document.body.dataset.page === 'home';
  const profileIcon = `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <clipPath id="profile-clip"><circle cx="20" cy="20" r="20"></circle></clipPath>
      <circle cx="20" cy="20" r="20" fill="#6b4a34"></circle>
      <g clip-path="url(#profile-clip)" fill="#f2e8da">
        <circle cx="20" cy="15" r="6.5"></circle>
        <path d="M5 41c1-9.5 7-14.5 15-14.5S34 31.5 35 41z"></path>
      </g>
    </svg>
  `;

  $('#hdr').innerHTML = `
    <header>
      <a class="logo" href="${PG('index')}">✏ Ansh<i>Ink</i></a>
      <nav>
        <a href="${PG('index')}">Home</a>
        <a href="${PG('index')}#gal" data-go="gal">Gallery</a>
        <a href="${PG('index')}#abt" data-go="abt">About</a>
        <a href="${PG('reviews')}">Reviews</a>
        <div class="pfw">
          <button class="pfb" id="pf" aria-label="Account">${profileIcon}</button>
          <div class="pmenu" id="pm"></div>
        </div>
      </nav>
    </header>
  `;

  $('#ftr').innerHTML = `
    <footer>
      Support: <a href="mailto:${CFG.email}">${CFG.email}</a> ·
      Instagram <a href="https://instagram.com/${CFG.insta}">@${CFG.insta}</a><br>
      <a id="al" href="${PG('admin')}" hidden>Artist panel</a>
      <div class="mu">© ${CFG.site}</div>
    </footer>
  `;

  if (!isHome) document.body.classList.add('go');

  document.querySelectorAll('[data-go]').forEach(link => {
    link.addEventListener('click', event => {
      if (!isHome) return;
      event.preventDefault();
      goTo(link.dataset.go);
    });
  });

  $('#pf').addEventListener('click', event => {
    event.stopPropagation();
    $('#pm').classList.toggle('on');
  });
  document.addEventListener('click', () => $('#pm').classList.remove('on'));

  onUser(() => {
    $('#pm').innerHTML = me ? `
      <div class="mu">Hi, ${esc(me.name || 'there')}</div>
      <a href="${PG('account')}">My account</a>
      <a href="${PG('orders')}">My orders</a>
      ${isAdm() ? `<a href="${PG('admin')}">Artist panel</a>` : ''}
      <a href="#" id="lo">Logout</a>
    ` : `<a href="#" id="li">Login / Sign up</a>`;

    const logout = $('#lo');
    const loginLink = $('#li');

    if (logout) {
      logout.onclick = event => {
        event.preventDefault();
        auth.signOut();
        toast('Logged out');
      };
    }

    if (loginLink) {
      loginLink.onclick = event => {
        event.preventDefault();
        login();
      };
    }

    $('#al').hidden = !isAdm();
  });
})();
