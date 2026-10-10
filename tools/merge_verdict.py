import json, glob, collections
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
OK = {"Join", "Join, after checks", "Backup only", "Avoid"}
want = {d['id'] for f in glob.glob('verdict/in*.json') for d in json.load(open(f))}
V, bad = {}, []
for f in sorted(glob.glob('verdict/out*.json')):
    for v in json.load(open(f)):
        if v.get('id') not in want or v.get('verdict') not in OK: bad.append((f, v.get('id'), v.get('verdict'))); continue
        V[v['id']] = {'verdict': v['verdict'], 'headline': str(v.get('headline', '')), 'reasons': [str(x) for x in v.get('reasons') or []],
                      'deal_breakers': [str(x) for x in v.get('deal_breakers') or []], 'verify': [str(x) for x in v.get('verify') or []],
                      'confidence': v.get('confidence') if v.get('confidence') in ('High', 'Medium', 'Low') else 'Low'}
# Consistency rules across batches (her priority order: super-speciality first, bond last).
import re
R = json.load(open(APP + 'research.json'))
adj = []
for cid, v in V.items():
    db = v['deal_breakers']; ss = R.get(cid, {}).get('super_speciality', {}).get('confidence')
    if v['verdict'] == 'Avoid' and db and all(re.search(r'stipend', x, re.I) for x in db) and ss in ('High', 'Medium'):
        v['verdict'] = 'Join, after checks'; v['verify'] = ['Get the legal minimum stipend confirmed in writing before joining.'] + v['verify'][:2]
        v['reasons'] = v['reasons'] + ['Adjusted from Avoid: training evidence is credible; the only deal-breaker is a fixable stipend shortfall.']; adj.append(cid)
    elif v['verdict'] == 'Avoid' and db and all(re.search(r'bond|service|penalt', x, re.I) and not re.search(r'stipend|harass|unsafe|suicide', x, re.I) for x in db):
        v['verdict'] = 'Backup only'
        v['reasons'] = v['reasons'] + ['Adjusted from Avoid: a bond alone (your lowest priority) is not a reason to refuse a seat.']; adj.append(cid)
    elif v['verdict'] == 'Avoid' and db and all(re.search(r'stipend', x, re.I) for x in db) and not any(re.search(r'unpaid|withh|not giv|NBEMS|floor|43', x, re.I) for x in db):
        v['verdict'] = 'Backup only'  # below the *state* rate is a concern, not a legal-minimum breach (same rule as other batches)
        v['reasons'] = v['reasons'] + ['Adjusted from Avoid: stipend below the state rate is a real concern but not a legal-minimum breach.']; adj.append(cid)
print('adjusted for consistency:', len(adj), [V[c]['headline'][:40] for c in adj][:0])
json.dump(V, open(APP + 'verdict.json', 'w'), ensure_ascii=False)
print('verdicts', len(V), 'of', len(want), dict(collections.Counter(v['verdict'] for v in V.values())), 'bad', bad[:5])
