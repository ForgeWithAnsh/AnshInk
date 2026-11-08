# AnshInk

Hand-drawn portrait shop. Plain HTML + CSS + JavaScript, with Firebase (login + database).

```
index.html            home page (quote screen, hero, gallery, about)
html/order.html       order page
html/orders.html      my orders (list + details)
html/account.html     my account
html/admin.html       artist panel (admin only)
css/                  base.css (shared) + one file per page
js/                   config.js (site settings/prices), core.js, auth.js, layout.js, one file per page
images/               local source photos (gallery photos are stored in Firestore after upload)
firestore.rules       paste into Firebase > Firestore > Rules
```

## Publish the current changes

The website's source changes are already in this local project folder. To publish them without selecting files one by one:

1. Install/open GitHub Desktop and choose **File > Add Local Repository...**. Select this `AnshInk` folder. If GitHub Desktop says it cannot find a repository, choose **Create a Repository** only if this folder has no `.git` directory; this project already has one, so normally choose Add Local Repository.
2. Review all changes and include the updated Firebase rules, gallery changes, new CSS file, page cleanup, and new pages from the previous updates.
3. Enter a summary such as `Use Firestore for the sketch gallery`, click **Commit to [current branch]**, then click **Push origin**.
4. On GitHub, open **Settings > Pages** and confirm the site is deployed from the repository's root on the branch you pushed (usually `main`). Wait for the Pages deployment to finish, then open the site URL shown there.
5. After it deploys, check the home page on a phone-sized screen, sign-in, order submission, My Orders, account editing, and the reviews page.

Do not upload just a few files through GitHub's web interface: the update includes edits, new pages, and removals that need to be published together.

## Firebase setup

### Authentication

1. The site currently offers Google sign-in and email/password. Phone/OTP login was removed because Firebase charges for verification SMS.
2. Under **Authentication > Settings > Authorized domains**, add `forgewithansh.github.io` (domain only, no `https://` and no `/AnshInk`).
3. Under **Authentication > Sign-in method**, keep Google and Email/Password enabled. You can disable Phone in Firebase too, but it is not required for this code update.
4. Test both login methods on the deployed website.

### Firestore rules and notifications

1. In Firebase Console, open **Firestore Database > Rules**.
2. Replace the complete rules text with the complete contents of this repository's `firestore.rules`, then click **Publish**. Do not paste only a fragment. These rules allow anyone to view gallery items and only the verified admin account to add or remove them.
3. No rule change is needed to remove phone login: Firebase Authentication providers are configured separately from Firestore rules.
4. The website currently shows order progress in My Orders but does not deliver email or push notifications. The Trigger Email extension is not configured, so queued `mail` documents do not send messages by themselves.

Without the Firebase extension, automated notifications need a separate trusted service (for example, a small server/serverless endpoint connected to an email provider). Browser push is also possible with FCM, but needs a service worker and a trusted sender. Manual email/WhatsApp is the zero-setup fallback. Never put SMTP or API secrets in this static website. No notification service is connected yet.

## Set up Razorpay payments

The site uses Razorpay Payment Links. No Razorpay API key is needed in the website.

1. Sign in to your Razorpay Dashboard and finish any account/business verification it requests. Add and verify the bank account for settlements.
2. Open **Payment Links > Create Payment Link**.
3. Enter the total amount the customer owes: final sketch price plus delivery charge. Use a description such as `AnshInk sketch #0001`, and add the customer's name/email/phone if the dashboard offers those fields.
4. Create the link and copy its hosted URL.
5. In the website's Artist panel, open the matching order. Paste the URL into **Razorpay Payment Link** before pressing **Accept & ask for payment**. If you already accepted it, paste the link into the accepted order and choose **Save link**.
6. The customer will see the **Pay** button in My Orders and pay on Razorpay's hosted checkout page.
7. Check the transaction in Razorpay Dashboard. When it shows as paid, change the order status to **Payment received** in the Artist panel.

The current site uses manual verification of each transaction. Automatic payment confirmation would need a trusted server and Razorpay webhook. Keep secret API keys out of this static website. See Razorpay's [Payment Links guide](https://razorpay.com/learn/payment-links-collect-payments-without-website/).

Google Pay can accept UPI payments, but its [official website integration](https://developers.google.com/pay/india/api/web/intro) requires verified merchant/UPI details and payment-status handling. A personal GPay QR/UPI payment is possible as a manual transfer, but the artist would need to verify each payment manually and it does not securely confirm the matching order automatically. For this website's existing per-order hosted-link flow, Razorpay is the more practical fit; no payment provider has been connected yet.

## Manage sketches and migrate the current gallery

The home page, All sketches page, and review page use the Firestore `gallery` collection. All uploaded sketches appear under **All sketches**; only sketches you mark **Show this sketch on the home page** appear in the homepage showcase. In the Artist view of **All sketches**, the **Homepage picks**, **Human sketches**, and **Other sketches** tabs have up/down controls to reorder their lists independently. You can also use **Feature on home** / **On home** on a sketch card to change the homepage selection. Sign in with the verified Google account `forgewithansh@gmail.com`, open **All sketches**, choose **Add a sketch**, enter a title/category/description, and upload up to four photos. The first photo is the cover. Use **Remove** on a sketch card to take it off the site.

The gallery photos and reviews you uploaded are stored in Firestore and are independent of the local `images/` folder. The current code uses `images/eyes.jpg` for the homepage hero; the other local files are not required to show uploaded gallery items. Keep your own source-image backup if you may want to upload those files again.

## Edit the website and manage InkShop

After publishing the latest files and Firestore rules, sign in with `forgewithansh@gmail.com` and open **Artist panel**. The panel has sections for orders, website text and logo, order options and prices, and InkShop. Changes to site text, favicon, order pricing, and shop listings are stored in Firestore, so they remain separate from the local source images.

- **Website text & logo** edits the home introduction, About story/details, quotes, navigation text, contact details, shop notice, and homepage image. Upload a small square favicon image and save it to update the browser tab/bookmark logo.
- **Order options & prices** sets the standard starting price, adds/removes option groups and choices, edits each price adjustment, and marks choices available or unavailable. Changes apply to new orders; submitted orders keep their saved price and selections.
- **All sketches** lets the artist edit the card display price separately from the price used by **Order like this**, and choose the preselected order details for that sketch.
- **InkShop** lets the artist add or edit a card with an uploaded Pinterest reference image, title, category, price, description, and Pinterest URL. The shop notice explains that the images are references and the sketches are drawn after ordering.

Publish the complete updated `firestore.rules` file before using these controls. It adds public read and admin-only write access for the `siteSettings`, `orderSettings`, and `shopProducts` collections. No Firebase Blaze plan is required for these Firestore features.
