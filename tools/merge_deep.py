# Merge the deep pass (deep/out*.json): hospital facts replace "Rule:" text; new facts are appended to thin cells.
import json, glob
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
SP = '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/'
SH = json.load(open(APP + 'sheet_short.json')); R = json.load(open(APP + 'research.json'))
D = {d['id']: d for f in glob.glob(SP + 'deep/out*.json') for d in json.load(open(f)) if isinstance(d, dict)}
n = {}
def add(k): n[k] = n.get(k, 0) + 1
for i, d in D.items():
    sh = SH.get(i)
    if not sh: continue
    for f in ('hours', 'icu'):
        v = (d.get(f) or '').strip()
        if v and (not sh[f] or sh[f].startswith('Rule:')): sh[f] = v; add(f)
    h = (d.get('hands') or '').strip(); res = (d.get('residents') or '').strip()
    if h and h.lower() not in sh['hands'].lower(): sh['hands'] = (sh['hands'] + '; ' + h).strip('; ') if len(sh['hands']) < 60 else sh['hands']; add('hands')
    if res: sh['hands'] = (sh['hands'] + '. Residents: ' + res).strip('. '); add('residents')
    # keep every sourced item in the detail panel (pros list, with link)
    r = R.get(i)
    if r is not None:
        seen = {p['text'] for p in r.get('pros', [])}
        for it in d.get('items', []):
            if it.get('url', '').startswith('http') and it.get('text') and it['text'] not in seen and it.get('field') in ('hands', 'icu', 'hours', 'residents'):
                r.setdefault('pros', []).append({'text': it['text'][:220], 'url': it['url'], 'type': it.get('src', 'web')}); seen.add(it['text']); add('items')
json.dump(SH, open(APP + 'sheet_short.json', 'w'), ensure_ascii=False); json.dump(R, open(APP + 'research.json', 'w'), ensure_ascii=False)
print(n, '| hospitals', len(D))
print('rule cells left: hours', sum(v['hours'].startswith('Rule:') for v in SH.values()), 'icu', sum(v['icu'].startswith('Rule:') for v in SH.values()))
