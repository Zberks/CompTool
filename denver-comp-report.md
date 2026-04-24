# Denver Anesthesia Compensation Brief

**NAPA GasGauge Market Insights · Denver, CO (ZIP 80202 · 25-mile radius)**
*Reporting period: April 2026 · Live postings + synthetic benchmark reconciliation*

---

## Executive summary

The Denver anesthesia market shows **moderate demand** with compensation
running roughly in line with the national average. Across ~61 active
listings (40 anesthesiologist · 21 CRNA), salary-disclosing postings and
aggregator surveys produce a blended midpoint of **~$345K** (all roles,
inventory-weighted). The synthetic GasGauge model overshoots live midpoints
by single digits — within methodology noise, but consistent with Denver
currently routing through the national fallback bucket rather than a
Mountain-West-specific cluster.

| Headline metric | Value |
|---|---:|
| Open MD listings (Denver metro) | ~40 |
| Open CRNA listings (Denver metro) | ~21 |
| MD total comp (live blended midpoint) | **~$411K** |
| CRNA total comp (live blended midpoint, W-2 anchored) | **~$220K** |
| Cost-of-living index (model output) | 100 |
| Shortage tier | Moderate |

---

## Anesthesiologist (MD) compensation

### By source

| Source | Salary midpoint | Method |
|---|---:|---|
| ZipRecruiter | $405,649 | Aggregator estimate |
| Salary.com | $450,600 | Aggregator estimate |
| SalaryExpert (ERI) | $457,620 | Aggregator estimate |
| Indeed (from postings) | $332,119 | Actual posting avg, n = 7 (36 mo) |
| Anthony North / Westminster | ~$505,000 | Live posting, $207–$280/hr |
| Colorado outlier posting | ~$683,000 | Live posting, $625K–$740K |

- **Source-blended MD midpoint (4 aggregators):** ~$411K
- **Experience tail:** entry-level ~$299K → senior (8+ yr) ~$626K
- **vs. national anchor ($443K):** −7% at blended midpoint

## CRNA compensation

### By source

| Source | Salary midpoint | Method |
|---|---:|---|
| Salary.com | $247,613 | Aggregator estimate, $119/hr |
| IncredibleHealth / talent.com | $192,590 | Aggregator, $97/hr |
| Indeed (Denver hourly, annualized) | ~$355,000 | $171/hr × 2,080 — locum-skewed |
| ZipRecruiter Denver | $94–$227/hr range | Mixed W-2 + 1099 |

- **Source-blended CRNA midpoint (W-2 anchors):** ~$220K
- **Locum / 1099 hourly figures intentionally excluded** from blended
  average — they distort annualized comparisons by $100K+
- **vs. national anchor ($228K):** essentially flat

---

## Active inventory snapshot

**Top employers surfacing in current postings:**

UCHealth · Denver Health · US Anesthesia Partners · St. Anthony Hospital ·
Vail Health · Sound Physicians · Community Hospital · Jackson Physician
Search · Clinical Colleagues · CU Anschutz / School of Medicine · Wray
Community District Hospital

**Representative current openings:**

- Autonomous office-based CRNA group, aesthetic plastic surgery practice — Highlands Ranch
- OB-focused CRNA, Denver anesthesia practice — competitive comp, flexible scheduling
- Denver Health — Level I trauma, 555-bed academic medical center, CRNA openings
- Anthony North Hospital, Westminster — anesthesiologist, $207–$280/hr
- CU Anschutz — academic anesthesiology faculty positions

---

## Model reconciliation

GasGauge synthetic model output (default-region branch, mult = 1.000 at
mid‑year 2024) vs. live April‑2026 market:

| Metric | Synthetic model | Live midpoint | Δ |
|---|---:|---:|---:|
| MD total comp | $440K | ~$411K | model **+7%** |
| MD base salary (.78) | $343K | — | — |
| CRNA total comp | $228K | ~$220K | model **+4%** |
| CRNA base salary (.84) | $191K | — | — |
| Sign-on (MD / CRNA) | $50K / $28K | rarely disclosed | n/a |
| 401(k) match (MD / CRNA) | 5% / 4% | rarely disclosed | n/a |
| PTO days (MD / CRNA) | 30 / 28 | rarely disclosed | n/a |

