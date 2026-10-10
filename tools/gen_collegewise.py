import json, re, html, collections
S = '/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/'
OUT = '/Users/pankaj/Documents/code/getsetyo-ai/reports/Anaesthesia college wise ranks AIR 42000.html'
E = html.escape

MCC = {
 '24r1': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2024/11/2024112085.pdf',
 '24r2': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2024/12/2024121477.pdf',
 '24r3': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/01/2025012533.pdf',
 '24st': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/02/2025021923.pdf',
 '25r1': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/11/202511221303622410.pdf',
 '25r2': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/12/202512172132273940.pdf',
 '25r3': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2026/02/20260206892439077.pdf',
 '25st': 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2026/02/20260223177387794.pdf',
}
CET = {
 '25r1': 'https://statecetcell.s3.ap-south-1.amazonaws.com/PGM-25/SelList_R1.pdf',
 '25r2': 'https://statecetcell.s3.ap-south-1.amazonaws.com/PGM-25/SelList_R2.pdf',
 '25r3': 'https://statecetcell.s3.ap-south-1.amazonaws.com/PGM-25/Revised_SelList_R3.pdf',
 '25st': 'https://statecetcell.s3.ap-south-1.amazonaws.com/PGM-25/SelList_stray.pdf',
 '25sv': 'https://statecetcell.s3.ap-south-1.amazonaws.com/PGM-25/SelList_SVR2.pdf',
 '25ml': 'https://statecetcell.s3.ap-south-1.amazonaws.com/PGM-25/02-pgm-merit-r1.pdf',
 '24r1': 'https://medical2024.mahacet.org/NEET-PGM-2024/instructions-downloadFile/Revisedpgmr1SelList.pdf',
 '24r2': 'https://medical2024.mahacet.org/NEET-PGM-2024/instructions-downloadFile/SelList-R2.pdf',
 '24r4': 'https://medical2024.mahacet.org/NEET-PGM-2024/instructions-downloadFile/PGM-SelList-R4.pdf',
 '24ml': 'https://statecetcell.s3.ap-south-1.amazonaws.com/Old+Notifications/02-pgm-merit-r1.pdf',
}
IB = 'https://statecetcell.s3.ap-south-1.amazonaws.com/PGM-25/NEET+PG+2025+IB.pdf'
MCCB = 'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/10/202510181022788907.pdf'
NBN = 'https://natboard.edu.in/viewNotice.php?NBE=R1RvNXFHaVp4THFOSnNUZWpOT0RJdz09'
NBP = 'https://natboard.edu.in/viewUpload?xyz=MFFGM0M0bzNYTU9jSG5uWU9OWkZOZz09'
NBACC = 'https://accr.natboard.edu.in/online_user/DOCUMENTS/misc/information_bulletin_chapter/Jan-feb/09-2025.pdf'

def a(url, t): return f'<a href="{E(url)}" target="_blank" rel="noopener">{E(t)}</a>'

