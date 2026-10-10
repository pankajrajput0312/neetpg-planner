# When a fetch fails — the fallback ladder (all routes below were tested from this machine on 2026-10-10)

**This is a Mac. These commands do NOT exist here — never call them:** `timeout` (curl already has `--max-time`; the scripts have their own limits), `pdftotext`, `pdftoppm`, `wget`, `xdg-open`. For PDFs use `bash <SP>/site/pdftext.sh <URL-or-file>` (text layer via pdfplumber) or the **Read tool** on a downloaded PDF (it renders scanned pages). Always call the helper scripts by absolute path: `SP=/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad` then `bash $SP/site/fetch.sh …`, `bash $SP/site/search.sh …`, `node $SP/site/render.mjs …`, `bash $SP/site/pdftext.sh …` — the shell's working directory resets between calls, so relative paths break. If a command errors, do not re-run the same command: move to the next rung.

Never record "unreachable" after one failed WebFetch. Walk this ladder; stop at the first rung that gives the page or the fact. Record which rung worked in `sources`.

Helper scripts live in `/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/site/` (call them with Bash):

## Rung 0 — FIRST attempt for every college/hospital URL: `bash $SP/site/fetch.sh URL`
Most failures in this run were WebFetch refusing Indian college sites (expired/self-signed certificates, redirect loops, >10 MB PDFs, archive.org). fetch.sh handles all of those, so use it first and use WebFetch only when fetch.sh returns no useful text (e.g. a JS-only page → then render.mjs). For a PDF, fetch.sh saves it and tells you the pdftext.sh / pdfimg.sh command to run.

## Error → what to do instead (the errors actually seen in this run)
| Error you got | Do this instead |
|---|---|
| `unable to verify the first certificate` / `certificate has expired` / `self signed certificate` / `SSL … HANDSHAKE_FAILURE` | `bash $SP/site/fetch.sh URL` — it ignores bad certificates (`-k`) and falls back to http:// |
| `Claude Code is unable to fetch from web.archive.org` | `bash $SP/site/fetch.sh "https://web.archive.org/web/2024/<url>"` — curl can read the archive |
| `maxContentLength size of 10485760 exceeded` (big PDF/page) | `bash $SP/site/fetch.sh URL` saves the PDF and prints the path → `bash $SP/site/pdftext.sh <path>` |
| `Too many redirects` / `timeout of 60000ms exceeded` | `bash $SP/site/fetch.sh URL` (20 redirects, 60 s) or `node $SP/site/render.mjs URL` |
| `pdftoppm is not installed` (Read tool on a scanned PDF) | `bash $SP/site/pdfimg.sh <pdf> 1-3` → prints PNG paths → open each PNG with the **Read tool** |
| `getaddrinfo ENOTFOUND` (domain dead) | `bash $SP/site/search.sh '<college> anaesthesia department'` for the live domain, or Rung 4 (Wayback) |
| `command not found: timeout/pdftotext/pdftoppm` | Don't use them (Mac). Use the scripts above. |
| `File does not exist` with a relative path | Use absolute paths (`$SP/...`); the working directory resets between calls |
| `denied by the … auto mode classifier` | Don't retry that command. Fetch the page with fetch.sh/render.mjs and read it — never execute code taken from a web page |

## Rung 1 — WebFetch returned 403 / timeout / empty → curl with a browser identity
`bash site/fetch.sh "https://example.ac.in/departments"` → prints the page as plain text (scripts/styles stripped, tags removed). Works on sites that refuse WebFetch (e.g. mcc.nic.in). Also try the variants: http:// vs https://, with/without www, .ac.in / .edu.in / .org / .com, trailing slash.

## Rung 2 — page is JavaScript-rendered (text comes back empty / "enable JavaScript") → headless Chrome
`node site/render.mjs "https://example.ac.in/"` → prints the rendered page text. Slower; use for SPAs, "mahafra"-style portals, menus that only appear after render.

## Rung 3 — you don't know the right URL → web search by plain page fetch (works without the WebSearch tool)
`bash site/search.sh 'K J Somaiya anaesthesia department'` → up to 10 results (URL, title, snippet) from Bing through a real headless browser (plain curl to search engines returns junk or captchas — don't bother). Each search takes ~6 s; keep to ~4 queries per college. Don't put double quotes in the query. Good query patterns:
- `"<college>" anaesthesia department` · `"<college>" ICU beds` · `"<college>" "clinical material"` (NMC-mandated disclosure: beds, OPD/IPD, surgeries/day) · `"<college>" "mandatory disclosure"` · `"<college>" NABH scope` · `"<college>" DNB anaesthesia seats` · `"<college>" prospectus pdf`
- For resident experience (labelled anecdotal): `"<college>" anaesthesia resident reddit` · `"<college>" PG stipend strike` · `"<college>" resident doctors protest` · `"<college>" MD anaesthesia review`
Then fetch the promising result with Rung 1/2. If the result page itself is blocked, you may still cite the snippet shown by Brave — label it `[search snippet]`.

## Rung 4 — site is dead or the page was removed → Wayback Machine
`curl -s "http://archive.org/wayback/available?url=<domain/path>&timestamp=20250601"` → if `archived_snapshots.closest.url` exists, fetch that snapshot URL with Rung 1. Say "archived <date>" in the source.

## Rung 5 — same fact, different official source
- NMC "Clinical Material" / "Mandatory Disclosure" PDF on the college site (beds, OT, surgeries, faculty list) — usually linked from the footer or /nmc, /disclosure, /mandatory-disclosure.
- NBEMS accreditation search for DNB hospitals: `https://accr.natboard.edu.in/online_user/frontpage.php?v=4` (lists accredited hospitals & specialities).
- NABH scope certificate PDFs: `https://portal.nabh.co/Documents/AccreditedList/Hospitals/<ID>.pdf` (ID from a Brave search for `"<hospital>" NABH portal.nabh.co`).
- Wikipedia page for large hospitals (bed counts, history) — label `[wikipedia]`.
- The MCC institute profile (fee/stipend) is already in the app — don't redo it.

## Rung 6 — Reddit / forums for hands-on & hours (anecdotal, but it is the only place residents talk)
Try `https://old.reddit.com/r/IndianMedicalStudents/search?q=<college>+anaesthesia&restrict_sr=1` and append `.json` to any thread URL (`https://old.reddit.com/r/.../comments/<id>/.json`). If blocked, use the Brave snippet (Rung 3). Quote the gist in one line, label `[forum]`, never treat one post as fact.

## What still counts as "not found"
Only after Rungs 1–5 all fail for the fact in question. Then write `site_status: "unreachable"` (or `"partial"`) and say which rungs you tried in `red_flags` or `academics`.
