# Run Internship Radar

This project includes Days 1–3: internship search and MySQL-backed application tracking.

## Easiest option: Docker Desktop

1. Install and start **Docker Desktop** (Windows/macOS), or Docker Engine with the Compose plugin on Linux. Internet is needed for the first image download. Allow at least 6 GB of free Docker storage for images, containers, and database files.
2. Extract the project ZIP, then open the extracted folder in **VS Code**. You should see `compose.yaml`, `backend/`, and `frontend/` together.
3. Select **Terminal → New Terminal** and run this command in that folder:

   ```bash
   docker compose up --build -d --wait --wait-timeout 300
   ```

4. Once both services are healthy, open **http://localhost:3000**.

The release ZIP includes a prebuilt Java 21 app containing the React frontend. Docker supplies the Java runtime and starts MySQL. You do not need Java, Maven, Node, a separate MySQL install, an API key, or database configuration on your laptop for this option. The first image download and database startup may take several minutes. The optional `.env.example` explains the port/password defaults; you do not have to copy it to run the local demo.

### Use the app

- Search `java`: two demo matches should appear.
- Select **Save to tracker**, then **My applications**.
- Change a status, reload, and confirm it remains saved.
- Filter by status or remove a tracking entry.

Demo listings are fictional. Saving/changing status does not submit an application. This project currently has one shared tracker, with no login.

### Stop and start later

```bash
docker compose stop
docker compose up -d --wait --wait-timeout 300
```

Your records remain in Docker's named MySQL volume. `docker compose down` also keeps that volume. Do not use `down -v` unless you intentionally want to erase this Compose database. This is a new, separate database; any earlier laptop or Codex database is not copied into it.

### If startup fails

```bash
docker compose ps
docker compose logs --tail=80 app
```

- **Docker command not found / daemon unavailable:** install Docker Desktop and start it. On Windows, complete its WSL2 setup if prompted.
- **Cannot find configuration file:** your terminal is in the wrong folder. Open the folder containing `compose.yaml`.
- **Port 3000 is occupied:** copy `.env.example` to `.env`, change `APP_PORT=3001`, rerun the startup command, and open `http://localhost:3001`.
- **MySQL access denied after changing `.env`:** the existing volume still uses its original password. Restore the previous `DB_PASSWORD`; editing `.env` does not change an existing MySQL user's password.
- **Image download fails:** check the network and Docker's proxy configuration, then retry.
- **`dist/internship-radar.jar` missing:** use the complete release ZIP, or rebuild from source with `node scripts/build-release.mjs` (requires JDK 21 and Node 22.12+/24).
- **An older site is open:** use port 3000 for Docker, not the separate development server on port 5173.

## Development option

To edit Java/React with hot reload, install JDK 21, Node 22.12+ or Node 24, and MySQL 8.4, then follow the two-terminal Windows/macOS/Linux steps in `README.md`. Development uses **http://localhost:5173** and a backend on **8080**.

## API testing

Import `postman/Internship-Radar.postman_collection.json` into Postman. Its default address is `http://localhost:3000`. Run the collection against the demo app; it selects IDs dynamically and cleans up only the tracker entry it creates.

For a manual backend, change collection variable `baseUrl` to `http://localhost:8080`.
