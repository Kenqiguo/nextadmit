# NextAdmit

**In Progress · AI-assisted prototype**

NextAdmit helps students, especially international college transfer applicants, explore the backgrounds behind admission outcomes and compare universities. Built with HTML, CSS, and vanilla JavaScript, with no framework or package dependencies.

## Features

- Fully expanded profiles: GPA, previous institution, credits, activities, awards, English background, admission decisions, final choice, and reflections.
- Search universities, majors, and previous institutions; filter by term, GPA, major, institution type, student background, and decision.
- Sort by application term, submission date, or GPA. Unknown submission dates remain unknown.
- Conditional English test fields: native English speakers can skip scores. Domestic status and native language are separate.
- Validate required fields, GPA range, duplicate universities, and final choices matching an admitted university.
- Browse 207 universities with locations, historical cost breakdowns, and official links.
- Our Story: the founder's international-student path from Northern Virginia Community College to George Mason University Computer Science.

## Run locally

Requires **Node.js 18 or newer**. No npm install is needed.

1. Clone or download this repository and open its folder.
2. In Windows PowerShell, run:

   ```powershell
   npm.cmd start
   ```

   On macOS or Linux, run `npm start`.
3. Open **http://localhost:3000** in your browser.
4. Keep the terminal running. Press **Ctrl+C** to stop.

Windows users can also double-click START-WINDOWS.cmd. Serve dist over HTTP; opening dist/index.html directly may block the university JSON request. server.cjs binds to loopback and is a local preview server, not a production backend.

## Prototype limitations

All **eight built-in applicant profiles are fictional examples**, not verified admission records. They do not predict admission chances.

Submissions are saved only in the current browser's **localStorage**. There are no accounts, authentication, shared database, or moderation. Refreshing preserves submissions; clearing browser storage removes them. Different browsers, devices, and origins do not share submissions. Public hosting does not make submissions public. The legacy key `transferbridge-v1` remains for compatibility.

The form currently supports limited application terms, majors, and a 4.0 GPA scale. This is an early prototype, not a launched public community.

## University data and sources

- Ranking: pinned **2026 U.S. News National Universities**, ranks 1–200 including ties, yielding 207 institutions. Separately ranked liberal arts colleges are excluded. This is not described as the latest edition.
- Locations, institutional information, and official links: NCES IPEDS **HD2024**.
- Costs: NCES IPEDS **IC2023_AY**, representing **2023–24 academic-year historical reference budgets** for full-time, first-time out-of-state undergraduates living on campus, before aid.
- Total reference budget includes tuition and required fees, books, food and housing, and other expenses. Missing components are not replaced by zero.

These are **not current, international-specific, or transfer-specific quotes**. Insurance, travel, visas, and program fees may add costs. Check official university websites for current requirements and prices.

See [DATA_SOURCES.md](DATA_SOURCES.md) for source URLs, variable definitions, and provenance. The processed snapshot is included in dist/universities.json; rebuilding the original data is not required to run the site.

## Project structure

| File | Purpose |
| --- | --- |
| dist/index.html | Page structure and script loading |
| dist/app.js | Fictional samples, filtering, validation, browser storage |
| dist/profile-order.js | Application-term and submission-date sorting |
| dist/community.js | Expanded profiles, English fields, university directory and details |
| dist/story.js | Founder story, navigation, sorting menu |
| dist/style.css, dist/community.css | Styling and responsive layout |
| dist/universities.json | Processed university snapshot |
| server.cjs | Dependency-free local preview server |

Scripts load in this order: profile-order.js → app.js → community.js → story.js. Later scripts override some rendering and routing functions.

## Validation and attribution

Local checks covered JavaScript syntax, four-page navigation, university loading and details, representative filters and sorting, form validation, native-speaker test exemption, and persistence after refresh. Desktop and mobile-width layouts were checked. The owner also confirmed a fictional submission persisted after refresh. These are practical local checks, not comprehensive automated or cross-browser testing.

The founder defined the audience, requirements, design preferences, and personal story. **AI assisted with code generation, debugging, and data processing.** Human review and validation remain necessary. No real user counts, verified admission statistics, shared backend, or tested external integrations are claimed.

This repository contains the prototype source. A hosted demo is a separate setup step; uploading the project does not deploy it automatically.
