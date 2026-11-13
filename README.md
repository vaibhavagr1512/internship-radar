# Internship Radar — Days 1–3

**Start here:** [START_HERE.md](START_HERE.md) gives the one-command Docker setup for the complete downloadable release. Docker serves the app and API together at **http://localhost:3000**. The release includes `dist/internship-radar.jar`; a source-only checkout can recreate it with `node scripts/build-release.mjs` using Node 22.12+/24 and JDK 21.


A Java 21 / Spring Boot / Maven / MySQL backend and React/Vite frontend for third-year B.Tech students to browse and search internship information. Day 2 adds a responsive discovery page, internship cards, and search. Day 3 adds a MySQL-backed, single-user application tracker. Internship listings are read-only; tracker entries can be created, updated, and removed. Automatic eligibility filtering and user accounts remain future milestones. Eligibility is descriptive text, not an automated eligibility decision.

## Prerequisites and database

Install JDK 21 and MySQL 8.4. Maven is downloaded by the included wrapper (first run requires internet). On Windows use `mvnw.cmd` instead of `./mvnw`.

Create a database and a dedicated user with a MySQL administrator account:

```sql
CREATE DATABASE internship_radar CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'radar'@'localhost' IDENTIFIED BY 'choose-a-local-password';
GRANT ALL PRIVILEGES ON internship_radar.* TO 'radar'@'localhost';
```

Flyway creates the table and unique constraint on startup; Hibernate validates that schema. Credentials are required environment variables, with no checked-in password. Set these in the shell launching Java (the app does not automatically load `.env` files):

```bash
export DB_URL='jdbc:mysql://localhost:3306/internship_radar'
export DB_USERNAME='radar'
export DB_PASSWORD='choose-a-local-password'
```

`DB_URL` defaults to the URL above; `PORT` defaults to `8080`.

## Build, test, run

```bash
cd backend
./mvnw clean verify
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

Or run the packaged jar:

```bash
java -jar target/internship-radar-0.0.1-SNAPSHOT.jar --spring.profiles.active=demo
```

The `demo` profile adds **three fictional, clearly labeled DEMO listings** using example.com URLs. They are not actual verified openings. Their last-verified dates are illustrative. One has a deadline, two have no deadline. Flyway loads them once, retaining them across restarts. Use a separate local demo database and keep the `demo` profile enabled on subsequent starts against that database so Flyway can resolve its applied V2 seed migration. Without `demo`, a fresh database starts empty. To enable demo data after V3 has already migrated a database without demo, create a separate fresh demo database instead of editing migration history.

## Postman and curl

Set a Postman environment variable `baseUrl` to `http://localhost:8080`. Create these GET requests (no body or authentication required):

| Request | Expected result with fresh demo data |
| --- | --- |
| `{{baseUrl}}/api/internships` | 200; array of three demo records |
| `{{baseUrl}}/api/internships?search=java` | 200; Java title and Java company match (two records) |
| `{{baseUrl}}/api/internships?search=JaVa` | Same two results; case-insensitive |
| `{{baseUrl}}/api/internships/{id}` | Replace `{id}` with an ID from the list; 200, one object |
| `{{baseUrl}}/api/internships/9223372036854775807` | 404 |
| `{{baseUrl}}/api/internships?search=unmatched` | 200; `[]` |

Blank or omitted search returns all records; surrounding whitespace is trimmed. Search matches substrings of title OR company and treats `%` and `_` as literal characters. Results are ordered by ID.

Equivalent terminal requests:

```bash
curl -i http://localhost:8080/api/internships
curl -i 'http://localhost:8080/api/internships?search=java'
curl -i http://localhost:8080/api/internships/1
curl -i http://localhost:8080/api/internships/9223372036854775807
```

Each object includes `id`, `title`, `company`, `location`, `workMode`, `roleCategory`, `eligibilityText`, `applicationUrl`, nullable `deadline`, and `lastVerifiedDate` (dates use `YYYY-MM-DD`). The internal normalized URL is not exposed.

## URL uniqueness

