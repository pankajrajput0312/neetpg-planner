# Excel version of the Sheet tab (same rows/columns/labels), with colour-coded labels and one tab per section.
import json, re, sys
sys.path.insert(0, '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/v/lib/python3.11/site-packages')
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
L = lambda f: json.load(open(APP + f))
C = {c['id']: c for c in L('colleges.json')['colleges']}; R = L('research.json'); O = L('official.json'); V = L('verdict.json'); S = L('superspec.json'); SITES = L('sites.json'); RES = L('resident.json'); D = L('derived.json'); SHEET = L('sheet.json')
AIR, CAT = 42000, 'OBC'
STATES = ["Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Himachal Pradesh", "Uttarakhand", "Punjab", "Chhattisgarh", "Jharkhand", "Karnataka", "Tamil Nadu", "Meghalaya", "Assam", "Odisha", "Manipur", "Andhra Pradesh"]
strip = lambda h: re.sub('<[^>]+>', '', h or '')
def cats(c): return [k for k in (c['ranks'].get('2025') or c['ranks'].get('2024') or {}) if k in ('Open', 'OBC')]
def deep(c, y): return max([v or 0 for k in cats(c) for v in c['ranks'].get(y, {}).get(k, [])] + [0])
def chance(c):
    d24, d25 = deep(c, '2024'), deep(c, '2025')
    return ('Likely', 'good') if AIR <= d24 and AIR <= d25 else ('Possible', 'ok') if AIR <= d25 else ('Borderline', 'mid') if d25 and AIR <= d25 * 1.1 else ('Unlikely', 'bad')
def money(t):
    m = re.search(r'(?:₹|Rs\.?|INR)\s?[\d,.]+(?:\s?(?:lakh|L|crore|Cr|k))?(?:\s?(?:/|per |a )\s?(?:yr|year|month|mo))?', t or '', re.I)
    return m.group(0).replace('Rs', '₹') if m else (t or '')
real = lambda v: v if v and not re.match(r'(?i)^not (found|verified|stated)', v) else None
def stipend(c):
    o = O.get(c['id'], {}); return money((o.get('stipend') if 'MCC' in (o.get('stipend') or '') else None) or real(c.get('stipend')) or real(R.get(c['id'], {}).get('stipend_year1')) or o.get('stipend'))
def bond_years(c):
    d = O.get(c['id'], {}).get('bond_doc'); t = (d or {}).get('service_years') or strip(c['bond'])
    if c['kind'] in ('pdnb', 'mhpriv'): return 0
    m = re.search(r'(\d)\s*years?', t or '', re.I)
    return int(m.group(1)) if m else (0 if d and not d.get('service_years') and not d.get('service_bond') else None)
CONF = {'High': 3, 'Medium': 2, 'Low': 1, 'Unverified': 0}
DEAL = re.compile(r'suicide|harass|assault|unpaid|not paid|withh|ragging|threat culture|strike', re.I)
def labels(c):
    sp = S.get(c['id']); r = R.get(c['id']); rs = RES.get(c['id']); st = SITES.get(c['id'])
    strong = [a for a in (sp or {}).get('areas', {}) if a in ('Cardiac', 'Neuro', 'Renal/Transplant', 'GI surgery', 'Onco', 'Paeds')]
    ssc = (r or {}).get('super_speciality', {}).get('confidence', 'Unverified')
    sdep = len([d for d in (st or {}).get('departments', []) if re.search(r'cardiac|ctvs|neuro|transplant|onco|paedi|pedi|nicu|picu', d, re.I)])
    ss = ('Strong (official)', 'good') if sp and len(strong) >= 3 else (f"Some (official: {', '.join(sp['areas'])})", 'ok') if sp else ('Claimed on site', 'ok') if sdep >= 3 else ('Claimed', 'ok') if ssc in ('High', 'Medium') else ('Weak / unclear', 'mid') if ssc == 'Low' or sdep else ('Unknown — ask', 'none')
    hs = (rs or {}).get('hands_on'); neg = bool(hs and re.search(r'observ|limited|no hands|restricted|consultant-led|clerical', hs['summary'], re.I))
    ho = (('Observation-heavy', 'bad') if neg else ('Some reports (weak)', 'mid') if hs['confidence'] == 'Low' else ('Good (reported)', 'good')) if hs and hs['confidence'] != 'Unverified' else ('Some evidence', 'ok') if r and r['hands_on']['confidence'] != 'Unverified' else ('Dept page only', 'mid') if (st or {}).get('anaesthesia_dept', {}) and (st['anaesthesia_dept'] or {}).get('services') else ('Unknown — ask', 'none')
    flags = [f for f in (rs or {}).get('red_flags', []) if DEAL.search(f)]; hc = (rs or {}).get('hours_culture')
    hr = ('Serious concerns', 'bad') if flags and hc and CONF[hc['confidence']] >= 2 else ('Concerns reported', 'mid') if flags else (('Reported OK', 'good') if CONF[hc['confidence']] >= 2 else ('Mixed / thin', 'mid')) if hc and hc['confidence'] != 'Unverified' else ('Some reports', 'ok') if r and r['toxicity']['confidence'] != 'Unverified' else ('Unknown — ask', 'none')
    by = bond_years(c)
    bd = ('None', 'good') if by == 0 else ('1 yr', 'ok') if by == 1 else (f'{by} yrs', 'bad') if by is not None else ('Not verified', 'none')
    return ss, ho, hr, bd
