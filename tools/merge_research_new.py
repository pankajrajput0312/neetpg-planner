# Add research for shortlist colleges that had none (research/sh_r*_out.json) — never rebuild existing entries.
import json, glob, importlib.util
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
SP = '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/'
src = open(SP + 'merge_research.py').read().split('merged, bad = {}, []')[0]   # reuse clean() / richness() only
ns = {}; exec(src, ns)
R = json.load(open(APP + 'research.json')); n = 0
for f in sorted(glob.glob(SP + 'research/sh_r*_out.json')):
    for r in json.load(open(f)):
        if isinstance(r, dict) and r.get('id') in ns['ids'] and r['id'] not in R: R[r['id']] = ns['clean'](r); n += 1
json.dump(R, open(APP + 'research.json', 'w'), ensure_ascii=False); print('added', n, 'research entries; total', len(R))