# ---------- bond / penalty rules (service bond and discontinuation penalty kept separate) ----------
MCC_DEP = f'MCC deposit (₹25k UR / ₹10k OBC; ₹2 L deemed) forfeited if an R2-or-later seat is not joined; a joined R3 seat cannot be resigned ({a(MCCB, "MCC 2025 bulletin")})'
STATE_BOND = {
 'Maharashtra': ('1 year (Maharashtra govt / local body / Defence); ₹50 L if not served — applies to AIQ and state quota at govt & municipal colleges, High: ' + a(IB, 'CET IB 2025 §20.3'),
                 '₹10 L if junior residency not completed (§20.1) + ₹10 L more if seat lapses and 2-year state-quota bar (§20.2), High: ' + a(IB, 'CET IB 2025 §20')),
 'Delhi': ('1 year in GNCTD facilities, ₹20 L PG bond (GNCTD orders 19 Sep 2024 / 25 Feb 2025; confirmed at MAMC only — Medium: ' + a('https://medicaldialogues.in/news/education/rs-15-lakh-for-mbbs-rs-20-lakh-for-pg-medical-super-speciality-mamc-introduces-1-year-mandatory-bond-service-153298', 'Medical Dialogues') + '). Central-govt colleges (VMMC, LHMC, RML, ESIC): Not verified',
           'Not verified (VMMC ₹10 L seat-leaving is aggregator-only)'),
 'Uttar Pradesh': ('2 years; ₹40 L (degree incl. DNB) — Low (aggregator: ' + a('https://bodmaseducation.com/blog_details/up-pg-bond-2025-rs40-lakh-penalty-2-year-service-mandatory-for-pg-medical-graduates', 'Bodmas') + ')',
                   'No fixed sum; resigning/non-joining → debarment from next UP counselling (148 debarred in 2025), Medium: ' + a('https://news.careers360.com/up-neet-pg-counselling-2025-148-students-debarred-for-not-joining-leaving-md-ms-seats-allotted-last-year/amp', 'Careers360')),
 'Madhya Pradesh': ('1 year rural; ₹10 L (UR) — Not verified (aggregator only); 2025 first-phase admission took an affidavit instead of the bond, Medium: ' + a('https://news.careers360.com/mp-neet-pg-2025-counselling-no-rural-service-or-seat-leaving-bond-for-first-phase-round-1-schedule-dme-mponline-gov-in-rules/amp', 'Careers360'),
                    '₹30 L discontinuation — Not verified (aggregator only)'),
 'Karnataka': ('Conflict: 3 years / ₹50 L (Medical Dialogues) vs 1 year (aggregators) — unresolved, check KEA 2026 bulletin',
               '₹10 L (degree) + 3-year PG-admission bar; applies to govt, AIQ and private seats, Medium: ' + a('https://medicaldialogues.in/news/education/medical-admissions/rs-10-lakh-penalty-for-discontinuing-pg-medical-course-in-karnataka-157186', 'Medical Dialogues 20 Oct 2025')),
 'Gujarat': ('₹40 L bond (₹10 L guarantee + ₹30 L undertaking), AIQ and state quota; 1 year rural "if required" — Not verified (BJMC page 404)', '"₹5 L + ₹20 L" — Not verified (aggregator only)'),
 'Rajasthan': ('2 years govt service or ₹50 L (anaesthesia tier), order of 1 Sep 2025, Medium: ' + a('https://medicaldialogues.in/news/education/rajasthan-pg-bond-penalty-now-upto-rs-15-crore-highest-for-dermatology-radiodiagnosis-gynaecology-medicine-154771', 'Medical Dialogues 7 Sep 2025'),
               '₹10 L "not to leave the course" surety, AIQ and state quota — Low (secondary)'),
 'Kerala': ('≥1 year as Senior Resident incl. AIQ; stipend paid + ₹50 L if broken; lapses if no post offered within 1 year, High: ' + a('https://cee.kerala.gov.in/pgm2025/pdf/prospectus.pdf', 'CEE Kerala PG 2025 prospectus'),
            '₹50 L + up to 2-year bar if seat vacated after stray allotment, High: ' + a('https://cee.kerala.gov.in/pgm2025/pdf/prospectus.pdf', 'prospectus cl. 10.1.19')),
 'Tamil Nadu': ('2 years incl. 50% AIQ; ₹40 L (MD), Medium: ' + a('https://medicaldialogues.in/news/education/rs-40-lakh-penalty-for-md-ms-rs-20-lakh-for-pg-diploma-tamil-nadu-bond-service-policy-155310', 'Medical Dialogues'), 'Discontinuation fee + stipend received (amount Not verified)'),
 'Telangana': ('1 year; ₹20 L (degree), Medium: ' + a('https://medicaldialogues.in/news/education/medical-admissions/telangana-pg-medical-admissions-2025-rs-50-lakh-penalty-for-leaving-seat-midway-157047', 'Medical Dialogues'), '₹50 L for not completing the course (same source)'),
 'West Bengal': ('3 years (open-category MD); penalty amount Not verified', '₹5 L (MD) discontinuation; no discontinuity bond for DNB, Medium: ' + a('https://news.careers360.com/west-bengal-neet-pg-2025-rs-5-lakh-bond-penalty-3-year-mandatory-service-for-open-category-nri-quota-md-ms-couselling/amp', 'Careers360')),
 'Bihar': ('3 years; ₹25 L + stipend, Medium: ' + a('https://news.careers360.com/bihar-neet-pg-2025-counselling-round-1-registration-begins-bond-penalty-up-rs-25-lakh-3-year-service-stipend-md-ms-admissions/amp', 'Careers360'), '₹15 L + all stipend (same source)'),
 'Chhattisgarh': ('2 years; ₹50 L (UR) — Not verified (aggregator)', 'Not verified'),
 'Odisha': ('2 years state service at govt colleges incl. DNB & AIQ; default = double the stipend received — Medium (c.2021, check 2026): ' + a('https://www.orissapost.com/odisha-enforces-bond-for-passing-out-doctors-from-govt-colleges-to-engage-two-years-in-service/amp/', 'Orissa Post'), '₹10 L + stipend received for leaving mid-course (same source)'),
 'Assam': ('₹20 L (degree), duration unclear — Not verified (aggregator)', 'Not verified'),
 'Punjab': ('AIQ: 2 years service or ₹20 L; state quota: 3 years or ₹30 L (13 Jun 2025 notification as reported) — Low (aggregator: ' + a('https://formity.ai/pg/service-bond/', 'Formity') + '; official scan unreadable)', 'Not verified'),
 'Haryana': ('No fixed service period — Not verified', '₹10 L + stipend — Not verified (aggregator)'),
}
NV = ('Not verified', 'Not verified')

def bond(state, kind, name):
    n = name.upper()
    if kind == 'deemed':
        return ('Institutional bond Not verified (MCC disclaims college bonds)', MCC_DEP)
    if kind == 'pdnb':
        return ('None — NBEMS bars private DNB hospitals from charging a bond or security deposit, High: ' + a(NBACC, 'NBEMS accreditation bulletin 2025 §5.10'),
                'No money penalty from NBEMS; resigning can bring NBEMS debarment and you cannot take another DNB seat for the course duration (' + a(NBN, 'NBEMS notice') + '); ' + MCC_DEP)
    if kind == 'gdnb':
        sb = 'Host govt hospital/state bond — Not verified for this hospital'
        if state == 'Uttar Pradesh': sb = 'UP ₹40 L degree bond explicitly lists DNB — Low (aggregator); applicability to this hospital Not verified'
        if state == 'Odisha': return STATE_BOND['Odisha'][0], STATE_BOND['Odisha'][1] + '; NBEMS debarment risk; ' + MCC_DEP
        if state == 'Delhi': sb = 'Delhi govt DNB seats: ₹10 L bond — Not verified (scanned GNCTD notice unreadable)'
        return (sb, 'NBEMS debarment risk on resignation (' + a(NBN, 'NBEMS notice') + '); ' + MCC_DEP)
    # govt MD via MCC AIQ
    if 'TATA MEMORIAL' in n or 'HOMI BHABHA' in n:
        return ('1 year or ₹25 L (TMC central institute) — Medium: Careers360 quoting CET brochure', '₹10 L for seat lapse (same)')
    if 'MAHATMA GANDHI INSTITUTE OF MEDICAL SCIENCES' in n:
        return ('1 year or ₹50 L — Medium (Careers360 quoting CET brochure)', '₹20 L non-completion (same)')
    if 'ESI' in n and state != 'Maharashtra':
        return ('ESIC bond — Not verified', MCC_DEP)
    sb, pen = STATE_BOND.get(state, NV)
    return (sb, pen + '; ' + MCC_DEP)

