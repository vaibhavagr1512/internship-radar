# Day 14 — Tracker pagination and complete CSV export

My applications displays 6 records per page by default; choose 2, 6, 12 or 24. Previous/Next buttons and a live matching-row range explain the current page. Search/filter/sort/page-size changes reset to page one. Removing or updating a record clamps a vanished last page to a valid page so results do not become blank.

CSV exports ALL matching records across every page, in the current sort order. It does not export only the current page. Missing/unknown applied dates sort last. Existing Unicode, multiline-cell and spreadsheet-formula protection remains.

Pagination is performed in React on the complete tracker array, not in MySQL; no new endpoint is claimed. Save note/date drafts before changing pages or filters. Controls disable during writes, and export remains disabled while loading, failed, empty or changing data.

For a three-demo installation, select 2 per page and save all three roles to see pagination. A single page with fewer than the selected page size is expected. See DAY15.md for the combined installer and release checks.
