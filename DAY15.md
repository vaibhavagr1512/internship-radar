# Day 15 — Safe removal, accessibility, and combined release

This update completes the agreed scope for Days 12–15:

- Day 12: case-insensitive role/company search and applied/updated date sorting.
- Day 13: date-only deadline filters combined with search and status.
- Day 14: tracker pagination and CSV exporting every matching row in order.
- Day 15: removal confirmation, keyboard/focus handling, browser checks and this release guide.

Removal first opens an inline confirmation explaining that saved notes and the applied date will also be deleted. Keep application receives focus. Keep or Escape cancels and restores focus to the original removal button. Only Confirm removal sends DELETE. Repeated confirms are blocked during the request. A failed request keeps the confirmation and record available for retry; refresh to reconcile an uncertain network response. A successful removal focuses the tracker heading. Removing tracking does not delete the internship listing.

Dropdowns have stable explicit accessible names. Live page ranges and errors expose state changes. This is not a claim of a complete WCAG audit.

## Install once over Days 10–11

Download internship-radar-days-1-15.zip and Apply-InternshipRadar-Days12-15.ps1 into the same Downloads folder. Keep Docker Desktop running. Run in Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Days12-15.ps1"
```

The updater checks the ZIP and source hashes, accepts equivalent Windows line endings, stops for conflicting local edits and backs up replaced files. It updates the frontend source, tests, four milestone guides and bundled runtime jar. It excludes Git metadata, the Day 11 CI workflow, .env, screenshots, README and the database volume. No migration is added. It then rebuilds/restarts the app container using the existing database.

The full ZIP includes Day 11's MySQL CI files for first installation. The updater intentionally preserves the existing workflow. Native Windows execution remains to be checked on your laptop; this cloud environment cannot install directly into your VS Code folder.

## Local acceptance walkthrough

1. Open http://localhost:3000, press Ctrl+F5, and open My applications.
2. Save all three demo roles if needed. Search JAVA and then a company name. Try a status filter at the same time.
3. Save different applied dates, sort both directions, and confirm missing dates appear last. Save drafts before changing filters/pages.
4. Try Past deadline and No recorded deadline. Demo deadlines are fixed, so Due today/Next 7 days may correctly return no rows.
5. Choose 2 applications per page. Move to the next page and change search/sort: it should return to page one.
6. Export CSV from a later page. Verify all matching rows, not just that page, are present and sorted.
7. Click Remove from tracker. Keep application or Escape must cancel. Confirm removal deletes that tracked entry and its details; the listing remains saveable in Explore.
8. Test a small browser window and keyboard Tab navigation. Refresh the browser to confirm saved records reload.

## Implementation and changed files

Added:

- frontend/src/utils/applicationView.js
- frontend/src/components/ApplicationPagination.jsx
- frontend/src/components/ApplicationRemoval.jsx
- frontend/src/ApplicationView.test.jsx
- DAY12.md, DAY13.md, DAY14.md and DAY15.md

Updated:

- frontend/src/components/ApplicationTracker.jsx
- frontend/src/components/ApplicationCsvExport.jsx
- frontend/src/hooks/useApplications.js (returns success/failure for confirmation retry)
- frontend/src/App.css
- frontend/src/ApplicationTracking.test.jsx (confirms removal before checking its result)
- dist/internship-radar.jar (generated, ignored by Git)

The full-download README, START_HERE and VERIFICATION report are updated; the updater preserves your local README. No production Java source, schema, endpoint, or dependency changed. The original non-static jar entries remain unchanged. Normal source rebuilds use node scripts/build-release.mjs with a full JDK 21 and Node available.

## Verification

The final result and exact verification limits are recorded in VERIFICATION.md. Commands include npm ci, npm test, npm run build; headless Chromium via the installed Playwright runner at desktop/mobile sizes; independent Python CSV parsing; Java runtime startup; existing live API scripts; and ZIP/jar/SHA checks. Browser checks use labelled test fixtures; live API smoke checks use MySQL separately. No GitHub-hosted CI or Windows execution is claimed from this cloud session.

## Commit all four days in one pull request

Keep your existing feature/application-search-sort branch. If you are on main instead, create feature/tracker-days-12-15 before committing. Do not recreate an existing branch.

```powershell
git branch --show-current
git status
git add frontend/src/components/ApplicationTracker.jsx frontend/src/components/ApplicationCsvExport.jsx frontend/src/components/ApplicationPagination.jsx frontend/src/components/ApplicationRemoval.jsx frontend/src/utils/applicationView.js frontend/src/hooks/useApplications.js frontend/src/App.css frontend/src/ApplicationTracking.test.jsx frontend/src/ApplicationView.test.jsx DAY12.md DAY13.md DAY14.md DAY15.md
git diff --cached --stat
git commit -m "Complete tracker search, deadlines, pagination and safe removal"
git push -u origin HEAD
```

Open one pull request into main. Wait for the H2, MySQL and frontend checks to turn green before merging. Then sync your local main branch. Do not include .env, generated jar, node_modules, browser fixtures or workspace caches in Git.
