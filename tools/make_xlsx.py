# Excel version of the Sheet tab (same rows/columns/labels), with colour-coded labels and one tab per section.
import json, re, sys
sys.path.insert(0, '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/v/lib/python3.11/site-packages')
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter
APP = '/Users/pankaj/Documents/code/neetpg-planner/app/'
L = lambda f: json.load(open(APP + f))
C = {c['id']: c for c in L('colleges.json')['colleges']}; R = L('research.json'); O = L('official.json'); V = L('verdict.json'); S = L('superspec.json'); SITES = L('sites.json'); RES = L('resident.json'); D = L('derived.json'); SHEET = L('sheet.json'); TX = L('toxhours.json')
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
    ss = (f'High — {len(strong)} super-speciality depts, officially confirmed', 'good') if sp and len(strong) >= 3 else (f"Medium — only {', '.join(sp['areas'])} (officially confirmed)", 'ok') if sp else (f"Medium — {sdep} super-speciality depts, hospital's own claim", 'ok') if sdep >= 3 else ('Medium — mentioned online, not confirmed', 'ok') if ssc in ('High', 'Medium') else ('Low — little super-speciality work', 'mid') if ssc == 'Low' or sdep else ('Missing — nothing found online', 'none')
    hs = (rs or {}).get('hands_on'); neg = bool(hs and re.search(r'observ|limited|no hands|restricted|consultant-led|clerical', hs['summary'], re.I))
    ho = (('Poor — residents mostly watch', 'bad') if neg else ('Unclear — no reliable resident review', 'mid') if hs['confidence'] == 'Low' else ('Good — residents say they do cases', 'good')) if hs and hs['confidence'] != 'Unverified' else ('Some — reported, but not by residents', 'ok') if r and r['hands_on']['confidence'] != 'Unverified' else ('Unclear — no resident has said', 'mid') if (st or {}).get('anaesthesia_dept', {}) and (st['anaesthesia_dept'] or {}).get('services') else ('Missing — nothing found online', 'none')
    flags = [f for f in (rs or {}).get('red_flags', []) if DEAL.search(f)]; hc = (rs or {}).get('hours_culture')
    tx = TX.get(c['id'], {}).get('toxicity'); cnt = (tx or {}).get('count', {}); serious = cnt.get('suicides', 0) + cnt.get('unknown_deaths', 0); minor = cnt.get('strikes', 0) + cnt.get('harassment', 0) + cnt.get('resignations', 0)
    hr = ((f'Red flag — {serious} deaths reported' if serious > 1 else 'Red flag — a death reported'), 'bad') if tx and tx['cell'] and serious else ('Caution — complaints reported', 'mid') if tx and tx['cell'] and minor else ('OK — nothing bad found online', 'ok') if tx and re.search(r'(?i)nothing (adverse|bad) found|^no resident (incident|item)|nothing about (this|residents|pgs)', tx['cell']) and not flags else ('Caution — complaints reported', 'mid') if tx and re.search(r'(?i)toxic|harass|unpaid|not paid|strike', tx['cell']) else ('Red flag — serious resident complaints', 'bad') if flags and hc and CONF[hc['confidence']] >= 2 else ('Caution — resident complaints', 'mid') if flags else (('Good — residents report sane hours', 'good') if CONF[hc['confidence']] >= 2 else ('Unclear — only weak reports', 'mid')) if hc and hc['confidence'] != 'Unverified' else ('Unclear — some reports, read the text', 'ok') if r and r['toxicity']['confidence'] != 'Unverified' else ('Missing — nothing found online', 'none')
    by = bond_years(c)
    bd = ('No bond', 'good') if by == 0 else ('1-year bond', 'ok') if by == 1 else (f'{by}-year bond', 'bad') if by is not None else ('Missing — bond not confirmed', 'none')
    return ss, ho, hr, bd
HOURS = re.compile(r'\b\d{1,2}(?:\s*[-–to]+\s*\d{1,2})?\s*(?:h\b|hr|hrs|hour)[^.;]{0,60}', re.I)
TOX = re.compile(r'suicide|death|died|resign|strike|harass|unpaid|not paid|withh|protest|ragging|threat culture|assault', re.I)
AREA_NAME = {'Cardiac': 'Heart', 'Neuro': 'Brain & spine', 'Renal/Transplant': 'Kidney & transplant', 'GI surgery': 'Stomach & liver (GI) surgery', 'Onco': 'Cancer', 'Paeds': "Children's surgery", 'Critical care': 'Critical care (ICU)', 'Vascular/Thoracic': 'Blood vessel & chest surgery'}
DEPTS = [(r'cardiac surg|ctvs|cvts|cardiothoracic|cardio-?thoracic', 'Heart surgery'), (r'cardiolog|cath', 'Cardiology'), (r'neurosurg|neuro surg|spine surg', 'Brain & spine surgery'),
  (r'kidney transplant|renal transplant', 'Kidney transplant'), (r'liver transplant', 'Liver transplant'), (r'nephro|dialysis', 'Kidney (dialysis)'), (r'urolog', 'Urology'),
  (r'gi surg|gastro.{0,20}surg|hpb|surgical gastro', 'GI surgery'), (r'onco', 'Cancer surgery'), (r'pa?ediatric surg', "Children's surgery"), (r'nicu|picu|neonat', 'Newborn / child ICU'),
  (r'trauma|emergenc|casualty', 'Trauma & emergency'), (r'burn', 'Burns'), (r'pain', 'Pain clinic')]
