# Resolve the hedged "Join, after checks" into a decision: Join or Backup only. The open questions stay in `verify` ("confirm before locking").
import json, re
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
V = json.load(open(APP + 'verdict.json')); S = json.load(open(APP + 'superspec.json')); O = json.load(open(APP + 'official.json')); RS = json.load(open(APP + 'resident.json')); T = json.load(open(APP + 'toxhours.json'))
C = {c['id']: c for c in json.load(open(APP + 'colleges.json'))['colleges']}
CORE = {'Cardiac', 'Neuro', 'Renal/Transplant', 'GI surgery', 'Onco', 'Paeds'}
def stip(cid):
    m = re.search(r'₹([\d,]+)', O.get(cid, {}).get('stipend') or ''); return int(m.group(1).replace(',', '')) if m else None
n = {'Join': 0, 'Backup only': 0}
for cid, v in V.items():
    if v['verdict'] != 'Join, after checks' or cid not in C: continue
    c = C[cid]; areas = set(S.get(cid, {}).get('areas', {})); core = len(areas & CORE); s = stip(cid); govt = c['kind'] in ('govt', 'mhgovt', 'gdnb')
    tox = T.get(cid, {}).get('toxicity', {}); cnt = tox.get('count', {}); deaths = (cnt.get('suicides') or 0) + (cnt.get('unknown_deaths') or 0)
    flags = [f for f in RS.get(cid, {}).get('red_flags', []) if re.search(r'suicide|harass|assault|unpaid|not paid|withh|ragging', f, re.I)]
    why = []
    if core >= 2: why.append(f'official DM/MCh in {core} core areas')
    elif areas: why.append(f'official super-speciality only in {", ".join(sorted(areas))}')
    else: why.append('no super-speciality course verifiable')
    if s is not None and s < 50000 and not govt: why.append(f'stipend ₹{s:,}/month is low')
    if deaths: why.append(tox.get('cell', 'resident death reported'))
    if flags: why.append(flags[0][:80])
    join = core >= 2 and not flags and not deaths and (govt or s is None or s >= 50000)
    v['decided_from'] = 'Join, after checks'; v['verdict'] = 'Join' if join else 'Backup only'; n[v['verdict']] += 1
    v['reasons'].insert(0, ('Decision: join — ' if join else 'Decision: backup — ') + '; '.join(why))
json.dump(V, open(APP + 'verdict.json', 'w'), ensure_ascii=False)
import collections; print('resolved', n, '| now', dict(collections.Counter(v['verdict'] for v in V.values())))
