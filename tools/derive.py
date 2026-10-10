# Official-data pros/cons + "for you" suggestion for EVERY college (no web, no guessing).
import json, re
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
C = json.load(open(APP + 'colleges.json'))['colleges']
R = json.load(open(APP + 'research.json')); O = json.load(open(APP + 'official.json')); V = json.load(open(APP + 'verdict.json'))
S = json.load(open(APP + 'superspec.json')); A = json.load(open(APP + 'admitted.json'))
AIR = 42000
def cats(c): return [k for k in (c['ranks'].get('2025') or c['ranks'].get('2024') or {}) if k in ('Open', 'OBC')]
def rounds(c, y): return [max([c['ranks'].get(y, {}).get(k, [None] * 4)[i] or 0 for k in cats(c)] + [0]) for i in range(4)]
def deep(c, y): return max(rounds(c, y))
def first_round(c, y):
    for i, v in enumerate(rounds(c, y)):
        if v >= AIR: return ['R1', 'R2', 'R3', 'Stray'][i]
def rupees(t):
    """₹ amount → integer rupees, from strings like 'Rs 27,00,000', '₹12.0 L/yr', '₹1.25 L', '₹48,000/month', '₹3,480,000'."""
    if not t: return None
    m = re.search(r'(?:₹|Rs\.?|INR)\s?([\d,]+(?:\.\d+)?)\s*(lakh|lac|L\b|Cr|crore|k\b)?', t, re.I)
    if not m: return None
    n = float(m.group(1).replace(',', '')); u = (m.group(2) or '').lower()
    if u in ('lakh', 'lac', 'l'): n *= 1e5
    elif u in ('cr', 'crore'): n *= 1e7
    elif u == 'k': n *= 1e3
    return int(n)
