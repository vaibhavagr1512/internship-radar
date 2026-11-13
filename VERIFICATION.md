# Release verification — Days 1–3

This release includes the complete source and a runnable Java 21 jar with the React frontend bundled inside it.

## Passed

- Reproducible release command: `node scripts/build-release.mjs` completed on Linux with Java 21 and Node 24.
- `npm ci`, **37 frontend tests**, and the Vite production build passed.
- **33 backend tests on H2** passed, including tracking, validation, URL uniqueness, and serialization after a transaction closes.
- **33 backend tests on MySQL 8.4** passed with Flyway and Hibernate schema validation.
- The final runtime Docker image built successfully.
- `docker compose up --build -d --wait` completed with **both services healthy** against a freshly initialized Docker MySQL database.
- The combined HTTP address served the index HTML, generated JavaScript and CSS, and `/api` responses on the same port 3000.
- Live checks passed for three labeled demo records, Java/JAVA search, deadlines, all card fields, and rejection of fractional IDs with 400.
- Live tracker checks passed for save, list, detail, duplicate 409, status update, filtering, and removal.
- The exported Postman collection ran through Newman: **12 requests and 19 assertions, zero failures**.
- A saved APPLIED entry survived stopping/starting MySQL and the app and replacing the app container. It reloaded correctly and was then removed. The original internship remained.
- Test tracking entries were cleaned up. Demo listings remain available.
- Docker configuration syntax and archive integrity were checked.

## Fixes made during release checks

- Serialized frontend tracker mutations to prevent refresh/write races; added a regression test.
- Rejected fractional JSON IDs instead of silently truncating them; added a regression test.
- Bundled UI and API into one runtime address, removing the development proxy from the normal release startup path.
- Made the container health check explicitly use loopback without an inherited outbound proxy. The original probe received a proxy 403 even though the app was working; the corrected probe passes.
- Reduced build-time requirements by shipping the prebuilt jar. The runtime Docker build does not compile Java or React.

## Limits and scope

- A real browser visual/keyboard/responsive check and screenshot could not be performed because the supported managed browser tool was unavailable. React behavior was tested with jsdom, and the actual combined HTTP delivery was verified separately.
- Docker Desktop installation and native Windows/macOS setup were not executed here. The release uses standard cross-platform Docker Compose commands; source rebuilds were tested on Linux.
- This is a local, single-user demo with fictional listings, no login, no automatic eligibility decision, and no real application submission. Those are scope boundaries, not completed features.

## Files and commands

Added `Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`, `START_HERE.md`, this report, `scripts/build-release.mjs`, and the Postman collection. Updated the Maven frontend-bundling profile, JSON validation configuration/tests, tracker mutation controls/tests, `.gitignore`, and README.

Commands included the release build script; Maven MySQL `verify`; Docker Compose configuration/build/up/stop/start checks; live Node API and tracker checks; combined HTTP checks; and Newman collection execution. Temporary workspace-specific proxy settings and caches are excluded from this release.

An initial all-source Docker build exceeded this cloud workspace's disk limit. The final, tested release uses a small runtime-only Docker build with the bundled jar instead. Earlier standalone MySQL data was preserved in its own volume while testing the separate Compose database.
