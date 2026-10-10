# Merge toxicity / hours / ICU findings into app/toxhours.json (keyed by college id, or "given:<name>" for sheet rows not in app data).
# NOTE: app/toxhours.json cells were later rewritten by hand into plain English — re-running this overwrites them.
import json, glob, os, collections
SP = '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/tox/'
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
want = {d['id'] for f in glob.glob(SP + 'in*.json') for d in json.load(open(f))}
CONF = {'High', 'Medium', 'Low', 'Unverified'}
def items(l): return [{'text': str(i.get('text', '')), 'src': str(i.get('src', 'forum')), 'url': str(i.get('url') or ''), 'date': i.get('date')} for i in (l or []) if isinstance(i, dict) and i.get('text')]
def fld(x): x = x or {}; return {'cell': str(x.get('cell') or '').strip(), 'confidence': x.get('confidence') if x.get('confidence') in CONF else 'Unverified', 'items': items(x.get('items'))}
T, bad = {}, []
for f in sorted(glob.glob(SP + 'out*.json')):
    try: arr = json.load(open(f))
    except Exception as e: bad.append((os.path.basename(f), str(e)[:60])); continue
    for r in arr if isinstance(arr, list) else []:
        if not isinstance(r, dict) or r.get('id') not in want: continue
        t = fld(r.get('toxicity')); t['count'] = {k: v for k, v in ((r.get('toxicity') or {}).get('count') or {}).items() if isinstance(v, int)}
        T[r['id']] = {'toxicity': t, 'hours_per_day': fld(r.get('hours_per_day')), 'icu_per_week': fld(r.get('icu_per_week')), 'searches_done': r.get('searches_done')}
# Sheet rows researched as "given:<name>" that have since been matched to a college id -> store under the id
remap = {'given:' + r['given']: r['id'] for r in json.load(open(APP + 'sheet.json')) if r['id']}
T = {remap.get(k, k): v for k, v in T.items()}
json.dump(T, open(APP + 'toxhours.json', 'w'), ensure_ascii=False)
print('merged', len(T), 'of', len(want), '| bad', bad)
for k in ('toxicity', 'hours_per_day', 'icu_per_week'): print(k, 'filled', sum(1 for v in T.values() if v[k]['cell']), dict(collections.Counter(v[k]['confidence'] for v in T.values())))
