# Day 5 — Pagination and sorting

Day 5 adds database-backed pagination, page-size selection, Previous/Next controls, and sorting by deadline or last verified date. Search and Day 4 filters continue to work. Tracking and the MySQL schema are unchanged.

## Apply the update on your existing Windows project

Download `internship-radar-days-1-5.zip` and `Apply-InternshipRadar-Day5.ps1` from the private download page into the same Downloads folder. Keep Docker Desktop running, then open PowerShell and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day5.ps1"
```

The updater expects the working Day 4 project in `Documents\CodexProjects\internship-radar` (OneDrive Documents is detected through Windows). It validates the ZIP and file versions, backs up replaced files, installs the Day 5 files, then rebuilds/restarts Docker. It accepts equivalent Windows CRLF/LF source line endings and stops for conflicting code edits. It does not modify `.git`, `.env`, screenshots, README, or the database volume. The generated jar is updated; no local Java/Node installation is needed for Docker startup.

For another project location:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day5.ps1" -ProjectFolder "C:\path\to\internship-radar"
```

Open **http://localhost:3000** after startup and press **Ctrl + F5**. Use your configured APP_PORT if it differs.

## Verify Day 5

1. The default is **6 records per page**, sorted by newest last-verified date.
2. With the three demo records, change **Per page** to **2**. Page 1 should show two cards, and Next should be enabled.
3. Click **Next**. Page 2 should show the remaining card; Next should be disabled.
4. Click **Previous** to return.
5. Choose **Deadline: earliest first**. The React demo with a deadline should appear before the records without deadlines. Missing deadlines stay last in both directions.
6. Search or change a filter while on a later page. The list should reset to page 1 and count only matching records.
7. Check **My applications**. Saved records and statuses should still be available.

The demo data contains only one non-null deadline and equal last-verified dates. Changing sort direction may therefore look similar. Automated tests use eight records with different dates and tied values to verify actual ordering and page boundaries. No extra fictional records are added to your database.

## API contract

Adding any of `page`, `size`, or `sort` requests the page envelope:

```http
GET /api/internships?page=0&size=6&sort=deadline,asc
GET /api/internships?search=java&workMode=HYBRID&page=0&size=2&sort=lastVerifiedDate,desc
```

```json
{
  "content": [],
  "page": 0,
  "size": 6,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true
}
```

- API page numbers start at 0; the UI displays them starting at 1.
- Default size is 6. The API permits 1–50; the UI offers 2, 6, 12, and 24.
- Page must be 0–1,000,000. Invalid numbers/sizes return 400.
- Allowed sorts: `deadline,asc`, `deadline,desc`, `lastVerifiedDate,asc`, `lastVerifiedDate,desc`.
- The default is `lastVerifiedDate,desc`. Unknown sort fields/directions return 400.
- Null deadlines always come last. ID ascending breaks ties, preventing arbitrary page ordering.
- Filters apply before counting and limiting records. Empty results have zero pages; an out-of-range API page returns empty content with the correct totals.
- If records disappear while browsing, the UI moves back to the last available page.
- Requests with none of `page`, `size`, or `sort` retain the original array response. Existing list/filter/Postman clients therefore continue to work.
- `GET /api/internships/filter-options`, ID lookup, and application tracking endpoints are unchanged.

Pagination and ordering execute in the database through JPA; React does not download the full list and slice it locally.

## Tests and rebuild

```bash
cd frontend
npm ci
npm test
npm run build
cd ../backend
./mvnw clean verify
```

On Windows use `.\mvnw.cmd` instead of `./mvnw`. MySQL test configuration remains the same as Day 4. To rebuild the bundled release after editing source, run `node scripts/build-release.mjs` from the project root, then rebuild Docker.

Live smoke checks against the Docker demo:

```powershell
cd frontend
$env:API_BASE_URL="http://localhost:3000"
npm run test:api
npm run test:filters-api
npm run test:pagination-api
npm run test:tracker-api
```

Import the updated Postman collection to get the Day 5 cases as well. Browser visuals and native Windows updater execution cannot be verified in this cloud environment; inspect the UI on your laptop after updating.

## Save Day 5 to GitHub

Use your existing `feature/pagination-sorting` branch, or create it before committing. Review `git diff` first:

```powershell
git branch --show-current
git status
git diff --stat
git add backend/src frontend/src frontend/scripts/check-pagination-api.mjs frontend/package.json postman/Internship-Radar.postman_collection.json Dockerfile DAY5.md
git commit -m "Add internship pagination and sorting"
git push -u origin feature/pagination-sorting
```

Open a pull request into `main` after verifying the app. Do not commit `.env` or the generated jar.

The runtime Dockerfile was simplified to reduce build storage: it still uses Java 21, runs as a non-root numeric user, and serves the same app/API. The updater includes this Dockerfile along with the new bundled jar.

## Verification

- 73 backend tests passed on H2 and on MySQL 8.4.
- 65 frontend tests passed; the bundled Java/React build passed.
- Live API checks passed for pagination, sorting, null deadlines, combined filters, tracking, and input validation.
- The updated Postman collection passed 26 requests and 49 assertions.
- Docker runtime checks and release/updater integrity checks were performed separately.
- The Windows updater and real-browser visual review still need to run on the laptop; they cannot be executed from this cloud workspace.
