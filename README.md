# NEET-PG Anaesthesia Choice Planner

A local Next.js app to decide a NEET-PG 2026 MD/DNB Anaesthesiology choice list (built for AIR ~42,000, OBC-NCL, Maharashtra-first).

- **Explore** 486 seats with official 2024–25 closing ranks (MCC + Maharashtra CET Cell PDFs, R1→Stray, Open/OBC), fee, stipend and bond from colleges' own MCC declarations, DM/MCh super-speciality courses from MCC NEET-SS, the 2025 admitted list (counts only), official-website checks, resident/news evidence, pros & cons, a verdict and a "for you" suggestion per college.
- **Compare**, **Saved** (consider later), **My list** (ranked choice order with drag-and-drop, filters, sort, auto-build from your priorities/budget/bond/DNB rules), **Before you decide** (senior's checklist, data coverage, future scope of anaesthesia).
- All personal data (lists, ratings, notes) stays in the browser (`localStorage`); use Backup/Restore.

```bash
npm install
npm run dev        # http://localhost:3000
```

`tools/` holds the Python/Node scripts that built the data files in `app/` (they reference the original scratch paths; adjust before re-running). Research used official PDFs where possible; "Not verified" means nothing citable was found — it is not a judgment.
