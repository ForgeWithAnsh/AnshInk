/* Public site copy and configurable order pricing, stored in Firestore. */
const copyData = value => JSON.parse(JSON.stringify(value));

const DEFAULT_SITE = {
  siteName: CFG.site,
  artist: CFG.artist,
  email: CFG.email,
  insta: CFG.insta,
  hero: CFG.hero,
  heroCta: 'Order one for yourself',
  navHome: 'Home',
  navGallery: 'Gallery',
  navAbout: 'About',
  navReviews: 'Reviews',
  footerSupport: 'Support',
  allSketchesCta: 'All sketches',
  shopHeading: 'InkShop',
  galleryHeading: 'My sketches',
  aboutHeading: 'About me',
  contactHeading: 'Questions or custom requests?',
  bio: CFG.bio,
  story: CFG.story.slice(),
  quotes: CFG.quotes.slice(),
  about: CFG.about.map(([label, value]) => ({ label, value })),
  shopIntro: 'Choose a design and order a hand-drawn sketch made from its reference image.',
  shopNotice: 'These are Pinterest reference images, not photos of finished sketches. Your sketch will be drawn by hand after you place an order.',
  orderNotice: 'Delivery charges are confirmed after you order. The final price is confirmed before I start.',
  shopCategories: ['Anime', 'Characters', 'Portraits', 'Other'],
  favicon: ''
};

const DEFAULT_ORDER_SETTINGS = {
  basePrice: 700,
  categories: [
    { id: 'subject', label: 'What should I draw?', options: [
      { id: 'person', label: 'Person', price: 0, available: true },
      { id: 'pet', label: 'Pet / animal', price: 0, available: true },
      { id: 'object', label: 'Object / scene', price: 0, available: true }
    ] },
    { id: 'style', label: 'Style', options: [
      { id: 'realistic', label: 'Realistic', price: 0, available: true },
      { id: 'anime', label: 'Anime / cartoon', price: -140, available: true },
      { id: 'concept', label: 'Concept / symbolic', price: -70, available: true },
      { id: 'abstract', label: 'Abstract / expressive', price: -175, available: true }
    ] },
    { id: 'size', label: 'Paper size', options: [
      { id: 'a5', label: 'A5 (15×21 cm)', price: 0, available: true },
      { id: 'a4', label: 'A4 (21×30 cm)', price: 500, available: true },
      { id: 'a3', label: 'A3 (30×42 cm)', price: 1500, available: true }
    ] },
    { id: 'people', label: 'Number of people', options: [
      { id: '1', label: '1 person', price: 0, available: true },
      { id: '2', label: '2 people', price: 420, available: true },
      { id: '3', label: '3 people', price: 840, available: true },
      { id: '4', label: '4 people', price: 1260, available: true }
    ] },
    { id: 'details', label: 'Extra detailed items', options: [
      { id: '0', label: 'None', price: 0, available: true },
      { id: '1', label: '1 item (jewellery, necklace…)', price: 100, available: true },
      { id: '2', label: '2 items', price: 200, available: true },
      { id: '3', label: '3 items', price: 300, available: true }
    ] }
  ]
};

let SITE = copyData(DEFAULT_SITE);
let ORDER_SETTINGS = copyData(DEFAULT_ORDER_SETTINGS);

function normalizeSiteSettings(data = {}) {
  return {
    ...copyData(DEFAULT_SITE),
    ...data,
    story: Array.isArray(data.story) ? data.story : DEFAULT_SITE.story.slice(),
    about: Array.isArray(data.about) ? data.about : copyData(DEFAULT_SITE.about)
  };
}

function normalizeOrderSettings(data = {}) {
  if (!Array.isArray(data.categories) || !data.categories.length) return copyData(DEFAULT_ORDER_SETTINGS);
  return {
    basePrice: Number.isFinite(Number(data.basePrice)) ? Number(data.basePrice) : DEFAULT_ORDER_SETTINGS.basePrice,
    categories: data.categories.map((category, index) => ({
      id: String(category.id || `category-${index + 1}`),
      label: String(category.label || `Option ${index + 1}`),
      defaultOption: String(category.defaultOption || ''),
      options: (Array.isArray(category.options) ? category.options : []).map((option, optionIndex) => ({
        id: String(option.id || `option-${optionIndex + 1}`),
        label: String(option.label || `Option ${optionIndex + 1}`),
        price: Number(option.price) || 0,
        available: option.available !== false
      }))
    })).filter(category => category.options.length)
      .map(category => ({
        ...category,
        defaultOption: category.options.some(option => option.id === category.defaultOption && option.available)
          ? category.defaultOption
          : (category.options.find(option => option.available)?.id || '')
      }))
  };
}

async function loadSiteData() {
  const [siteResult, orderResult] = await Promise.allSettled([
    db.collection('siteSettings').doc('public').get(),
    db.collection('orderSettings').doc('public').get()
  ]);
  if (siteResult.status === 'fulfilled' && siteResult.value.exists) {
    SITE = normalizeSiteSettings(siteResult.value.data());
  } else if (siteResult.status === 'rejected') {
    console.warn('Using built-in site copy because Firestore settings could not be loaded.', siteResult.reason);
  }
  if (orderResult.status === 'fulfilled' && orderResult.value.exists) {
    ORDER_SETTINGS = normalizeOrderSettings(orderResult.value.data());
  } else if (orderResult.status === 'rejected') {
    console.warn('Using built-in order prices because Firestore settings could not be loaded.', orderResult.reason);
  }
  applyFavicon();
  return { site: SITE, order: ORDER_SETTINGS };
}

const siteDataReady = loadSiteData();

function applyFavicon() {
  let icon = document.querySelector('link[rel~="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.href = SITE.favicon || 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#f2e8da"/><path d="M12 50 30 12l22 38h-9l-5-10H25l-5 10z" fill="#6b4a34"/><path d="m27 32 6-13 6 13z" fill="#f2e8da"/></svg>'
  );
}

function optionById(categoryId, optionId) {
  return ORDER_SETTINGS.categories.find(category => category.id === categoryId)
    ?.options.find(option => option.id === optionId);
}

function orderOptionPrice(selections, baseline = null, basePrice = ORDER_SETTINGS.basePrice) {
  return Math.max(0, Math.round(basePrice + ORDER_SETTINGS.categories.reduce((total, category) => {
    const chosenId = selections?.[category.id];
    const chosen = category.options.find(option => option.id === chosenId);
    const baselineOption = baseline ? category.options.find(option => option.id === baseline[category.id]) : null;
    return total + (chosen?.price || 0) - (baselineOption?.price || 0);
  }, 0)));
}

function defaultOrderSelections() {
  return Object.fromEntries(ORDER_SETTINGS.categories.map(category => {
    const defaultOption = category.options.find(option => option.id === category.defaultOption && option.available);
    const available = defaultOption || category.options.find(option => option.available);
    return [category.id, available?.id || ''];
  }));
}
