# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this project is

**CompTool** is the source for **"NAPA GasGauge Market Insights"** — a single-page
React app that provides ZIP-code-based anesthesia workforce and compensation
intelligence for CRNAs and Anesthesiologists (MD/DO) and Anesthesiologist
Assistants (AA). A user enters a US ZIP code + search radius and gets:

- Compensation benchmarks (base, bonus, benefits, sign-on, CME, PTO, 401k) vs national averages
- Local workforce shortage classification
- Live job postings (Indeed via Apify, plus a free AI web-search fallback)
- AI-generated sample role datasets, market analysis, and a nearby-facilities map
- PDF/print export

The product is branded for **NAPA (North American Partners in Anesthesia)**.

## The single most important thing to know

**The entire application is one file: `README.md`.** Despite the `.md`
extension, the file contains raw, unwrapped **React/JSX source** (starting with
`import { useState … } from "react"` on line 2). It is not Markdown, and it is
not documentation. There is:

- **No `package.json`**, no `node_modules`, no lockfile
- **No build system** (Vite/webpack/Next/CRA), no bundler config
- **No test suite**, no linter/formatter config
- **No other source files** — `README.md` is the whole repo

The code is written to be dropped into a **browser-based React runtime that
resolves bare imports and proxies the Anthropic API** — i.e. a Claude
Artifact / canvas-style sandbox — rather than compiled by a local toolchain.
That environment is why direct `fetch("https://api.anthropic.com/v1/messages")`
calls work **without an API key** (see External integrations below).

When asked to change "the app," edit `README.md`. When the user references
"the code" or "the component," they mean this file.

## File layout inside `README.md`

The file is organized top-to-bottom into clearly commented sections
(`// ── SECTION ──`):

| Lines (approx) | Section | Purpose |
|---|---|---|
| 1–5 | Imports | `react`, `recharts` |
| 7–19 | Constants | `FF` (font stack), `N` (color palette), `shortage*` maps, `fmt()` |
| 21–64 | Data engine | `geocodeZip`, `reverseGeocode`, `dateRangeMultiplier`, `syntheticWorkforceFromCoord` |
| 66–88 | Shared UI | `Tip`, `Badge`, `Btn`, `TabBar` |
| 90–95 | `SOURCE_CONFIG` | Job-board metadata (Indeed, GasWork, GasJobs) |
| 97–633 | `LiveJobsTab` | Apify Indeed scraper + web-search fallback, filtering, averages tables |
| 635–933 | `PasteJobsPanel` / `ManualJobEntry` | Scrape pasted job URLs; manual entry |
| 934–1107 | `PostedRolesTab` | AI-generated sample role dataset ("Sample Roles" tab) |
| 1108–1274 | `CompWizard` | Modal to override/customize workforce comp values |
| 1275–1434 | `ExportPDFModal` | PDF export via CDN `html2canvas` + `jsPDF`, and print preview |
| 1435–1497 | `OverviewCompare` | Market-vs-NAPA comparison table |
| 1498–1543 | `AIAnalysisTab` | AI market narrative |
| 1544–1568 | `JobsTab` | External job-board deep links |
| 1569–1627 | `MapTab` | Leaflet map (CDN) + AI-listed nearby facilities |
| 1628–1809 | `MethodologyTab` | "Data Sources" accordion |
| 1810–1998 | `App` (default export) | Search form, results header, tab router |

The top-level component is `export default function App()`. Tabs are switched by
the `tab` state and rendered conditionally near the bottom of `App`. The tab
keys and labels are declared in the `TabBar` `tabs={[…]}` prop
(`overview`, `live`, `paste`, `posted`, `map`, `ai`, `jobs`, `methodology`).

## Data model & core logic

- **`syntheticWorkforceFromCoord(lat, lng, cityLabel, dateRange)`** is the heart
  of the app. It **synthesizes** compensation and shortage data from coarse
  regional heuristics (Northeast / West Coast / South / Midwest / rural),
  a cost-of-living base, and a `dateRangeMultiplier`. It uses `Math.random()`,
  so **outputs vary between runs** — this is synthetic/estimated data, not a
  real dataset. National baselines are hard-coded: **MD ≈ $443K, CRNA ≈ $228K**
  total comp. It returns the `wf` object threaded through nearly every tab.
