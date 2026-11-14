# Day 25 — Combined Days 16–25 release

This batch completes the scope documented in DAY16.md through DAY24.md: details, direct links, safe copy/official links, date notices, saving from details, print output, up-to-three-role comparison, comparison CSV, and focused integration/accessibility checks. Days 17–25 were defined for this batch because no earlier roadmap specified them. No authentication, scraping, public deployment or employer-side application submission is claimed.

## Install over Days 12–15

Download internship-radar-days-1-25.zip and Apply-InternshipRadar-Days16-25.ps1 into the same Downloads folder. Keep Docker Desktop running and execute in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Days16-25.ps1"
```

The updater checks archive/file hashes and previous source versions, accepts equivalent Windows line endings, stops for conflicting local edits, backs up replaced files and rebuilds/restarts the app using the same database volume. Git history, the MySQL CI workflow, .env, screenshots and your local README are preserved. No migration is required. Native Windows execution remains to be checked on your laptop.

## Check the ten-day batch locally

1. Open http://localhost:3000 and press Ctrl+F5. Open Details for any demo role from Explore or My applications.
2. Confirm all recorded facts, eligibility, deadline, demo label and full official URL are visible.
3. Copy the internship link, paste it into another tab and refresh. Try browser Back/Forward. Links work only where the app backend is accessible.
4. If copying is blocked, copy from the manual link field. Try a direct link ending #/internships/999999 for the missing-record state and #/internships/abc for invalid input.
5. Save from details, then open My applications. It should be the same saved entry, with duplicate saving disabled.
6. Use Print internship details and save a PDF. Navigation/buttons should not appear; the demo label should remain.
7. Add all three demo roles to comparison. Change Explore pages if needed. Compare roles should show three selected columns and all facts.
8. Refresh comparison, remove one selection, add it back, and export comparison CSV. Check all three rows and ten columns. Comparison selection clears on a full browser reload by design.
9. Resize to mobile width and use Tab/Enter. Recheck existing search, tracker details, dashboard, filters and tracker CSV.
10. Confirm your saved notes/date/status still reload from MySQL.

Demo listings are fictional. Notices are based on recorded dates; use the official source before deciding whether a real role is open or suitable. Details shows the recorded eligibility text. Structured student-profile matching remains in Explore; it is not inferred or reconstructed from prose in details/comparison.

## Implementation and verification

No production Java source, database schema or dependency changed. The frontend uses the existing listing/detail/application endpoints. The generated runtime jar updates static assets only; backend/library hashes are compared with the previous jar. A normal source rebuild still uses node scripts/build-release.mjs with a full JDK 21 and Node available.

Changed existing files: frontend/src/App.jsx, frontend/src/App.css, frontend/src/components/InternshipCard.jsx, frontend/src/components/InternshipPagination.jsx, frontend/src/components/ApplicationTracker.jsx, frontend/src/services/internshipApi.js, frontend/src/utils/applicationCsv.js, frontend/src/test/setup.js, frontend/src/ApplicationTracking.test.jsx and frontend/package.json.

Added files: frontend/src/hooks/useHashView.js; frontend/src/utils/internshipNavigation.js, listingNotices.js and internshipComparison.js; frontend/src/components/InternshipDetails.jsx, CopyInternshipLink.jsx and InternshipComparison.jsx; frontend/src/InternshipDetails.test.jsx, InternshipComparison.test.jsx and InternshipExperience.test.jsx; frontend/scripts/check-internship-details-api.mjs; DAY16.md through DAY25.md. The generated dist/internship-radar.jar is included in downloads and stays ignored by Git.

The full-download README, START_HERE and VERIFICATION report are updated. Read VERIFICATION.md for final counts, commands and limits. Browser screenshots/PDF use labelled synthetic test fixtures; the MySQL API checks are separate. The new npm run test:internship-details-api command is a read-only contract check against a running backend; its default is localhost:8080, or set API_BASE_URL to your combined runtime URL.

## Commit once after local checks pass

Keep your existing feature/internship-details branch. If on main instead, create feature/internship-details-comparison before committing. Do not recreate an existing branch.

```powershell
git branch --show-current
git status
git add frontend/src frontend/scripts/check-internship-details-api.mjs frontend/package.json DAY16.md DAY17.md DAY18.md DAY19.md DAY20.md DAY21.md DAY22.md DAY23.md DAY24.md DAY25.md
git diff --cached --stat
git commit -m "Add internship details, comparison and printable listing views"
git push -u origin HEAD
```

Review the staged diff so unrelated local source edits are not included. Create one pull request into main, wait for the H2/MySQL/frontend checks to turn green, and merge. This cloud run does not claim a successful GitHub-hosted run or direct installation into your Windows VS Code folder.

For your portfolio, include screenshots of Explore, the detail view, comparison, dashboard and tracker. Label synthetic screenshots as demos. Describe concrete behavior and tested limits rather than claiming active listings, employer submission or automatic guaranteed eligibility.