def multi_text(c):
    sp = S.get(c['id']); st = SITES.get(c['id']) or {}; r = R.get(c['id'])
    site = list(dict.fromkeys(n for rx, n in DEPTS if any(re.search(rx, d, re.I) for d in st.get('departments', []))))
    if sp: return 'Officially confirmed: ' + ', '.join(AREA_NAME.get(a, a) for a in sp['areas']) + '.' + (' Website also lists: ' + ', '.join(site) + '.' if site else '')
    if site: return 'Hospital website lists: ' + ', '.join(site) + '. Not officially confirmed.'
    return r['super_speciality']['summary'] if r and r['super_speciality']['confidence'] != 'Unverified' else ''
def row(c):
    rs = RES.get(c['id']); r = R.get(c['id']); sp = S.get(c['id']); st = SITES.get(c['id']); o = O.get(c['id'], {})
    hands = rs['hands_on']['summary'] if rs and rs['hands_on']['confidence'] != 'Unverified' else r['hands_on']['summary'] if r and r['hands_on']['confidence'] != 'Unverified' else ''
    multi = multi_text(c)
    tox = ' · '.join(dict.fromkeys([t for t in (rs or {}).get('red_flags', []) + [x['text'] for x in (rs or {}).get('cons', [])] + [x['text'] for x in (r or {}).get('cons', [])] if TOX.search(t)]).keys())[:400]
    htxt = ' '.join([(rs or {}).get('hours_culture', {}).get('summary', '')] + [i['text'] for i in (rs or {}).get('hours_culture', {}).get('items', [])] + [(rs or {}).get('hands_on', {}).get('summary', '')])
    hours = ' · '.join(dict.fromkeys(m.strip() for m in HOURS.findall(htxt)).keys())[:200]
    icu = (re.search(r'[^.]{0,60}\bICU\b[^.]{0,80}(?:week|posting|rotation|month)[^.]{0,40}', htxt + ' ' + ((st or {}).get('anaesthesia_dept') or {}).get('notes', '') + ' ' + ((st or {}).get('academics') or '')) or [''])
    icu = icu.group(0).strip() if hasattr(icu, 'group') else ''
    b = o.get('bond_doc'); bond = ' · '.join(x for x in [b.get('service_years'), b.get('service_bond'), b.get('leaving_penalty') and 'leaving: ' + b['leaving_penalty']] if x) if b and (b.get('service_years') or b.get('service_bond') or b.get('leaving_penalty')) else "Private DNB hospitals can't take a bond (NBEMS rule)" if c['kind'] == 'pdnb' else "None; 3 yrs' fee if you resign late" if c['kind'] == 'mhpriv' else ''
    t = TX.get(c['id'])
    if t: tox, hours, icu = ('' if re.match(r'(?i)^nothing adverse found online\.?$', t['toxicity']['cell'].strip()) else t['toxicity']['cell']) or tox, t['hours_per_day']['cell'] or hours, t['icu_per_week']['cell'] or icu
    return bond, stipend(c), hands, multi, tox, hours, icu
CHANCE_TEXT = {'good': 'reached her rank in both 2024 & 2025', 'ok': 'reached her rank in 2025 only', 'mid': 'missed her rank by less than 10% in 2025', 'bad': 'closed well before her rank'}
def PLACE(d):
    r = d.get('rec', '')
    return 'Put high in her list' if r == 'Put high' else 'Keep lower, as a backup' if r == 'Backup only' else 'Leave out — out of her rank range' if re.search(r'(?i)out of reach', d.get('rec_why', '')) else 'Leave out — has a deal-breaker'
