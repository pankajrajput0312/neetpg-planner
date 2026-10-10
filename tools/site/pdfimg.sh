#!/bin/bash
# Render PDF pages to PNG without poppler (uses pdfplumber/pypdfium2 from the venv), then view the PNGs with the Read tool.
# Usage: bash pdfimg.sh <URL or local pdf> [pages e.g. 1-3]   → prints the PNG paths
SP=/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36"
src="$1"; pages="${2:-1-3}"
if [[ "$src" == http* ]]; then f=$(mktemp /tmp/claude-501/pdfXXXX).pdf; curl -skL --max-time 90 -A "$UA" -o "$f" "$src"; else f="$src"; fi
"$SP/v/bin/python" - "$f" "$pages" <<'PY'
import sys, pdfplumber, os
f, rng = sys.argv[1], sys.argv[2]
a, b = (rng.split('-') + [rng])[:2]; a, b = int(a), int(b)
with pdfplumber.open(f) as p:
    print(f"[{len(p.pages)} pages in {f}]")
    for i in range(a - 1, min(b, len(p.pages))):
        out = f"{f[:-4]}_p{i+1}.png"
        p.pages[i].to_image(resolution=110).save(out)
        print(out)
PY
