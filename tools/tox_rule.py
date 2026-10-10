# Priority 3 (toxicity): a Join with a hospital-named strike/harassment/suicide (Medium+), or residents themselves calling it toxic, becomes Backup only.
import json, re
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
V = json.load(open(APP + 'verdict.json')); T = json.load(open(APP + 'toxhours.json')); down = []
for cid, v in V.items():
    t = T.get(cid, {}).get('toxicity')
    if v['verdict'] != 'Join' or not t: continue
    cnt = t.get('count', {}); hits = (cnt.get('strikes') or 0) + (cnt.get('harassment') or 0) + (cnt.get('suicides') or 0)
    if (hits and t['confidence'] in ('High', 'Medium')) or re.search(r'(?i)\btoxic', t['cell']):
        v['verdict'] = 'Backup only'; v['reasons'].insert(0, 'Downgraded on toxicity (your priority 3): ' + t['cell'][:110])
        v['verify'].insert(0, 'Ask current residents directly about the work culture and what changed since: ' + t['cell'][:80]); down.append(v['headline'][:40])
json.dump(V, open(APP + 'verdict.json', 'w'), ensure_ascii=False)
print('downgraded', len(down))
