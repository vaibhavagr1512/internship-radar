# Day 23 — Comparison CSV

Export comparison CSV downloads all selected roles in selection order, with ten columns: role, company, location, work mode, category, eligibility, deadline, last verified, official URL and data status. Data status carries stale/missing-listing warnings. The serializer preserves Unicode and multiline fields, quotes/doubles embedded quotes and prefixes formula-like cells as text. This export contains listing facts, not private tracker notes or student profile values.

Install this batch once using the combined updater in DAY25.md. Do not create or install nine separate releases.
