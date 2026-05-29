# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

CompTool is a single-file React application: an **anesthesia workforce compensation comparison tool** (branded "NAPA Workforce Tool" in outbound request user-agents). A user enters a US ZIP code; the app geocodes it, then shows regional compensation data and live anesthesia job postings for that area, broken down by role (MD / CRNA / AA).

## ⚠️ The entire app lives inside `README.md`

There is exactly one file in this repo: `README.md`. Despite the name, it is **not documentation** — it is the full ~2000-line React/JSX source. Line 1 is a stray markdown header (`# CompTool`); line 2 onward is real code starting with `import { useState, useRef, useEffect } from "react";`.

When editing the app, edit the JSX inside `README.md`. There is **no build system, no `package.json`, no bundler config, no tests, and no lint setup** — so there are no build/lint/test commands to run. To actually run this code you would first need to extract it into a real `.jsx`/`.tsx` entry file inside a React project (Vite/CRA/Next) and add its two runtime dependencies: **`react`** and **`recharts`**. Don't invent or document commands that don't exist in the repo.

## Architecture / data flow

The app is one component tree with a root component (the default export) that owns the ZIP-code input and orchestrates everything else. The flow:

1. **Location resolution** — `geocodeZip(zip)` and `reverseGeocode(lat,lng)` call the OpenStreetMap **Nominatim** API to turn a ZIP into coordinates + a human-readable `locLabel`.
2. **Compensation data** — `syntheticWorkforceFromCoord(lat, lng, cityLabel, dateRange)` produces region-bucketed (Northeast / West Coast / South / Midwest / rural) synthetic comp figures for MD and CRNA roles (base, bonus, benefits, sign-on, PTO, 401k, CME, malpractice, relocation, and national-difference %). `dateRangeMultiplier()` inflates values by year (baseline 2024, ~+3.2%/yr). This synthetic model is the always-available data source; it is **not** a live salary feed.
3. **Live job postings** — `LiveJobsTab` fetches real anesthesia listings. Two paths:
   - **Apify** (preferred): the user pastes an Apify API token into a password field at runtime (held in `apifyToken` state, never committed). `runApifyActor()` runs the `valig~indeed-jobs-scraper` actor and polls up to ~90s. `normalizeApifyJob()` maps raw results into the app's job shape — including decoding Apify's obfuscated codes (e.g. job-type `CF3CP` → "Full-Time", benefit `EY33Q` → "Health insurance") and inferring role (MD/CRNA/AA) from title/description.
   - **Anthropic web-search fallback** (free, no token): `fetchViaWebSearch()` calls the Anthropic Messages API directly from the browser (`claude-sonnet-4-20250514` with the `web_search_20250305` tool) and parses a JSON job array out of the response via `extractJSON()`.
   - Salaries are normalized through `parseSalaryMid()`, which only accepts midpoints in a sane $50K–$2M range.
4. **Manual entry** — users can also paste raw job text; parsed results flow through as `pastedJobs` and are merged with fetched jobs.
5. **Presentation** — results render in a tabbed UI (`TabBar`) with `recharts` visualizations, an "Average Salary by Role & Source" table, and table/card views with role/source filtering and sorting.

All external calls are **client-side `fetch`** with no backend — there is no server, proxy, or secret storage. Tokens and any API keys are entered/handled in the browser at runtime.

## Conventions specific to this codebase

- **Styling is 100% inline.** There are no CSS files. Two module-level constants drive all visuals:
  - `N` — the color palette object (`navy`, `blue`, `teal`, gray scale, semantic `amber`/`red`/`green`/`orange` plus `*Lt` light variants). Reuse these names instead of hardcoding hex.
  - `FF` — the shared font-family string.
- **Reuse the shared primitives** rather than re-rolling them: `Btn` (variants `primary`/`teal`/`ghost`), `Badge`, `Tip` (custom recharts tooltip), `TabBar`.
- **Domain vocabulary is fixed:** roles are `MD` / `CRNA` / `AA`; shortage levels are `low` / `moderate` / `high` / `critical` (mapped through `shortageColor`, `shortageBg`, `shortageLabel`); job sources are `indeed` / `gaswork` / `gasjobs` (see `SOURCE_CONFIG`).
- **Code style is intentionally dense** — compact one-liners, heavy ternaries, terse names. Match the surrounding density when editing rather than reformatting wholesale.

## Known issue (don't "fix" unless asked)

In `LiveJobsTab`, `filtered` and `avgRows` reference `allJobs` before its `const` declaration appears later in the same function body — a temporal-dead-zone hazard. Be aware of it; only address it if the task calls for it.

## Git workflow

Active development branch: `claude/claude-md-docs-Hetim`. Commit with clear messages and push with `git push -u origin <branch>`. Do not open a PR unless explicitly asked.