The entity's insert/update callbacks canonicalize URLs: trim whitespace, lowercase scheme/host, remove default ports and fragments, resolve dot segments, and give an empty path `/`. Path case, query order/values, non-default ports, and trailing slashes are preserved. Only absolute HTTP(S) links without embedded credentials are accepted; maximum normalized length is 2048. No network request or link verification is performed.

MySQL enforces `uk_internships_normalized_url` on the full canonical URL using ASCII binary collation, preserving path/query case. Unicode path/query characters are percent encoded. Future write endpoints/importers should use the entity callback; direct SQL writers must supply a correctly normalized value. The database guarantees uniqueness of the stored normalized value, not computation of normalization for arbitrary SQL.

There is no POST endpoint for internship listings; Day 3 adds POST only for application tracking. Test duplicate rejection through the integration test below or by copying an existing row's normalized URL in SQL:

```sql
INSERT INTO internships
(title, company, location, work_mode, role_category, eligibility_text,
 application_url, normalized_application_url, deadline, last_verified_date)
SELECT title, company, location, work_mode, role_category, eligibility_text,
 application_url, normalized_application_url, deadline, last_verified_date
FROM internships LIMIT 1;
-- Expected: ERROR 1062 duplicate entry for uk_internships_normalized_url.
```

## Tests against MySQL

The normal `clean verify` runs unit tests and full HTTP/controller/service/repository tests using H2. H2 does not prove MySQL migration or collation compatibility. To run those tests on MySQL, create a **separate disposable** empty database `internship_radar_test`, grant your test user access, and run:

```bash
export TEST_DB_URL='jdbc:mysql://localhost:3306/internship_radar_test'
export TEST_DB_USERNAME='radar'
export TEST_DB_PASSWORD='choose-a-local-password'
export TEST_DDL_AUTO=validate
export TEST_FLYWAY_ENABLED=true
./mvnw clean verify
```

Tests temporarily clear fixtures inside rolled-back transactions and insert their own data. Use a dedicated test database only. These tests exercise actual database reads through MockMvc, case-insensitive title/company search, blank/no-match/literal-wildcard searches, field serialization, unknown-ID 404, and rejection of equivalent URL variants by the database. Flyway schema changes remain in the test database.

For live verification, also run the packaged app against a demo MySQL database, call the curl/Postman requests above, execute the duplicate INSERT, and restart to confirm demo data is not duplicated.

## Request flow

The controller receives the HTTP request and reads the ID or search text. It calls the service, which decides whether to list, search, or find one internship. The service asks the repository to read MySQL through JPA. The records travel back to the controller, and Spring turns them into JSON. If the repository cannot find an ID, the service returns a 404 response.

## Milestone 1 validation (historical)

- Java 21 build and executable jar packaging passed.
- `clean verify` with H2: 14 tests passed, none failed or skipped.
- `verify` with MySQL 8.4.13, Flyway enabled, and Hibernate `validate`: the same 14 tests passed, including equivalent-URL rejection and distinct URL path case preservation.
- Packaged app with `demo`: live HTTP checks confirmed three labeled rows, ID lookup, two case-insensitive Java title/company matches, and unknown-ID 404.
- Direct duplicate SQL INSERT was rejected with MySQL error 1062 for `uk_internships_normalized_url`.
- A second application startup against the same database retained exactly three demo rows.
- Postman GUI requests were documented but not manually executed; equivalent HTTP requests were verified programmatically.

Environment preparation used a local Maven 3.9.9 download and generated the Maven wrapper with `wrapper:wrapper -Dmaven=3.9.9 -Dtype=only-script`. The initial environment contained a Java 21 runtime without a compiler, so an official Temurin 21 JDK was downloaded into ignored `work/`. Maven used a workspace-local repository, the inherited cloud proxy via a scratch settings file, and the system Java CA trust store. These are environment-specific accommodations, not application requirements.

Commands used for validation (from `backend/`, with the environment-specific Maven settings described above):

```bash
./mvnw -B -ntp -s ../work/settings.xml clean verify
# With TEST_DB_* set to the disposable MySQL instance,
# TEST_DDL_AUTO=validate and TEST_FLYWAY_ENABLED=true:
./mvnw -B -ntp -s ../work/settings.xml verify
java -jar target/internship-radar-0.0.1-SNAPSHOT.jar --spring.profiles.active=demo
# Live endpoint checks used Python urllib; the SQL duplicate check used docker exec mysql.
```

