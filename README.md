# hromoepilogi.gr

Single-page site for **Χρωμοεπιλογή — Καρράς** (paint & coatings, Ιωάννινα, since 1963).

Plain static HTML/CSS/JS. No build step. Contact form is progressively enhanced — works as a `mailto:` link with zero backend, or POSTs to a tiny Cloudflare Worker if you want real email delivery.

## Files

```
index.html          # the page
styles.css          # design system + layout
main.js             # contact form handler + small enhancements
assets/logos/       # company + 15 vendor logos
worker/             # optional Cloudflare Worker for the contact form
  contact-worker.js
  wrangler.toml
```

## Local preview

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy — GitHub Pages

1. Push this directory to a (private or public) GitHub repo.
2. Repo → Settings → Pages → Source: `Deploy from a branch` → `main` / `/` (root).
3. Set a custom domain if you have one (`www.hromoepilogi.gr`) and add the `CNAME` record.
4. Done — the form opens the visitor's mail client (mailto fallback) as long as `window.CONTACT_ENDPOINT` is empty.

## Deploy — Cloudflare Pages (recommended)

Pages serves the static site, the Worker handles the form.

### 1. Static site

```sh
# from this directory, with wrangler authenticated:
npx wrangler pages deploy . --project-name=hromoepilogi
```

Or wire it up via the dashboard pointing at your private GitHub repo (no build command, output directory = `/`).

### 2. Contact-form Worker

```sh
cd worker
npm i -g wrangler   # if not installed
wrangler login

# Set the destination email + verified sender (Resend account):
#   https://resend.com → API Keys → create a key
wrangler secret put RESEND_API_KEY

# (Edit wrangler.toml first to set FROM_EMAIL, TO_EMAIL, ALLOWED_ORIGIN.)
wrangler deploy
```

You'll get a URL like `https://chromo-contact.<your-account>.workers.dev`.

### 3. Point the form at the Worker

In `main.js`, set:

```js
window.CONTACT_ENDPOINT = "https://chromo-contact.<your-account>.workers.dev";
```

Commit, redeploy Pages, done.

## Editing content

- **Vendor logos:** add/remove `<li>` entries inside `.logo-wall` in `index.html`. Drop the file into `assets/logos/`.
- **Services:** edit the six `<li>` items inside `.service-list`.
- **Hours / address / phone:** update the `<dl class="meta">` block in `index.html` and the JSON-LD in `<head>`.
- **Colors:** edit the CSS custom properties at the top of `styles.css` (`--accent`, `--accent-2`, …).

## Notes

- All text is Greek.
- Mobile-first; tested down to 320px width.
- The hero swatches and "1963" number are decorative — `aria-hidden`, screen-reader-friendly.
- The contact form has an invisible honeypot field; the Worker also supports optional per-IP rate limiting via Cloudflare KV (see `wrangler.toml`).