# ---------- institute-specific evidence (only what the research found; everything else stays "Not verified") ----------
NOTE = [  # (regex on upper-cased name, dict)
 (r'GRANT MEDICAL COLLEGE', dict(ss='CVTS dept since 1961: 2 units, 54 beds + 8 cardiac ICU beds; MCh CVTS & perfusion running — High: ' + a('https://gmcjjh.edu.in/wp-content/uploads/2025/04/cvts-1.pdf', 'GMC-JJ CVTS PDF 2025'))),
 (r'SETH GORDHANDAS|K\.E\.M\. HOSPITAL', dict(ss='Heart transplant (2024), liver programme restarted, hand transplant (2021) — Medium (news; ' + a('https://kem.edu/wp-content/uploads/2025/Annual-Report-2024_ebook.pdf', 'KEM annual report 2024') + ' not parsed)')),
 (r'^GOVERNMENT MEDICAL COLLEGE, NAGPUR', dict(ss='Super Speciality Hospital lists cardiac surgery; functioning Not verified (Low)', tox='MARD protests Oct–Nov 2025 after Dr Sampada Munde case — Medium (news)')),
 (r'INDIRA GANDHI GOVT.MEDICAL COLLEGE NAGPUR', dict(tox='Order: 1st-year residents no emergency duty for first 6 months (official notice; enforcement Not verified); MARD protests 2025 — Medium')),
 (r'B.J.GOVERNMENT MEDICAL COLLEGE', dict(tox='~400 Sassoon residents joined Aug 2026 statewide MARD strike — Medium (news)')),
 (r'TOPIWALA', dict(tox='Dr Payal Tadvi case (2019, OBGY not anaesthesia); trial not begun — Medium (news), dated')),
 (r'SHANKARRAO CHAVAN', dict(tox='31 deaths in 48 h (Oct 2023); dean cited staff shortage & broken equipment; Bombay HC suo motu — High (news + court)', ss='No super-speciality evidence found (Low)')),
 (r'GOVERNMENT MEDICAL COLLEGE, RATLAM', dict(ss='Official department list (updated 08-06-2026) shows NO super-speciality departments — High: ' + a('https://gmcratlam.org/Departments.aspx', 'GMC Ratlam departments'))),
 (r'GOVERNMENT MEDICAL COLLEGE, DATIA', dict(ss='550 + 30 emergency beds (Low); no super-speciality evidence', tox='Faculty shortage reported 2023; still advertising faculty (Apr 2025) and resident posts (May 2025) — Medium')),
 (r'JHALAWAR', dict(ss='No super-speciality evidence found (Low)', tox='RDA president: residents "not even getting enough sleep" (strike; date 2022/2024 ambiguous) — Medium: ' + a('https://www.udayavani.com/english-news/resident-doctors-strike-hits-medical-services-in-rajasthan', 'Udayavani'))),
 (r'GOVERNMENT MEDICAL COLLEGE, BHILWARA', dict(ss='No super-speciality evidence found (Low); 4 seats "recognised" per aggregator only')),
 (r'SHAIKH-UL-HIND', dict(ss='No super-speciality evidence found (Low)')),
 (r'GANDHI MEDICAL COLLEGE, BHOPAL', dict(tox='MP Human Rights Commission took up plea (Apr 2024) alleging 24–36 h shifts & faculty harassment; 2023 OBGY PG suicide; May 2024 anonymous letter — Medium (news; not anaesthesia-specific)')),
 (r'SAWAI MAN SINGH', dict(tox='Resident strike Oct 2024 (safety, stipend, housing), 100+ surgeries postponed; ended by Rajasthan HC Nov 2024 — Medium (news)')),
 (r'KING GEORGES MEDICAL', dict(tox='Residents threatened strike over pay parity with SGPGI (date unconfirmed) — Low')),
 (r'MAHATMA GANDHI MEMORIAL MEDICAL COLLEGE, INDORE', dict(tox='MY Hospital junior doctors\' indefinite strike over 12 demands (date unconfirmed) — Low')),
 (r'VARDHMAN MAHAVIR', dict(tox='Safdarjung: 189 of 638 doctor posts + 382 resident posts vacant (Parliament reply, 15 Aug 2026) — High')),
 (r'PGIMER, DR. RML', dict(tox='RML: 82 doctor + 210 resident vacancies (Parliament, Aug 2026); resident association quote of 24–36 h shifts (Jul 2025, one outlet) — Medium/Low')),
 (r'LADY HARDINGE', dict(tox='51 doctor + 85 resident vacancies (Parliament, Aug 2026) — High')),
 (r'MAULANA AZAD', dict(tox='Resident association quote: 48 h shifts "standard" at LNJP (Jul 2025, one outlet) — Low')),
 (r'UNIVERSITY COLLEGE OF MEDICAL SCIENCES', dict(tox='Poor duty-room conditions at GTB (resident association, Jul 2025) — Low')),
 (r'CHL HOSPITAL', dict(ss='Self-described 30+ specialities, cardiac surgery, kidney/liver/BMT transplants — Medium (self-claim): ' + a('https://www.carehospitals.com/hospital-detail/care-chl-hospitals-indore', 'CARE CHL'))),
 (r'CHANDAN HOSPITAL', dict(ss='300 beds incl. 100 critical-care beds (ICU/NICU/PICU) — Low/Medium: ' + a('https://housing.com/news/all-about-chandan-hospital-in-lucknow/', 'listing'))),
 (r'APEX HOSPITAL, N7', dict(ss='Claims cardiology + heart/kidney transplant; beds 100 vs 200 (conflict) — Low')),
 (r'MATA CHANAN DEVI', dict(ss='207 beds — Medium/High: ' + a('https://health.delhi.gov.in/sites/default/files/Health/circulars-orders/list50bed.pdf', 'Delhi health dept list') + '; super-speciality Not verified')),
 (r'ANAND HOSPITAL, A-1', dict(ss='Listing shows cardiology, neurology, gastro, oncology — Low')),
 (r'SANTOSH HOSPITAL', dict(ss='100 beds — Low; super-speciality Not verified')),
 (r'SWAMI DAYANAND', dict(tox='Salary strikes found only from 2015–16; nothing 2023–26 — Medium')),
 (r'KOTHARI MEDICAL', dict(ss='Not verified; 1-seat unit (single-faculty accreditation risk)')),
 (r'GOVERNMENT MEDICAL COLLEGE, SATNA', dict(ss='No recruitment in anaesthesia, cardiology, neurology, nephrology (Sep 2023) — Medium (news)')),
]
def note(name):
    d = {}
    for rx, v in NOTE:
        if re.search(rx, name.upper()): d.update(v)
    return d