Changed project files: `.gitignore`, `README.md`, `backend/pom.xml`, `backend/mvnw`, `backend/mvnw.cmd`, `backend/.mvn/wrapper/maven-wrapper.properties`; six Java application classes (`InternshipRadarApplication`, `Internship`, `ApplicationUrl`, `InternshipRepository`, `InternshipService`, `InternshipController`); `application.yml`, `application-demo.yml`; the V1 schema and V2 demo SQL migrations; `ApplicationUrlTest`, `InternshipApiTest`, and test `application.yml`.

## Day 2 — React + Vite frontend

### Start the full application

Use Node.js **22.12+** (Node 24 was used for validation) and npm. Start MySQL and the backend using the setup instructions above. Ensure the backend runs with `demo` enabled if you want the three sample records:

```bash
# Terminal 1, from the project root; first export DB_USERNAME and DB_PASSWORD.
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

In another terminal:

```bash
# Terminal 2, from the project root
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite's `/api` proxy forwards requests to **http://localhost:8080**. If you change the backend port, update the target in `frontend/vite.config.js`. Port 5173 is strict: if occupied, stop the existing process or explicitly change the port. No CORS changes or database credentials are needed in React. Keep database secrets exclusively in the backend environment.

### What works

- Browse cards fetched from MySQL through the existing Spring Boot API.
- Display title, company, location, work mode, role category, eligibility, application link, optional deadline, and last verified date.
- Search by title or company with the Search button, Enter key, or Java/React/Software suggestions. Case-insensitivity is provided by the backend.
- Clear a search and restore all listings. Missing deadlines display **Not specified**.
- Show loading placeholders, a no-results message, and a request-failure state with a working retry button.
- Cancel outdated requests and ignore late responses to prevent an earlier search from overwriting newer results.
- Label fictional demo records, show illustrative dates as **Demo date**, and use **View demo** for their example.com links. Non-demo cards use **Apply now** and **Last verified**.
- Open valid HTTP(S) application links in a new tab. Reject unsafe or credential-bearing URLs in the UI.
- Adapt the layout to smaller screens, support keyboard search/navigation, announce result changes, and respect reduced-motion settings.

There is no automatic eligibility decision. Application tracking is implemented in Day 3 below. The Google Fonts stylesheet is optional; the page uses system sans-serif fallback if unavailable.

### Frontend structure

```text
frontend/
  index.html
  public/radar.svg
  vite.config.js
  package.json
  package-lock.json
  scripts/check-api.mjs
  src/
    main.jsx
    App.jsx
    App.css
    App.test.jsx
    components/
      InternshipCard.jsx
      InternshipCard.test.jsx
      SearchBar.jsx
    services/
      internshipApi.js
      internshipApi.test.js
    test/
      setup.js
      fixtures.js
```

`App` manages loading, errors, and the current query. `SearchBar` collects a query. `internshipApi.js` fetches `/api/internships` with an optional encoded search parameter. Vite forwards it to the controller, which calls the service and repository to read MySQL. `InternshipCard` displays each response object.

### Build and tests

```bash
cd frontend
npm test
npm run build

# Optional live check: requires the backend and the three-record demo database.
npm run test:api
# For a different backend address:
API_BASE_URL=http://localhost:8080 npm run test:api
```

`npm test` runs React component and API-client tests with Vitest, Testing Library, and jsdom; it requires no running database. These tests cover full listings, Java/JAVA search, Enter and suggestion buttons, clearing, empty results, error/retry recovery, cancellation and late-response handling, dates, demo labels, and safe external links. Test fixtures are used only by tests; the application never substitutes fixtures for failed API requests.

`npm run test:api` runs the actual frontend API client against the live backend. It checks the three demo records, all required fields, Java/JAVA title/company matching, empty results, and both deadline states. It resolves browser-relative URLs directly against the backend in Node; this does **not** verify the Vite proxy or browser rendering.

`npm run build` writes deployable frontend assets to `frontend/dist/`. Production hosting must route `/api` to Spring Boot on the same origin; the development proxy is not embedded in the generated files. The default backend build does not bundle the frontend. The `bundle-frontend` Maven profile and release script include `frontend/dist` as static assets in the runnable release jar.

