# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape (read this first)

This repo is **not** a conventional project layout. The entire application — a
single-page React app named "NAPA GasGauge Market Insights" (CompTool) — lives
inside `README.md` as raw JSX. There is:

- No `package.json`, no `src/`, no build config, no test runner, no lint config.
- No `.gitignore`, no CI, no environment files.
- One file at the repo root: `README.md` (~2000 lines of JSX beginning with `import { useState, ... }`).

When asked to change "the code", edit `README.md`. When the user refers to a
component or tab, search `README.md` for the component name (`grep -n '^function'
README.md` lists every top-level definition quickly).

There is no `npm install`, `build`, `test`, or `lint` command. If the user asks
to run or preview the app, tell them the file must first be extracted to a
`.jsx` in a React host (Vite, CRA, Next, or the canvas/Claude artifact runtime
it appears to have been authored in) — don't invent a build command that
doesn't exist.

## Application architecture

Single default export at the bottom of `README.md`: `export default function
App()`. Everything above it is either a shared helper, a shared UI primitive, or
one of the tab components `App` mounts.

### Data flow

1. User enters a 5-digit ZIP + radius + date range in `App`.
2. `geocodeZip` → Nominatim (OpenStreetMap) returns lat/lng.
3. `reverseGeocode` → Nominatim returns a `"City, ST"` label.
4. `syntheticWorkforceFromCoord(lat, lng, cityLabel, dateRange)` computes the
   entire workforce object (`wf`) **deterministically from geographic
   clusters** — `isNE / isWC / isSouth / isMW / isRural` flags select base
   numbers, then `dateRangeMultiplier` applies a 3.2%/yr forward-comp trend.
   All overview/benchmark figures are modeled here, not fetched. Treat this
   function as the single source of truth for MD/CRNA comp, shortage tier,
   COL index, sign-on, PTO, 401k match, CME, malpractice, relocation, etc.
5. Result state `{ zip, geo, city, wf, radius }` feeds every tab.

### Tabs (rendered by `App` via the `tab` state)

Each tab is its own top-level function component in `README.md`:

- `LiveJobsTab` — Real job postings. **Dual-path fetch:** if the user enters an
  Apify token, runs `valig/indeed-jobs-scraper` twice in parallel (CRNA +
  anesthesiologist) via `runApifyActor`, polls the run for up to 90s, then
  normalizes with `normalizeApifyJob`. Without a token, falls back to
  `fetchViaWebSearch` which calls the Anthropic Messages API with the
  `web_search_20250305` tool and extracts a JSON array from the response.
- `PasteJobsPanel` + `ManualJobEntry` — Lets the user paste raw job-listing
  text for Claude to structure, or enter a job by hand.
- `PostedRolesTab` — Asks Claude to generate a sample roles dataset for the
  region.
- `MapTab` — Leaflet map. **Expects `window.L` to already be loaded** by the
  host page; there's no bundler to import it.
- `AIAnalysisTab` — Calls Anthropic Messages API with a prompt that demands a
  strict JSON shape (`marketSummary`, `compPressure`, `talentFlow`, `hotSpots`,
  `recruitStrategies`, `watchOut`, `outlook`) and parses it after stripping
  markdown fences.
- `JobsTab` — Static deep links to external boards (ASA, AANA, BagMask, NEJM,
  Indeed) templated with the current location.
- `MethodologyTab` — Documentation of data sources (BLS OEWS, MGMA, AANA,
  ASA, C2ER COLI, Indeed, GasWork, GasJobs, Claude synthetic).

Plus two modals launched by `App`: `CompWizard` (lets the user override the
computed `wf`) and `ExportPDFModal`. `OverviewCompare` is embedded in the
Overview tab.

### Shared primitives

- `N` — hex color palette (navy/blue/teal/gray/amber/red/green/orange with
  `*Lt` light variants). Every color reference uses `N.*`; don't introduce
  raw hex.
- `FF` — the single font-family string applied inline.
- `fmt(v)` — currency formatter that renders `≥1000` as `$XXXK`.
- `shortageColor` / `shortageBg` / `shortageLabel` — maps keyed by
  `"low" | "moderate" | "high" | "critical"`.
- `Tip`, `Badge`, `Btn`, `TabBar` — the only shared UI components. Reuse
  them rather than hand-rolling buttons/badges.
- `SOURCE_CONFIG` — Indeed / GasWork / GasJobs display + apply-URL config.
- Role constants throughout: `"MD"`, `"CRNA"`, `"AA"`. Color maps are
  `{ MD: N.blue, CRNA: N.teal, AA: N.navy }`.

### External services called directly from the browser

- Nominatim (`nominatim.openstreetmap.org`) — geocoding, no auth.
- Apify (`api.apify.com`) — actor `valig/indeed-jobs-scraper`; token pasted
  into the UI by the user at runtime.
- Anthropic Messages API (`api.anthropic.com/v1/messages`) — model
  `claude-sonnet-4-20250514`; called directly from the browser for web
  search, sample roles, and AI analysis. There is no proxy or backend.
- Leaflet via `window.L`, Recharts via module import.

If you modernize model IDs or API shapes, update all three call sites
(`fetchViaWebSearch` in `LiveJobsTab`, `PostedRolesTab`, `AIAnalysisTab`) —
they each have their own `fetch` call.

## Conventions in this codebase

- **Inline styles only.** There is no CSS file. Every component styles itself
  with a `style={{ ... }}` object that references `N.*` and `FF`. Match this
  pattern; don't introduce Tailwind, styled-components, or class names.
- **Terse one-liner style.** Many helpers (e.g. `syntheticWorkforceFromCoord`,
  `Tip`, `Badge`) pack multiple statements per line with short identifiers
  (`r`, `d`, `wf`, `N`, `FF`). When editing nearby code, preserve the style of
  the surrounding block rather than reformatting it.
- **Region clusters are load-bearing.** The `isNE / isWC / isSouth / isMW /
  isRural` branches in `syntheticWorkforceFromCoord` determine every number
  downstream. Changing a threshold shifts the whole benchmark model.
- **Role filtering lives in the component.** Each tab re-filters jobs by role
  (MD/CRNA/AA) and source locally; there's no global store.
- **API tokens stay in component state.** Never persist them — `apifyToken`
  is a `useState` in `LiveJobsTab`, intentionally in-memory.

## Git workflow

Active branch for documentation/related changes: `claude/add-claude-documentation-sOD1u`.
`main` is the default. Push with `git push -u origin <branch>`.
