/* Site copy, prices, and Firebase web-app configuration. */
const CFG = {
  site: 'AnshInk',
  artist: 'Ansh',
  email: 'forgewithansh@gmail.com',
  insta: 'an5h669',
  adminEmail: 'forgewithansh@gmail.com',
  hero: 'images/eyes.jpg',
  quotes: [
    'Without art, reality is unbearable.',
    'Art is not what you see, but what you make others see.',
    'Every child is an artist; the problem is staying an artist when you grow up.',
    'To create a work of art is to create the world.',
    'Painting is just another way of keeping a diary.',
    'The day is an empty canvas; the shapes and colors are yours to choose.',
    'Imagination is more important than knowledge.',
    'Anyone who says you can’t see a thought simply doesn’t know art.'
  ],
  bio: "Anyone can buy an expensive gift. But a handmade one takes something money can't buy — time, patience, and effort. Every stroke carries a little piece of the person who made it, which is why a sketch isn't just something you give someone; it's a memory, made by hand, that they can keep forever.",
  story: [
    'Hey, I’m Ansh, an artist from Gwalior. I’ve been drawing since Class 1.',
    'I love making things by hand, especially for people who matter to me. Over the years, sketching has become one of my favourite ways to turn a memory into something you can actually hold.'
  ],
  about: [
    ['Name', 'Ansh'],
    ['Age / City', 'Gwalior, Madhya Pradesh, India'],
    ['Drawing since', '13+ years'],
    ['Materials', 'Charcoal pencils, blending stumps, cotton buds, kneaded eraser'],
    ['Time per sketch', '3–4 days · approximately 8-10 hours of work'],
    ['Delivery', 'All over India · delivery charges paid by the customer']
  ],
  sizes: {
    'A5 (15×21 cm)': 700,
    'A4 (21×30 cm)': 1200,
    'A3 (30×42 cm)': 2200
  },
  extraPerson: 0.6,
  itemPrice: 100,
  styles: {
    Realistic: 1,
    'Anime / cartoon': 0.8,
    'Concept / symbolic': 0.9,
    'Abstract / expressive': 0.75
  },
  firebase: {
    apiKey: 'AIzaSyBpX1v9zK90KMmrcA6LtrCZ1NXsBfwgLLg',
    authDomain: 'ansh-ink.firebaseapp.com',
    projectId: 'ansh-ink',
    storageBucket: 'ansh-ink.firebasestorage.app',
    messagingSenderId: '725401030026',
    appId: '1:725401030026:web:88a5466e28f5d1521f8c73'
  }
};

const STAT = [
  'Order placed (under review)',
  'Accepted: payment due',
  'Payment received',
  'Sketching started',
  'Sketching finished',
  'Out for delivery',
  'Order delivered'
];

/* Preserve the review references used by the previous hardcoded gallery. */
const LEGACY_SKETCHES = {
  j: 'Jhumka Portrait',
  e: 'Hidden Smile',
  c: 'Wind-swept Hair',
  a: 'Soft Smile',
  b: 'The Look',
  d: 'Om Sai Ram Portrait'
};

function legacySketchIdForTitle(title) {
  const normalizedTitle = String(title || '').trim().toLowerCase();
  return Object.entries(LEGACY_SKETCHES)
    .find(([, legacyTitle]) => legacyTitle.toLowerCase() === normalizedTitle)?.[0] || '';
}
