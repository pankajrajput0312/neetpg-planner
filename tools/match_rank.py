# Match admitted-list colleges to app colleges by overlapping candidate ranks (no names used).
import json, re, collections
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
C = json.load(open(APP + 'colleges.json'))['colleges']; rows = json.load(open('rows2.json'))
v = __import__('openpyxl').load_workbook('/Users/pankaj/Desktop/NEET_PG_2025_Anaesthesia_Collegewise_Govt_Private (1).xlsx', read_only=True, data_only=True)
pat = re.compile(r'-\s*(\d+)\s*\(([^,]+),\s*([^)]+)\)')
adm = []
for sh in ('Government - All', 'Private - All'):
    for r in list(v[sh].iter_rows(values_only=True))[1:]:
        if r[2]: adm.append((str(r[2]), r[1], [(int(m.group(1)), m.group(2).strip().upper(), m.group(3).strip()) for m in pat.finditer(str(r[10] or ''))]))
def disp(i):
    p = [re.sub(r'\s+', ' ', s).strip() for s in i.split(',') if s.strip()]
    if len(p) > 1 and p[1].upper() == p[0].upper(): p = p[1:]
    return ', '.join(p)
byname = {c['name']: c['id'] for c in C if c['counselling'] == 'MCC' and 'dnb' not in c['kind']}
mccranks = collections.defaultdict(set)
for x in rows:
    if x['f'].startswith('25') and x['ct'] == 'MD':
        cid = byname.get(disp(x['inst']))
        if cid: mccranks[cid].add(x['rank'])
# Maharashtra state quota: AIRs of 2025 CET selection-list allottees per CET code
import importlib.util, sys
sys.argv = ['x']; sys.path.insert(0, 'mh')
merit = {}
for l in open('mh/m25.txt'):
    m = re.match(r'\s*(\d+) (\d{11})(.*?)(\d{9})(\S*)\s+(\d+)\s+([\d.]+)\s*$', l)
    if m: merit[m.group(4)] = int(m.group(6))
for f in ['mh/SelList_R1.txt', 'mh/SelList_R2.txt', 'mh/SelList_R3rev.txt', 'mh/stray25.txt', 'mh/svr2.txt']:
    for l in open(f):
        m = re.match(r'\s*(\d+)\s+(\d+)\s+(\d{9})\s+(.*?)(\d{4})([SI]) : (ANAES\S*)', l)
        if m and merit.get(m.group(3)): mccranks['mh-' + m.group(5)].add(merit[m.group(3)])
match, report = {}, []
for name, st, a in adm:
    ranks = {r for r, _, _ in a}
    ov = sorted(((len(ranks & s), cid) for cid, s in mccranks.items()), reverse=True)
    if not ov or ov[0][0] == 0: continue
    top = ov[0][0]
    for n, cid in ov:  # same college can be both an MCC seat and a Maharashtra state-quota seat
        if n >= 2 and n >= 0.3 * top or (n == top == 1 and len(ranks) <= 2):
            match.setdefault(cid, []).append((n, len(ranks), name))
final = {}
for cid, lst in match.items():
    lst.sort(reverse=True); final[cid] = lst[0][2]
    if len(lst) > 1: report.append((cid, lst[:3]))
print('admitted colleges', len(adm), '| matched to app colleges', len(final), 'of', len([c for c in C if 'dnb' not in c['kind']]))
for r in report[:10]: print('multi:', r)
json.dump(final, open('adm_rankmatch.json', 'w'), ensure_ascii=False)
# Per-college aggregates — counts and last ranks only, never names.
agg = {}
by = {name: (st, a) for name, st, a in adm}
for cid, name in final.items():
    st, a = by[name]; d = {'college': name.split(':', 1)[-1].strip(), 'total': len(a), 'aiq': 0, 'state': 0, 'last': {}}
    for r, cat, q in a:
        qq = 'AIQ' if q.upper().startswith('AIQ') else 'State' if q.lower().startswith('state') else 'Other'
        d['aiq' if qq == 'AIQ' else 'state' if qq == 'State' else 'other'] = d.get('aiq' if qq == 'AIQ' else 'state' if qq == 'State' else 'other', 0) + 1
        catg = 'OBC' if cat.startswith('OBC') else 'Open' if cat in ('GENERAL', 'GEN', 'UR', 'OPEN') else cat.title()
        for k in (f'{qq} {catg}', f'{qq} all'):
            d['last'][k] = max(d['last'].get(k, 0), r)
    agg[cid] = d
json.dump(agg, open('admitted_agg.json', 'w'), ensure_ascii=False)
print('aggregates', len(agg), list(agg.items())[0])
