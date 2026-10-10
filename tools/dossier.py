# One evidence file per researched college, for the verdict agents.
import json, glob, re
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
C = json.load(open(APP + 'colleges.json'))['colleges']; R = json.load(open(APP + 'research.json')); O = json.load(open(APP + 'official.json'))
bonds = {b['code']: b for f in glob.glob('mccprof/bondjobs/out*.json') for b in json.load(open(f))}
strip = lambda h: re.sub('<[^>]+>', '', h or '')
def best(c, y):
    rows = [v for k, v in c['ranks'].get(y, {}).items() if k in ('Open', 'OBC')]
    return [max([r[i] or 0 for r in rows] or [0]) or None for i in range(4)]
out = []
for c in C:
    if c['id'] not in R: continue
    o = O.get(c['id'], {}); r = R[c['id']]
    out.append({'id': c['id'], 'name': c['name'].split(',')[0], 'state': c['state'], 'seat': c['kindLabel'], 'counselling': c['counselling'],
        'closing_2025_R1_R2_R3_Stray': best(c, '2025'), 'closing_2024': best(c, '2024'),
        'fee': c.get('fee') or o.get('fee') or r.get('fee_per_year'), 'stipend': o.get('stipend') or c.get('stipend') or r.get('stipend_year1'), 'beds': r.get('beds'),
        'service_bond_rule': strip(c['bond']), 'leaving_penalty_rule': strip(c['penalty']), 'mcc_forfeit': o.get('forfeit'), 'college_note_to_mcc': o.get('mcc_note'),
        'official_bond_document': o.get('bond_doc'),
        'research': {k: r[k] for k in ('super_speciality', 'hands_on', 'toxicity', 'dnb_pass', 'bond')},
        'pros': [p['text'] + f" [{p['type']}]" for p in r['pros']], 'cons': [p['text'] + f" [{p['type']}]" for p in r['cons']], 'missing': r['missing']})
for k in range(6):
    json.dump(out[k::6], open(f'verdict/in{k}.json', 'w'), ensure_ascii=False, indent=1)
print(len(out), 'dossiers;', sum(1 for d in out if d['official_bond_document']), 'with official bond doc read')