# ---------- MCC data ----------
rows = json.load(open(S + 'rows2.json'))
QK = {'AllIndia': 'AIQ', 'DNBQuota': 'DNB', 'Deemed-PaidSeat(PS)': 'Deemed', 'Deemed-Mgmt/Paid': 'Deemed'}
FIX = {'BHAARATH': 'Tamil Nadu', 'ANANTNAG': 'Jammu and Kashmir'}
def norm(i): return re.sub(r'[^A-Z0-9]', '', i.upper())
def disp(i):
    p = [re.sub(r'\s+', ' ', s).strip() for s in i.split(',') if s.strip()]
    if len(p) > 1 and p[1].upper() == p[0].upper(): p = p[1:]
    return ', '.join(p)
# Matched against the hospital name only (before the first comma) — addresses caused false positives.
GOVT = re.compile(r"\b(S\.N\.M\. HOSPITAL|GMERS|SHRI JAGANNATH MEDICAL|BHIMA BHOI|STATE INSTITUTE OF MEDICAL|GOVERNMENT|GOVT|DISTRICT HOSPITAL|ESIC?|RAILWAY HOSPITAL|CENTRAL RAILWAY|NORTHERN RAILWAY|JAGJIVAN RAM RAILWAY|MUNICIPAL|CIVIL HOSPITAL|SWAMI DAYANAND|HINDU RAO|DEEN DAYAL|SANJAY GANDHI MEMORIAL|BABA SAHEB AMBEDKAR HOSPITAL|AUTONOMOUS STATE|K\.E\.M\.|BHABHA|RAJIV GANDHI MEDICAL COLLEGE|SHATABDI|SHETH VADILAL|JLNM|K C GENERAL|BOKARO GENERAL)\b|^GENERAL HOSPITAL", re.I)
C = {}
for x in rows:
    q = QK.get(x['qn']);
    if not q or x['ct'] not in ('MD', 'DNB') or (x['ac'] not in ('Open', 'OBC') and x['cc'] != 'OBC'): continue
    st = x['st']
    for k, v in FIX.items():
        if k in x['inst'].upper(): st = v
    if st == 'Jammu': st = 'Jammu and Kashmir'
    if st == 'Dadra': st = 'Dadra and Nagar Haveli'
    key = (st, x['ct'], norm(x['inst'].split(',')[0]) + norm(x['inst'])[len(norm(x['inst'].split(',')[0])):][:25])
    c = C.setdefault(key, dict(st=st, ct=x['ct'], q=q, name=disp(x['inst']), r={}))
    for cat in ([x['ac']] if x['ac'] in ('Open', 'OBC') else []) + (['OBC cand.'] if x['cc'] == 'OBC' else []):
        rk = (x['f'][:2], cat, x['f'][2:])
        c['r'][rk] = max(c['r'].get(rk, 0), x['rank'])

def mx25(c): return max([v for (y, _, _), v in c['r'].items() if y == '25'] or [0])
def mx(c): return max(c['r'].values() or [0])
def reach(v):
    if v >= 42000: return 'ok', 'Reached ≥42k in 2025'
    if v >= 38000: return 'mid', 'Closest 38–42k in 2025'
    return 'no', 'Below 38k in 2025'

def cell(v, url):
    if not v: return '<td class="na">–</td>'
    cls = 'ok' if v >= 42000 else 'mid' if v >= 38000 else ''
    return f'<td class="{cls}"><a href="{url}" target="_blank" rel="noopener">{v:,}</a></td>'

def rank_table(c):
    cats = (['Open', 'OBC'] if c['q'] != 'Deemed' else ['Open']) + ['OBC cand.']
    h = '<table class="rk"><tr><th>Year · Cat</th><th>R1</th><th>R2</th><th>R3</th><th>Stray</th></tr>'
    for y in ('24', '25'):
        for cat in cats:
            if not any(c['r'].get((y, cat, r)) for r in ('r1', 'r2', 'r3', 'st')): continue
            h += f'<tr><th>20{y} {cat}</th>' + ''.join(cell(c['r'].get((y, cat, r)), MCC[y + r]) for r in ('r1', 'r2', 'r3', 'st')) + '</tr>'
    return h + '</table>'

def kind(c):
    if c['q'] == 'Deemed': return 'deemed'
    if c['q'] == 'DNB': return 'gdnb' if GOVT.search(c['name'].split(',')[0]) else 'pdnb'
    return 'govt'
KLABEL = {'deemed': 'MD · Deemed university (paid seat, no reservation)', 'pdnb': 'DNB · Private hospital (no reservation)',
          'gdnb': 'DNB · Government hospital (govt status inferred from name)', 'govt': 'MD · Government, 50% All India Quota'}

def pointers(name, k, sb, pen):
    n = note(name)
    dnb = k in ('pdnb', 'gdnb')
    li = [
     ('1. Super-speciality exposure', n.get('ss', 'Not verified')),
     ('2. Hands-on training', n.get('hands', 'Not verified — no department-level case logs, procedure data or resident accounts found')),
     ('3. Working hours / toxicity', n.get('tox', 'No institute-specific reports found (absence of evidence, not evidence of a good environment)')),
     ('4. DNB pass rate', ('Institute-wise pass rate not verified from an official source — NBEMS declares results only as PASS/FAIL (' + a(NBP, 'NBEMS DNB final bulletin §5.3') + ')') if dnb else 'n/a (MD — excluded by your criteria)'),
     ('5a. Service bond', sb),
     ('5b. Discontinuation / seat-leaving penalty', pen),
    ]
    return '<dl>' + ''.join(f'<dt>{E(t)}</dt><dd>{v}</dd>' for t, v in li) + '</dl>'

def card(c):
    k = kind(c)
    sb, pen = bond(c['st'], k, c['name'])
    rc, rt = reach(mx25(c))
    return (f'<article class="card" data-s="{E((c["name"] + " " + c["st"]).lower())}"><h4>{E(c["name"])}</h4>'
            f'<p class="meta"><span class="tag">{E(KLABEL[k])}</span> <span class="tag {rc}">{rt}</span></p>'
            + rank_table(c) + pointers(c['name'], k, sb, pen) + '</article>')

# ---------- Maharashtra state quota (CET Cell) ----------
def parse_md(f):
    L = [l for l in open(f) if l.startswith('| ') and not l.startswith('| Code') and not l.startswith('|---')]
    out = []
    for l in L:
        p = [s.strip() for s in l.strip().strip('|').split('|')]
        out.append(p)
    return out
