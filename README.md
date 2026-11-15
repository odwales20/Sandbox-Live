# Sandbox Live 🚛

A browser-based live RC truck competition scoreboard and digital signage system for **The Sandbox Café, Keswick**.

## Pages

- [TV1](./tv1/) — live scoreboard for active competitions, PNG slideshow when idle.
- [TV2](./tv2/) — always-on PNG slideshow.
- [Control](./control/) — mobile-friendly controls for truck weigh-ins, timer, edits, and winners.

With GitHub Pages enabled, links become:

- `https://odwales20.github.io/Sandbox-Live/tv1/`
- `https://odwales20.github.io/Sandbox-Live/tv2/`
- `https://odwales20.github.io/Sandbox-Live/control/`

## GitHub Pages setup

1. Repository **Settings → Pages**.
2. Under Build and deployment, select **Deploy from a branch**, `main`, `/ (root)`, and Save.
3. Allow deployment to finish, then open the links above.

## Firebase setup (required for cross-device live updates)

Without Firebase, the site runs in **local demo mode**: scores are kept in the control browser's localStorage and do **not** synchronise between TV and phone. No Firebase credentials have been configured yet.

1. Create a project at https://console.firebase.google.com/ (Spark plan is suitable for a small installation).
2. Add a **Web app**, then copy its Firebase config object to `firebase-config.js` (replace `null`). The web configuration is not a secret; **never** put Firebase service-account keys or staff passwords in the repository.
3. Enable **Firestore Database** (production mode). Create the database as close to the UK as the offered locations allow.
4. Enable **Authentication → Sign-in method → Email/Password**. Create a staff account in Authentication.
5. Under **Firestore → Rules**, replace the rules with the following. **Replace `STAFF_USER_UID` with the actual authenticated UID** shown in Firebase Authentication:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sandboxLive/current {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == 'STAFF_USER_UID';
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

6. Publish the rules. Add your Pages domain `odwales20.github.io` to Firebase Authentication authorized domains if needed.
7. Open TV1 on the smart TV, TV2 on the other smart TV, and Control on your phone. Log in on Control to edit. Firebase broadcasts updates to TV1 automatically.

**Security:** TV1 can publicly read the current competition (including truck names). Don't enter personal data. Only the specified staff UID can write. Creating Firebase credentials does **not** require embedding any private keys in site code. Any future Cloud Functions or server services must keep privileged credentials server-side.

**Current limitations:** This is a small-venue first version, with one live competition at a time. Concurrent operators can overwrite one another's changes because a full document is saved on each edit. Prefer one scoring operator at a time. The finish timer automatically commits when the logged-in Control page is open; if that page is closed, TV1 still displays 0:00 but doesn't autonomously commit a finish state. Improvements can be made later.

## Adverts

Upload public display artwork to `signage/`. A GitHub Actions workflow updates `signage/images.json` automatically when images are pushed to `main`. TV1 in standby and TV2 read the playlist and refresh it every minute. Recommended image dimensions: 1920×1080. This first version rotates the adverts every 10 seconds.

If the workflow fails, check **Actions → Update signage playlist**, and run it manually. If Actions permissions block commits, set **Settings → Actions → General → Workflow permissions → Read and write permissions**.

## Licence and branding

The original code is MIT licensed (see [LICENSE](./LICENSE)). **Sandbox Café logos, branding, trademarks and third-party promotional materials are not included in that licence.** Logo images are referenced from the official Sandbox website; they have not been copied into this repository. Make sure the business has permission to use all uploaded images.
