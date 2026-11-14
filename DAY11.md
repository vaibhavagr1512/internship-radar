# Day 11 — MySQL continuous integration

This milestone adds database checks in GitHub Actions. There is no new app screen and no need to restart Docker or replace the runnable jar.

The existing Backend tests (H2) and Frontend tests and build jobs remain. A third job, Backend tests (MySQL 8.4), starts an ephemeral MySQL service with its own database and throwaway credentials. It waits for an authenticated health check, installs Temurin JDK 21, applies the Flyway migrations, validates the schema, and runs the backend suite. A second startup validates that already-applied migrations still match their checksums. MySQL test reports are uploaded on failure for seven days.

The ci-mysql test profile requires TEST_DB_URL, TEST_DB_USERNAME and TEST_DB_PASSWORD with no H2 defaults. It enables Flyway for production and demo migrations and sets Hibernate to validate rather than create tables. MySqlMigrationTest verifies the database product and JDBC URL are MySQL, the schema setting is validate, all six current migrations are present, and none remain pending. It is skipped in the default H2 job.

The service uses a dynamically assigned host port referenced at step level, where GitHub allows the job context. Permissions remain contents: read. Pushes to main and pull requests targeting main trigger the checks. A feature-branch push alone does not trigger this workflow: open a pull request.

## Install over Day 10 on Windows

Download internship-radar-day11-update.zip and Apply-InternshipRadar-Day11.ps1 into the same Downloads folder, then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\Apply-InternshipRadar-Day11.ps1"
```

This is a small source update, not a full application release. Unlike earlier updaters, it intentionally updates .github/workflows/ci.yml because changing CI is the Day 11 task. It checks the Day 10 workflow checksum (including normalized Windows line endings), checks new-file conflicts, and backs up replaced files. Custom workflow edits cause it to stop before copying; merge those changes manually. It does not touch .git, .env, screenshots, application data, runtime jar, or Docker services.

Files changed/added:

- .github/workflows/ci.yml
- backend/src/test/resources/application-ci-mysql.yml
- backend/src/test/java/com/internshipradar/MySqlMigrationTest.java
- DAY11.md

## Commit and run the checks on GitHub

Use the existing feature/mysql-ci branch. Confirm the branch before committing:

```powershell
git branch --show-current
git status
git add .github/workflows/ci.yml backend/src/test/resources/application-ci-mysql.yml backend/src/test/java/com/internshipradar/MySqlMigrationTest.java DAY11.md
git diff --cached --stat
git commit -m "Add MySQL migration and backend checks to CI"
git push -u origin feature/mysql-ci
```

Open the repository and create a pull request into main. On the pull request's Checks tab, expect Backend tests, Backend tests (MySQL 8.4), and Frontend tests and build. Wait for all checks to turn green before merging. If MySQL fails, expand the failing step's log and download backend-mysql-test-reports under the workflow run's artifacts when available. Green local tests do not prove that a GitHub-hosted workflow has run.

## Verification in this cloud run

- H2 build: 99 tests passed; the two MySQL-only tests were skipped (101 total).
- Fresh isolated MySQL 8.4 database: 101 tests passed; all six migrations applied and Hibernate validation passed.
- Second startup against the same migrated database: both MySQL migration tests passed.
- Missing CI database settings: the build correctly failed instead of falling back to H2.
- Official actionlint v1.7.12 validated the workflow with no findings; shellcheck was disabled because no new shell script is embedded in the workflow.
- Docker health-command argument quoting and a real authenticated SELECT 1 were checked.
- Update ZIP hashes, exact file whitelist and Windows line-ending equivalence were checked.

The cloud image has Java 21 compiler modules but lacks the JDK release-symbol archive, so the initial unmodified Maven command failed with release version 21 not supported. Local validation then used source/target 21 overrides without changing the POM. GitHub uses a full Temurin JDK 21 and the ordinary clean verify command. The cloud test server had an isolated data directory and a loopback relay; the normal app database was not used by these destructive tests.

Commands included the Maven wrapper with clean verify for H2 and MySQL, -Dtest=MySqlMigrationTest test for the repeat and missing-setting checks, actionlint -shellcheck= .github/workflows/ci.yml, and Python ZIP/SHA/YAML checks. Only cloud runs additionally used -Dmaven.compiler.release= -Dmaven.compiler.source=21 -Dmaven.compiler.target=21 plus workspace-specific proxy/cache settings.

Still unverified: execution of the updated workflow on GitHub-hosted runners and native Windows updater execution. The frontend was unchanged; its previous Day 10 run passed 120 tests and was not repeated for this CI-only change. No UI/browser checks are needed for this milestone.

For local MySQL test runs, use a dedicated disposable database. The backend tests delete test records; never set TEST_DB_URL to the database containing your saved applications.
