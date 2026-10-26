# NextAdmit

**In Progress · AI-assisted prototype**

[Live demo](https://kenqiguo.github.io/nextadmit/)

NextAdmit helps students, especially international college transfer applicants, explore the backgrounds behind admission outcomes and compare universities. Built with HTML, CSS, and vanilla JavaScript, with no frontend framework. The deployed site includes a pinned Supabase browser client. Optional shared submissions use Supabase PostgreSQL through its REST API.

## Problem and audience

An admission decision alone does not explain an applicant's path. Students considering a US college transfer need context such as GPA, previous institution, coursework, activities, and language background to interpret an outcome. NextAdmit brings these details into fully expanded profiles alongside a searchable university directory.

The primary audience is international students considering transfer to US universities, including community college students. This first version demonstrates how those experiences could be organized; fictional examples are not evidence of admission likelihood or measured user demand.

## Technology

- HTML and CSS for page structure, styling, and responsive layouts.
- Vanilla JavaScript for DOM rendering, hash-based navigation, filtering, sorting, and form validation.
- Browser APIs: `FormData` for form values, `localStorage` for browser-local persistence, and `fetch` for the bundled university JSON snapshot.
- Node.js built-in HTTP and filesystem modules for local preview only.
- Git and GitHub for version control; GitHub Actions and GitHub Pages for static deployment.

With empty database configuration the site remains a browser-local demo. Shared mode uses Supabase PostgreSQL as its backend; no Node server deployment or external AI API is needed.

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

With empty `dist/database-config.js`, submissions are saved only in the current browser's **localStorage**. Shared mode supports database submissions and manual moderation using anonymous Auth sessions, without email/password registration. Refreshing preserves submissions; clearing browser storage removes them. Different browsers, devices, and origins do not share submissions. Public hosting does not make submissions public. The legacy key `transferbridge-v1` remains for compatibility.

The form currently supports limited application terms, majors, and a 4.0 GPA scale. This is an early prototype, not a launched public community.

No real-user population or adoption metrics have been established. Profile counts include fictional examples and records saved in the visitor's browser; they are not counts of registered users.

## University data and sources

- Ranking: pinned **2026 U.S. News National Universities**, ranks 1–200 including ties, yielding 207 institutions. Separately ranked liberal arts colleges are excluded. This is not described as the latest edition.
- Locations, institutional information, and official links: NCES IPEDS **HD2024**.
- Costs: NCES IPEDS **IC2023_AY**, representing **2023–24 academic-year historical reference budgets** for full-time, first-time out-of-state undergraduates living on campus, before aid.
- Total reference budget includes tuition and required fees, books, food and housing, and other expenses. Missing components are not replaced by zero.

These are **not current, international-specific, or transfer-specific quotes**. Insurance, travel, visas, and program fees may add costs. Check official university websites for current requirements and prices.

See [DATA_SOURCES.md](DATA_SOURCES.md) for source URLs, variable definitions, and provenance. The processed snapshot is included in dist/universities.json; rebuilding the original data is not required to run the site.

Source files and references: [2026 ranking republication](https://qyliuxue.com/rank/32898543582171136.html), [additional tied-rank reference](https://www.compassedu.hk/usnews?no=15), [IPEDS HD2024](https://nces.ed.gov/ipeds/datacenter/data/HD2024.zip), and [IPEDS IC2023_AY](https://nces.ed.gov/ipeds/datacenter/data/IC2023_AY.zip). Rankings are taken from republications, not an official U.S. News API.

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

Scripts load in this order: database-config.js → vendor/supabase-2.118.0.js → shared-store.js → profile-order.js → app.js → community.js → story.js → shared-ui.js → wechat.js. Later scripts override some rendering and routing functions.

## Validation and attribution

Local checks covered JavaScript syntax, four-page navigation, university loading and details, representative filters and sorting, form validation, native-speaker test exemption, and persistence after refresh. Desktop and mobile-width layouts were checked. The owner also confirmed a fictional submission persisted after refresh. These are practical local checks, not comprehensive automated or cross-browser testing.

The founder defined the audience, requirements, design preferences, and personal story. **AI assisted with code generation, debugging, and data processing.** Human review and validation remain necessary. No real user counts or verified admission statistics are claimed. A configured Supabase project and live verification are required before claiming shared submissions are operational.

## Deployment

The [live demo](https://kenqiguo.github.io/nextadmit/) is hosted on GitHub Pages. The workflow in `.github/workflows/pages.yml` publishes only `dist/` when website files change on `main`, and can also be run manually from GitHub Actions. No server or package installation is required for deployment.

Shared mode must be explicitly configured and deployed before visitors can share submissions. Localhost and the public demo have separate legacy browser storage; old records are never uploaded automatically.

## Optional shared database

See [SHARED_DATABASE_SETUP.md](SHARED_DATABASE_SETUP.md) for creation, migration, moderation, and verification. Only a public `sb_publishable_...` key belongs in the browser configuration. Database policies allow public reads of approved profiles; validated submissions enter a private review queue. Visitors cannot directly change, approve, or delete records. Legacy browser records stay private and are never automatically migrated.

Shared mode shows up to 500 latest approved profiles and offers a refresh button. Failed submissions preserve the form. Same-form retries reuse an idempotency UUID. The database enforces global submission bounds (20/minute, 300/day) and 5 submissions/day per anonymous identity; anonymous identities can be recreated, so this is not reliable per-person bot prevention. Cross-device visitor login, self-service editing/deletion, and CAPTCHA are not implemented. The official Supabase client manages anonymous sessions; reads remain public and only approved data is exposed.

Run `node --test tests/shared-store.test.cjs`. Optional local PostgreSQL checks use a temporary PGlite install: `npm.cmd install --prefix tmp/database-check --no-save --ignore-scripts @electric-sql/pglite`, then `node tests/database-security.cjs`. This temporary test dependency is not part of the deployed site.
