# Day 8 — Structured eligibility checks

Day 8 adds a student profile form and structured requirements for degree, study year and minimum CGPA. Checks run on the backend and combine with existing search, filters, pagination and sorting. This is a check against recorded criteria, not a guarantee of eligibility or acceptance.

## Update the existing project

Download `internship-radar-days-1-8.zip` and `Apply-InternshipRadar-Day8.ps1` from the private download page into the same Downloads folder. Keep Docker Desktop running, then run in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day8.ps1"
```

The updater targets `Documents\CodexProjects\internship-radar` (including OneDrive Documents). Use `-ProjectFolder "C:\path\to\internship-radar"` for another path. It validates file versions, accepts equivalent Windows line endings, backs up replaced files, copies only this update's files, and restarts Docker. It preserves `.git`, `.github`, `.env`, screenshots, README and the database volume. The migrations run automatically.

After startup, open **http://localhost:3000** and press **Ctrl + F5**. Do not rerun a first-install script on an existing project.

## Try Day 8

1. In Explore internships, find **Check recorded eligibility**.
2. Choose **B.Tech**, **Year 3**, and **CGPA 8.50**. Select **Apply profile**.
3. The Java and React demo records should show **Matches listed requirements**. The Software demo should show **Check official requirements**.
4. Select **Show matches only**: two records should remain.
5. Change the CGPA to **6.50** and select Apply profile again: only React should remain when matches-only is on. Its fictional criteria explicitly have no minimum CGPA.
6. Change to Year 1: no records should match. Clear profile to restore unassessed listings.
7. Confirm My applications, existing notes and dates still work.

The Java demo requires B.Tech, Year 3, and CGPA at least 7.00. The React demo allows B.Tech/B.E., Years 2–4, with no minimum CGPA in this fictional example. Software intentionally remains unverified. Demo criteria are illustrative, not verification of real openings. No extra internship records are created.

The profile is temporary page state and is not saved in MySQL or browser storage. Refreshing the page clears it. Apply profile submits the current form; typing alone does not change an already applied profile. Clear profile removes the assessment and match-only filter while preserving ordinary search/filters. Clear filters resets search, ordinary filters and matches-only but retains the applied profile.

## Cautious assessment rules

- **Matches listed requirements:** the profile matches all recorded degree/year/CGPA criteria, the requirements are marked verified, and degree/year requirements are present.
- **Doesn’t match listed requirements:** a complete, reviewed set of requirements has a degree, year or minimum-CGPA mismatch.
- **Check official requirements:** requirements are unverified or degree/year data is missing. Such entries never count as matches.

A null minimum CGPA means no minimum only for a complete, reviewed requirement set. It is not treated as proof of eligibility for unverified records. Requirements should remain unverified if important conditions cannot be represented by these fields. Original eligibility text and official links stay visible; skills, location restrictions and other conditions must still be checked on the official site. Links remain usable regardless of the result.

## Data model and migrations

V5 adds `minimum_cgpa DECIMAL(4,2)` and `eligibility_verified BOOLEAN DEFAULT FALSE`, plus degree/year collection tables linked to internships with cascading foreign keys. Existing listings start unverified; their free text is not parsed or guessed. Degree and study-year sets are loaded in batches, without collection-fetch joins that would force in-memory pagination.

V6 is in the demo migration location. It updates criteria and illustrative eligibility text only for the two known `[DEMO]` Java/React records. IDs, application URLs, deadlines and tracking data remain in place. Existing non-demo listings remain unverified. Keep the demo profile enabled for an existing demo database, as before.

The domain method `Internship.configureEligibility(...)` can be used by a future trusted importer/admin feature. Day 8 does not add an unauthenticated write endpoint for requirements. No automated source verification is performed.

## API

```http
GET /api/internships?page=0&size=6&studentDegree=BTECH&studentYear=3&studentCgpa=8.50
GET /api/internships?page=0&size=1&studentDegree=BTECH&studentYear=3&studentCgpa=8.50&matchesOnly=true
```

Supplying any profile value requires all three values. Matches-only requires a profile. Degrees: `BTECH`, `BE`, `BSC`, `BCA`, `MTECH`, `MCA`, `MSC`, `OTHER` (case-insensitive, trimmed). OTHER is an explicit degree code, not a wildcard. Study years must be 1–6; CGPA is 0–10 with at most two decimal places. Invalid or partial profiles return 400.

With a profile, page `content` includes an `eligibility` object per row:

```json
{
  "status": "MATCHES",
  "reasons": ["You match the recorded degree, year and CGPA criteria. Confirm all conditions on the official listing."],
  "degrees": ["BTECH"],
  "studyYears": [3],
  "minimumCgpa": 7.00,
  "verified": true
}
```

Other statuses are `DOES_NOT_MATCH` and `CHECK_OFFICIAL`. The top-level page metadata is unchanged. Match-only constraints run in SQL before counting/pagination and combine with existing search/work-mode/category/location filters. No-profile array/page clients remain compatible and are not forced to load or expose requirement collections. Application tracking responses are unchanged.

## Tests and source rebuild

```bash
cd frontend
npm ci
npm test
npm run build
cd ../backend
./mvnw clean verify
```

Use `.\mvnw.cmd` on Windows. MySQL test settings remain as documented earlier; demo databases need the demo profile. Source rebuilds use `node scripts/build-release.mjs` before Docker rebuild. The prebuilt update does not require local Java/Node installations.

Live demo check with Node installed:

```powershell
cd frontend
$env:API_BASE_URL="http://localhost:3000"
npm run test:eligibility-api
```

The updated Postman collection includes Day 8 cases. Automated tests cover threshold boundaries, wrong degree/year, missing/unverified requirements, no minimum CGPA, input validation, SQL-filtered paging, and prior features. Native Windows updater execution and real-browser visual checks still need to run on the laptop.

## Save to GitHub

After checking the app, create/switch to `feature/eligibility-filtering`, inspect changes, and commit:

```powershell
git branch --show-current
git switch -c feature/eligibility-filtering
git status
git diff --stat
git add backend/src frontend/src frontend/scripts/check-eligibility-api.mjs frontend/package.json postman/Internship-Radar.postman_collection.json DAY8.md
git commit -m "Add structured eligibility checks and student profile"
git push -u origin feature/eligibility-filtering
```

If the branch already exists, use `git switch feature/eligibility-filtering`. Wait for CI checks on the pull request before merging. Do not commit credentials or the generated jar.

Verified release: 99 backend tests on each H2/MySQL, 84 frontend tests, 33 Postman requests/63 assertions, Docker health and live eligibility/pagination/details checks passed. Native Windows execution and real-browser visuals remain unverified.
