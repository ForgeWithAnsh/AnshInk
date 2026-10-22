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

The home page, All sketches page, and review page use the Firestore `gallery` collection. All uploaded sketches appear under **All sketches**; only sketches you mark **Show this sketch on the home page** appear in the homepage showcase. You can also use **Feature on home** / **On home** on each All sketches card to change that selection later. Sign in with the verified Google account `forgewithansh@gmail.com`, open **All sketches**, choose **Add a sketch**, enter a title/category/description, and upload up to four photos. The first photo is the cover. Use **Remove** on a sketch card to take it off the site.

To move the current homepage sketches into Firebase, do this once after publishing the code and Firestore rules:

1. Sign in as `forgewithansh@gmail.com` and go to **All sketches > Add a sketch**.
2. Upload each sketch as a separate item. The local `images/` folder still has source photos to choose in the file picker.
3. For existing reviews to stay attached, choose the matching item in **Link any existing reviews** when adding that old sketch:

   | Sketch | Suggested photos from `images/` | Existing review link |
   | --- | --- | --- |
   | Jhumka Portrait | `jhumka-aesthetic.jpg`, `jhumka-comparison.jpg`, `jhumka-reference.jpg`, `jhumka-sketch.jpg` | Jhumka Portrait |
   | Hidden Smile | `eyes-aesthetic.jpg`, `eyes-comparison.jpg`, `eyes-reference.jpg`, `eyes-sketch.jpg` | Hidden Smile |
   | Wind-swept Hair | `windswept-aesthetic.jpg`, `windswept-sketch.jpg` | Wind-swept Hair |
   | Soft Smile | `softsmile-aesthetic.png` | Soft Smile |
   | The Look | `thelook-aesthetic.png`, `thelook-reference.png`, `thelook-sketch.jpg` | The Look |
   | Om Sai Ram Portrait | `omsairam-aesthetic.png`, `omsairam-comparison.png`, `omsairam-reference.jpg`, `omsairam-sketch.jpg` | Om Sai Ram Portrait |

4. All uploaded items appear on All sketches. Mark only your chosen best sketches to feature them on the home page. The existing local photo files are retained so you can upload them; after migration, they are not used by the public gallery code. The six photos that were empty placeholders in the old repository are unavailable, so only upload originals you actually have.