FILL = {'good': 'DCF5E6', 'ok': 'E4ECFF', 'mid': 'FFF1C9', 'bad': 'FDE4E4', 'none': 'F2F2F2'}
FONT = {'good': '0B6B3A', 'ok': '1D4ED8', 'mid': '8A5A00', 'bad': 'B91C1C', 'none': '666666'}
VK = {'Join': 'good', 'Backup only': 'mid', 'Avoid': 'bad'}
wb = Workbook(); ws = wb.active; ws.title = 'Shortlist'
head = ['State', 'College (as given)', 'Official name', 'Type of seat', 'Verdict (is it good?)', 'Where to place it in her list', 'Why (one line)', 'Chance at AIR 42k', '2025 closing AIR', '2024 closing AIR',
        'Bond', 'Bond — detail', 'Stipend per month (yr 1)', 'Multispeciality exposure', 'Multispeciality — detail', 'Hands on', 'Hands on — detail',
        'Toxicity', 'Toxicity — detail (resignations / suicides / deaths / strikes)', 'Working hours / day', 'ICU posting hrs / week']
ws.append(head)
thin = Side(style='thin', color='DDDDDD')
for cell in ws[1]: cell.font = Font(bold=True, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor='111111'); cell.alignment = Alignment(wrap_text=True, vertical='center')
for st in STATES:
    for s in [x for x in SHEET if x['state'] == st]:
        c = C.get(s['id']) if s['id'] else None
        if not c:
            t = TX.get('given:' + s['given'], {}); ws.append([st, s['given'], 'No MCC anaesthesia seat in 2024–25 — nothing to judge'] + [''] * (len(head) - 6) + [t.get(k, {}).get('cell', '') for k in ('toxicity', 'hours_per_day', 'icu_per_week')]); continue
        v = V.get(c['id']); d = D.get(c['id'], {}); ch = chance(c); ss, ho, hr, bd = labels(c); bond, stp, hands, multi, tox, hours, icu = row(c)
        typ = {'govt': 'Government college', 'mhgovt': 'Government college (MH quota)', 'deemed': 'Deemed university (private)', 'mhpriv': 'Private college (MH quota)', 'pdnb': 'Private hospital · DNB', 'gdnb': 'Government hospital · DNB'}.get(c['kind'], c['kind'])
        ws.append([st, s['given'], c['name'].split(',')[0][:60], typ, v['verdict'] if v else 'Not assessed', PLACE(d), (v['headline'] if v else d.get('data_verdict', '')) or '', f'{ch[0]} — {CHANCE_TEXT[ch[1]]}', deep(c, '2025') or '', deep(c, '2024') or '',
                   bd[0], bond, stp, ss[0], multi, ho[0], hands, hr[0], tox, hours, icu])
        rr = ws.max_row
        def paint(col, level):
            cell = ws.cell(row=rr, column=col); cell.fill = PatternFill('solid', fgColor=FILL[level]); cell.font = Font(color=FONT[level], bold=True)
        if v: paint(5, VK[v['verdict']])
        paint(6, {'Put high': 'good', 'Backup only': 'mid', 'Leave out': 'bad'}.get(d.get('rec'), 'none')); paint(8, ch[1]); paint(11, bd[1]); paint(14, ss[1]); paint(16, ho[1]); paint(18, hr[1])
        if deep(c, '2025') >= AIR: paint(9, 'good')
widths = [14, 26, 28, 20, 16, 12, 40, 12, 12, 12, 12, 34, 16, 22, 40, 18, 40, 18, 40, 30, 30]
for i, w in enumerate(widths, 1): ws.column_dimensions[get_column_letter(i)].width = w
for rowc in ws.iter_rows(min_row=2):
    for cell in rowc: cell.alignment = Alignment(wrap_text=True, vertical='top'); cell.border = Border(top=thin, bottom=thin, left=thin, right=thin)
