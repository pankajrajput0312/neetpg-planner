#!/bin/bash
# PDF → text (macOS has no pdftotext). Usage: bash pdftext.sh <URL or local path> [maxchars]
# Downloads with a browser identity if given a URL, then extracts text with pdfplumber from the project venv.
SP=/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36"
src="$1"; max="${2:-20000}"
if [[ "$src" == http* ]]; then
  f=$(mktemp /tmp/claude-501/pdfXXXX).pdf
  code=$(curl -sL --max-time 60 -A "$UA" -o "$f" -w "%{http_code}" "$src"); echo "HTTP $code $src"
else f="$src"; fi
"$SP/v/bin/python" - "$f" "$max" <<'EOF'
import sys, pdfplumber
try:
    with pdfplumber.open(sys.argv[1]) as p:
        print(f"[{len(p.pages)} pages]")
        out = []
        for i, pg in enumerate(p.pages):
            t = pg.extract_text() or ""
            out.append(f"--- page {i+1} ---\n{t}")
            if sum(len(x) for x in out) > int(sys.argv[2]): break
        txt = "\n".join(out)
        print(txt[: int(sys.argv[2])])
        if len(txt.strip()) < 200: print("[little/no text layer — scanned PDF: open it with the Read tool (pages='1-5') to view the images]")
except Exception as e:
    print("PDF ERROR:", e, "— if it is an HTML page, use fetch.sh; if scanned, use the Read tool on the file")
EOF
