import json, glob, os, collections
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
ids = {c['id'] for c in json.load(open(APP + 'colleges.json'))['colleges']}
S, bad = {}, []
for f in sorted(glob.glob('site/out*.json') + glob.glob('site/retry/out*.json')):
    try: arr = json.load(open(f))
    except Exception as e: bad.append((os.path.basename(f), str(e)[:60])); continue
    for r in arr if isinstance(arr, list) else []:
        if not isinstance(r, dict) or r.get('id') not in ids: continue
        ad = r.get('anaesthesia_dept') or {}
        S[r['id']] = {
            'site_status': str(r.get('site_status') or 'unreachable'),
            'departments': [str(x) for x in r.get('departments') or []], 'generic_claim': bool(r.get('generic_claim')),
            'icu_beds': r.get('icu_beds'), 'ot_count': r.get('ot_count'), 'beds': r.get('beds'),
            'anaesthesia_dept': {'faculty': ad.get('faculty'), 'services': [str(x) for x in ad.get('services') or []], 'pg_seats': ad.get('pg_seats'),
                                 'simulation_or_workshops': ad.get('simulation_or_workshops'), 'notes': ad.get('notes'), 'url': ad.get('url')} if ad else None,
            'hostel': r.get('hostel'), 'academics': r.get('academics'), 'red_flags': [str(x) for x in r.get('red_flags') or []],
            'sources': [str(x) for x in r.get('sources') or [] if str(x).startswith('http')],
            'pros': [{'text': str(p['text']), 'url': str(p.get('url') or '')} for p in r.get('pros') or [] if isinstance(p, dict) and p.get('text')],
            'cons': [{'text': str(p['text']), 'url': str(p.get('url') or '')} for p in r.get('cons') or [] if isinstance(p, dict) and p.get('text')],
        }
json.dump(S, open(APP + 'sites.json', 'w'), ensure_ascii=False)
want = {d['id'] for f in glob.glob('site/in*.json') for d in json.load(open(f))}
print('sites', len(S), 'of', len(want), dict(collections.Counter(v['site_status'] for v in S.values())), 'bad', bad)
if os.path.exists('site/future.json'):
    fu = json.load(open('site/future.json')); assert isinstance(fu.get('sections'), list)
    json.dump(fu, open(APP + 'future.json', 'w'), ensure_ascii=False); print('future sections', len(fu['sections']))