def num(s):
    m = re.match(r'([\d,]+)', s or '')
    extra = ' *' if 'not in merit' in (s or '') else ''
    return (int(m.group(1).replace(',', '')), extra) if m else (None, extra)
m25 = {p[0]: p for p in parse_md(S + 'mh/tab25.md')}
m24 = {p[0]: p for p in parse_md(S + 'mh/tab24_clean.md')}
MHOBC = json.load(open(S + 'mh/mh_obc.json'))
MHPRIV = {  # FRA 2024-25 fee (official API) and NMC-filed PG stipend, from mh_private_colleges notes
 '3311': ('K J Somaiya MC, Sion, Mumbai', '₹12.0 L/yr', 'not stated in NMC filing', '550-bed hospital, 9 major OTs; super-speciality centre with cath lab + cardiac surgery, NICU/PICU — Medium (college page + ' + a('https://medicaldialogues.in/k-j-somaiya-hospital-and-research-centre-launched-a-new-super-speciality-centre', 'news') + ')'),
 '3411': ('Smt Kashibai Navale MC, Pune', '₹12.94 L/yr (2023-24)', '"as per State Govt" (claim)', 'Not verified'),
 '3511': ('MIMER MC, Talegaon (Pune)', '₹9.0 L/yr', 'not stated', 'Not verified'),
 '3611': ('MIMSR MC, Latur', 'Not verified', 'Not verified', 'Not verified'),
 '3711': ('Terna MC, Nerul, Navi Mumbai', '₹9.0 L/yr', '₹64,000 (below state ₹76,629)', 'NABH scope lists cardiac anaesthesia, CTVS, interventional cardiology — Medium/Low (' + a('https://portal.nabh.co/Documents/AccreditedList/Hospitals/H-2024-1339.pdf', 'NABH') + ')'),
 '3811': ('MVPS Dr Vasantrao Pawar MC, Nashik', '₹9.0 L/yr', '₹64,551', 'Not verified'),
 '4011': ('Dr Vithalrao Vikhe Patil Foundation MC, Ahilyanagar', '₹10.0 L/yr', '"as per State Govt" (claim)', 'Not verified'),
 '4111': ('NKP Salve IMS & Lata Mangeshkar Hospital, Nagpur', '₹9.0 L/yr', 'not stated', '1,130-bed hospital (college claim); FRA lists a super-speciality fee stream — Medium (' + a('https://nkpsims.edu.in/lata-mangeshkar-hospital/', 'NKP') + ')'),
 '4211': ('Dr Panjabrao Deshmukh MC (PDMC), Amravati', '₹12.29 L/yr', '"as per State Govt" (claim)', 'Not verified'),
 '4311': ('Dr Ulhas Patil MC, Jalgaon', 'Not verified', '₹52,869', 'Not verified'),
 '4411': ('Ashwini Rural MC, Solapur', 'Not verified', '"as per State Govt" (claim)', 'Not verified'),
 '4511': ('B K L Walawalkar Rural MC, Chiplun', '₹9.67 L/yr', '₹62,000', '~200-bed multi-specialty (insurer directory) — Low'),
 '4611': ('SMBT IMS & RC, Igatpuri (Nashik)', '₹15.16 L/yr', '₹60,000', 'Directories claim cardiology, cancer care, renal transplant; beds 300 vs 900 (conflict) — Low'),
 '4711': ('IIMSR, Jalna', 'Not verified', '₹60,000', 'Not verified'),
 '4811': ('Vedantaa IMS, Dahanu (Palghar)', '₹19.32 L/yr (highest)', '₹60,000', 'Listed as "secondary care" PM-JAY hospital — no super-speciality evidence (Low, negative)'),
 '5211': ('Prakash IMS, Islampur', 'Not on FRA', 'Not verified', 'Not verified'),
 '5511': ('Dr Rajendra Gode MC, Amravati', 'Not on FRA', 'no figure filed', 'New department (MBBS from 2023-24)'),
}
def mh_card(code):
    p25, p24 = m25.get(code), m24.get(code)
    nm = (p25 or p24)[1]
    priv = code in MHPRIV
    fullname = MHPRIV.get(code, (nm,))[0] if priv else nm
    def c(v, url):
        n, extra = num(v)
        if n is None: return '<td class="na">–</td>' if not (v or '').strip(' –') else f'<td class="na" title="{E(v)}">SML only*</td>'
        cls = 'ok' if n >= 42000 else 'mid' if n >= 38000 else ''
        return f'<td class="{cls}"><a href="{url}" target="_blank" rel="noopener">{n:,}</a>{extra}</td>'
    h = '<table class="rk"><tr><th>Year · Cat</th><th>R1</th><th>R2</th><th>R3</th><th>Stray (R4)</th></tr>'
    cats = [('OPEN', 0), ('OBC', 1)] + ([('Inst. quota', 2)] if priv else [])
    for lab, o in cats:
        if p24:  # 2024 cols: R1(2-4) R2(5-7) R4.0(8-10) R5 IQ(11) R6 stray IQ(12)
            st = p24[8 + o] if o < 2 else (p24[12] if p24[12] not in ('–', '') else p24[11] if p24[11] not in ('–', '') else p24[10])
            h += f'<tr><th>2024 {lab}</th>{c(p24[2+o], CET["24r1"])}{c(p24[5+o], CET["24r2"])}<td class="na" title="2024 Round 3.0 list not on portal">n/a</td>{c(st, CET["24r4"])}</tr>'
        if p25:  # 2025 cols: R1 2-4, R2 5-7, R3 8-10, R4 stray 11-13, R5 SVR2 14-16
            st = p25[11 + o] if p25[11 + o] not in ('–', '') else p25[14 + o]
            h += f'<tr><th>2025 {lab}</th>{c(p25[2+o], CET["25r1"])}{c(p25[5+o], CET["25r2"])}{c(p25[8+o], CET["25r3"])}{c(st, CET["25st"])}</tr>'
    for y, src in (('2024', ['24r1', '24r2', None, '24r4']), ('2025', ['25r1', '25r2', '25r3', '25st'])):
        v = MHOBC[y].get(code)
        if v: h += f'<tr><th>{y} OBC cand.</th>' + ''.join(cell(x, CET[u]) if u else '<td class="na">n/a</td>' for x, u in zip(v, src)) + '</tr>'
    h += '</table>'
    vals = [num(x)[0] or 0 for x in (p25 or [])[2:] if x]
    best = max([v for i, v in enumerate(vals) if (i % 3) != 2] or [0])  # exclude IQ columns from reach
    rc, rt = reach(best)
    if priv:
        _, fee, stip, ss = MHPRIV.get(code, (nm, 'Not verified', 'Not verified', 'Not verified'))
        sb = 'None — private unaided colleges may not impose a post-PG bond, High: ' + a(IB, 'CET IB 2025 §20.5')
        pen = f'Three years\' fees if you resign after the cut-off date (§20.6, High); fee {fee} (FRA 2024-25); state security deposit (₹1 L if private colleges opted) forfeited for non-joining from R2'
        extra = f'<p class="meta">Fee: {fee} · Filed PG stipend: {stip}</p>'
        tag = 'MD · Private, Maharashtra state quota'
    else:
        ss = note(nm.replace('GMC NAGPUR', 'GOVERNMENT MEDICAL COLLEGE, NAGPUR').replace('GMC MUMBAI', 'GRANT MEDICAL COLLEGE').replace('GSMC MUMBAI', 'SETH GORDHANDAS').replace('GMC NANDED', 'SHANKARRAO CHAVAN')).get('ss', 'Not verified')
        if code == '2511':
            sb, pen = '1 year or ₹25 L (Tata Memorial, central) — Medium (Careers360 quoting CET brochure)', '₹10 L for seat lapse (same)'
        elif code == '2411':
            sb, pen = '1 year or ₹50 L — Medium (Careers360 quoting CET brochure)', '₹20 L non-completion (same)'
        else:
            sb, pen = STATE_BOND['Maharashtra']
        extra = '<p class="meta">Fee: ₹1,52,100/yr (govt tuition, CET IB 2025) · Stipend: state rate</p>'
        tag = 'MD · Govt / municipal, Maharashtra state quota'
    key = nm.replace('GMC NAGPUR', 'GOVERNMENT MEDICAL COLLEGE, NAGPUR').replace('GMC MUMBAI', 'GRANT MEDICAL COLLEGE').replace('GSMC MUMBAI', 'SETH GORDHANDAS').replace('GMC NANDED', 'SHANKARRAO CHAVAN').replace('IGMC NAGPUR', 'INDIRA GANDHI GOVT.MEDICAL COLLEGE NAGPUR').replace('TNMC MUMBAI', 'TOPIWALA').replace('BJMC PUNE', 'B.J.GOVERNMENT MEDICAL COLLEGE')
    n = note(key); n['ss'] = ss
    li = [('1. Super-speciality exposure', n['ss']),
          ('2. Hands-on training', 'Not verified — no department-level evidence found'),
          ('3. Working hours / toxicity', n.get('tox', 'No college-specific reports found. State-wide: MARD strikes 2025–26; Maharashtra 12 h/day–48 h/week order (2 Apr 2026), enforcement Not verified')),
          ('4. DNB pass rate', 'n/a (MD)'), ('5a. Service bond', sb), ('5b. Discontinuation / seat-leaving penalty', pen)]
    return (f'<article class="card" data-s="{E((fullname + " maharashtra " + code).lower())}"><h4>{E(fullname)} <small>(CET code {code})</small></h4>'
            f'<p class="meta"><span class="tag">{tag}</span> <span class="tag {rc}">{rt}</span></p>{extra}' + h + '<dl>' + ''.join(f'<dt>{E(t)}</dt><dd>{v}</dd>' for t, v in li) + '</dl></article>')