HOURS = re.compile(r'\b\d{1,2}(?:\s*[-–to]+\s*\d{1,2})?\s*(?:h\b|hr|hrs|hour)[^.;]{0,60}', re.I)
TOX = re.compile(r'suicide|death|died|resign|strike|harass|unpaid|not paid|withh|protest|ragging|threat culture|assault', re.I)
def row(c):
    rs = RES.get(c['id']); r = R.get(c['id']); sp = S.get(c['id']); st = SITES.get(c['id']); o = O.get(c['id'], {})
    hands = rs['hands_on']['summary'] if rs and rs['hands_on']['confidence'] != 'Unverified' else r['hands_on']['summary'] if r and r['hands_on']['confidence'] != 'Unverified' else ''
    multi = 'Official courses: ' + ', '.join(sp['areas']) if sp else 'Site lists: ' + ', '.join(st['departments'][:8]) if st and st['departments'] else r['super_speciality']['summary'] if r and r['super_speciality']['confidence'] != 'Unverified' else ''
    tox = ' · '.join(dict.fromkeys([t for t in (rs or {}).get('red_flags', []) + [x['text'] for x in (rs or {}).get('cons', [])] + [x['text'] for x in (r or {}).get('cons', [])] if TOX.search(t)]).keys())[:400]
    htxt = ' '.join([(rs or {}).get('hours_culture', {}).get('summary', '')] + [i['text'] for i in (rs or {}).get('hours_culture', {}).get('items', [])] + [(rs or {}).get('hands_on', {}).get('summary', '')])
    hours = ' · '.join(dict.fromkeys(m.strip() for m in HOURS.findall(htxt)).keys())[:200]
    icu = (re.search(r'[^.]{0,60}\bICU\b[^.]{0,80}(?:week|posting|rotation|month)[^.]{0,40}', htxt + ' ' + ((st or {}).get('anaesthesia_dept') or {}).get('notes', '') + ' ' + ((st or {}).get('academics') or '')) or [''])
    icu = icu.group(0).strip() if hasattr(icu, 'group') else ''
    b = o.get('bond_doc'); bond = ' · '.join(x for x in [b.get('service_years'), b.get('service_bond'), b.get('leaving_penalty') and 'leaving: ' + b['leaving_penalty']] if x) if b and (b.get('service_years') or b.get('service_bond') or b.get('leaving_penalty')) else 'None (NBEMS rule)' if c['kind'] == 'pdnb' else "None; 3 yrs' fee if you resign late" if c['kind'] == 'mhpriv' else ''
    return bond, stipend(c), hands, multi, tox, hours, icu
FILL = {'good': 'DCF5E6', 'ok': 'E4ECFF', 'mid': 'FFF1C9', 'bad': 'FDE4E4', 'none': 'F2F2F2'}
FONT = {'good': '0B6B3A', 'ok': '1D4ED8', 'mid': '8A5A00', 'bad': 'B91C1C', 'none': '666666'}
VK = {'Join': 'good', 'Join, after checks': 'ok', 'Backup only': 'mid', 'Avoid': 'bad'}
wb = Workbook(); ws = wb.active; ws.title = 'Shortlist'
head = ['State', 'College (as given)', 'Matched in app', 'Type', 'Verdict', 'For you', 'Why (one line)', 'Chance at 42k', '2025 closing AIR', '2024 closing AIR',
        'Bond — label', 'Bond — detail', 'Stipend (yr 1)', 'Multispeciality — label', 'Multispeciality — detail', 'Hands on — label', 'Hands on — detail',
        'Toxicity — label', 'Toxicity (resignations / suicides / unknown deaths)', 'Working hours / day', 'ICU posting hrs / week']
