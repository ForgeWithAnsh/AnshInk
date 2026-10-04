/* AnshInk - settings you can edit: text, prices, sketches, Firebase keys */
const CFG={
  site:'AnshInk',artist:'Ansh',
  email:'forgewithansh@gmail.com',insta:'an5h669',
  adminEmail:'forgewithansh@gmail.com',   // only this Google account gets the Artist panel
  quote:'Some memories are too precious for a screenshot.',
  bio:"I'm Ansh, an 18-year-old artist from Gwalior. I draw with charcoal pencils and love turning photos of the people you care about into handmade keepsakes. The smile on someone's face when they open a handmade gift is my favourite part.",
  story:"I've been drawing since first class, over 13 years now. I love making handmade things for the people I care about, and a sketch is the most personal gift I can make. I mostly draw people, but I also draw animals and other things.",
  about:[['Name','Ansh'],['Age / city','18 · Gwalior, Madhya Pradesh'],['Drawing since','Childhood, over 13 years'],['Materials','Charcoal pencils, blending stumps, cotton buds, kneaded eraser'],['Time per sketch','3–4 days (about 6–9 hours of work)'],['Delivery','All over India (delivery charges paid by the customer)']],
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
