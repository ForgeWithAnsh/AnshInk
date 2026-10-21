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

## Publish the current changes

The website's source changes are already in this local project folder. To publish them without selecting files one by one:

1. Install/open GitHub Desktop and choose **File > Add Local Repository...**. Select this `AnshInk` folder. If GitHub Desktop says it cannot find a repository, choose **Create a Repository** only if this folder has no `.git` directory; this project already has one, so normally choose Add Local Repository.
2. Review the changed files. Keep the deletions and the new `html/edit-details.html`, `html/reviews.html`, and `js/reviews.js` files included.
3. Enter a summary such as `Improve mobile layout and order flows`, click **Commit to [current branch]**, then click **Push origin**.
4. On GitHub, open **Settings > Pages** and confirm the site is deployed from the repository's root on the branch you pushed (usually `main`). Wait for the Pages deployment to finish, then open the site URL shown there.
5. After it deploys, check the home page on a phone-sized screen, sign-in, order submission, My Orders, account editing, and the reviews page.

Do not upload just a few files through GitHub's web interface: the update includes edits, new pages, and removals that need to be published together.

## Firebase setup

### Authentication and phone sign-in

1. In Firebase Console, open **Authentication > Sign-in method** and enable **Phone** (and the methods you use).
2. Under **Authentication > Settings > Authorized domains**, add `forgewithansh.github.io` (domain only, no `https://` and no `/AnshInk`). Also add `localhost` if testing locally.
3. In **Authentication > Settings > SMS region policy**, allow India (`IN`) for testing/real Indian numbers. Firebase may require a linked Cloud Billing account for sending real SMS. Phone sign-in on the web also uses a reCAPTCHA challenge. For development, use Firebase's fictional test phone numbers instead of repeatedly sending paid SMS.
4. Test with the deployed website. If it fails, open the browser developer console and note the Firebase error code; `auth/unauthorized-domain`, reCAPTCHA errors, and SMS-region/billing restrictions need different fixes.

### Firestore rules and email notifications

1. In Firebase Console, open **Firestore Database > Rules**.
2. Replace the complete rules text with the complete contents of this repository's `firestore.rules`, then click **Publish**. Do not paste only a fragment.
3. To deliver order/progress emails, install Firebase's **Trigger Email** extension (`firestore-send-email`) and configure it to watch the `mail` collection. It needs an SMTP provider account and a verified sender email. Keep SMTP credentials in the extension configuration, never in the website files.
4. The extension requires the Firebase **Blaze (pay as you go)** plan. Set a budget alert in Google Cloud Billing and review any provider charges before enabling it.
5. Submit a test order and check `forgewithansh@gmail.com`; then update the order to “Sketching started” and “Sketching finished” and check the customer's email. The website creates the email records; the extension is what sends them.

Firebase setup guides: [Phone sign-in](https://firebase.google.com/docs/auth/web/phone-auth), [Trigger Email extension](https://firebase.google.com/docs/extensions/official/firestore-send-email), and [installing extensions](https://firebase.google.com/docs/extensions/install-extensions).

## Payment links

The **Pay here** button opens the payment URL entered for that order in the artist panel. To use it, create a Razorpay account, complete its required account verification, create a Payment Link for the accepted total (sketch price plus delivery), and paste that link into the order's payment-link field before saving. The customer pays on Razorpay's hosted page. Check the payment in Razorpay, then manually mark the order as paid in the artist panel. Automatic payment confirmation needs a trusted server and a Razorpay webhook; never put secret API keys in this static website.

Razorpay has a [Payment Links guide](https://razorpay.com/learn/payment-links-collect-payments-without-website/). Availability and onboarding requirements depend on your account.

## Email notifications
The site queues email jobs in Firestore's `mail` collection. To deliver them:

1. In Firebase Console > Extensions, install **Trigger Email** (`firestore-send-email`).
2. Choose `mail` as the collection to watch.
3. Configure it with SMTP credentials from an email delivery provider (for example SendGrid, Mailgun, or another SMTP service) and set a verified sender address.
4. Publish the updated `firestore.rules` in Firebase > Firestore > Rules.
5. Place a test order, then check the extension's logs and your artist inbox. Change an order to “Sketching started” and “Sketching finished” to test customer notices.

New order emails go to `forgewithansh@gmail.com`; progress emails go to the email saved on the order. Do not put SMTP credentials in this static website. The extension keeps them on the Firebase side. See Firebase's [Trigger Email setup guide](https://firebase.google.com/docs/extensions/official/firestore-send-email).

## Add a new sketch
Put the photo in `images/` and add a line to the `SK` list in `js/config.js`.

## Restore the six missing gallery photos

These files in the original project were empty placeholders, so the real photos cannot be recovered from the repository history. If you still have the originals, copy them into `images/` using these exact names:

- `windswept-comparison.jpg`
- `windswept-reference.jpg`
- `softsmile-comparison.jpg`
- `softsmile-reference.jpg`
- `softsmile-sketch.jpg`
- `thelook-comparison.jpg`

The old Windswept reference filename was misspelled as `windswept-refrence.jpg`; use the corrected spelling above. The current gallery configuration no longer points to these missing placeholders. Once you restore the photos, add their paths back to the appropriate sketch entries in `js/config.js` if you want them displayed.
