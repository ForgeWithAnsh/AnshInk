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

### Authentication

1. The site currently offers Google sign-in and email/password. Phone/OTP login was removed because Firebase charges for verification SMS.
2. Under **Authentication > Settings > Authorized domains**, add `forgewithansh.github.io` (domain only, no `https://` and no `/AnshInk`).
3. Under **Authentication > Sign-in method**, keep Google and Email/Password enabled. You can disable Phone in Firebase too, but it is not required for this code update.
4. Test both login methods on the deployed website.

### Firestore rules and notifications

1. In Firebase Console, open **Firestore Database > Rules**.
2. Replace the complete rules text with the complete contents of this repository's `firestore.rules`, then click **Publish**. Do not paste only a fragment.
3. No rule change is needed to remove phone login: Firebase Authentication providers are configured separately from Firestore rules.
4. The website currently shows order progress in My Orders but does not deliver email or push notifications. The Trigger Email extension is not configured, so queued `mail` documents do not send messages by themselves.

Without the Firebase extension, automated notifications need a separate trusted service (for example, a small server/serverless endpoint connected to an email provider). Browser push is also possible with FCM, but needs a service worker and a trusted sender. Manual email/WhatsApp is the zero-setup fallback. Never put SMTP or API secrets in this static website. No notification service is connected yet.

## Payment links

The **Pay here** button opens the payment URL entered for that order in the artist panel. To use it, create a Razorpay account, complete its required account verification, create a Payment Link for the accepted total (sketch price plus delivery), and paste that link into the order's payment-link field before saving. The customer pays on Razorpay's hosted page. Check the payment in Razorpay, then manually mark the order as paid in the artist panel. Automatic payment confirmation needs a trusted server and a Razorpay webhook; never put secret API keys in this static website.

Razorpay has a [Payment Links guide](https://razorpay.com/learn/payment-links-collect-payments-without-website/). Availability and onboarding requirements depend on your account.

Google Pay can accept UPI payments, but its [official website integration](https://developers.google.com/pay/india/api/web/intro) requires verified merchant/UPI details and payment-status handling. A personal GPay QR/UPI payment is possible as a manual transfer, but the artist would need to verify each payment manually and it does not securely confirm the matching order automatically. For this website's existing per-order hosted-link flow, Razorpay is the more practical fit; no payment provider has been connected yet.

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
