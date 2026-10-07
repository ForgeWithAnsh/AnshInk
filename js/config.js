/* AnshInk - settings you can edit: text, prices, sketches, Firebase keys */
const CFG={
  site:'AnshInk',artist:'Ansh',
  email:'forgewithansh@gmail.com',insta:'an5h669',
  adminEmail:'forgewithansh@gmail.com',   // only this Google account gets the Artist panel
  quote:'Some memories are too precious for a screenshot.',
  bio:"Anyone can buy an expensive gift. But a handmade one takes something money can't buy — time, patience, and effort. Every stroke carries a little piece of the person who made it, which is why a sketch isn't just something you give someone; it's a memory, made by hand, that they can keep forever.",
  story:['Hey, I’m Ansh — an 18-year-old artist from Gwalior. I’ve been drawing since Class 1, so it’s been over 13 years now.','I love making things by hand, especially for people who matter to me. Over the years, sketching has become one of my favourite ways to turn a memory into something you can actually hold.'],
  about:[['Name','Ansh'],['Age / City','18 · Gwalior, Madhya Pradesh'],['Drawing since','Class 1 · 13+ years'],['Materials','Charcoal pencils, blending stumps, cotton buds, kneaded eraser'],['Time per sketch','3–4 days · approximately 8-10 hours of work'],['Delivery','All over India · delivery charges paid by the customer']],
  /* prices in rupees */
  sizes:{'A5 (15×21 cm)':700,'A4 (21×30 cm)':1200,'A3 (30×42 cm)':2200},
  extraPerson:0.6,   // +60% for each extra person
  itemPrice:100,     // per detailed item (jewellery etc.)
  styles:{'Realistic':1,'Anime / cartoon':0.8,'Concept / symbolic':0.9,'Abstract / expressive':0.75},
  firebase:{apiKey:"AIzaSyBpX1v9zK90KMmrcA6LtrCZ1NXsBfwgLLg",authDomain:"ansh-ink.firebaseapp.com",projectId:"ansh-ink",storageBucket:"ansh-ink.firebasestorage.app",messagingSenderId:"725401030026",appId:"1:725401030026:web:88a5466e28f5d1521f8c73"}
};
const STAT=['Order placed (under review)','Accepted: payment due','Payment received','Sketching started','Sketching finished','Out for delivery','Order delivered'];
/* gallery: add new sketches here (put photos in the images/ folder) */
const SK=[
  {id:'j',t:'Jhumka Portrait',d:'Charcoal pencil on paper',img:['images/jhumka-1.jpg','images/jhumka-2.jpg']},
  {id:'e',t:'Hidden Smile',d:'Charcoal pencil, close-up',img:['images/eyes.jpg']},
  {id:'c',t:'Wind-swept Hair',d:'Charcoal pencil on paper',img:['images/windswept.jpg']},
  {id:'a',t:'Soft Smile',d:'Charcoal pencil on paper',img:['images/soft-smile.jpg']},
  {id:'b',t:'The Look',d:'Charcoal pencil on paper',img:['images/the-look.jpg']}
];
