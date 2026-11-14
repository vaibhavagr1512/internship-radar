# Day 16 — Internship details

Every Explore and tracked-application card now has a Details link. The full view retrieves the latest record from GET /api/internships/{id} and shows title, company, location, work mode, category, eligibility text, official URL, optional deadline and verification date. Invalid IDs, missing records, failed loads, retry, request cancellation and stale responses have explicit handling. This is a read-only listing view; no listing-edit endpoint was added.

Install this batch once using the combined updater in DAY25.md. Do not create or install nine separate releases.
