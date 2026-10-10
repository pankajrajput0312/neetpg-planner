# Merge resident-experience findings (hands-on, hours/culture) into the app; apply verdict rules for the new evidence.
import json, glob, os, re, collections
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
C = {c['id']: c for c in json.load(open(APP + 'colleges.json'))['colleges']}
R = json.load(open(APP + 'research.json')); V = json.load(open(APP + 'verdict.json')); S = json.load(open(APP + 'superspec.json'))
CONF = {'High': 3, 'Medium': 2, 'Low': 1, 'Unverified': 0}
RES, bad = {}, []
def items(lst):
    return [{'text': str(i.get('text', '')), 'src': str(i.get('src', 'forum')), 'url': str(i.get('url') or ''), 'date': i.get('date')} for i in (lst or []) if isinstance(i, dict) and i.get('text')]
for f in sorted(glob.glob('res/out*.json') + glob.glob('res/retry/out*.json') + glob.glob('site/res/out*.json')):
    try: arr = json.load(open(f))
    except Exception as e: bad.append((os.path.basename(f), str(e)[:60])); continue
    for r in arr if isinstance(arr, list) else []:
        if not isinstance(r, dict) or r.get('id') not in C: continue
        h = r.get('hands_on') or {}; t = r.get('hours_culture') or {}
        RES[r['id']] = {
            'hands_on': {'summary': str(h.get('summary') or 'Nothing found'), 'confidence': h.get('confidence') if h.get('confidence') in CONF else 'Unverified', 'items': items(h.get('items'))},
            'hours_culture': {'summary': str(t.get('summary') or 'Nothing found'), 'confidence': t.get('confidence') if t.get('confidence') in CONF else 'Unverified', 'items': items(t.get('items'))},
            'stipend_paid_on_time': r.get('stipend_paid_on_time'), 'red_flags': [str(x) for x in r.get('red_flags') or []],
            'pros': items(r.get('pros')), 'cons': items(r.get('cons')), 'searches_done': r.get('searches_done'),
        }
json.dump(RES, open(APP + 'resident.json', 'w'), ensure_ascii=False)
# 1. research.json: upgrade hands_on / toxicity where the new evidence is stronger
up = 0
for cid, x in RES.items():
    r = R.setdefault(cid, {'beds': None, 'fee_per_year': None, 'stipend_year1': None, 'pros': [], 'cons': [], 'missing': [],
                           'super_speciality': {'summary': 'Not researched', 'confidence': 'Unverified', 'available': []},
                           'hands_on': {'summary': 'Not found', 'confidence': 'Unverified'}, 'toxicity': {'summary': 'Not found', 'confidence': 'Unverified'},
                           'dnb_pass': {'summary': 'Not published', 'confidence': 'Unverified'}, 'bond': {'summary': 'See official', 'confidence': 'Unverified'}})
    for key, src in (('hands_on', 'hands_on'), ('toxicity', 'hours_culture')):
        if CONF[x[src]['confidence']] > CONF.get(r[key].get('confidence', 'Unverified'), 0):
            r[key] = {'summary': x[src]['summary'], 'confidence': x[src]['confidence']}; up += 1
json.dump(R, open(APP + 'research.json', 'w'), ensure_ascii=False)
# 2. verdict rules on the new evidence
chg = collections.Counter()
DEAL = re.compile(r'suicide|harass|assault|unpaid|not paid|withh|stipend.*(delay|pending)|ragging', re.I)
for cid, x in RES.items():
    v = V.get(cid)
    if not v: continue
    flags = [f for f in x['red_flags'] if DEAL.search(f)]
    strong_flag = flags and CONF[x['hours_culture']['confidence']] >= 2
    if strong_flag and v['verdict'] == 'Join, after checks':
        v['verdict'] = 'Backup only'; v['deal_breakers'] = v['deal_breakers'] + flags[:2]
        v['reasons'].insert(0, 'Downgraded: resident/news evidence of ' + flags[0][:90]); chg['down'] += 1
    elif v['verdict'] == 'Join, after checks' and not flags and CONF[x['hands_on']['confidence']] >= 2 and len(S.get(cid, {}).get('areas', {})) >= 3 and not re.search(r'nothing found|not found|no evidence|mostly observ|limited hands', x['hands_on']['summary'], re.I):
        v['verdict'] = 'Join'; v['headline'] = 'Hands-on evidence plus official super-speciality departments; join if allotted.'
        v['reasons'].insert(0, 'Upgraded: hands-on evidence — ' + x['hands_on']['summary'][:120]); chg['up'] += 1
    if x['stipend_paid_on_time'] and re.search(r'not|delay|late|unpaid', x['stipend_paid_on_time'], re.I) and v['verdict'] != 'Avoid':
        v['verify'].insert(0, 'Stipend payment reported late/unpaid: ' + x['stipend_paid_on_time'][:100])
json.dump(V, open(APP + 'verdict.json', 'w'), ensure_ascii=False)
want = {d['id'] for f in glob.glob('res/in*.json') + glob.glob('site/res/in*.json') for d in json.load(open(f))}
print('resident findings', len(RES), 'of', len(want), '| research fields upgraded', up, '| verdict changes', dict(chg), '| bad', bad)
print('hands-on confidence:', dict(collections.Counter(x['hands_on']['confidence'] for x in RES.values())), '| hours:', dict(collections.Counter(x['hours_culture']['confidence'] for x in RES.values())))