**Interpretation.** Single-digit overshoot on both roles is well inside
the methodology tab's stated noise band. The most actionable observation
is structural: Denver's lat/lng (39.74, −104.99) currently fails every
region flag in `syntheticWorkforceFromCoord` (`lng=-104.99` falls just
west of the `-100` Midwest cutoff), so the model is using the national
default rather than a Mountain-West calibration. A dedicated `isRockies`
cluster would tighten Denver and similar metros (SLC, Boise) to within
~2% of live.

---

## Methodology

**Pipeline (mirrors GasGauge `MethodologyTab`):**

1. ZIP → Nominatim geocode → lat/lng
2. Region cluster (NE/WC/South/MW/Rural — Denver currently → default)
3. National anchors: BLS OEWS, MGMA, AANA, ASA
4. C2ER Cost-of-Living Index applied
5. Date-range multiplier (3.2%/yr forward trend; April 2026 → mult ≈ 1.064)
6. Live job-board fetch (Indeed via web search; Apify path not used here)
7. Reconciliation against modeled benchmarks

**Caveats:**

- Anesthesia postings disclose salary on ~30–40% of listings.
- CRNA hourly figures blend W-2 and locum/1099, inflating annualized averages.
- Single-posting outliers (e.g., the $625–$740K Colorado listing) are reported
  individually but excluded from blended midpoints.
- AI- and aggregator-derived figures are directional, not audit-grade.
- NAPA-specific comp figures are modeled from public market data and do not
  represent verified or official NAPA compensation offers.

---

## Sources

**Aggregator salary data:**

- [CRNA salary in Denver, CO — Salary.com](https://www.salary.com/research/salary/benchmark/certified-nurse-anesthetist-crna-salary/denver-co)
- [Anesthesiologist salary in Denver, CO — Salary.com](https://www.salary.com/research/salary/alternate/anesthesiologist-salary/denver-co)
- [Anesthesiologist salary in Denver — ZipRecruiter](https://www.ziprecruiter.com/Salaries/Anesthesiologist-Salary-in-Denver,CO)
- [Anesthesiologist salary in Denver — SalaryExpert (ERI)](https://www.salaryexpert.com/salary/job/anesthesiologist/united-states/colorado/denver)
- [CRNA Denver — IncredibleHealth](https://www.incrediblehealth.com/salaries/crna/co/denver)
- [Anesthesiologist salary in Denver — Indeed](https://www.indeed.com/career/anesthesiologist/salaries/Denver--CO)
- [CRNA salary in Denver — Indeed](https://www.indeed.com/career/certified-registered-nurse-anesthetist/salaries/Denver--CO)
- [CRNA salary by state 2026 — Nurse.org](https://nurse.org/resources/nurse-anesthetist-salary/)

**Live inventory:**

- [21 CRNA jobs in Denver — Glassdoor](https://www.glassdoor.com/Job/denver-crna-jobs-SRCH_IL.0,6_IC1148170_KO7,11.htm)
- [40 anesthesiologist jobs in Denver — Glassdoor](https://www.glassdoor.com/Job/denver-anesthesiologist-jobs-SRCH_IL.0,6_IC1148170_KO7,23.htm)
- [CRNA jobs in Denver — ZipRecruiter](https://www.ziprecruiter.com/Jobs/Crna/-in-Denver,CO)
- [CU Anschutz Anesthesiology — Career Opportunities](https://medschool.cuanschutz.edu/anesthesiology/about/career-opportunities)

---

*© North American Partners in Anesthesia (NAPA) · GasGauge Market Insights*
*Data: BLS OES · MGMA · AANA · ASA · C2ER COLI · Indeed · live web search · 2024–2026*