### Manual browser checklist

1. Open the frontend with the backend running in the demo profile: three labeled cards should appear.
2. Search `java` and `JAVA`: both should return the Java role and Java company (two cards).
3. Search an unmatched word: confirm **No internships found**, then use **View all internships**.
4. Confirm two cards show **Not specified** for deadlines and the React card shows **31 Dec 2026**.
5. Stop the backend, submit a search, and confirm the error state. Restart it and select **Try again**.
6. Use only the keyboard to search, clear, and open a link. Resize to phone and tablet widths; check for overflow and readability.
7. Capture a screenshot of the discovery page for your portfolio.

The managed browser-preview tool was unavailable during this run. Visual layout, real-browser interaction, Vite proxy behavior, the actual backend-stop scenario in the browser, and a browser screenshot remain unverified; automated UI tests simulate request failures and recovery.

### Day 2 validation results (historical)

- **21 automated frontend tests passed** across the app, card, and API-client suites.
- **Production build passed** with Vite.
- **Live API smoke check passed** against the running MySQL-backed backend: three demo records, Java/JAVA matching, no-match results, both deadline states, and all card fields.
- Browser QA and the portfolio screenshot remain pending for the environment reason above.

Day 2 changed `.gitignore`, `README.md`, and added the `frontend/` files listed in the structure above. Commands run included `npm install`, `npm test`, `npm run build`, `npm run test:api`, and a one-time Prettier source-formatting command. npm's download cache was placed under ignored `work/` in this environment.

## Day 3 — My applications

Save roles from Explore, open **My applications**, update their status, filter by status, and remove entries. Records are stored in MySQL and loaded again when the page or backend restarts. Opening an application link never changes a tracker status automatically. Saving or setting **Applied** is a personal tracking action; it does not submit anything to the employer.

This is a **local, single-user project** with one shared tracker and no login or user ownership. Every client using this backend sees the same entries. Add authentication and per-user ownership before using it as a multi-user service.

### Run Day 3

Use VS Code → **Terminal → New Terminal**. Start MySQL, then open the project root (the folder containing `backend/` and `frontend/`). Restart any older backend process so it loads the Day 3 endpoints. Flyway adds the V3 tracker table automatically; do not delete or recreate existing tables.

**Terminal 1 — Windows PowerShell:**

```powershell
cd backend
$env:DB_USERNAME="radar"
$env:DB_PASSWORD="your-mysql-password"
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

**Terminal 1 — macOS/Linux:**

```bash
cd backend
export DB_USERNAME=radar
export DB_PASSWORD='your-mysql-password'
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

**Terminal 2 — either platform, starting from the project root:**

```bash
cd frontend
npm ci
npm run dev
```

Keep both terminals open, then visit **http://localhost:5173**. No API keys are needed. If no listings appear, confirm MySQL is running, credentials are correct, and the backend started successfully on port 8080. A 404 from `/api/applications` usually means the older backend is still running.

### Tracking API / Postman

Use `Content-Type: application/json` for POST and PATCH requests. Get a real internship ID from `GET /api/internships`; the application ID returned by POST is a separate ID.

| Method | Endpoint | Body / behavior |
| --- | --- | --- |
| POST | `/api/applications` | `{"internshipId":34}` → 201, default `SAVED`, Location header |
| GET | `/api/applications` | 200, newest saves first |
| GET | `/api/applications?status=APPLIED` | 200, only matching status |
| GET | `/api/applications/{applicationId}` | 200, one tracked application |
| PATCH | `/api/applications/{applicationId}` | `{"status":"INTERVIEW"}` → 200 |
| DELETE | `/api/applications/{applicationId}` | 204; removes the tracker entry |

Replace the example ID `34` with an ID from your own database. Available statuses are `SAVED`, `APPLIED`, `INTERVIEW`, `OFFER`, and `REJECTED` (uppercase in API requests). A status can be changed to any of these, allowing corrections. The API stores save and update timestamps in UTC; the UI displays dates in the browser's locale timezone.

Response example:

