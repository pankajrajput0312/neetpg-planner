#!/bin/bash
# Fetch a page with a browser identity and print its visible text. Usage: bash fetch.sh URL [maxchars]
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36"
tmp=$(mktemp)
# -k: many Indian college sites have expired/self-signed certificates; --max-redirs: redirect loops; 60 s for slow hosts
code=$(curl -skL --max-redirs 20 --max-time 60 -A "$UA" -H "Accept-Language: en-IN,en;q=0.9" -o "$tmp" -w "%{http_code}" "$1")
if [ "$code" = "000" ] && [[ "$1" == https://* ]]; then alt="http://${1#https://}"; code=$(curl -skL --max-redirs 20 --max-time 60 -A "$UA" -o "$tmp" -w "%{http_code}" "$alt"); echo "(https failed; tried $alt)"; fi
echo "HTTP $code  $(wc -c < "$tmp") bytes  $1"
if head -c 5 "$tmp" | grep -q "%PDF"; then keep="/tmp/claude-501/dl_$(date +%s%N | tail -c 8).pdf"; mv "$tmp" "$keep"; echo "[PDF saved: $keep — run: bash site/pdftext.sh $keep  (text) or bash site/pdfimg.sh $keep 1-3 (pages as images, then Read them)]"; exit 0; fi
python3 - "$tmp" "${2:-12000}" <<'EOF'
import re, sys, html
h = open(sys.argv[1], errors="ignore").read()
if h.lstrip().startswith("%PDF"):
    print("[PDF — read it with the Read tool instead:", sys.argv[1], "]"); sys.exit()
h = re.sub(r"(?is)<(script|style|noscript|svg|header nav)[^>]*>.*?</\1>", " ", h)
links = re.findall(r'href="(https?://[^"#]+|/[^"#]+)"[^>]*>([^<]{3,80})<', h)
t = re.sub(r"(?s)<[^>]+>", " ", h); t = html.unescape(re.sub(r"[ \t\r\f]+", " ", t)); t = re.sub(r"\n\s*\n+", "\n", t)
print(t[: int(sys.argv[2])])
print("\n[links on page, first 40]")
seen = set()
for u, txt in links:
    if u in seen: continue
    seen.add(u); print(u, "|", txt.strip())
    if len(seen) >= 40: break
EOF
rm -f "$tmp"
