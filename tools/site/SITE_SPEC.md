# Hands-on training & working hours — resident-experience pass (the two gaps nothing official can fill)

Candidate: NEET-PG 2026, Anaesthesiology, priorities: (1) super-speciality exposure, (2) hands-on, (3) sane hours / no toxicity. Your input colleges are the ones she may actually join ("Put high"). For each, find what residents, alumni, news and the department's own pages say about HANDS-ON TRAINING and DUTY HOURS / CULTURE.

Tools: WebSearch is unavailable. Use the fallback ladder in /private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/site/FALLBACK.md — mainly `bash site/search.sh 'query'` (headless-browser Bing, ~6 s each) and `bash site/fetch.sh URL` / `node site/render.mjs URL` to open results. Run the scripts from the scratchpad folder `/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad`. No sub-agents. ~4–6 searches per college, e.g.:
- `<college> anaesthesia residency review` · `<college> anaesthesia PG reddit` · `<college> MD anaesthesia resident experience quora`
- `<college> resident doctors strike stipend` · `<college> PG resident suicide OR harassment` · `<college> anaesthesia department workshop USG regional block simulation`
- for DNB hospitals: `<hospital> DNB anaesthesia review` · `<hospital> DNB residents stipend`
Open the 1–2 most promising results (Reddit/Quora pages may be blocked → then use the search snippet and label it `[search snippet]`). News sites (Medical Dialogues, TOI, Indian Express, The Hindu) usually open with fetch.sh.

Record ONLY what a source actually says. Label every item: `official` (college/NMC/NBEMS page), `news`, `forum` (Reddit/Quora/Telegram/blog), `snippet` (only the search-result text was readable). One anonymous post is weak evidence — say so; two independent accounts = usable signal.

Output JSON array to the path in your prompt, one object per input college:
{"id": ..., "hands_on": {"summary": str (2–3 sentences or "Nothing found"), "confidence": "High|Medium|Low|Unverified", "items": [{"text": str, "src": "official|news|forum|snippet", "url": str, "date": str|null}]},
 "hours_culture": {"summary": str, "confidence": ..., "items": [...same...]},
 "stipend_paid_on_time": str|null, "red_flags": [str], "pros": [{"text": str, "url": str, "src": str}], "cons": [{"text": str, "url": str, "src": str}], "searches_done": int}
Confidence: High = official document or 2+ independent recent sources agree; Medium = one credible news/official item; Low = single forum post or snippet; Unverified = nothing found.
Write incrementally (every 3 colleges). Validate with `python3 -c "import json;json.load(open(PATH))"`. Final reply: 2–3 sentences (how many colleges had any resident evidence; the strongest red flags).
