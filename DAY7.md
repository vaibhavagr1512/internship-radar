# Day 7 — Application notes and applied date

Day 7 adds an editable notes field and an optional applied date to each application in My applications. Existing status, search, filters, pagination, and sorting continue to work. Your Day 6 GitHub Actions workflow is preserved.

## Update the existing Windows project

Download `internship-radar-days-1-7.zip` and `Apply-InternshipRadar-Day7.ps1` from the private download page into the same Downloads folder. Keep Docker Desktop running, then run this in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day7.ps1"
```

The updater finds `Documents\CodexProjects\internship-radar` (including OneDrive Documents), verifies checksums and source versions, backs up replaced files, copies only the Day 7 files, then rebuilds/restarts Docker. It accepts equivalent CRLF/LF source files but stops for conflicting code edits. It preserves `.git`, `.github`, screenshots, README, `.env`, and the Docker database volume.

For a custom project location, add `-ProjectFolder "C:\path\to\internship-radar"` to that command.

Do not rerun the first-install setup script for an existing project. On successful startup, open **http://localhost:3000** and press **Ctrl + F5**. The database migration runs automatically.

## Use Day 7

1. Open **My applications**. Save a role from Explore first if your tracker is empty.
2. Under **Application details**, choose an **Applied date** and enter **Notes**.
3. Select **Save details**. Wait for **Application details saved**.
4. Refresh the page, reopen My applications, and confirm both values remain.
5. Change the status to Applied or Interview; saved notes/date should remain unchanged.
6. Edit again, then select **Cancel** to restore the last saved details.
7. To clear the details, empty the notes and date and select **Save details** again.

Save before navigating away, filtering out the card, or refreshing. Unsaved drafts are not stored in MySQL. Failed saves keep the draft visible so you can retry. A status-only response does not overwrite a note draft. Inputs are disabled while a write is pending to avoid accidental overlap.

Notes are plain text, support multiple lines, and allow up to 2000 characters (the same JavaScript/Java UTF-16 length limit is used on both sides). HTML-looking content is treated as text. The date is a calendar value stored exactly as `YYYY-MM-DD` without timezone conversion. Neither changing status nor opening the company link fills a date automatically. Existing application dates cannot be inferred from their status.

## Database migration

`V4__add_application_details.sql` adds:

- `notes VARCHAR(2000) NOT NULL DEFAULT ''`
- `applied_date DATE NULL`

Existing tracker entries retain their IDs, relationships, statuses, and timestamps. They start with empty notes and no applied date. No existing table is dropped. Do not edit previously applied migrations or delete your database volume.

## API

```http
PUT /api/applications/{applicationId}/details
Content-Type: application/json
```

```json
{
  "notes": "Interview on Friday. Review Java collections.",
  "appliedDate": "2026-11-13"
}
```

This replaces only notes and applied date and returns the complete application with status unchanged. Null notes are normalized to empty text. Null/missing applied date clears it. Because this is PUT on the details resource, omitted notes/date are treated as empty/null; clients should always send both fields.

`GET /api/applications` and `GET /api/applications/{id}` now include `notes` and `appliedDate`. The existing status PATCH remains compatible and preserves details. Saving a new application starts with `notes: ""` and `appliedDate: null`.

- Notes longer than 2000 characters return 400 without altering existing data.
- Invalid date syntax or dates outside MySQL's supported 1000–9999 year range return 400.
- Unknown application ID returns 404.
- Saving details updates `updatedAt` and preserves `savedAt`.

## Tests and rebuild

```bash
cd frontend
npm ci
npm test
npm run build
cd ../backend
./mvnw clean verify
```

Use `.\mvnw.cmd` on Windows. The backend test default is H2; the MySQL test settings remain as described in README. Tests cover details, clearing, length limits, date validation, status preservation, and existing features. Native Windows updater execution and real-browser visuals still need a laptop check.

For a live demo API check with Node installed:

```powershell
cd frontend
$env:API_BASE_URL="http://localhost:3000"
npm run test:details-api
```

This creates and removes its own test tracker entry, preserving existing entries. One untracked demo role is required. Import the updated Postman collection to include the Day 7 requests.

If you edit source later, regenerate the runnable jar using `node scripts/build-release.mjs` before rebuilding Docker.

## Commit Day 7

After verifying the UI, create/switch to `feature/application-details`, review your changes, and commit the source (not the generated jar):

```powershell
git switch -c feature/application-details
git status
git diff --stat
git add backend/src frontend/src frontend/scripts/check-details-api.mjs frontend/package.json postman/Internship-Radar.postman_collection.json DAY7.md
git commit -m "Add application notes and applied date"
git push -u origin feature/application-details
```

If the branch already exists, use `git switch feature/application-details`. Open a pull request into main and wait for your existing Day 6 checks to pass before merging.

The updater's backups cover replaced project files, not the database itself. V4 is an additive migration. After it applies, do not delete migration history or restore an older jar alone; use a forward fix if startup fails. Your database volume remains in place.

## Verification in this release

- 85 backend tests passed on H2 and on MySQL 8.4.
- 77 frontend tests passed; the production and bundled app builds passed.
- The V4 migration preserved a pre-migration APPLIED record with empty default details.
- Live details/pagination/tracker checks passed. Notes and date survived an app restart, and later status changes preserved them.
- Postman completed 29 requests and 55 assertions without failures.
- The runtime containers became healthy. Archive hashes, update boundaries, and Windows line-ending equivalence were checked.
- Native Windows execution and real-browser visual review still need a laptop check.
