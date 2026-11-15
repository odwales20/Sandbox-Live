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

## Live site and Firebase

GitHub Actions publishes the site from `main` to GitHub Pages. The site uses the
[Sandbox Keswick Live Firebase project](https://console.firebase.google.com/project/sandbox-keswick-live/overview)
and its Standard Firestore database in London (`europe-west2`).

- **TV1** shows the live scoreboard when a competition is active and rotates
  adverts when idle.
- **TV2** rotates adverts by default. Use **TV2 adverts** in Control to show a
  single image or resume the slideshow.
- **Control** requires the approved staff account. To set its initial password
  or recover it, enter the account email and select **Set or reset password**.

Firestore listens for changes to `sandboxLive/current` on TV1 and
`sandboxLive/tv2` on TV2. Both documents can be read by the public displays.
Only the staff account can update them. Use public-facing truck names and
artwork. Deploy changes to the rules with
`npx firebase-tools deploy --only firestore:rules`.

Use one scoring operator at a time. Control saves the full competition state
on each edit, and the open staff Control page commits the finish when the
timer reaches zero.

## Adverts

Upload public display artwork to `signage/`. A GitHub Actions workflow updates `signage/images.json` automatically when images are pushed to `main`. TV1 in standby, TV2, and Control refresh the playlist every minute. Recommended image dimensions: 1920×1080. This first version rotates the adverts every 10 seconds.

If the workflow fails, check **Actions → Update signage playlist**, and run it manually. If Actions permissions block commits, set **Settings → Actions → General → Workflow permissions → Read and write permissions**.

## Licence and branding

The original code is MIT licensed (see [LICENSE](./LICENSE)). **Sandbox Café logos, branding, trademarks and third-party promotional materials are not included in that licence.** Logo images are referenced from the official Sandbox website; they have not been copied into this repository. Make sure the business has permission to use all uploaded images.
