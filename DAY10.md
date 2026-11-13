# Day 10 — Export applications to CSV

My applications now has an Export CSV button. It downloads rows shown by the current status filter. All statuses exports the entire tracker; Applied exports only Applied entries. Empty results, loading, failed loads, and pending writes disable export.

Columns: Role, Company, Status, Deadline, Applied date, Notes, Official application URL. Original demo labels remain in the exported data. Missing dates and notes become empty cells. The filename includes the status filter and the device's current local date.

Export uses the saved records already loaded by useApplications. It does not include unsaved note/date drafts or submit applications. Save details first. Exporting does not change the database or call a new endpoint. Refresh tracker first if another tab changed your data.

The file uses UTF-8 with a BOM, CRLF record separators, quoted fields, doubled embedded quotes, and preserved multiline notes. Formula-like cells (including leading whitespace/control characters) receive an apostrophe prefix so spreadsheet software treats them as text. The prefix can be visible in some import tools and is intentional. This is a CSV file, not an Excel workbook; Excel may infer date types or use locale-specific separators. If Excel shows a single column, use Data → From Text/CSV and choose UTF-8 and comma.

## Install over Day 9

Download internship-radar-days-1-10.zip and Apply-InternshipRadar-Day10.ps1 into the same Downloads folder. Keep Docker Desktop running. In Windows PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day10.ps1"
```

The updater checks checksums and expected previous versions, accepts equivalent Windows line endings, stops before copying conflicting source edits, and backs up replaced files. Git, CI, credentials, README, screenshots, and the database volume are excluded. No migration is required.

## Check locally

1. Open http://localhost:3000 and press Ctrl+F5.
2. Open My applications and save at least two roles if the tracker is empty.
3. Change one role to Applied. Save a note containing a comma, quotes, and a newline, plus an applied date.
4. Choose All statuses, click Export CSV, and open the file from browser downloads. Check all seven columns and saved details.
5. Filter by Applied, export again, and confirm only Applied records are present.
6. Verify an empty status filter disables export. A draft typed without Save details must not appear in the file.
7. Optionally save a note starting with =1+1 and confirm it is treated as text by your spreadsheet program. Then restore your note.
8. Confirm exporting leaves tracker status, dates, and notes unchanged.

No real-browser download, Excel import, or native Windows updater execution was available in this cloud run; complete those checks on your laptop.

## Verification and files

120 frontend tests passed (including 28 CSV cases), and the Vite production build passed. An independent Python csv reader checked the actual generated file for Unicode, commas, quotes, multiline notes, optional fields, and formula prefixes.

Changed source files: frontend/src/components/ApplicationTracker.jsx, frontend/src/App.css. Added frontend/src/components/ApplicationCsvExport.jsx, frontend/src/utils/applicationCsv.js, frontend/src/ApplicationCsv.test.jsx, and this guide. The release also updates the generated dist/internship-radar.jar. Full-download README, startup guide, and verification report describe the milestone; the updater preserves your local README.

The frontend-only release replaces static assets in the Day 9 jar. All backend/library entries were compared byte-for-byte and remain unchanged. No new backend/Maven test run is claimed; Day 8 previously passed 99 backend tests on H2 and MySQL. See VERIFICATION.md for runtime checks.

Commands run: npm --prefix frontend ci --no-audit --no-fund; npm --prefix frontend test; npm --prefix frontend run build; Node CSV generation; Python csv parsing, jar/ZIP/hash checks; Java 21 runtime startup; and existing live Node API smoke checks. Workspace-specific caches, logs, and build helpers are excluded from the download.

## Commit after your local checks pass

Use your existing feature/application-csv-export branch. Check the branch before committing:

```powershell
git branch --show-current
git status
git add frontend/src/components/ApplicationTracker.jsx frontend/src/App.css frontend/src/components/ApplicationCsvExport.jsx frontend/src/utils/applicationCsv.js frontend/src/ApplicationCsv.test.jsx DAY10.md
git diff --cached --stat
git commit -m "Add filtered application CSV export"
git push -u origin feature/application-csv-export
```

Create a pull request into main and wait for green CI before merging. The generated jar remains ignored by Git. A normal full source build still uses node scripts/build-release.mjs with Java 21 and Node available.
