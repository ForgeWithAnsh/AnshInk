# AnshInk

Hand-drawn portrait shop. Plain HTML + CSS + JavaScript, with Firebase (login + database).

```
index.html            home page (quote screen, hero, gallery, about)
html/order.html       order page
html/orders.html      my orders (list + details)
html/account.html     my account
html/admin.html       artist panel (admin only)
css/                  base.css (shared) + one file per page
js/                   config.js (edit text/prices/sketches), core.js, auth.js, layout.js, one file per page
images/               sketch photos
firestore.rules       paste into Firebase > Firestore > Rules
```

## Deploy on GitHub Pages
1. Upload everything (keep the folders) to a GitHub repository.
2. Settings > Pages > Deploy from a branch > main > /(root).
3. Firebase > Authentication > Settings > Authorized domains > add `YOURUSERNAME.github.io`.

## Add a new sketch
Put the photo in `images/` and add a line to the `SK` list in `js/config.js`.
