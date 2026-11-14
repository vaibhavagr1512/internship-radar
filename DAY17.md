# Day 17 — Direct links and browser navigation

Details use #/internships/{id} and comparison uses #/compare. These hash routes reload correctly with the existing Spring static index, without server rewrite rules. Back/Forward restores the matching view. Invalid IDs are rejected before HTTP requests. The skip link and How it works focus actions preserve detail URLs. Comparison selections remain in App memory and are not encoded in the URL or restored after a full reload.

Install this batch once using the combined updater in DAY25.md. Do not create or install nine separate releases.