ORDER = ['Maharashtra', 'Delhi', 'Uttar Pradesh', 'Madhya Pradesh', 'Karnataka', 'Gujarat', 'Rajasthan', 'Kerala']
NE = ['Assam', 'Tripura', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Arunachal', 'Sikkim']
by = collections.defaultdict(list)
for c in C.values():
    if c['st'] in ORDER or mx25(c) >= 38000: by[c['st']].append(c)
others = sorted([s for s in by if s not in ORDER and s not in NE and s != 'Jammu and Kashmir'])
states = ORDER + others + [s for s in NE if s in by] + (['Jammu and Kashmir'] if 'Jammu and Kashmir' in by else [])
SEC = [('govt', 'MD — Government (MCC 50% AIQ)'), ('deemed', 'MD — Deemed universities (MCC)'), ('pdnb', 'DNB — Private hospitals (MCC)'), ('gdnb', 'DNB — Government hospitals (MCC)')]

body, toc = [], []
# MH state quota section
body.append('<section id="mhsq"><h2>Maharashtra state quota (State CET Cell) — only if you are Maharashtra-eligible</h2>'
 '<p>Eligibility depends on where you did MBBS (MBBS in Maharashtra, or out-of-state on 15% AIQ / AIIMS / central seat with a Maharashtra domicile certificate) — ' + a(IB, 'CET IB 2025 rules 8.2, 8.3, 8.18.1') + '. '
 'AIRs were obtained by matching selection-list application numbers to the State Merit List (' + a(CET['25ml'], '2025') + ', ' + a(CET['24ml'], '2024') + '). '
 '<b>*</b> = at least one allottee not in the R1 merit list, AIR not verified. 2024 Round 3.0 list was not on the portal; 2024 "Stray" column = Round 4.0 (and Round 5.0/6.0 stray for institutional quota). 2025 "Stray" = Round 4.0, falling back to Round 5.0 (SVR2) — ' + a(CET['25sv'], 'SVR2 list') + '.</p>')
gov = sorted([k for k in set(m25) | set(m24) if k not in MHPRIV], key=int)
pv = sorted([k for k in set(m25) | set(m24) if k in MHPRIV], key=lambda k: -max([num(x)[0] or 0 for i, x in enumerate((m25.get(k) or [''] * 17)[2:]) if i % 3 != 2] or [0]))
body.append('<h3>Government / municipal colleges</h3><div class="grid">' + ''.join(mh_card(k) for k in gov) + '</div>')
body.append('<h3>Private colleges (sorted by deepest 2025 closing)</h3><div class="grid">' + ''.join(mh_card(k) for k in pv) + '</div></section>')
toc.append('<a href="#mhsq">Maharashtra state quota</a>')
for s in states:
    sid = 's-' + norm(s).lower()
    toc.append(f'<a href="#{sid}">{E(s)}</a>')
    parts = [f'<section id="{sid}"><h2>{E(s)} — MCC</h2>']
    for kk, lab in SEC:
        cs = sorted([c for c in by[s] if kind(c) == kk], key=lambda c: -mx25(c))
        if cs: parts.append(f'<h3>{lab} <small>({len(cs)})</small></h3><div class="grid">' + ''.join(card(c) for c in cs) + '</div>')
    body.append(''.join(parts) + '</section>')

N = sum(len(v) for v in by.values()) + len(gov) + len(pv)
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Anaesthesia College-wise Ranks</title><style>
:root{{--bg:#fbfaf7;--fg:#1d1d1b;--mu:#5d5d58;--ac:#1f5f8b;--ln:#dcd8cf;--th:#efece5;--card:#fff;--ok:#d9f2df;--okf:#13542a;--mid:#fdf0cf;--midf:#6b4b00;--no:#eee}}
@media (prefers-color-scheme:dark){{:root:not([data-theme=light]){{--bg:#141517;--fg:#e6e4df;--mu:#a6a39b;--ac:#7cb7e3;--ln:#34363a;--th:#202226;--card:#1a1c1f;--ok:#183d24;--okf:#9fe0b2;--mid:#43360f;--midf:#f1d58a;--no:#2a2c30}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}}
main{{max-width:1400px;margin:auto;padding:16px}}a{{color:var(--ac)}}h1{{font-size:1.6rem;margin:.2em 0}}h2{{margin-top:2em;border-bottom:2px solid var(--ln);padding-bottom:.2em}}
h3{{margin:1.4em 0 .5em}}h4{{margin:0 0 .3em;font-size:1rem}}small{{color:var(--mu);font-weight:400}}
nav{{position:sticky;top:0;background:var(--bg);padding:8px 0;border-bottom:1px solid var(--ln);z-index:2;display:flex;flex-wrap:wrap;gap:6px 12px;font-size:.85rem}}
input{{width:100%;padding:8px 10px;font-size:1rem;border:1px solid var(--ln);border-radius:6px;background:var(--card);color:var(--fg);margin:8px 0}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,430px),1fr));gap:12px}}
.card{{background:var(--card);border:1px solid var(--ln);border-radius:8px;padding:12px}}
.meta{{margin:.2em 0 .5em;font-size:.82rem;color:var(--mu)}}.tag{{display:inline-block;padding:1px 7px;border-radius:10px;background:var(--th);margin:0 4px 4px 0}}
.tag.ok{{background:var(--ok);color:var(--okf)}}.tag.mid{{background:var(--mid);color:var(--midf)}}
table{{border-collapse:collapse;width:100%;font-size:.85rem;font-variant-numeric:tabular-nums}}th,td{{border:1px solid var(--ln);padding:3px 6px;text-align:right}}th{{background:var(--th);text-align:left;font-weight:600}}
td.ok{{background:var(--ok)}}td.ok a{{color:var(--okf);font-weight:600}}td.mid{{background:var(--mid)}}td.mid a{{color:var(--midf)}}td.na{{color:var(--mu);text-align:center}}
td a{{text-decoration:none}}dl{{margin:.6em 0 0;font-size:.84rem}}dt{{font-weight:600;margin-top:.35em}}dd{{margin:0 0 0 .8em;color:var(--fg)}}
.box{{background:var(--card);border:1px solid var(--ln);border-radius:8px;padding:12px 16px;margin:12px 0}}.wrap{{overflow-x:auto}}
.legend span{{padding:1px 8px;border-radius:4px;margin-right:8px}}
</style></head><body><main>
<h1>Anaesthesia PG — college-wise closing ranks, priorities, bond &amp; penalty</h1>
<p class="meta">NEET-PG 2026 · AIR ~42,000 · OBC-NCL · {N} colleges · generated 10 Oct 2026 from official MCC and Maharashtra CET Cell allotment PDFs</p>
<div class="box"><b>How to read this.</b> Every rank is the <b>highest NEET-PG AIR allotted</b> in that round for that quota and category (fresh or upgraded), parsed from the official result PDFs — click any number to open the source PDF. "–" = no allotment in that category that round.
<div class="legend" style="margin-top:6px"><span style="background:var(--ok)">≥ 42,000 — your rank was reached</span><span style="background:var(--mid)">38,000–41,999 — close</span><span style="background:var(--no)">&lt; 38,000</span></div>
<ul style="margin:.5em 0 0 1em;padding:0">
<li><b>2024 was much tighter than 2025</b> (AIQ MD OBC max 32,247 vs 48,136; DNB max ~33k vs ~51k). 2024 MCC Special Stray round not parsed. Historical closings never guarantee a 2026 seat.</li>
<li>For an OBC-NCL candidate, both the <b>Open</b> and <b>OBC</b> rows are relevant on AIQ seats. Private DNB and deemed seats have no reservation (Open row only matters).</li>
<li>Scope: all MD/DNB anaesthesia colleges in your 8 preferred states, plus any other college whose 2025 closing reached ≥38,000. North-east then J&amp;K are placed last, per your order. Diplomas excluded.</li>
<li><b>Priorities 1–3</b> show only what the research could source; "Not verified" means nothing citable was found — it is not a negative or positive judgment. <b>Priority 4</b>: NBEMS does not publish institute-wise DNB pass rates. <b>Priority 5</b>: service bond and discontinuation penalty are listed separately; bonds are 2025 rules (2026 state brochures not yet out).</li>
<li>Government-vs-private for DNB hospitals is inferred from the hospital name; check MCC's "college, fee, bond" listing before choice filling.</li></ul></div>
<div class="box"><b>MCC sources:</b> 2024 {a(MCC['24r1'],'R1')} · {a(MCC['24r2'],'R2')} · {a(MCC['24r3'],'R3')} · {a(MCC['24st'],'Stray')} &nbsp;|&nbsp; 2025 {a(MCC['25r1'],'R1')} · {a(MCC['25r2'],'R2')} · {a(MCC['25r3'],'R3')} · {a(MCC['25st'],'Stray')}<br>
<b>Maharashtra CET Cell:</b> 2025 {a(CET['25r1'],'R1')} · {a(CET['25r2'],'R2')} · {a(CET['25r3'],'R3')} · {a(CET['25st'],'Stray')} · {a(CET['25sv'],'SVR2')} &nbsp;|&nbsp; 2024 {a(CET['24r1'],'R1')} · {a(CET['24r2'],'R2')} · {a(CET['24r4'],'R4')} · bonds {a(IB,'IB 2025 §20')}</div>
<input id="q" type="search" placeholder="Filter colleges by name, city or state…" aria-label="Filter colleges">
<nav>{" ".join(toc)}</nav>
{"".join(body)}
</main><script>
const q=document.getElementById('q');q.addEventListener('input',()=>{{const t=q.value.toLowerCase().trim();document.querySelectorAll('.card').forEach(c=>c.style.display=!t||c.dataset.s.includes(t)?'':'none')}});
</script></body></html>'''
open(OUT, 'w').write(page)
print(OUT, N, len(page))

# ---------- JSON export for the Next.js planner ----------
def mcc_rec(c):
    k = kind(c); sb, pen = bond(c['st'], k, c['name']); n = note(c['name'])
    cats = (['Open', 'OBC'] if c['q'] != 'Deemed' else ['Open']) + ['OBC cand.']
    rk = {f'20{y}': {cat: [c['r'].get((y, cat, r)) for r in ('r1', 'r2', 'r3', 'st')] for cat in cats} for y in ('24', '25')}
    src = {f'20{y}': [MCC[y + r] for r in ('r1', 'r2', 'r3', 'st')] for y in ('24', '25')}
    return dict(id='mcc-' + norm(c['name'])[:40] + '-' + c['ct'], name=c['name'], state=c['st'], counselling='MCC',
                kind=k, kindLabel=KLABEL[k], ranks=rk, sources=src,
                ss=n.get('ss', 'Not verified'), hands=n.get('hands', 'Not verified'),
                tox=n.get('tox', 'No institute-specific reports found'),
                dnb=('Not published by NBEMS (PASS/FAIL only)' if k in ('pdnb', 'gdnb') else 'n/a (MD)'),
                bond=sb, penalty=pen, fee=None, stipend=None)

def mh_rec(code):
    p25, p24 = m25.get(code), m24.get(code); nm = (p25 or p24)[1]; priv = code in MHPRIV
    full = MHPRIV.get(code, (nm,))[0] if priv else nm
    rk = {}
    for lab, o in [('Open', 0), ('OBC', 1)] + ([('Inst. quota', 2)] if priv else []):
        if p24:
            st = p24[8 + o] if o < 2 else (p24[12] if p24[12] not in ('–', '') else p24[11] if p24[11] not in ('–', '') else p24[10])
            rk.setdefault('2024', {})[lab] = [num(p24[2 + o])[0], num(p24[5 + o])[0], None, num(st)[0]]
        if p25:
            st = p25[11 + o] if p25[11 + o] not in ('–', '') else p25[14 + o]
            rk.setdefault('2025', {})[lab] = [num(p25[2 + o])[0], num(p25[5 + o])[0], num(p25[8 + o])[0], num(st)[0]]
    for y in ('2024', '2025'):
        if MHOBC[y].get(code) and y in rk: rk[y]['OBC cand.'] = MHOBC[y][code]
    src = {'2024': [CET['24r1'], CET['24r2'], None, CET['24r4']], '2025': [CET['25r1'], CET['25r2'], CET['25r3'], CET['25st']]}
    key = nm.replace('GMC NAGPUR', 'GOVERNMENT MEDICAL COLLEGE, NAGPUR').replace('GMC MUMBAI', 'GRANT MEDICAL COLLEGE').replace('GSMC MUMBAI', 'SETH GORDHANDAS').replace('GMC NANDED', 'SHANKARRAO CHAVAN').replace('IGMC NAGPUR', 'INDIRA GANDHI GOVT.MEDICAL COLLEGE NAGPUR').replace('TNMC MUMBAI', 'TOPIWALA').replace('BJMC PUNE', 'B.J.GOVERNMENT MEDICAL COLLEGE')
    n = note(key)
    if priv:
        _, fee, stip, ss = MHPRIV.get(code, (nm, 'Not verified', 'Not verified', 'Not verified'))
        sb = 'None — private unaided colleges may not impose a post-PG bond, High: ' + a(IB, 'CET IB 2025 §20.5')
        pen = "Three years' fees if you resign after the cut-off date (§20.6, High); state deposit forfeited for non-joining from R2"
        k, lab = 'mhpriv', 'MD · Private, Maharashtra state quota'
    else:
        fee, stip, ss = '₹1.52 L/yr (govt)', 'State rate', n.get('ss', 'Not verified')
        if code == '2511': sb, pen = '1 year or ₹25 L (Tata Memorial) — Medium', '₹10 L for seat lapse'
        elif code == '2411': sb, pen = '1 year or ₹50 L — Medium', '₹20 L non-completion'
        else: sb, pen = STATE_BOND['Maharashtra']
        k, lab = 'mhgovt', 'MD · Govt / municipal, Maharashtra state quota'
    return dict(id='mh-' + code, name=f'{full} (CET {code})', state='Maharashtra', counselling='MH-CET', kind=k, kindLabel=lab,
                ranks=rk, sources=src, ss=ss, hands='Not verified',
                tox=n.get('tox', 'No college-specific reports; state-wide MARD strikes 2025–26; 48 h/week order Apr 2026 (enforcement Not verified)'),
                dnb='n/a (MD)', bond=sb, penalty=pen, fee=fee, stipend=stip)

recs = [mh_rec(k) for k in gov + pv] + [mcc_rec(c) for s in states for c in by[s]]
ids = collections.Counter(r['id'] for r in recs)
seen = collections.Counter()
for r in recs:
    if ids[r['id']] > 1: seen[r['id']] += 1; r['id'] += f'-{seen[r["id"]]}'
J = '/Users/pankaj/Documents/code/neetpg-planner/app/colleges.json'
json.dump(dict(stateOrder=states, colleges=recs), open(J, 'w'), ensure_ascii=False)
print(J, len(recs))