seg = ['', '', '', '', 'Verdict', '', '', 'Reach', '', '', 'Money & bond', '', '', 'Training', '', '', '', 'Daily life', '', '', '']
ws.append(seg); ws.append(head)
thin = Side(style='thin', color='DDDDDD')
for cell in ws[2]: cell.font = Font(bold=True, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor='111111'); cell.alignment = Alignment(wrap_text=True, vertical='center')
for cell in ws[1]: cell.font = Font(bold=True, color='2563EB'); cell.alignment = Alignment(horizontal='center')
for st in STATES:
    for s in [x for x in SHEET if x['state'] == st]:
        c = C.get(s['id']) if s['id'] else None
        if not c: ws.append([st, s['given'], 'not in app data (no 2024–25 allotment near your rank)'] + [''] * (len(head) - 3)); continue
        v = V.get(c['id']); d = D.get(c['id'], {}); ch = chance(c); ss, ho, hr, bd = labels(c); bond, stp, hands, multi, tox, hours, icu = row(c)
        typ = {'govt': 'Government college', 'mhgovt': 'Government college (MH quota)', 'deemed': 'Deemed university (private)', 'mhpriv': 'Private college (MH quota)', 'pdnb': 'Private hospital · DNB', 'gdnb': 'Government hospital · DNB'}.get(c['kind'], c['kind'])
        ws.append([st, s['given'], c['name'].split(',')[0][:60], typ, v['verdict'] if v else 'Not assessed', d.get('rec', ''), (v['headline'] if v else d.get('data_verdict', '')) or '', ch[0], deep(c, '2025') or '', deep(c, '2024') or '',
                   bd[0], bond, stp, ss[0], multi, ho[0], hands, hr[0], tox, hours, icu])
        rr = ws.max_row
        def paint(col, level):
            cell = ws.cell(row=rr, column=col); cell.fill = PatternFill('solid', fgColor=FILL[level]); cell.font = Font(color=FONT[level], bold=True)
        if v: paint(5, VK[v['verdict']])
        paint(6, {'Put high': 'good', 'Backup only': 'mid', 'Leave out': 'bad'}.get(d.get('rec'), 'none')); paint(8, ch[1]); paint(11, bd[1]); paint(14, ss[1]); paint(16, ho[1]); paint(18, hr[1])
        if deep(c, '2025') >= AIR: paint(9, 'good')
widths = [14, 26, 28, 20, 16, 12, 40, 12, 12, 12, 12, 34, 16, 22, 40, 18, 40, 18, 40, 30, 30]
for i, w in enumerate(widths, 1): ws.column_dimensions[get_column_letter(i)].width = w
for rowc in ws.iter_rows(min_row=3):
    for cell in rowc: cell.alignment = Alignment(wrap_text=True, vertical='top'); cell.border = Border(top=thin, bottom=thin, left=thin, right=thin)
ws.freeze_panes = 'C3'; ws.auto_filter.ref = f"A2:{get_column_letter(len(head))}{ws.max_row}"
# legend sheet
lg = wb.create_sheet('How to read')
for line in ['Shortlist sheet — NEET-PG 2026 Anaesthesia, AIR ~42,000 OBC-NCL', '',
    'Verdict: Join / Join after checks / Backup only / Avoid — from official data + web/resident research on her 5 priorities.',
    'For you: Put high / Backup only / Leave out — whether the seat is worth filling in counselling.',
    'Chance: Likely = reached in 2024 & 2025; Possible = 2025 only; Borderline = within 10% of 2025 closing; Unlikely = not reached.',
    'Labels: green = good, blue = acceptable, amber = caution, red = problem, grey "Unknown — ask" = nothing verified online (only seniors can answer).',
    'Blank cell = nothing verified, NOT "no". "not in app data" = no 2024–25 allotment near the rank, so never researched.',
    'Sources: MCC/CET Cell allotment PDFs (cutoffs), colleges\' own MCC declarations (fee, stipend, bond documents), MCC NEET-SS 2025 list (DM/MCh courses), hospital websites, news and resident forums (anecdotal).',
    'DNB pass rate is never published per institute by NBEMS — ask the department for the last 3 batches.', 'Generated 10 Oct 2026 from the NEET-PG planner app.']:
    lg.append([line])
lg.column_dimensions['A'].width = 140
out = '/Users/pankaj/Documents/code/neetpg-planner/public/NEETPG_Anaesthesia_Shortlist_Sheet.xlsx'
import os; os.makedirs('/Users/pankaj/Documents/code/neetpg-planner/public', exist_ok=True); wb.save(out); print('saved', out, ws.max_row - 2, 'rows')
