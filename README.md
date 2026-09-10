# Toby Math

> I learn it. Then I teach it.

A personal mathematics portfolio and free study site, written and maintained by **Toby**, a Grade 11
student in British Columbia. The site does two honest jobs at once:

- **For learners** — free contest guides, BC grades 10–12 course notes, and printable formula sheets.
- **For the record** — a dated, verifiable account of contest results, teaching, and leadership work.

Everything on the site is dated and honestly kept — no retrofits. It is built for anyone preparing for
math contests (AMC, AIME, Waterloo, COMC, CMO) as much as for the applications ahead.

## Contest highlights (all real and dated)

| Result | Score | Date |
| --- | --- | --- |
| Cayley (Waterloo) — perfect score | 150 / 150 | 2026 · Feb |
| AIME II — qualifier | 10 / 15 | 2026 · Feb |
| AMC 10B — top 5% | 123 / 150 | 2025 · Nov |
| AMC 10A — top 10% | 111 / 150 | 2025 · Nov |
| Fryer (Waterloo) — top ~30 in Canada | 36 / 40 | 2025 · Apr |
| Euclid (Waterloo) — honour roll | 85 / 100 | 2025 · Apr |

The full record, including the story behind the AMC 111 → 123 jump (a mistake log, not more practice),
lives on the [results page](activities/results.html).

## Sections

| Section | What it holds |
| --- | --- |
| [Home](index.html) | Who I am, what you'll find, where to start |
| [Competition Math](competition/index.html) | AMC & AIME roadmaps, Waterloo contests, COMC, CMO, strategy |
| [BC Courses](courses/index.html) | Vancouver BC Math 10–12 curriculum notes |
| [Formula Sheets](cheatsheets/index.html) | Printable reference sheets by grade |
| [Topics](topics/index.html) | Deep-dive concept hubs |
| [Activities](activities/index.html) | Real results, public lectures, teaching |
| [Reflections](reflections/index.html) | Learning in public — reading notes, problem of the season, original problems |

## Technology

- Plain **HTML + CSS + JavaScript** — no frameworks, no build step, no dependencies.
- Dark/light theme toggle, responsive layout, print-friendly pages (`window.print()`).
- Client-side search powered by a JSON index in [`data/index.json`](data/index.json) and
  [`js/main.js`](js/main.js).

```
toby-math/
├── index.html            # homepage
├── about.html            # story, dated milestones, leadership
├── search.html           # client-side search page
├── competition/          # AMC, AIME, Waterloo, COMC, CMO, strategy
├── courses/              # BC Math 10 / 11 / 12 notes
├── cheatsheets/          # printable formula sheets
├── topics/               # concept hubs
├── activities/           # results, public lectures, teaching
├── reflections/          # learning-in-public posts
├── css/style.css
├── js/main.js
├── data/index.json       # search index
├── images/               # site images (her source photo is not committed)
└── NOTES.md              # change log for this project
```

## Run locally

No build or install needed. Either:

- Double-click **`start-server.bat`**, or
- From the repo root run `python -m http.server 8000` and open http://localhost:8000, or
- Open `index.html` directly in a browser (search needs a local server).

## Deploy

The site is fully static, so it deploys to **GitHub Pages**, Netlify, or any static host as-is.
Source photos (`picture.png`) are gitignored to keep the repo light; the site itself only uses
`images/hero.png`.

Content © Toby. Built with plain HTML, CSS &amp; JavaScript.