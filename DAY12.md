# Day 12 — Search and sort tracked applications

My applications now has live, case-insensitive search by role title or company. Outer whitespace is ignored; punctuation is treated literally. Search combines with the status and deadline filters using AND.

Sort by last updated or applied date, oldest or newest first. Missing or invalid dates sort last in either direction. Equal dates use application ID ascending for deterministic results. The original array is not mutated. Changing search, status, sort or deadline returns to page one.

Search and sort are client-side over the records returned by the existing /api/applications endpoint. They are suitable for this single-user portfolio tracker. There is no server-side paging or new database migration. View settings reset when leaving/remounting the tracker or refreshing the browser; application data remains in MySQL.

CSV follows the selected search, status, deadline and sort across all matching pages. Save note/date drafts before changing the view. See DAY15.md for the combined Days 12–15 installer, verification, and GitHub instructions.