ws.freeze_panes = 'C2'; ws.auto_filter.ref = f"A1:{get_column_letter(len(head))}{ws.max_row}"
# legend sheet: every label in the sheet, what it means and how it was decided
lg = wb.create_sheet('How to read')
G = [('Shortlist sheet — NEET-PG 2026 Anaesthesia, AIR ~42,000, OBC-NCL', '', ''), ('', '', ''), ('Column', 'Label you will see', 'What it means'),
 ('Verdict (is it good?)', 'Join', 'Good training: official DM/MCh courses in 2+ core areas, no red flags found, fair stipend. Take it if allotted.'),
 ('', 'Backup only', 'A real PG seat but weaker or less certain training. Fill it below the Join colleges.'),
 ('', 'Avoid', 'Has a deal-breaker (unpaid / below-minimum stipend, documented harassment, etc.). Do not fill unless she would truly join.'),
 ('Where to place it in her list', 'Put high in her list', 'Good college AND within her rank range — fill near the top.'),
 ('', 'Keep lower, as a backup', 'Worth filling, but below the "Put high" ones.'),
 ('', 'Leave out — out of her rank range', 'Closed well before AIR 42k in 2024 and 2025; filling it only wastes a choice (unless kept as a dream pick at the very top).'),
 ('', 'Leave out — has a deal-breaker', 'Reachable, but the verdict is Avoid.'),
 ('Chance at AIR 42k', 'Likely — reached her rank in both 2024 & 2025', 'Someone at or below AIR 42k (Open or OBC) was allotted this seat in both years.'),
 ('', 'Possible — reached her rank in 2025 only', 'Only 2025 went as far as 42k.'),
 ('', 'Borderline — missed her rank by less than 10% in 2025', 'Last 2025 allotment was within 10% of 42k (e.g. 38k–42k).'),
 ('', 'Unlikely — closed well before her rank', 'Last allotment in both years was far above her (e.g. 30k).'),
 ('2025 / 2024 closing AIR', 'number', 'Highest AIR allotted in any round (R1, R2, R3, stray) for Open or OBC — from official MCC result PDFs. Green = reached 42k.'),
 ('Bond', 'No bond', 'No service bond. Private DNB hospitals are barred by NBEMS from taking one.'),
 ('', '1-year bond / N-year bond', 'Must serve that many years after PG (or pay the penalty in Bond — detail).'),
 ('', 'Missing — bond not confirmed', 'No official bond document found; ask the college.'),
 ('Multispeciality exposure', 'High — N super-speciality depts, officially confirmed', 'Official MCC list shows super-speciality (DM/MCh) training running in 3+ of: heart, brain, kidney/transplant, GI surgery, cancer, children. Strongest proof those OTs are busy.'),
 ('', 'Medium — only Cardiac … (officially confirmed)', 'Officially confirmed, but in only 1–2 areas (named in the label).'),
 ('', "Medium — N super-speciality depts, hospital's own claim", 'Only the hospital website says so; nothing official confirms it.'),
 ('', 'Medium — mentioned online, not confirmed', 'News or review sites mention it.'),
 ('', 'Low — little super-speciality work', 'Very little found.'),
 ('Hands on', 'Good — residents say they do cases', 'Two or more resident / news accounts say PGs give anaesthesia themselves.'),
 ('', 'Some — reported, but not by residents', 'A website or review says PGs do cases; no resident confirms it.'),
 ('', 'Unclear — no reliable resident review', 'No one who trained there has written about it; only the hospital or review sites say anything. Searched: Reddit, Quora, review sites, Google.'),
 ('', 'Unclear — no resident has said', 'The department page lists what it does, but nobody says how much PGs actually do.'),
 ('', 'Poor — residents mostly watch', 'Reports that PGs mostly observe; consultants do the cases.'),
 ('Toxicity', 'OK — nothing bad found online', '5–8 searches (news, Reddit, forums) found no suicide, strike, harassment or unpaid stipend naming this hospital.'),
 ('', 'Caution — complaints reported', 'A strike, unpaid stipend, harassment or duty-hour complaint naming the hospital (see detail).'),
 ('', 'Red flag — a death reported', 'Suicide or unexplained death linked to the hospital (detail says who and when).'),
 ('', 'Good — residents report sane hours', 'Residents describe manageable hours.'),
 ('', 'Unclear — …', 'Thin evidence either way; read the detail.'),
 ('Any column', 'Missing — nothing found online', 'Searched; nothing published. Only seniors there can answer — ask them.'),
 ('Any text cell', '(blank)', 'Nothing found — NOT the same as "no".'),
 ('Colours', 'green / blue / amber / red / grey', 'good / acceptable / caution / problem / missing'),
 ('', '', ''), ('Sources', '', 'MCC & CET Cell allotment PDFs (cutoffs), colleges\' own MCC declarations (stipend, fee, bond), MCC NEET-SS 2025 list (DM/MCh), hospital websites, news, resident forums (anecdotal). Generated 10 Oct 2026.')]
for g in G: lg.append(list(g))
for cell in lg[3]: cell.font = Font(bold=True, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor='111111')
lg['A1'].font = Font(bold=True, size=13)
for row_ in lg.iter_rows(min_row=4):
    for cell in row_: cell.alignment = Alignment(wrap_text=True, vertical='top')
lg.column_dimensions['A'].width = 28; lg.column_dimensions['B'].width = 48; lg.column_dimensions['C'].width = 100

out = '/Users/pankaj/Documents/code/neetpg-planner/public/NEETPG_Anaesthesia_Shortlist_Sheet.xlsx'
import os; os.makedirs('/Users/pankaj/Documents/code/neetpg-planner/public', exist_ok=True); wb.save(out); print('saved', out, ws.max_row - 1, 'rows')
