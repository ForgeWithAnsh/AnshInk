/* Shared header, footer, navigation, and profile menu. */
let primaryNavScrollHandlerRegistered = false;

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

async function renderSharedLayout() {
  await siteDataReady;
  const isHome = document.body.dataset.page === 'home';
  document.title = document.title.replace('AnshInk', SITE.siteName);
  applyFavicon();
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
      <div class="brand-group">
        <a class="logo" href="${PG('index')}">${SITE.brandLogo ? `<img class="brand-logo" src="${esc(SITE.brandLogo)}" alt="">` : '✏'} ${esc(SITE.siteName)}</a>
        <a class="btn sm shop-nav" href="${PG('shop')}"><svg class="shop-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7h14l-1 10H4L3 7Z"/><path d="M7 7V5a3 3 0 0 1 6 0v2"/></svg><span>InkShop</span></a>
      </div>
      <nav>
        <div class="pfw">
          <button class="pfb" id="pf" aria-label="Account">${profileIcon}</button>
          <div class="pmenu" id="pm"></div>
        </div>
      </nav>
    </header>
  `;

  const page = document.body.dataset.page;
  document.getElementById('primary-navigation')?.remove();
  document.body.classList.remove('has-primary-navigation');
  {
    const active = ['home', 'shop', 'orders', 'sketches', 'reviews'].includes(page) ? page : '';
    const destinations = [
      ['home', 'Home', 'index', '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7H9v7H4a1 1 0 0 1-1-1z"/>'],
      ['shop', 'InkShop', 'shop', '<path d="M3 7h18l-1.5 13h-15z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>'],
      ['orders', 'My orders', 'orders', '<path d="M5 4h14v17H5z"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="M9 4V2h6v2"/>'],
      ['sketches', 'All sketches', 'sketches', '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'],
      ['reviews', 'Reviews', 'reviews', '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>']
    ];
    const navigation = document.createElement('nav');
    navigation.id = 'primary-navigation';
    navigation.className = 'primary-navigation';
    navigation.setAttribute('aria-label', 'Main navigation');
    navigation.innerHTML = destinations.map(([id, label, route, path]) => `
      <a class="primary-navigation-item ${id === active ? 'is-active' : ''}" href="${PG(route)}" ${id === active ? 'aria-current="page"' : ''}>
        <svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>
        <span>${label}</span>
      </a>
    `).join('');
    $('#hdr').after(navigation);
    document.body.classList.add('has-primary-navigation');
    if (!primaryNavScrollHandlerRegistered) {
      primaryNavScrollHandlerRegistered = true;
      let previousY = window.scrollY;
      window.addEventListener('scroll', () => {
        const currentY = Math.max(0, window.scrollY);
      const compactNav = window.matchMedia('(max-width: 680px), (max-width: 1100px) and (orientation: portrait)').matches;
        const currentNav = $('#primary-navigation');
        if (currentNav && compactNav) {
          if (currentY < 64 || currentY < previousY - 3) {
            const wasHidden = currentNav.classList.contains('nav-hidden');
            currentNav.classList.remove('nav-hidden');
            if (wasHidden) {
              currentNav.classList.add('nav-returning');
              setTimeout(() => currentNav.classList.remove('nav-returning'), 320);
            }
          } else if (currentY > previousY + 3 && currentY > 64) {
            currentNav.classList.add('nav-hidden');
            currentNav.classList.remove('nav-returning');
          }
        } else if (currentNav) {
          currentNav.classList.remove('nav-hidden', 'nav-returning');
        }
        previousY = currentY;
      }, { passive: true });
      window.addEventListener('resize', () => {
        const currentNav = $('#primary-navigation');
        if (currentNav && !window.matchMedia('(max-width: 680px), (max-width: 1100px) and (orientation: portrait)').matches) {
          currentNav.classList.remove('nav-hidden', 'nav-returning');
        }
      }, { passive: true });
    }
  }

  $('#ftr').innerHTML = `
    <footer>
      <div class="footer-contact">
        <span>${esc(SITE.footerSupport || 'Support')}: <a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></span>
        <span>Instagram: <a href="https://instagram.com/${encodeURIComponent(SITE.insta)}">@${esc(SITE.insta)}</a></span>
      </div>
      <div class="mu">© ${esc(SITE.siteName)}</div>
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
  if (!O.layoutDocumentHandlerRegistered) {
    O.layoutDocumentHandlerRegistered = true;
    document.addEventListener('click', () => $('#pm').classList.remove('on'));
  }

  function updateProfileMenu() {
    $('#pm').innerHTML = me ? `
      <div class="mu">Hi, ${esc(me.name || 'there')}</div>
      <a href="${PG('account')}">My account</a>
      <a href="${PG('order')}">Order a custom sketch</a>
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
  }

  if (!O.layoutUserCallbackRegistered) {
    O.layoutUserCallbackRegistered = true;
    onUser(updateProfileMenu);
  } else {
    updateProfileMenu();
  }
}

renderSharedLayout();