```json
{
  "id": 1,
  "internship": {
    "id": 34,
    "title": "[DEMO] Java Backend Intern",
    "company": "[DEMO] Example Systems",
    "location": "Bengaluru",
    "workMode": "HYBRID",
    "roleCategory": "BACKEND",
    "eligibilityText": "DEMO ONLY: third-year B.Tech students; Java and SQL basics.",
    "applicationUrl": "https://example.com/internships/java",
    "deadline": null,
    "lastVerifiedDate": "2026-11-12"
  },
  "status": "SAVED",
  "savedAt": "2026-11-12T10:00:00Z",
  "updatedAt": "2026-11-12T10:00:00Z"
}
```

Duplicate saves return **409**; MySQL also enforces one tracker entry per internship, including concurrent requests. Missing/nonpositive internship IDs, missing/unknown status values, and invalid status filters return **400**. Unknown internship or application IDs return **404**. Removing tracking preserves the internship listing and allows saving it again.

The controller reads the request, the service checks the internship/status and performs the tracking operation, and the repository reads/writes MySQL. Responses use a DTO that copies the associated internship fields inside the service transaction, so JSON serialization does not depend on an open database session.

### Test Day 3

```bash
# Backend: H2 tests, no running MySQL required
cd backend
./mvnw clean verify

# Frontend: component and API-client tests
cd ../frontend
npm test
npm run build

# Live checks: require the running MySQL-backed demo backend
npm run test:api
npm run test:tracker-api
```

`test:tracker-api` creates a new entry for an untracked demo role, exercises reads, duplicate rejection, update, filtering, and removal, then cleans up its own entry. It preserves existing tracker entries and requires at least one untracked demo role. Run this against your local demo database. Neither Node smoke command verifies browser rendering or the Vite proxy.

For MySQL integration tests, use the disposable test database and `TEST_DB_*` variables documented above. Set `TEST_DDL_AUTO=validate` and `TEST_FLYWAY_ENABLED=true`. If reusing a test database that already has V2 demo data, also set `SPRING_PROFILES_ACTIVE=demo` so Flyway can resolve the existing seed migration. Tests roll back their fixtures; a serialization test creates and removes only its own committed fixture.

Manual UI checks: save a role, open My applications, change its status, reload the page, filter by that status, restart the backend and check it again, then remove the entry. Stop the backend and verify failed operations show a retryable error. The supported managed browser tool remains unavailable in this environment, so browser layout, Vite proxy interaction, and screenshots still need a local check.

### Day 3 files

- Backend: `ApplicationStatus.java`, `TrackedApplication.java`, `ApplicationRepository.java`, `ApplicationResponse.java`, `ApplicationService.java`, `ApplicationController.java`, and `db/migration/V3__create_application_tracker.sql`.
- Backend tests: added `ApplicationApiTest.java` and `ApplicationSerializationTest.java`; updated fixture cleanup in `InternshipApiTest.java` for the new foreign key.
- Frontend: added `ApplicationTracker.jsx`, `hooks/useApplications.js`, `services/applicationApi.js`, API/workflow tests, and `scripts/check-tracker-api.mjs`; updated `App.jsx`, `App.css`, `InternshipCard.jsx`, `App.test.jsx`, and `package.json`.
- Documentation: updated this README with setup, tracking endpoints, test commands, and single-user scope.

### Day 3 verification results

- Backend `clean verify` with H2: **32 tests passed**, zero failures/errors/skips.
- Backend `verify` with MySQL 8.4, Flyway, Hibernate schema validation, and the demo profile: **32 tests passed**. The V3 migration preserves the existing demo listings.
- Frontend `npm test`: **36 tests passed** across five suites.
- Frontend `npm run build`: **passed**.
- `npm run test:api`: **passed** against the live MySQL-backed API.
- `npm run test:tracker-api`: **passed** for save/list/detail, duplicate 409, status update/filter, and removal.
- An additional live persistence check saved a demo entry, set it to APPLIED, stopped and restarted the actual backend process, confirmed the same APPLIED entry reloaded, and removed that test entry. The original internship remains present.
- Browser visual QA, the Vite proxy in a real browser, and screenshots remain unverified because the supported managed browser tool was not available.

