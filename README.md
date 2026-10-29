# hromoepilogi.gr

Single-page site for **Χρωμοεπιλογή — Καρράς** (paint & coatings, Ιωάννινα, since 1963).

Plain static HTML/CSS/JS. No build step, no backend. Visitors reach the shop by phone, email link or the embedded Google Map — there is deliberately no contact form, so there is nothing to abuse.

## Files

```
index.html          # the page
styles.css          # design system + layout
main.js             # small enhancements (footer year)
assets/             # favicon, shop photo
assets/logos/       # company + 15 vendor logos
```

## Local preview

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

The site is hosted on **Cloudflare**, connected to this GitHub repo. Every push to `main` deploys automatically — there is no build step (output directory = `/`).

Workflow:

1. Make changes and check them locally (see *Local preview* above).
2. Commit and push to `main`.
3. Cloudflare picks up the push and the live site updates within a minute or two. Hard-refresh to bypass the browser cache.

The custom domain (`www.hromoepilogi.gr`) is configured in the Cloudflare dashboard, so no `CNAME` file is needed in the repo.

## Editing content

- **Vendor logos:** add/remove `<li>` entries inside `.logo-wall` in `index.html`. Drop the file into `assets/logos/`.
- **Services:** edit the six `<li>` items inside `.service-list`. The layout is 3 × 2, with all six on one row on screens ≥1300px; if you change the count, adjust the `.service-list` grid in `styles.css`.
- **Hours / address / phone:** update the `<dl class="meta">` block in `index.html` and the JSON-LD (`openingHoursSpecification`) in `<head>`.
- **Map:** the `.contact-map` iframe uses a keyless Google Maps embed searching for the shop's listing.
- **Colors:** edit the CSS custom properties at the top of `styles.css` (`--accent`, `--accent-2`, …).

## Notes

- All text is Greek.
- Mobile-first; tested down to 320px width.
- The "1963" number is decorative — `aria-hidden`, screen-reader-friendly.
