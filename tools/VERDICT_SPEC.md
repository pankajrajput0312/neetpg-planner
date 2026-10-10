# Verdict: "If this Anaesthesia PG seat is allotted to me, should I join?"

Candidate: NEET-PG 2026, AIR ~42,000, OBC-NCL, wants MD/DNB Anaesthesiology. Her priorities, in order:
1. Super-speciality exposure (cardiac, neuro, transplant, paeds, obstetric, trauma/ICU, pain)
2. Hands-on training (volume, blocks/USG, lines, independent work)
3. Low toxicity / sane working hours (incl. stipend paid on time, safety)
4. DNB pass rate (DNB only — never published per institute, so treat as unknown, don't penalise)
5. Bond: service bond years/amount and leaving penalty (lighter is better)
Cost (total fee for 3 years) matters as a practical constraint: ₹20 L+/yr is a heavy burden; mention it.

Input: a JSON array of college dossiers (official cutoffs, fee, stipend, bond rules, MCC official bond document summary if present, online research with confidence labels, pros/cons with source types, missing items). Use ONLY the dossier — no web, no outside knowledge, no sub-agents.

For each college output:
- `id` (copy)
- `verdict`: exactly one of
  - "Join" — clear evidence of good super-speciality exposure and case load, no deal-breaker.
  - "Join, after checks" — looks reasonable but an important point is unverified; say what to check.
  - "Backup only" — weak/limited super-speciality or case mix, or notable concerns, but still a real PG seat better than dropping a year.
  - "Avoid" — a deal-breaker: stipend below the legal minimum or reports of unpaid stipend; documented harassment/unsafe conditions; programme so new it has no seniors/recognition AND weak exposure; bond/penalty disproportionate to the training on offer; or very high fee with secondary-care exposure.
- `headline`: one plain sentence (≤ 20 words) a candidate can read in 3 seconds.
- `reasons`: 2–4 short bullets, most important first, tied to her priority order.
- `deal_breakers`: list (may be empty) of specific red flags from the dossier.
- `verify`: 1–3 concrete questions to ask seniors/college before locking.
- `confidence`: "High" | "Medium" | "Low" — how solid the evidence behind the verdict is (Low if super-speciality and hands-on are both Unverified).

Be fair and consistent across colleges; don't reward missing data. Aggregator-only claims are weak evidence. Don't judge reachability (cutoffs are shown separately) — but you may note if 2024 closings were far tighter than 2025.

Write the JSON array to the output path in your prompt, validate with `python3 -c "import json;json.load(open(PATH))"`, writing incrementally. Final reply: counts per verdict in one line.
