# Fill fee/stipend gaps from official documents: NMC stipend list (Dec 2025) and NBEMS DNB fee/stipend rules.
import json, re, difflib
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
NMC = 'https://nmc.org.in/storage/stipend-details/stipend-detail-list.pdf'
NBEMS_FEE = 'https://natboard.edu.in/viewnbeNotice?NBE=Ty9SNFNHbExvQ0phdHlPaGl5cWN0dz09'
C = json.load(open(APP + 'colleges.json'))['colleges']
R = json.load(open(APP + 'research.json'))
lines = open('mh/nmcstip.txt').read().splitlines()
recs, cur = [], None
for l in lines:
    m = re.match(r'^(\d{1,4}) (\D.*)$', l)
    if m and not l.startswith(('1st', '2nd', '3rd')):
        cur = {'head': m.group(2), 'body': [l]}; recs.append(cur)
    elif cur: cur['body'].append(l)
def norm(s): return re.sub(r'[^a-z]', '', s.lower().replace('government', 'govt').replace('&', 'and'))
STATES = ['Maharashtra','Delhi','Uttar Pradesh','Madhya Pradesh','Karnataka','Gujarat','Rajasthan','Kerala','Tamil Nadu','Telangana','Andhra Pradesh','West Bengal','Bihar','Orissa','Odisha','Haryana','Punjab','Chandigarh','Assam','Jharkhand','Chhattisgarh','Uttarakhand','Uttaranchal','Himachal Pradesh','Jammu & Kashmir','Goa','Puducherry','Pondicherry','Tripura','Manipur','Meghalaya','Sikkim','Mizoram','Nagaland','Arunachal Pradesh','Dadra']
nmc = []
for r in recs:
    head = r['head']; st = next((s for s in STATES if f' {s} ' in f' {head} '), None)
    if not st: continue
    name = head[:head.index(st)].strip(' ,')
    body = ' '.join(r['body'])
    pg = [int(x.replace(',', '')) for x in re.findall(r'PG[^0-9]{0,12}?([\d,]{5,7})', body)]
    pg = [x for x in pg if 15000 <= x <= 200000]
    if pg: nmc.append((norm(name), st.replace('Orissa', 'Odisha'), pg, name))
fill = {}
for c in C:
    if c['kind'] in ('pdnb', 'gdnb'):
        fill[c['id']] = {'fee': '₹1.25 L/yr + GST to NBEMS (official DNB course fee)', 'fee_src': NBEMS_FEE,
                         'stipend': 'At least ₹43,000/month yr 1 (NBEMS floor from Jun 2025; state rate if higher) — actual not verified',
                         'stipend_src': 'https://natboard.edu.in/'}
        continue
    key = norm(c['name'].split(',')[0].split('(CET')[0]); st = c['state']; full = norm(c['name'])
    def city_ok(nm):
        # NMC names end in ", City" — that city must appear somewhere in our full name/address.
        parts = [norm(x) for x in nm.split(',')[1:] if norm(x)]
        words = [norm(w) for w in re.findall(r'[A-Za-z]{4,}', nm.split(',')[0])]
        return all(p[:5] in full for p in parts) and sum(w in full for w in words) >= len(words) * 0.7
    cands = [(difflib.SequenceMatcher(None, key, n).ratio(), pg, nm) for n, s, pg, nm in nmc if (s == st or st == 'Puducherry') and city_ok(nm)]
    best = max(cands, default=None)
    # Fuzzy matches checked by hand and found wrong (different institution, same city).
    BAD = [('ESI-POST', 'Hamdard'), ('GOVERNMENT MEDICAL COLLEGE - KANNUR', 'Kannur Medical'), ('Mahatma Gandhi Medical College', 'Indira Gandhi'), ('Shri Sathya Sai', 'Sri Ramachandra')]
    if best and any(c['name'].startswith(x) and best[2].startswith(y) for x, y in BAD): best = None
    if best and best[0] >= 0.78:
        pg = best[1]
        txt = f'₹{pg[-1]:,}/month PG (NMC stipend filing)' if len(pg) == 1 else f'₹{pg[-1]:,}/month PG (college; state ₹{pg[0]:,}) — NMC filing'
        fill[c['id']] = {'stipend': txt, 'stipend_src': NMC, 'match': best[2]}
json.dump(fill, open(APP + 'official.json', 'w'), ensure_ascii=False)
md = [v for v in fill.values() if 'match' in v]
print('NMC-matched colleges', len(md), '| DNB filled', len(fill) - len(md))
for c in C[:0]: pass

# MCC Annexure-C institute profiles (college's own declaration to MCC, PG 2025) — preferred over the NMC list.
PROF = 'https://mcc.admissions.nic.in/Counseling/Handler/ViewInstituteProfileDetailsDynamic.ashx?boardId=140012521&InstituteId=%s'
codes = json.load(open('mccprof/codes.json'))['match']; prof = json.load(open('mccprof/prof.json'))
n = 0
for cid, inst in codes.items():
    p = prof.get(inst['code'], {}); f = fill.setdefault(cid, {})
    f['mcc_code'] = inst['code']; f['mcc_bond_doc'] = inst['bond']
    if p.get('stip1'):
        s = [p.get(k) for k in ('stip1', 'stip2', 'stip3')]
        f['stipend'] = '₹' + ' / '.join(f'{x:,}' for x in s if x) + '/month (yr 1/2/3) — college declaration to MCC 2025'
        f['stipend_src'] = PROF % inst['code']; n += 1
    fee = p.get('fee_1st') or p.get('annual_fee')
    if fee and fee > 1000:
        f['fee'] = f'₹{fee:,}/yr — college declaration to MCC 2025'; f['fee_src'] = PROF % inst['code']
    if p.get('forfeit'): f['forfeit'] = f"₹{p['forfeit']:,} forfeited if you resign/don't join from Round 2 (MCC profile)"
    if p.get('other') and len(p['other']) > 3 and p['other'].lower() not in ('na', 'nil', 'n/a', '-'): f['mcc_note'] = p['other'][:200]
json.dump(fill, open(APP + 'official.json', 'w'), ensure_ascii=False)
print('MCC profile stipends applied', n)

# Official bond documents uploaded by colleges to MCC (read one by one; see mccprof/bondjobs/out*.json).
bonds = {b['code']: b for k in range(6) for b in json.load(open(f'mccprof/bondjobs/out{k}.json'))}
PII = {'700408'}  # uploaded file is a past candidate's filled form with Aadhaar/PAN — never link it
nb = 0
for cid, inst in codes.items():
    f = fill.setdefault(cid, {}); b = bonds.get(inst['code'])
    if inst['code'] in PII: f['mcc_bond_doc'] = False
    if not b or not b.get('readable'): continue
    sb = b.get('service_bond')
    state = next((c['state'] for c in C if c['id'] == cid), '')
    if state == 'Rajasthan' and sb and re.search(r'crore|Cr\b|1,50,00,000', sb):
        sb = '₹50 lakh for Anaesthesia (Rajasthan 2025-26 subject-wise bond: ₹25 L – ₹1.5 Cr by specialty)'
    f['bond_doc'] = {k: b.get(k) for k in ('service_years', 'leaving_penalty', 'applies_to', 'other', 'quote', 'doc_year')}
    f['bond_doc']['service_bond'] = sb
    nb += 1
json.dump(fill, open(APP + 'official.json', 'w'), ensure_ascii=False)
print('official bond documents applied to', nb, 'college entries')
