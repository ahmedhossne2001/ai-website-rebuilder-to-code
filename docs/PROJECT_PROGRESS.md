# AI Website Rebuilder — Project Progress & Change Log

> **Updated:** 2026-10-26 · **Repository:** https://github.com/ahmedhossne2001/ai-website-rebuilder-to-code  
> **Working branch:** `feature/hybrid-cross-platform-setup` · **Scope:** Mac now; Windows pending

## 1. Vision and boundaries

Build an AI-assisted tool for reconstructing **public, permitted website user interfaces** from screenshots, textual descriptions, and URLs. Preferred export: editable React + Tailwind + Vite. The objective is a maintainable independent implementation, **not** extraction of private backend code, accounts, credentials, or copyrighted assets without permission.

## 2. Implemented features and actual validation

| Capability | Implemented | Evidence / validation state |
|---|---|---|
| Hybrid Mac/Windows Docker workflow | Yes | Docker Compose runs on user's **Mac**; Windows still untested |
| Claude Test Mode (one variant) | Yes | User generated a Hello World page via Claude Sonnet 4.6 on Mac |
| Desktop/mobile preview and interactive generated button | Yes | User confirmed preview and mobile button behavior |
| React ZIP export (Vite/Tailwind) | Yes | User ran `npm install`, `npm run build` (27 modules), and `npm run dev` successfully on Mac |
| Save and Open JSON backups | Yes | User saved and restored a test project |
| Named Project Manager | Yes | User confirmed save, rename, backup and reopen on Mac |
| Visual Comparison: side-by-side, overlay, alignment, difference blend | Yes | User screenshots confirmed all modes and manual -60px alignment |
| URL analyzer: restricted Chromium screenshot, DOM colors and fonts | Yes (initial) | `https://example.com` returned image, title, and basic CSS data on Mac; incomplete content analysis observed |
| Windows testing | Not yet | No Windows run reported |
| True pixel similarity score / robust auto registration | No | Difference mode is CSS blending, not a calibrated score |
| Multi-page crawl / dynamic-JS support | No | Planned, requires security and accuracy work |
| Production-secure URL crawler | No | Allowlist + DNS checks are **not sufficient** without network egress isolation and authentication |

## 3. Issues / risks and decisions

1. **URL page fidelity:** the first Example Domain capture was readable only partially, with missing headings in the report. Improve DOM inspection, capture readiness, and quality diagnostics before spending Claude API credits.
2. **Browser safety:** limit URL analysis to explicitly approved HTTPS hosts. JS remains disabled. Playwright route checks cannot guarantee against DNS rebinding or browser network bypass. **Do not publicly expose analyzer or arbitrary targets** without host-level egress controls, authentication, quotas, and an isolated browser.
3. **Model cost:** Test Mode limits parallel variants; it does not impose a hard spending cap. Claude API credit is separate from a Claude subscription.
4. **Local storage:** named projects live in browser localStorage. JSON backups must be saved separately, particularly before resetting browser data.
5. **Dependency audit:** the exported Hello World app's `npm install` reported three *moderate* advisories, to be triaged before production.

## 4. Current development milestone — URL analysis improvements

- **Implemented in branch, not yet tested:** richer DOM inspection with visible headings, key element rectangles, typography, backgrounds and link/image counts.
- **Implemented in branch, not yet tested:** capture quality warnings for missing headings, low element counts and long pages.
- Keep local Chromium analysis separate from **Generate with selected AI model**.
- **Configured locally, not yet tested:** allow **user-owned test site** `https://www.alhashmyahh.com/` by explicit dev-only hostname allowlist, subject to network restrictions. The publicly accessible site advertises aluminum/glass manufacturing and contracting services, with multiple navigation categories; an effective real-world Arabic/RTL fixture.
- Do not copy, alter, deploy to, or authenticate against the original website. Read-only test only.
- Validate Mac behavior; Windows pending.

## 5. Next acceptance checks

1. Rebuild Docker successfully on Mac and run the URL analyzer security unit tests.
2. Analyze `https://example.com`: screenshot + visible headings, colors, element counts and warnings.
3. Analyze the owned site `https://www.alhashmyahh.com/`: verify a readable screenshot and Arabic/RTL metadata; accept that JS-disabled pages may be incomplete.
4. Confirm no Claude call occurs when pressing **Analyze URL (no AI)**.
5. Confirm non-allowlisted host and local/private targets are blocked.
6. Capture result screenshots and document exact outcomes; then test Windows.

## 6. Change history

| Date | Milestone | Status |
|---|---|---|
| 2026-10-26 | Cross-platform Docker guidance, Claude Test Mode, model selection | Implemented; Mac manual tests passed |
| 2026-10-26 | Export React ZIP; build and run on Mac | Implemented; Mac manual tests passed |
| 2026-10-26 | JSON save/open and named Project Manager | Implemented; Mac manual tests passed |
| 2026-10-26 | Visual Comparison, adjustable alignment, Difference mode | Implemented; Mac screenshot tests passed |
| 2026-10-26 | Restricted Analyze URL without AI | Implemented; basic capture passed, fidelity needs work |
| 2026-10-26 | Progress log created and URL analyzer enriched with DOM geometry, Arabic/RTL hints and quality warnings | Committed; Mac Docker rebuild and verification pending |\n| 2026-10-26 | User-owned alhashmyahh.com authorized for local read-only analysis | Allowlist configured; site test still pending |

## 7. Documentation maintenance policy

**Update this file with every substantial code milestone**, including the date, commit/branch, features changed, tests actually run, known limits, and next actions. Never mark a test passed merely because code was committed. Review periodically for stale status and append a dated log entry rather than silently rewriting history.

Related documents: `docs/QUICKSTART_MAC_WINDOWS.md`, `docs/REACT_EXPORT.md`, `docs/SAVE_OPEN_PROJECTS.md`, `docs/PROJECT_MANAGER.md`, `docs/VISUAL_COMPARISON.md`, `docs/URL_ANALYZER.md`.