- **Roles** are represented as `"MD"`, `"CRNA"`, `"AA"` throughout.
- **Salary parsing** is done ad hoc in each tab (`parseSalaryMid`,
  `extractJobFromPage`, `normalizeApifyJob`) with regex + sanity bounds
  (typically $50K–$2M/$3M). Averages are always **midpoints of disclosed
  ranges**, and only over postings that disclose salary.

## External integrations (all client-side `fetch`)

1. **OpenStreetMap Nominatim** — ZIP → lat/lng geocode and reverse geocode.
   Public, no key. Sends a `User-Agent: NAPAWorkforceTool/1.0` header.
2. **Anthropic Messages API** (`https://api.anthropic.com/v1/messages`) — called
   **directly from the browser with no `x-api-key` header**. Used for: web-search
   job fallback, AI sample-role generation, AI market analysis, and map facility
   listing. Model pinned to `claude-sonnet-4-20250514`. This only works because
   the host runtime injects credentials/proxies the request; it will fail in a
   plain browser.
3. **Apify** — two actors: `valig~indeed-jobs-scraper` (live Indeed jobs, needs a
   user-supplied token entered in the UI) and `apify~rag-web-browser` (scraping
   pasted job URLs).
4. **CDN scripts loaded at runtime** via injected `<script>`/`<link>`:
   `html2canvas` + `jspdf` (PDF export) and `leaflet` (map).

### ⚠️ Security note — hardcoded credential
`PasteJobsPanel` contains a **hardcoded Apify API token** (currently around
line 643: `const APIFY_TOKEN = "apify_api_…"`). This is a leaked secret. If you
touch that area, flag it: the token should be user-supplied (as `LiveJobsTab`
already does) or injected via the host environment, never committed. Do not add
new hardcoded secrets.

## Coding conventions

Match the existing style — it is deliberate and consistent:

- **Ultra-compact, near-minified code.** Multiple statements per line, terse
  names, chained ternaries. Keep new code at the same density; do not reformat
  or "prettify" existing code in unrelated diffs.
- **Inline styles only.** Every element is styled with a `style={{…}}` object.
  There is no CSS file and no CSS framework (aside from one small `<style>` block
  of global resets/keyframes inside `App`).
- **Use the palette.** All colors come from the `N` object (NAPA navy/blue/teal
  plus grays and status colors). Never hardcode hex values that duplicate an
  existing `N` entry. Use `FF` for `fontFamily`.
- **Shared primitives.** Reuse `Badge`, `Btn`, `TabBar`, `Tip`, and the `fmt()`
  currency formatter rather than re-implementing them.
- **Emoji** are used intentionally as inline iconography throughout the UI.
- Components are plain function components using `useState` / `useEffect` /
  `useRef`. No external state library, no routing library.

## Working in this repo

- **There is nothing to install, build, run, or test locally** — no scripts
  exist. Do not invent a `package.json` or fabricate `npm run …` commands unless
  the user explicitly asks you to set up tooling.
- To sanity-check a change, the practical path is to render `README.md`'s
  contents in a compatible React sandbox (the runtime it was authored for).
  Because there's no compiler, **read carefully for JSX/JS correctness** —
  unbalanced braces, undefined variables, or bad hooks usage won't be caught by
  any local check.
- Note one existing quirk in `LiveJobsTab`: `filtered` and `avgRows` reference
  `allJobs` slightly before its `const` declaration in source order (they're
  inside render-time expressions, so it works via closure at call time). Preserve
  behavior; don't "fix" it into a runtime error.
- Keep everything in the single `README.md` file unless the user explicitly asks
  to split the project into a real build. Adding files silently will break the
  "paste one file into the sandbox" workflow this project depends on.

## Git workflow

- Active development branch for this work: **`claude/claude-md-docs-eiwwh0`**.
- Commit with clear, descriptive messages and push with
  `git push -u origin <branch>`.
- Do **not** open a pull request unless explicitly asked.
