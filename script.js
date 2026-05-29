// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

/**
 * Live Denver-area software engineering openings.
 * Snapshot sourced from Indeed (May 2026). Each entry links to the live
 * Indeed posting — update or re-pull these as roles change.
 */
const OPENINGS = [
  {
    title: "Software Engineer I",
    company: "DAT Solutions",
    location: "Denver, CO",
    pay: "$117K–$135K / yr",
    type: "Full-time",
    url: "https://to.indeed.com/aa92ynfw9vwd",
  },
  {
    title: "Software Engineer Level 4",
    company: "Northrop Grumman",
    location: "Aurora, CO",
    pay: "$142K–$213K / yr",
    type: "Full-time",
    url: "https://to.indeed.com/aazkcr7blnsv",
  },
  {
    title: "Software Engineer 1",
    company: "Garmin",
    location: "Boulder, CO",
    pay: "$95K–$105K / yr",
    type: "Full-time",
    url: "https://to.indeed.com/aawq6ynlxyyd",
  },
  {
    title: "Software Engineer, New College Grad — 2026",
    company: "Visa",
    location: "Highlands Ranch, CO",
    pay: "$98K / yr",
    type: "Full-time",
    url: "https://to.indeed.com/aabgj4ptqdbx",
  },
  {
    title: "Software Engineer I",
    company: "DAT Solutions",
    location: "Denver, CO",
    pay: "$85K–$118K / yr",
    type: "Full-time",
    url: "https://to.indeed.com/aatflf6w62ph",
  },
  {
    title: "Software Developer II — Contractor",
    company: "Spectra Logic",
    location: "Boulder, CO",
    pay: "$54–$74 / hr",
    type: "Contract",
    url: "https://to.indeed.com/aamkmzncmdrh",
  },
  {
    title: "Software Developer — AI Trainer",
    company: "DataAnnotation",
    location: "Brighton, CO",
    pay: "$50–$100 / hr",
    type: "Contract",
    url: "https://to.indeed.com/aac4qvr4jrgp",
  },
];

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

function renderOpenings() {
  const root = document.getElementById("jobs");
  if (!root) return;
  root.innerHTML = OPENINGS.map((job) => `
    <article class="job">
      <div class="job__main">
        <a class="job__title" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(job.title)} <span class="job__arrow" aria-hidden="true">→</span>
        </a>
        <div class="job__meta">
          <span class="job__company">${escapeHtml(job.company)}</span> · ${escapeHtml(job.location)}
        </div>
      </div>
      <div class="job__pay">
        ${escapeHtml(job.pay)}
        <span class="job__type">${escapeHtml(job.type)}</span>
      </div>
    </article>
  `).join("");
}

renderOpenings();

// Reveal sections on scroll
const revealEls = document.querySelectorAll(".section, .hero__facts");
revealEls.forEach((el) => el.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}