def lakh(n): return f'₹{n/1e5:.1f} L' if n < 1e7 else f'₹{n/1e7:.2f} Cr'
out = {}
for c in C:
    cid = c['id']; r = R.get(cid); o = O.get(cid, {}); s = S.get(cid); a = A.get(cid); v = V.get(cid)
    pros, cons, facts = [], [], {}
    d24, d25 = deep(c, '2024'), deep(c, '2025')
    # 1. reachability (official MCC / CET Cell allotments)
    if AIR <= d24 and AIR <= d25: pros.append(f'Reachable at your AIR in both 2024 and 2025 (2025 from {first_round(c, "2025")}, closing {d25:,})')
    elif AIR <= d25: pros.append(f'Reached your AIR in 2025 ({first_round(c, "2025")}, closing {d25:,}) but not in 2024 ({d24:,} max) — depends on how deep 2026 goes')
    elif d25 and AIR <= d25 * 1.1: cons.append(f'Just out of reach: 2025 closing {d25:,} vs your {AIR:,}')
    else: cons.append(f'Not reachable on 2024–25 data (2025 closing {d25:,})' if d25 else 'No 2025 allotment data at your category')
    # 2. seats actually filled (admitted list)
    if a:
        facts['seats_filled_2025'] = a['total']
        if a['total'] >= 10: pros.append(f'{a["total"]} anaesthesia seats filled in 2025 ({a["aiq"]} AIQ, {a["state"]} state) — bigger department, more seniors')
        elif a['total'] <= 2: cons.append(f'Only {a["total"]} anaesthesia seat(s) filled in 2025 — small unit, little peer cover')
    # 3. fee
    fee_r = rupees(r['fee_per_year']) if r and r.get('fee_per_year') else None
    fee_c = rupees(c.get('fee')); fee_o = rupees(o.get('fee')) if 'MCC' in (o.get('fee') or '') else None
    fee = fee_c or fee_r or fee_o
    if c['kind'] in ('pdnb', 'gdnb'):
        pros.append('DNB fee is only ₹1.25 L/yr + GST to NBEMS (official) — ~₹4 L for the course')
    elif fee:
        facts['fee_per_year'] = fee
        if fee >= 2e6: cons.append(f'Expensive: about {lakh(fee)}/yr ≈ {lakh(fee*3)} for 3 years')
        elif fee >= 9e5: cons.append(f'Private fee about {lakh(fee)}/yr ≈ {lakh(fee*3)} for 3 years')
        elif fee < 3e5: pros.append(f'Low fee: about {lakh(fee)}/yr')
        if fee_o and fee_r and abs(fee_o - fee_r) > 5e5: cons.append(f'Fee conflict: college declared {lakh(fee_o)}/yr to MCC but research shows ~{lakh(fee_r)}/yr — verify in writing')
    # 4. stipend (official MCC declaration preferred)
    st_txt = o.get('stipend') if 'MCC' in (o.get('stipend') or '') else (c.get('stipend') or (r or {}).get('stipend_year1') or o.get('stipend'))
    st = rupees(st_txt) if st_txt else None
    if st and st < 100000:
        facts['stipend_y1'] = st
        floor = 43000 if 'dnb' in c['kind'] else None
        if floor and st < floor: cons.append(f'Declared year-1 stipend ₹{st:,} is below the NBEMS minimum ₹43,000 — deal-breaker unless corrected in writing')
        elif st >= 75000: pros.append(f'Good stipend: ₹{st:,}/month in year 1 (official declaration)')
        elif st < 50000: cons.append(f'Low stipend: ₹{st:,}/month in year 1 (official declaration)')
    # 5. bond (college's own MCC bond document, else rule)
    b = o.get('bond_doc')
    if b:
        yrs = re.search(r'(\d+)', b.get('service_years') or ''); amt = rupees(b.get('service_bond'))
        if not b.get('service_years') and not b.get('service_bond'): pros.append('No post-PG service bond in the college\'s own bond document' + (f' (leaving penalty: {b["leaving_penalty"]})' if b.get('leaving_penalty') else ''))
        elif yrs and int(yrs.group(1)) >= 2: cons.append(f'Service bond {b["service_years"]}' + (f', {b["service_bond"]} if not served' if b.get('service_bond') else '') + ' (official bond document)')
        elif amt and amt >= 4e6: cons.append(f'Heavy bond: {b["service_bond"]} for {b.get("service_years") or "service"} (official bond document)')
        else: facts['bond'] = f'{b.get("service_years") or ""} {b.get("service_bond") or ""}'.strip()
    elif c['kind'] == 'pdnb': pros.append('No bond or security deposit allowed at private DNB hospitals (NBEMS rule)')
    elif c['kind'] == 'mhpriv': pros.append('No post-PG bond at Maharashtra private colleges (state rule); only 3 years\' fee if you resign after the cut-off')
    elif c['kind'] in ('govt', 'mhgovt', 'gdnb'):
        t = re.sub('<[^>]+>', '', c['bond'])
        m = re.search(r'(\d) years?.*?(₹[\d,]+ ?L|₹[\d,]+)', t)
        if m and int(m.group(1)) >= 2: cons.append(f'State service bond: {t[:90]}')
    # 6. super-speciality (official MCC SS counselling list)
    if s:
        areas = sorted(s['areas']); facts['ss_areas'] = areas
        strong = [x for x in areas if x in ('Cardiac', 'Neuro', 'Renal/Transplant', 'GI surgery', 'Onco', 'Paeds')]
        if len(strong) >= 4: pros.append(f'Runs official DM/MCh/DNB-SS courses in {", ".join(areas)} — functioning super-speciality departments')
        elif strong: pros.append(f'Official super-speciality courses running in {", ".join(areas)}')
        else: facts['ss_note'] = f'SS courses only in {", ".join(areas)}'
    elif c['kind'] in ('govt', 'mhgovt', 'deemed', 'mhpriv'):
        cons.append('No DM/MCh/DNB-SS course at this hospital in MCC\'s 2025 super-speciality counselling — cardiac/neuro/transplant exposure unlikely in-house')
    # 7. research pros/cons (web, labelled)
    if r:
        for p in r['pros']: pros.append(p['text'] + f' [{p["type"]}]')
        for p in r['cons']: cons.append(p['text'] + f' [{p["type"]}]')
        if r.get('beds') and not re.match(r'(?i)not', r['beds']): facts['beds'] = r['beds'][:40]
    # 8. suggestion "for you" — only-good-enough-to-join logic
    vv = v['verdict'] if v else None
    reach = 'good' if AIR <= d24 and AIR <= d25 else 'ok' if AIR <= d25 else 'mid' if d25 and AIR <= d25 * 1.1 else 'bad'
    if reach == 'bad': rec = ('Leave out', 'Out of reach on 2024–25 data' + (' — fine as a dream pick at the very top' if vv == 'Join' or (s and len(s['areas']) >= 4) else ''))
    elif vv == 'Join': rec = ('Put high', 'Good enough to join — confirm the open questions before locking')
    elif vv == 'Backup only': rec = ('Backup only', 'Join only if nothing better is allotted')
    elif vv == 'Avoid': rec = ('Leave out', 'Has a deal-breaker — don\'t fill it unless you would truly join')
    else: rec = ('Backup only', 'Reachable but not researched — treat as a backup until seniors vouch for it')
    out[cid] = {'pros': pros, 'cons': cons, 'facts': facts, 'rec': rec[0], 'rec_why': rec[1],
                'data_verdict': None if v else (f'Not reachable at your AIR (2025 closing {d25:,}); not researched.' if reach == 'bad' else 'Reachable but not researched online — official data only.')}
json.dump(out, open(APP + 'derived.json', 'w'), ensure_ascii=False)
import collections
print(len(out), collections.Counter(x['rec'] for x in out.values()), 'avg pros', sum(len(x['pros']) for x in out.values()) / len(out), 'avg cons', sum(len(x['cons']) for x in out.values()) / len(out))
