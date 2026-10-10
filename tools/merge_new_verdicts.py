# Add verdicts for sheet colleges that had none (verdict/out_new*.json) on top of the existing verdict.json — never rebuild the rest.
import json, glob, collections
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
V = json.load(open(APP + 'verdict.json')); n = 0
for f in sorted(glob.glob('verdict/out_new*.json')):
    for v in json.load(open(f)):
        if v.get('verdict') not in ('Join', 'Backup only', 'Avoid'): print('skip', v.get('id'), v.get('verdict')); continue
        V[v['id']] = {'verdict': v['verdict'], 'headline': str(v.get('headline', '')), 'reasons': [str(x) for x in v.get('reasons') or []],
                      'deal_breakers': [str(x) for x in v.get('deal_breakers') or []], 'verify': [str(x) for x in v.get('verify') or []],
                      'confidence': v.get('confidence') if v.get('confidence') in ('High', 'Medium', 'Low') else 'Low'}; n += 1
json.dump(V, open(APP + 'verdict.json', 'w'), ensure_ascii=False)
print('added', n, '| now', dict(collections.Counter(v['verdict'] for v in V.values())))
