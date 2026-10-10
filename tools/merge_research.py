import json, glob, os
R = '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/research/'
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
ids = {c['id'] for c in json.load(open(APP + 'colleges.json'))['colleges']}
P = ['super_speciality', 'hands_on', 'toxicity', 'dnb_pass', 'bond']

def clean(r):
    out = {k: r.get(k) for k in ('beds', 'fee_per_year', 'stipend_year1')}
    for p in P:
        v = r.get(p) or {}
        c = v.get('confidence') if v.get('confidence') in ('High', 'Medium', 'Low', 'Unverified') else 'Unverified'
        out[p] = {'summary': str(v.get('summary') or 'Not found online'), 'confidence': c, 'available': [str(x) for x in v.get('available') or []]}
    for k in ('pros', 'cons'):
        out[k] = [{'text': str(x['text']), 'url': str(x['url']), 'type': str(x.get('type', 'web'))}
                  for x in r.get(k) or [] if isinstance(x, dict) and x.get('text') and str(x.get('url', '')).startswith('http')]
    out['missing'] = [str(x) for x in r.get('missing') or []]
    return out

def richness(r): return len(r['pros']) + len(r['cons']) + sum(r[p]['confidence'] != 'Unverified' for p in P)

merged, bad = {}, []
for f in sorted(glob.glob(R + '*_out.json')):
    try: arr = json.load(open(f))
    except Exception as e: bad.append((os.path.basename(f), str(e)[:80])); continue
    for r in arr if isinstance(arr, list) else []:
        if not isinstance(r, dict) or r.get('id') not in ids: continue
        c = clean(r)
        if r['id'] not in merged or richness(c) > richness(merged[r['id']]): merged[r['id']] = c
json.dump(merged, open(APP + 'research.json', 'w'), ensure_ascii=False)
if os.path.exists(R + 'guide.json'):
    g = json.load(open(R + 'guide.json'))
    assert isinstance(g.get('sections'), list)
    json.dump(g, open(APP + 'guide.json', 'w'), ensure_ascii=False)
want = {c['id'] for f in glob.glob(R + 'g?_*_input.json') for c in json.load(open(f))}
print('researched', len(merged), 'of shortlist', len(want), '| missing', len(want - set(merged)), '| bad files', bad)
