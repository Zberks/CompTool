# Zach Berks — Job Opportunities Site

A fast, static personal website for **Zach Berks**, a software engineer
exploring new opportunities in the **Denver, Colorado** area.

> Note: this site lives alongside the existing `CompTool` app (see `README.md`).
> The site is just `index.html` + `styles.css` + `script.js` — no build step,
> no dependencies.

## Files

- `index.html` — page content (hero, about, experience, skills, live openings, contact)
- `styles.css` — dark theme, responsive layout, subtle scroll animations
- `script.js` — footer year, scroll reveal, and the live Denver openings list

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Customize

- **About / Experience / Skills** use placeholder copy (`20XX`, "Most Recent
  Role", etc.). Replace with your real story, dates, stack, and metrics.
- **LinkedIn** in the contact section points to a placeholder URL — swap in
  your profile.
- **Live openings** are defined in the `OPENINGS` array in `script.js`. They're
  a May 2026 snapshot from Indeed; re-pull or edit them as roles change.

## Deploy

Works out of the box on any static host (Netlify, Vercel, GitHub Pages,
Cloudflare Pages). For GitHub Pages, enable Pages and point it at the branch root.
