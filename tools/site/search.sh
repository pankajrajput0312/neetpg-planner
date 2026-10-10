#!/bin/bash
# Web search (the WebSearch tool is unavailable): real headless-Chrome Bing search. Usage: bash search.sh 'query' [bing|brave|ddg]
# Takes ~6 s. Keep to ~4 searches per college; several agents share this.
sleep 2
cd /private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/site && node bsearch.mjs "$1" "${2:-auto}"
