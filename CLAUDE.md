# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

CompTool is a single-file React application called **"GasGauge Market Insights"** — a ZIP-code-based anesthesia workforce/compensation tool branded for **NAPA (North American Partners in Anesthesia)**. The user enters a US ZIP code + radius; the app geocodes it and shows regional compensation benchmarks and live anesthesia job postings, broken down by role (**MD** / **CRNA** / **AA**).

## ⚠️ The entire app lives inside `README.md`

There is exactly one source file in this repo: **`README.md`** (~2000 lines). Despite the name and the leading `# CompTool` markdown header on line 1, the file is **React/JSX source**, not documentation — real code begins on line 2 with `import { useState, useRef, useEffect } from "react";`. When changing the app, edit the JSX inside `README.md`.

There is **no `package.json`, build config, bundler, linter, or test suite** in the repo, so there are no build/lint/test commands to run. The file is written to be dropped into a React host (it `export default function App()` and imports `react` + `recharts`). It reads like a **Claude.ai Artifact**: it calls `https://api.anthropic.com/v1/messages` with **no auth header**, which only works in an environment that proxies/injects credentials (e.g. the Claude artifact runtime). To run it standalone you would need to scaffold a React project (Vite/CRA), supply those two deps, and provide an Anthropic API proxy. Don't fabricate commands that don't exist here.

## Architecture & data flow

Root component is `App` (the default export, ~line 1811). It owns the search inputs (`zip`, `radius`, `dateRange`) and, on search, runs this pipeline:

1. **Geocode** — `geocodeZip(zip)` → OpenStreetMap **Nominatim** for lat/lng; `reverseGeocode()` for a `city` / `locLabel`.
2. **Synthetic comp model** — `syntheticWorkforceFromCoord(lat,lng,city,dateRange)` returns the `wf` object: region-bucketed (NE / West Coast / South / Midwest / rural) MD & CRNA figures (base, bonus, benefits, sign-on, PTO, 401k, CME, malpractice, relocation, national-diff %, cost-of-living index, shortage level). `dateRangeMultiplier()` inflates by year (~+3.2%/yr off a 2024 baseline). This deterministic model is the always-on data source — **not** a live salary feed.
3. **Result + tabs** — the `wf` flows into a `TabBar` with 8 tabs, each its own component:
   - `overview` → inline cards + `OverviewCompare` (Market vs NAPA-estimate vs National).
   - `live` → **`LiveJobsTab`**: real Indeed jobs via **Apify** actor `valig~indeed-jobs-scraper` (token typed into a runtime field), with an **Anthropic web-search fallback** (`fetchViaWebSearch`) when no token. `normalizeApifyJob` decodes Apify's obfuscated codes (job-type `CF3CP`→"Full-Time", benefit `EY33Q`→"Health insurance", etc.) and infers role from title/description.
   - `paste` → **`PasteJobsPanel`** / `ManualJobEntry`: scrape arbitrary job URLs via Apify `apify~rag-web-browser` and regex-extract salary/role, or enter jobs by hand.
   - `posted` → **`PostedRolesTab`**: asks the Anthropic API to generate 28 modeled postings, then lets you select/deselect to watch averages shift.
   - `map` → **`MapTab`**: Leaflet (loaded from CDN at runtime) with a radius circle; "nearby facilities" come from an Anthropic API call.
   - `ai` → **`AIAnalysisTab`**: Anthropic API narrative market analysis (JSON-parsed).
   - `jobs` → **`JobsTab`**: static external links to ASA/AANA/BagMask/NEJM/Indeed pre-filled with location.
   - `methodology` → **`MethodologyTab`**: static documentation of data sources & caveats.
   - `CompWizard` (modal) lets the user override `wf` comp inputs; `ExportPDFModal` screenshots `#gasgauge-root` via html2canvas + jsPDF (both CDN-loaded).

All network calls are **client-side `fetch`** — no backend. Three patterns recur: Nominatim (geocode), Apify (job scraping, needs token), and the Anthropic Messages API (`model: "claude-sonnet-4-20250514"`, used for generated datasets, analysis, and the web-search fallback).

## Conventions specific to this codebase

- **Styling is 100% inline** — no CSS files. Two module-level constants drive everything; reuse them instead of hardcoding:
  - `N` — the color palette (`navy`/`blue`/`teal` + `*Lt` light variants, gray scale, semantic `amber`/`red`/`green`/`orange`).
  - `FF` — the shared font-family string.
- **Reuse the shared primitives** near the top of the file rather than re-rolling: `Btn` (variants `primary`/`teal`/`ghost`), `Badge`, `Tip` (custom recharts tooltip), `TabBar`. `SOURCE_CONFIG` maps job sources `indeed`/`gaswork`/`gasjobs`.
- **Fixed domain vocabulary:** roles `MD`/`CRNA`/`AA`; shortage levels `low`/`moderate`/`high`/`critical` (mapped via `shortageColor`/`shortageBg`/`shortageLabel`).
- **Code is intentionally dense** — compact one-liners, heavy ternaries, terse names. Match the surrounding density when editing; don't reformat wholesale.

## Gotchas (don't "fix" unless the task calls for it)

- **Hardcoded secret:** `PasteJobsPanel` has a real Apify token inlined in the source (`const APIFY_TOKEN = "apify_api_..."` ~line 643). If you touch that area, flag it / move it out rather than copying the pattern; note the `LiveJobsTab` token is correctly user-entered at runtime instead.
- **Temporal-dead-zone hazard in `LiveJobsTab`:** `filtered` and `avgRows` reference `allJobs` before its `const allJobs = [...]` declaration appears later in the same function body. Be careful when editing that region.

## Git workflow

Active development branch: `claude/claude-md-docs-Hetim`. Commit with clear messages; push with `git push -u origin <branch>`. Do not open a PR unless explicitly asked.
