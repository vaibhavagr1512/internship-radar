# Day 4 — Internship filters

Day 4 adds work mode, role category, and location filters that combine with the existing title/company search. Saved applications and statuses continue to use the existing database. There is no schema migration for this update.

## Upgrade your existing Windows project

Use the same private download page provided in chat. Download **internship-radar-days-1-4.zip** and **Apply-InternshipRadar-Day4.ps1** into the same Downloads folder. Keep Docker Desktop running. Do not rerun the original Day 3 setup script or delete your existing project.

Recommended: commit any work you want to keep, then create a feature branch in the VS Code terminal:

```powershell
git switch -c feature/internship-filters
```

If the branch already exists, use `git switch feature/internship-filters`.

Open Windows PowerShell and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day4.ps1"
```

The updater locates `Documents\CodexProjects\internship-radar` using Windows' Documents setting (including OneDrive). It verifies the archive, checks source file versions, backs up files it will replace to a temporary folder, copies only the Day 4 files, and rebuilds/restarts the app with Docker Compose. The updater preserves `.git`, `.env`, screenshots, and the Docker database volume. It does not commit or push anything.

If your project is elsewhere, provide its path:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day4.ps1" -ProjectFolder "C:\path\to\internship-radar"
```

If a file has local changes that differ from both the original Day 3 release and this Day 4 release, the updater stops before copying anything. Preserve/merge those edits manually rather than overwriting them. README is intentionally preserved in an existing project; these instructions are added as `DAY4.md`.

When startup finishes, open **http://localhost:3000** and refresh with **Ctrl + F5**. An optional `APP_PORT` setting in your existing `.env` remains in use.

## Try the filters

1. Open **Explore internships**. Confirm there are three demo cards before filtering.
2. Choose **Remote** under **Work mode**: the React internship should remain.
3. Select **Clear filters**: all three records should return.
4. Search **Java**, then choose **Hybrid**, **Backend**, and **Bengaluru**: one Java Backend card should remain.
5. Choose **Frontend** while keeping **Hybrid**: the page should show no matches.
6. Use **Clear search and filters** in the empty state to restore all records.
7. Save a filtered role and check it in **My applications**. Existing saved entries and statuses should still be present.

Dropdown changes apply immediately to the submitted search. Typing a search does not apply it until Search/Enter is used. The small X in the search field clears only the search, retaining the filters. **Clear filters** clears the search and all three filters.

The dropdown values come from the complete database, not the currently filtered results. Choices therefore remain available even when a combination returns no matches. Failed option loads show a separate retry action while ordinary text search remains usable.

## Backend API

```http
GET /api/internships?search=java&workMode=HYBRID&roleCategory=BACKEND&location=Bengaluru
GET /api/internships/filter-options
```

- Search matches title **or** company as a case-insensitive substring.
- Every supplied filter must match: search AND work mode AND role category AND location.
- Filters match complete field values, ignoring case and surrounding whitespace. `location=Beng` does not match Bengaluru.
- Missing, empty, or whitespace-only parameters are ignored.
- Unknown values and incompatible combinations return **200 with `[]`**.
- `%`, `_`, and backslash remain literal search characters, not SQL wildcards.
- Results retain ascending ID order. Unknown numeric internship IDs still return 404.

Example filter-options response:

```json
{
  "workModes": ["HYBRID", "ONSITE", "REMOTE"],
  "roleCategories": ["BACKEND", "FRONTEND", "SOFTWARE"],
  "locations": ["Bengaluru", "Hyderabad", "Remote"]
}
```

Options are sorted, deduplicated, and obtained through read-only database queries. An empty database returns empty arrays. New locations/categories automatically appear without changing React code.

The controller accepts the query parameters, the service combines JPA predicates, and the repository executes one filtered database query. The options endpoint queries only distinct field values. No filtering result is fabricated in the frontend.

## Tests and rebuilds

```bash
# Frontend component/API tests
cd frontend
npm ci
npm test
npm run build

# Backend tests with H2
cd ../backend
./mvnw clean verify
# Windows: .\mvnw.cmd clean verify
```

For MySQL tests, use the disposable test database and `TEST_DB_*` settings in README. The existing demo database needs the `demo` profile so Flyway can resolve its seed migration.

Live checks against the running Docker demo app:

```powershell
cd frontend
$env:API_BASE_URL="http://localhost:3000"
npm run test:api
npm run test:filters-api
npm run test:tracker-api
```

These optional Node checks require Node 22.12+ or Node 24 on your laptop. Docker startup using the bundled jar does not require Node or a local JDK. The Postman collection now includes a Day 4 filter section; import the updated collection to replace the old one.

If you change the Java/React source later, rebuild the bundled jar before rebuilding Docker:

```bash
node scripts/build-release.mjs
docker compose up --build -d --wait --wait-timeout 300
```

## Commit Day 4

After checking the UI and reviewing `git diff` in your VS Code terminal:

```powershell
git status
git diff --stat
git add backend/src frontend/src frontend/scripts/check-filters-api.mjs frontend/package.json postman/Internship-Radar.postman_collection.json DAY4.md
git commit -m "Add combined internship search and filters"
git push -u origin feature/internship-filters
```

The last command assumes you created/switched to that feature branch. On GitHub, open a pull request into `main`. The runnable jar remains generated/ignored and should not be committed. Credentials, screenshots, Git history, and tracking data are unaffected by the upgrade.

## Verification in this run

- **49 backend tests passed on H2 and the same 49 on MySQL 8.4**.
- **53 frontend tests passed**; the production frontend and bundled Java release built successfully.
- Both Docker services became healthy. Live filter checks passed through the combined application address.
- Live tracker checks passed; an APPLIED entry created before the container update remained available afterward and was then cleaned up.
- The updated Postman collection passed **20 requests and 37 assertions**.
- The release archive and updater manifest were checked for integrity and protected-path preservation.
- Real-browser visual review and executing the updater on Windows were unavailable here. The PowerShell updater still needs to run on your laptop; it includes version checks and backups.