Environment-specific Maven commands used the same workspace JDK, local Maven repository, proxy settings file, and system CA trust store described earlier. The first MySQL test attempt failed because the previously seeded demo migration was not in the active locations; enabling the demo profile resolved it. A restart readiness probe initially expired before startup finished; repeating it after the server reported ready passed. No migration checksums or existing application data were changed to bypass these checks.

## Complete local release

### One-command startup

The release ZIP includes source code, a tested runnable jar containing the React build, a Dockerfile, Compose configuration, a start guide, and a Postman collection. The archive excludes credentials, caches, node_modules, temporary files, and database volumes.

With Docker Desktop/Engine running, from the extracted folder:

```bash
docker compose up --build -d --wait --wait-timeout 300
```

Open **http://localhost:3000**. Compose starts a separate MySQL 8.4 database, waits until it can execute a SQL query, then starts the application. An application health check waits for `/api/internships` to respond. The React files and `/api` are served by Spring Boot on the same origin, so this option needs no Vite proxy or second terminal. The Java process runs as a non-root user.

The Compose database has its own persistent named volume and no published database port. The app is bound to the laptop's loopback address. Default credentials are only for this local demo; `.env.example` allows an optional override. Use the original password with an existing volume—changing the environment variable does not change a MySQL user that already exists. The demo profile stays enabled so existing V2 seed migrations remain resolvable.

`docker compose stop` stops the app while preserving data. `docker compose up -d --wait --wait-timeout 300` starts it again. `docker compose down` removes the containers while retaining the volume. **`docker compose down -v` erases this Docker database** and is not a normal stop command.

### Rebuild the runnable package from source

```bash
node scripts/build-release.mjs
```

This installs exact frontend dependencies with `npm ci`, runs the frontend tests, builds React, runs Java tests, and packages the frontend into Spring Boot using `-Pbundle-frontend`. The resulting `dist/internship-radar.jar` is the input to the Docker build. Java 21 and Node 22.12+/24 are needed only for rebuilding or using the development workflow. Maven is downloaded by the wrapper.

The release rebuild script supports both Windows `.cmd` wrappers and macOS/Linux executables. If your organization uses a proxy, configure npm and Maven/Docker's proxy and trusted CA normally; TLS verification remains enabled. The managed environment's temporary settings are not shipped with this project.

Rebuild Docker after rebuilding the jar:

```bash
docker compose up --build -d --wait --wait-timeout 300
```

A direct jar run is also possible with Java 21 and an existing MySQL database, after setting `DB_USERNAME`, `DB_PASSWORD`, and optionally `DB_URL`:

```bash
java -jar dist/internship-radar.jar --spring.profiles.active=demo
```

Then both UI and API are at **http://localhost:8080**.

### Postman collection

Import `postman/Internship-Radar.postman_collection.json` and run its twelve requests in order. It chooses an untracked demo role dynamically, saves one tracker entry, verifies duplicate rejection and status changes, then deletes only its own test entry. It checks ID lookup, filtering, validation, and 404 responses as well. Existing tracker entries remain unchanged. If interrupted before cleanup, delete only the entry recorded in the collection's `smokeApplicationId` variable.

The default collection variable `baseUrl` is `http://localhost:3000`; set it to `http://localhost:8080` for the standalone backend. A local demo role must be available and untracked.

### Additional correctness fixes

- Tracker writes are serialized in the UI so an automatic duplicate-recovery refresh cannot overwrite another in-flight write. Other write controls are disabled until the current change completes.
- Fractional JSON IDs are rejected with 400 instead of being silently truncated to integers.
- Existing development commands remain available; the combined runnable release avoids the unverified development-proxy path for normal startup.

## Final release checks

See [VERIFICATION.md](VERIFICATION.md) for the final results: 33 backend tests on H2, 33 on MySQL, 37 frontend tests, successful bundled release and runtime image builds, both Compose services healthy, combined UI/API HTTP delivery, persistence across restart, and the Postman workflow's 12 requests/19 assertions. Browser visual review remains unverified.

The downloadable archive includes the runnable jar, source code, Docker setup, start guide, Postman collection, and file checksums. Read [START_HERE.md](START_HERE.md) first. No development caches, database volumes, temporary credentials, or unrelated uploaded files are included.
