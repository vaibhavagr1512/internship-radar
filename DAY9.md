# Day 9 — Application dashboard

The sidebar now has Dashboard. It shows the total number of tracked applications and counts for Saved, Applied, Interview, Offer, and Rejected. These are current statuses, not a history of transitions.

Upcoming deadlines lists the next five Saved roles with a recorded deadline on or after today. Applied, Interview, Offer, and Rejected roles are excluded. Unknown and past deadlines are excluded. Today uses the device's local calendar and is checked every minute and when the window regains focus. Dates do not represent a guaranteed closing time; always check the official listing. Demo dates are illustrative.

The dashboard and tracker use the same useApplications hook. Saving, changing status, or removing an application updates both views immediately. Refresh dashboard reloads the backend records. Loading/error states hide stale totals and offer retry. No additional endpoint, database migration, or dependency is required.

## Install over Day 8 on Windows

Download internship-radar-days-1-9.zip and Apply-InternshipRadar-Day9.ps1 into the same Downloads folder. Keep Docker Desktop running and execute in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day9.ps1"
```

The updater accepts original Day 8 files or identical Day 9 files, checks archive/file hashes with Windows line-ending normalization, stops for conflicting edits, and backs up replaced files. It excludes Git, CI, .env, screenshots, README, and database volumes.

## Manual acceptance checks

1. Open http://localhost:3000, press Ctrl+F5, and choose Dashboard.
2. Confirm the total matches My applications, including zero when empty.
3. Save a demo role and verify Saved and Total tracked increase.
4. Change its status to Applied, return to Dashboard, and verify the counts move.
5. A Saved role with a future recorded deadline appears under Upcoming deadlines. A null or past deadline does not. Changing to Applied removes it from this list.
6. Refresh the browser and confirm counts reload from the database.
7. Test Refresh dashboard and Open application tracker.

## Verification

92 frontend tests passed, including totals, deadlines, empty/loading/error states, retry, write locks, and tracker-to-dashboard integration. Vite production build passed. This release updates only the static UI inside the previously built Day 8 jar; backend and dependency entries are byte-for-byte unchanged. Java 21 startup and HTTP/API checks are recorded in VERIFICATION.md. No backend Java source changed; Maven/backend tests were not rerun for Day 9 (Day 8 previously passed 99 tests on H2 and MySQL).

Native Windows updater execution and real-browser visual/keyboard/responsive testing still need to run locally because no managed browser tool is available here.

## Save to GitHub after local checks pass

Keep your existing feature/application-dashboard branch. If it does not exist, create it from your synced main branch first. Stage the explicit files:

```powershell
git add frontend/src/App.jsx frontend/src/App.css frontend/src/components/ApplicationDashboard.jsx frontend/src/utils/applicationDashboard.js frontend/src/ApplicationDashboard.test.jsx DAY9.md
git diff --cached --stat
git commit -m "Add application dashboard and upcoming saved-role deadlines"
git push -u origin feature/application-dashboard
```

Create a pull request into main and wait for green CI before merging. The generated jar stays ignored by Git; the ordinary source release command remains node scripts/build-release.mjs with Java 21, Node and Maven available.
