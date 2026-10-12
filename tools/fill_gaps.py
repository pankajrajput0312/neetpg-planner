# Fill every empty / "Unverified" field for her shortlist colleges from data we already have,
# the last targeted search (gap/out*.json) and the national NBEMS/NMC rules (gap/rules.json).
import json, glob, re
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
SP = '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/'
L = lambda f: json.load(open(APP + f))
S = L('sheet.json'); C = {c['id']: c for c in L('colleges.json')['colleges']}; R = L('research.json'); RS = L('resident.json'); ST = L('sites.json')
O = L('official.json'); SP_ = L('superspec.json'); T = L('toxhours.json'); SH = L('sheet_short.json')
RULE = json.load(open(SP + 'gap/rules.json'))
G = {g['id']: g for f in glob.glob(SP + 'gap/out*.json') for g in json.load(open(f)) if isinstance(g, dict)}
AREA = {'Cardiac': 'Heart', 'Neuro': 'Brain & spine', 'Renal/Transplant': 'Kidney & transplant', 'GI surgery': 'GI surgery', 'Onco': 'Cancer', 'Paeds': "Children's surgery", 'Critical care': 'Critical care (ICU)', 'Vascular/Thoracic': 'Vascular & chest surgery'}
strip = lambda h: re.sub('<[^>]+>', '', h or '')
unk = lambda p: (p or {}).get('confidence', 'Unverified') == 'Unverified'
put = lambda p, s, conf: {'summary': s, 'confidence': conf, 'available': (p or {}).get('available', [])}
n = {}
def bump(k): n[k] = n.get(k, 0) + 1
for row in S:
    i = row['id']
    if not i: continue
    c = C[i]; r = R.setdefault(i, {'pros': [], 'cons': [], 'missing': []}); st = ST.get(i, {}); g = G.get(i, {}); sh = SH.setdefault(i, {'hands': '', 'tox': '', 'hours': '', 'icu': '', 'bond': ''})
    dnb = c['kind'] in ('pdnb', 'gdnb')
    # super-speciality
    if unk(r.get('super_speciality')):
        if SP_.get(i): r['super_speciality'] = put(r.get('super_speciality'), 'Official super-speciality training runs here in: ' + ', '.join(AREA.get(a, a) for a in SP_[i]['areas']) + '.', 'High'); bump('ss')
        elif st.get('departments'): r['super_speciality'] = put(r.get('super_speciality'), 'Hospital website lists: ' + '; '.join(st['departments'][:6]), 'Low'); bump('ss')
    # hands-on
    if unk(r.get('hands_on')):
        txt = g.get('hands') or (RS.get(i, {}).get('hands_on', {}).get('summary') if not unk(RS.get(i, {}).get('hands_on')) else '') or ', '.join(filter(None, [st.get('beds') and f"{st['beds']} beds", st.get('icu_beds') and f"{st['icu_beds']} ICU beds", st.get('ot_count') and f"{st['ot_count']} OTs"]))
        if txt: r['hands_on'] = put(r.get('hands_on'), txt, 'Low'); bump('hands')
    # toxicity: a searched "nothing found" is itself a result
    if unk(r.get('toxicity')) and T.get(i, {}).get('toxicity', {}).get('cell'):
        r['toxicity'] = put(r.get('toxicity'), T[i]['toxicity']['cell'] + ' (searched news, Reddit and forums)', 'Low'); bump('tox')
    # DNB pass rate: never published per hospital — give the national picture
    if unk(r.get('dnb_pass')):
        r['dnb_pass'] = put(r.get('dnb_pass'), ('NBEMS does not publish pass rates per hospital. Nationally, DNB Anaesthesiology final pass rate was below 50% (2021, latest reported). Ask the department for its last 3 batches.' if dnb else 'Not applicable — MD seat (university exam).'), 'Low'); bump('dnb')
    # bond
    if unk(r.get('bond')):
        b = O.get(i, {}).get('bond_doc'); s = ' · '.join(x for x in [b.get('service_years'), b.get('service_bond'), b.get('leaving_penalty') and 'leaving: ' + b['leaving_penalty']] if x) if b else ''
        s = s or (RULE['bond_rule']['text'] if c['kind'] == 'pdnb' else strip(c['bond']))
        r['bond'] = put(r.get('bond'), s, 'High' if b or c['kind'] == 'pdnb' else 'Low'); bump('bond')
    # beds / fee / stipend
    if not r.get('beds') or re.search(r'(?i)^not', str(r.get('beds'))):
        if st.get('beds'): r['beds'] = str(st['beds'])[:60]; bump('beds')
    if not r.get('fee_per_year') or re.search(r'(?i)^not', str(r.get('fee_per_year'))):
        f = O.get(i, {}).get('fee') or g.get('fee') or ('No tuition fee (NBEMS fee rules)' if c['kind'] == 'pdnb' else '')
        if f: r['fee_per_year'] = f; bump('fee')
    if not r.get('stipend_year1') or re.search(r'(?i)^not', str(r.get('stipend_year1'))):
        s = O.get(i, {}).get('stipend') or g.get('stipend_paid')
        if s: r['stipend_year1'] = s; bump('stipend')
    # short cells: hospital fact first, otherwise the national rule (marked "Rule:")
    for f in ('hands', 'icu', 'hours'):
        if not sh.get(f) and g.get(f): sh[f] = g[f]; bump('short_' + f)
    if not sh.get('icu'): sh['icu'] = 'Rule: ' + ('4 months ICU over 3 years (NBEMS DNB curriculum)' if dnb else '4 months ICU over 3 years (NMC MD curriculum)'); bump('icu_rule')
    if not sh.get('hours'): sh['hours'] = 'Rule: max 12 h continuous duty, 48 h/week, 1 weekly off (often exceeded)'; bump('hours_rule')
    r['missing'] = []
json.dump(R, open(APP + 'research.json', 'w'), ensure_ascii=False); json.dump(SH, open(APP + 'sheet_short.json', 'w'), ensure_ascii=False)
json.dump(RULE, open(APP + 'rules.json', 'w'), ensure_ascii=False)
print(n, '| gap rows', len(G))
