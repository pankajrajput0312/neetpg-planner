import data from "./colleges.json";
import researchData from "./research.json";
import guideData from "./guide.json";
import officialData from "./official.json";
import verdictData from "./verdict.json";
import admittedData from "./admitted.json";
import superspecData from "./superspec.json";
import derivedData from "./derived.json";
import sitesData from "./sites.json";
import futureData from "./future.json";
import residentData from "./resident.json";
import toxhoursData from "./toxhours.json";

export type Ranks = Record<string, Record<string, (number | null)[]>>;
export type College = {
  id: string; name: string; state: string; counselling: string; kind: string; kindLabel: string;
  ranks: Ranks; sources: Record<string, (string | null)[]>;
  ss: string; hands: string; tox: string; dnb: string; bond: string; penalty: string;
  fee: string | null; stipend: string | null;
};
export type Conf = "High" | "Medium" | "Low" | "Unverified";
export type Param = { summary: string; confidence: Conf; available?: string[] };
export type Point = { text: string; url: string; type: string };
export type Research = {
  beds: string | null; fee_per_year: string | null; stipend_year1: string | null;
  super_speciality: Param; hands_on: Param; toxicity: Param; dnb_pass: Param; bond: Param;
  pros: Point[]; cons: Point[]; missing: string[];
};
export type Guide = { sections: { title: string; summary: string; points: { text: string; url: string | null }[]; red_flags: string[]; ask_seniors: string[] }[] };
export type Crit = "ss" | "hands" | "tox" | "dnb" | "bond";
export type Weights = Record<Crit, number>;
export type PrioritySet = { id: string; name: string; weights: Weights };
export type Rating = Partial<Record<Crit, number>>;
export type List = { id: string; name: string; items: string[] };
export type Store = {
  air: number; cat: "Open" | "OBC";
  sets: PrioritySet[]; activeSet: string;
  ratings: Record<string, Rating>;
  notes: Record<string, string>;
  checked: Record<string, number[]>; // ticked "missing detail" questions per college
  verified: Record<string, string[]>; // checklist rows she has verified herself, per college
  prep: number[]; // ticked items of the "before you decide" checklist
  compare: string[];
  prefs: Prefs;
  saved: string[]; // "save for later" — considering, not in any list
  lists: List[]; active: string;
};
export type Prefs = { mhEligible: "yes" | "no" | "unknown"; budgetPerYear: number | null; dnbOk: boolean; maxBondYears: number; states: string[]; minStipend: number | null };
export const DEFAULT_PREFS: Prefs = { mhEligible: "unknown", budgetPerYear: null, dnbOk: true, maxBondYears: 2, states: [], minStipend: null };

export const COLLEGES = data.colleges as College[];
export const BY_ID = new Map(COLLEGES.map((c) => [c.id, c]));
export const RESEARCH = researchData as unknown as Record<string, Research>;
export const GUIDE = guideData as Guide;
// Her order (updated): Delhi → Maharashtra → UP → MP → Gujarat → Rajasthan → everything else → Jammu & Kashmir / Ladakh last.
export const PREFERRED = ["Delhi", "Maharashtra", "Uttar Pradesh", "Madhya Pradesh", "Gujarat", "Rajasthan"];
export const STATE_ORDER: string[] = [...PREFERRED, ...data.stateOrder.filter((x) => !PREFERRED.includes(x) && x !== "Ladakh" && x !== "Jammu and Kashmir"), "Ladakh", "Jammu and Kashmir"];
const NE = ["Assam", "Tripura", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Arunachal Pradesh", "Sikkim"];
const region = (st: string) => (st === "Jammu and Kashmir" || st === "Ladakh" ? 2 : NE.includes(st) ? 1 : 0);
export const CRITS: [Crit, string, keyof Research, string][] = [
  ["ss", "Super-speciality", "super_speciality", "SS"], ["hands", "Hands-on", "hands_on", "HO"],
  ["tox", "Hours / toxicity", "toxicity", "HR"], ["dnb", "DNB pass rate", "dnb_pass", "PR"], ["bond", "Bond / penalty", "bond", "BD"],
];
export const ROUNDS = ["R1", "R2", "R3", "Stray"];
export const ROW_LABEL: Record<string, string> = { Open: "Open seat", OBC: "OBC seat", "OBC cand.": "OBC candidates", "Inst. quota": "Inst. quota" };
export const ROW_HELP: Record<string, string> = {
  Open: "Last AIR allotted an Open (unreserved) seat — OBC candidates can take these too",
  OBC: "Last AIR allotted an OBC-reserved seat",
  "OBC cand.": "Last AIR of an OBC candidate allotted any seat (Open or OBC). Private DNB / deemed seats have no OBC reservation",
  "Inst. quota": "Private institutional / management quota — much higher fee",
};
export const PRESETS: PrioritySet[] = [
  { id: "p1", name: "My priorities (default)", weights: { ss: 30, hands: 25, tox: 20, dnb: 15, bond: 10 } },
  { id: "p2", name: "Training first", weights: { ss: 35, hands: 40, tox: 10, dnb: 10, bond: 5 } },
  { id: "p3", name: "Low stress / work-life", weights: { ss: 15, hands: 15, tox: 45, dnb: 10, bond: 15 } },
  { id: "p4", name: "Exit-safe (low bond)", weights: { ss: 20, hands: 20, tox: 15, dnb: 10, bond: 35 } },
];
export const DEFAULT: Store = {
  air: 42000, cat: "OBC",
  sets: PRESETS, activeSet: "p1",
  ratings: {}, notes: {}, checked: {}, verified: {}, prep: [], compare: [], prefs: { mhEligible: "unknown", budgetPerYear: null, dnbOk: true, maxBondYears: 2, states: [], minStipend: null }, saved: [],
  lists: [{ id: "l1", name: "MCC Round 1", items: [] }, { id: "l2", name: "Maharashtra state", items: [] }],
  active: "l1",
};

// 2025 final admitted list (shared spreadsheet): counts and last AIR that joined — names are never stored.
export type Admitted = { college: string; total: number; aiq: number; state: number; last: Record<string, number> };
export const ADMITTED = admittedData as unknown as Record<string, Admitted>;
export function joinedLast(c: College, cat: string) {
  const a = ADMITTED[c.id]; if (!a) return null;
  const pick = (q: string) => Math.max(a.last[`${q} Open`] ?? 0, a.last[`${q} ${cat}`] ?? 0) || null;
  return { aiq: pick("AIQ"), state: pick("State"), a };
}
// Official MCC super-speciality (NEET-SS 2025) counselling: DM/MCh/DNB-SS courses actually running at the hospital, by area.
export const SUPERSPEC = superspecData as Record<string, { code: string; name: string; areas: Record<string, string[]> }>;
// Official-data pros/cons + "for you" suggestion, for every college (derive.py).
export type Derived = { pros: string[]; cons: string[]; facts: Record<string, unknown>; rec: string; rec_why: string; data_verdict: string | null };
export const DERIVED = derivedData as Record<string, Derived>;
// Official-website check by agents (WebFetch of the college's own site).
export type Site = { site_status: string; departments: string[]; generic_claim: boolean; icu_beds: string | null; ot_count: string | null; beds: string | null;
  anaesthesia_dept: { faculty: string | null; services: string[]; pg_seats: string | null; simulation_or_workshops: string | null; notes: string | null; url: string | null } | null;
  hostel: string | null; academics: string | null; red_flags: string[]; sources: string[]; pros: { text: string; url: string }[]; cons: { text: string; url: string }[] };
export const SITES = sitesData as Record<string, Site>;
export const FUTURE = futureData as { sections: { title: string; summary: string; points: { text: string; url: string | null; evidence?: string }[]; red_flags: string[]; ask_seniors: string[] }[] };
// Resident-experience pass (hands-on & hours): news, forums, department pages — each item labelled by source.
export type ResItem = { text: string; src: string; url: string; date?: string | null };
export type Resident = { hands_on: { summary: string; confidence: Conf; items: ResItem[] }; hours_culture: { summary: string; confidence: Conf; items: ResItem[] }; stipend_paid_on_time: string | null; red_flags: string[]; pros: ResItem[]; cons: ResItem[] };
export const RESIDENT = residentData as Record<string, Resident>;
export type ToxField = { cell: string; confidence: Conf; items: { text: string; src: string; url: string; date: string | null }[]; count?: Record<string, number> };
export type ToxHours = { toxicity: ToxField; hours_per_day: ToxField; icu_per_week: ToxField; searches_done: number | null };
// Online pass for the 3 sheet columns (toxicity, duty hours, ICU posting); key = college id, or "given:<name>" for sheet rows not in app data
export const TOXHOURS = toxhoursData as Record<string, ToxHours>;
export const toxFor = (key: string) => TOXHOURS[key];
export const REC_KEY: Record<string, string> = { "Put high": "join", "Backup only": "backup", "Leave out": "avoid" };
// What to do with the college in her choice list, in words anyone can read
export function placeText(c: College) {
  const r = recommendation(c);
  return r.rec === "Put high" ? "Put high in her list" : r.rec === "Backup only" ? "Keep lower, as a backup" : /out of reach/i.test(r.rec_why ?? "") ? "Leave out — out of her rank range" : "Leave out — has a deal-breaker";
}
export const CHANCE_TEXT: Record<string, string> = { good: "Reached her rank in both 2024 & 2025", ok: "Reached her rank in 2025 only", mid: "Missed her rank by less than 10% in 2025", bad: "Closed well before her rank" };
export const recommendation = (c: College) => DERIVED[c.id] ?? { pros: [], cons: [], facts: {}, rec: "Backup only", rec_why: "No data", data_verdict: null };
export type ProCon = { text: string; src: string; url?: string };
function tagOf(t: string): [string, string] { const m = t.match(/\s\[(\w+)\]$/); return m ? [t.slice(0, m.index), m[1]] : [t, "official"]; }
export function allPros(c: College): ProCon[] {
  const d = DERIVED[c.id]; const st = SITES[c.id];
  const rs = RESIDENT[c.id];
  return [...(d?.pros ?? []).map((t) => { const [x, src] = tagOf(t); return { text: x, src }; }), ...(st?.pros ?? []).map((p) => ({ text: p.text, src: "site", url: p.url })), ...(rs?.pros ?? []).map((p) => ({ text: p.text, src: p.src, url: p.url }))];
}
export function allCons(c: College): ProCon[] {
  const d = DERIVED[c.id]; const st = SITES[c.id];
  const rs = RESIDENT[c.id];
  return [...(d?.cons ?? []).map((t) => { const [x, src] = tagOf(t); return { text: x, src }; }), ...(st?.cons ?? []).map((p) => ({ text: p.text, src: "site", url: p.url })), ...(st?.red_flags ?? []).map((t) => ({ text: t, src: "site" })), ...(rs?.cons ?? []).map((p) => ({ text: p.text, src: p.src, url: p.url })), ...(rs?.red_flags ?? []).map((t) => ({ text: t, src: "news" }))];
}
// What a senior candidate checks before placing a college — with what we already have.
export type Check = { label: string; status: "have" | "partial" | "ask"; value: string; how: string };
export function seniorChecklist(c: College, cat: string, notes?: string): Check[] {
  const r = RESEARCH[c.id]; const o = OFFICIAL[c.id]; const sp = SUPERSPEC[c.id]; const st = SITES[c.id]; const a = ADMITTED[c.id];
  const d25 = deepest(c, "2025", cat), d24 = deepest(c, "2024", cat); const j = joinedLast(c, cat);
  const conf = (f: keyof Research) => (r ? (r[f] as Param).confidence : "Unverified");
  const dnb = isDnb(c);
  return [
    { label: "Cutoff trend (R1→Stray, 2 years)", status: "have", value: `2025 ${fmt(d25)} · 2024 ${fmt(d24)}`, how: "MCC / CET Cell allotment PDFs" },
    { label: "Who actually joined in 2025", status: j ? "have" : "ask", value: j ? `AIQ ${fmt(j.aiq)} · State ${fmt(j.state)}` : "Not in admitted list (DNB hospitals aren't)", how: "Final admitted-candidates list" },
    { label: "Unit size (seats filled)", status: a ? "have" : "ask", value: a ? `${a.total} seats (${a.aiq} AIQ)` : "Ask: how many PGs per year, how many faculty", how: "Admitted list / NMC seat matrix" },
    { label: "Fee × 3 years, deposits", status: fee(c) ? (o?.fee && o.fee.includes("MCC") && !c.fee ? "partial" : "have") : "ask", value: money(fee(c)) ?? "Not found", how: "MCC fee sheet, FRA, college prospectus — get it in writing" },
    { label: "Stipend: declared vs actually paid", status: stipend(c) ? "partial" : "ask", value: (money(stipend(c)) ?? "Not found") + " declared — ask residents if paid on time", how: "MCC declaration + 2 current residents" },
    { label: "Bond & leaving penalty (document read)", status: o?.bond_doc ? "have" : c.kind === "pdnb" || c.kind === "mhpriv" ? "have" : "partial", value: bondShort(c), how: "College's bond document on MCC; state GR" },
    { label: "Super-speciality depts actually running", status: sp ? "have" : conf("super_speciality") === "Unverified" ? "ask" : "partial", value: sp ? Object.keys(sp.areas).join(", ") : (r?.super_speciality.summary.slice(0, 80) ?? "Not found"), how: "MCC NEET-SS list (DM/MCh running) + ask which OTs PGs rotate in" },
    { label: "ICU / OT / beds on hospital site", status: st && st.site_status === "ok" ? "have" : st ? "partial" : "ask", value: st ? [st.icu_beds && `ICU ${st.icu_beds}`, st.ot_count && `OT ${st.ot_count}`, (st.beds ?? beds(c)) && `beds ${st.beds ?? beds(c)}`].filter(Boolean).join(" · ") || "Site checked, numbers not stated" : (beds(c) ? `beds ${beds(c)}` : "Not checked"), how: "Official website / NABH scope" },
    { label: "Hands-on: blocks, lines, independent lists", status: conf("hands_on") === "Unverified" ? "ask" : "partial", value: conf("hands_on") === "Unverified" ? "Nothing online — only seniors can tell you" : r!.hands_on.summary.slice(0, 90), how: "2+ current PGs: cases/week, USG blocks, who intubates" },
    { label: "Duty hours, night calls, post-call off, seniors' culture", status: conf("toxicity") === "Unverified" ? "ask" : "partial", value: conf("toxicity") === "Unverified" ? "Nothing online — ask residents" : r!.toxicity.summary.slice(0, 90), how: "Residents + resident association + news" },
    ...(dnb ? [{ label: "DNB result of last 3 batches", status: "ask" as const, value: "Not published by NBEMS — ask the department", how: "Department / alumni" }] : []),
    { label: "Hostel & safety", status: st?.hostel && !/^(not|no |none|unknown)/i.test(st.hostel) ? "have" : "ask", value: st?.hostel ?? "Not stated", how: "Site / visit / residents" },
    { label: "Spoke to seniors (your notes)", status: notes ? "have" : "ask", value: notes ? notes.slice(0, 80) : "No notes yet", how: "Write what they said in Notes" },
  ];
}
export const SENIOR_METHOD = [
  { t: "1. Start from cutoffs, not names", d: "Pull R1→Stray closing ranks for 2 years and the list of who actually joined. Your real pool is what reached your AIR in both years; 2025-only seats are maybes." },
  { t: "2. Check the money before anything else", d: "Fee × 3 + hostel + deposits, and the stipend declared to MCC — then ask two residents whether it is actually paid on time. A ₹25 L/yr college with ₹45k stipend is a very different decision from a DNB at ₹1.25 L." },
  { t: "3. Read the bond document, don't trust summaries", d: "Open the college's bond PDF on MCC: service years, amount, leaving penalty, who it applies to (AIQ?), whether certificates are withheld. Separate the service bond from the seat-leaving penalty." },
  { t: "4. Verify super-speciality with hard proof", d: "If the hospital runs DM/MCh/DNB-SS in cardiac, neuro, transplant, GI, onco, paeds (MCC NEET-SS list), those departments exist with faculty and volume. A departments page on a website is a claim; a running DM course is proof. Then ask: do anaesthesia PGs actually rotate through those OTs?" },
  { t: "5. Count the unit", d: "How many PG seats per year and how many faculty? 2 PGs with 3 faculty means you cover every night; 20 PGs with 25 faculty means graded responsibility and teaching." },
  { t: "6. Get hands-on numbers from residents, not brochures", d: "Ask a 2nd/3rd-year PG: cases per week, spinals/epidurals/central lines done by 1st years, USG-guided blocks, who intubates in emergency, whether there is a simulation lab. If nobody can give numbers, assume you'll mostly observe." },
  { t: "7. Ask about hours the specific way", d: "How many 24-h duties a month? Post-call off? Weekly off honoured? Thesis time? Any resident left mid-course in the last 3 years and why? One bad story is noise; the same story from 2 people is signal." },
  { t: "8. For DNB, ask for results and exits", d: "Pass rate of the last 3 batches (NBEMS doesn't publish it), how many outside postings and where, hospital bed count (<500 beds = extra SR year for faculty posts), and whether the hospital ever lost accreditation." },
  { t: "9. Order by preference, protect the bottom", d: "Counselling gives the highest available choice, so dream picks at the top cost nothing. The danger is the bottom: never list a seat you wouldn't join — a Round-3 allotment can't be resigned." },
  { t: "10. Decide the budget ceiling and the DNB question before Round 1", d: "These two answers remove half the list. Write them down with family before choice-filling, not during." },
];
export type Verdict = { verdict: string; headline: string; reasons: string[]; deal_breakers: string[]; verify: string[]; confidence: Conf | "" };
const VERDICTS = verdictData as Record<string, Verdict>;
export const VERDICT_ORDER = ["Join", "Backup only", "Avoid", "Not assessed"];
export const verdictKey = (v: string) => ["join", "backup", "avoid", "na"][VERDICT_ORDER.indexOf(v)] ?? "na";
export function verdictOf(c: College): Verdict {
  return VERDICTS[c.id] ?? { verdict: "Not assessed", headline: "Not assessed — this seat closed far above your AIR in 2024–25, so it wasn't researched.", reasons: [], deal_breakers: [], verify: [], confidence: "" };
}

// Rows that apply to this candidate: a reserved candidate can also take Open seats.
export function cats(c: College, cat: string) {
  return Object.keys(c.ranks["2025"] ?? c.ranks["2024"] ?? {}).filter((k) => k === "Open" || k === cat);
}
// Per-round closing for this candidate = best of the applicable rows.
export function roundClose(c: College, year: string, cat: string) {
  return [0, 1, 2, 3].map((i) => Math.max(0, ...cats(c, cat).map((k) => c.ranks[year]?.[k]?.[i] ?? 0)) || null);
}
export function deepest(c: College, year: string, cat: string) {
  return Math.max(0, ...roundClose(c, year, cat).map((v) => v ?? 0));
}
export function firstRound(c: College, year: string, cat: string, air: number) {
  const i = roundClose(c, year, cat).findIndex((v) => (v ?? 0) >= air);
  return i < 0 ? null : ROUNDS[i];
}
export type Chance = { k: "good" | "ok" | "mid" | "bad"; t: string; short: string };
export function chance(c: College, air: number, cat: string): Chance {
  const d24 = deepest(c, "2024", cat), d25 = deepest(c, "2025", cat);
  if (air <= d24 && air <= d25) return { k: "good", short: "Likely", t: `Likely — reached in 2024 & 2025 (from ${firstRound(c, "2025", cat, air)})` };
  if (air <= d25) return { k: "ok", short: "Possible", t: `Possible — reached in 2025 ${firstRound(c, "2025", cat, air)} only` };
  if (air <= d25 * 1.1) return { k: "mid", short: "Borderline", t: "Borderline — within 10% of 2025 closing" };
  return { k: "bad", short: "Unlikely", t: "Unlikely on 2024–25 data" };
}
export function score(r: Rating | undefined, w: Weights, dnb: boolean) {
  if (!r) return null;
  let s = 0, tw = 0;
  for (const [k] of CRITS) {
    if (k === "dnb" && !dnb) continue;
    if (r[k]) { s += r[k]! * w[k]; tw += w[k]; }
  }
  return tw ? Math.round((s / tw) * 20) : null; // 0–100
}
export const TYPE_LABEL: Record<string, string> = { govt: "Government college", mhgovt: "Government college (MH quota)", deemed: "Deemed university (private)", mhpriv: "Private college (MH quota)", pdnb: "Private hospital · DNB", gdnb: "Government hospital · DNB" };
export const typeLabel = (c: College) => TYPE_LABEL[c.kind] ?? c.kindLabel;
export const isDnb = (c: College) => c.kind.includes("dnb");
export const params = (c: College) => CRITS.filter(([k]) => k !== "dnb" || isDnb(c));
// One evidence chip per priority, for every college — research where it exists, otherwise what official rules tell us.
export type Ev = { label: string; level: Conf | "na" | "none"; tip: string };
export function evidence(c: College): Ev[] {
  const r = RESEARCH[c.id];
  const bondLevel = (): Conf => {
    if (c.kind === "pdnb" || c.kind.startsWith("mh")) return "High"; // NBEMS rule / Maharashtra brochure §20
    const t = strip(c.bond);
    return /High/.test(t) ? "High" : /Medium/.test(t) ? "Medium" : /Low/.test(t) ? "Low" : "Unverified";
  };
  const from = (f: keyof Research, label: string): Ev => {
    const p = r?.[f] as Param | undefined;
    return p ? { label, level: p.confidence, tip: `${label}: ${p.confidence} — ${p.summary}` }
      : { label, level: "none", tip: `${label}: not researched online (this seat is far from your AIR)` };
  };
  const sp = SUPERSPEC[c.id];
  const out = [sp ? { label: "Super-spec", level: "High" as Conf, tip: `Super-speciality: official MCC SS counselling lists running courses in ${Object.keys(sp.areas).join(", ")}` } : from("super_speciality", "Super-spec"),
    from("hands_on", "Hands-on"), from("toxicity", "Hours")];
  if (isDnb(c)) out.push({ label: "DNB pass", level: "na", tip: "DNB pass rate: NBEMS does not publish institute-wise results — ask the last 3 batches" });
  const rb = r?.bond;
  if (OFFICIAL[c.id]?.bond_doc) { out.push({ label: "Bond", level: "High", tip: `Bond (college's official MCC document): ${bondShort(c)}` }); return out; }
  out.push(rb && rb.confidence !== "Unverified" ? { label: "Bond", level: rb.confidence, tip: `Bond: ${rb.summary}` }
    : { label: "Bond", level: bondLevel(), tip: `Bond: ${bondShort(c)}` });
  return out;
}
export function gaps(c: College) {
  const r = RESEARCH[c.id];
  if (!r) return null;
  return params(c).filter(([, , f]) => (r[f] as Param)?.confidence === "Unverified").length;
}
export const fmt = (v: number | null | undefined) => (v ? v.toLocaleString("en-IN") : "–");
export const strip = (h: string) => h.replace(/<[^>]*>/g, "");
export const shortName = (c: College) => c.name.split(",")[0].replace(/\s*\(CET \d+\)$/, "");
export function place(c: College) {
  const parts = c.name.split(",").slice(1).map((s) => s.trim())
    .filter((s) => s && !/\d{6}/.test(s) && !/@/.test(s) && !s.toLowerCase().includes(c.state.toLowerCase()) && s.toLowerCase() !== shortName(c).toLowerCase() && s.length < 40);
  return (parts.at(-1) ?? "").replace(/\s*\(CET \d+\)$/, "");
}
// Fallbacks from official documents: NMC stipend filing (Dec 2025) and NBEMS DNB fee / stipend floor.
export type BondDoc = { service_years: string | null; service_bond: string | null; leaving_penalty: string | null; applies_to: string | null; other: string | null; quote: string | null; doc_year: string | null };
export type Official = { bond_doc?: BondDoc; fee?: string; stipend?: string; stipend_src?: string; fee_src?: string; forfeit?: string; mcc_note?: string; mcc_code?: string; mcc_bond_doc?: boolean };
export const OFFICIAL = officialData as Record<string, Official>;
const isMcc = (v?: string) => !!v && v.includes("MCC");
const real = (v: string | null | undefined) => (v && !/^not (found|verified|stated)/i.test(v) ? v : null);
// Order: official college declarations (Maharashtra FRA / MCC profile) → online research → NBEMS rule.
export const fee = (c: College) => real(c.fee) ?? (isMcc(OFFICIAL[c.id]?.fee) ? OFFICIAL[c.id].fee! : null) ?? real(RESEARCH[c.id]?.fee_per_year) ?? OFFICIAL[c.id]?.fee ?? null;
export const stipend = (c: College) => (isMcc(OFFICIAL[c.id]?.stipend) ? OFFICIAL[c.id].stipend! : null) ?? real(c.stipend) ?? real(RESEARCH[c.id]?.stipend_year1) ?? OFFICIAL[c.id]?.stipend ?? null;
// First money amount in a free-text research field, e.g. "~Rs 32 lakh/yr (Careers360…)" → "₹32 lakh/yr".
export function money(t: string | null) {
  if (!t) return null;
  const m = t.match(/(?:₹|Rs\.?|INR)\s?[\d,.]+(?:\s?(?:lakh|L|crore|Cr|k))?(?:\s?(?:\/|per |a )\s?(?:yr|year|month|mo|annum))?/i);
  return m ? m[0].replace(/^(Rs\.?|INR)\s?/i, "₹") : t.length > 28 ? t.slice(0, 26) + "…" : t;
}
export function beds(c: College) {
  const t = RESEARCH[c.id]?.beds?.trim();
  if (!t || /^not/i.test(t)) return null;
  if (/conflict/i.test(t)) return "conflicting";
  const m = t.match(/^~?\s*([\d,]{2,7}(?:\s*[-–]\s*[\d,]{2,7})?\+?)/) ?? t.match(/([\d,]{2,7})\+?\s*[-–]?\s*(?:\w+\s)?beds?\b/i);
  return m ? m[1] : "see details";
}
export function bondShort(c: College) {
  const d = OFFICIAL[c.id]?.bond_doc;
  if (d && (d.service_years || d.service_bond)) return [d.service_years, d.service_bond].filter(Boolean).join(" · ").slice(0, 90);
  if (d && d.leaving_penalty) return "No service bond · leaving: " + d.leaving_penalty.slice(0, 60);
  if (c.kind === "pdnb") return "No bond (NBEMS rule)";
  const rb = RESEARCH[c.id]?.bond;
  if (c.kind === "deemed" && rb && rb.confidence !== "Unverified") return rb.summary.split(/(?<=\.)\s/)[0].slice(0, 90);
  if (c.kind === "mhpriv") return "No bond · 3 yrs fee if you quit late";
  const t = strip(c.bond);
  if (/^Not verified|— Not verified for this/.test(t)) return "Not verified";
  return t.split(/ — |;|, (?=High|Medium|Low)|\(/)[0].trim().slice(0, 60);
}

// What a candidate must know about a seat before ranking it — with how much of it the data covers.
export function coverage() {
  const ids = Object.keys(RESEARCH), n = ids.length || 1;
  const has = (f: (r: Research, c: College) => boolean) => ids.filter((id) => BY_ID.get(id) && f(RESEARCH[id], BY_ID.get(id)!)).length;
  const known = (p: Param) => p.confidence !== "Unverified";
  const real = (v: string | null) => !!v && !/not found|not verified/i.test(v);
  return { n, rows: [
    { what: "Closing ranks R1→Stray, 2 years (Open + OBC)", have: n, how: "Official MCC / CET Cell result PDFs (in app)" },
    { what: "Seat type, quota & eligibility", have: n, how: "MCC seat matrix + state brochure" },
    { what: "Fee per year (× 3 = total)", have: has((r, c) => !!fee(c)), how: "MCC 'fee, stipend & bond' annexure; college prospectus; Maharashtra FRA" },
    { what: "Stipend actually paid (not just declared)", have: has((r, c) => !!stipend(c)), how: "NMC stipend list + ask current residents if it's paid on time" },
    { what: "Beds / patient load / OT count", have: has((r) => real(r.beds)), how: "Hospital site, NABH certificate, NMC inspection data" },
    { what: "Super-speciality depts actually functioning", have: has((r, c) => known(r.super_speciality) || !!SUPERSPEC[c.id]), how: "DM/MCh seats, NABH scope, ask seniors which OTs run daily" },
    { what: "Hands-on: blocks, lines, independent cases", have: has((r) => known(r.hands_on)), how: "Seniors / logbook; DNB: outside-posting list" },
    { what: "Duty hours, night calls, post-call off, culture", have: has((r) => known(r.toxicity)), how: "Seniors (2+ independent), resident association, news" },
    { what: "DNB pass rate (DNB only)", have: 0, how: "Not published by NBEMS — ask last 3 batches' result directly" },
    { what: "Service bond: years + amount", have: has((r) => known(r.bond)), how: "MCC bond annexure; state GR; college bond document" },
    { what: "Discontinuation / seat-leaving penalty", have: has((r, c) => !/Not verified/.test(strip(c.penalty))), how: "State brochure; deemed college refund rules" },
    { what: "Resident reviews (first-hand)", have: has((r) => [...r.pros, ...r.cons].some((p) => p.type === "forum" || p.type === "review")), how: "Telegram/WhatsApp PG groups, alumni — online almost nothing" },
    { what: "NMC recognised vs only 'permitted' seats", have: 0, how: "NMC college/course search — new seats carry risk" },
    { what: "Faculty count & seats per unit", have: 0, how: "NMC / NBEMS accreditation; single-seat DNB units can lose accreditation" },
    { what: "Hostel, safety, distance from home", have: 0, how: "Ask seniors; visit" },
  ] };
}

export const PREP = [
  "MBBS college & quota confirmed → know if Maharashtra state quota is open to you",
  "Central-format OBC-NCL certificate (FY 2025-26 income, MCC Annexure) ready",
  "Maharashtra caste certificate + caste validity + state NCL ready (if using MH quota)",
  "Total budget decided (3-year fee + deposits) — rules private / deemed in or out",
  "Decided: am I OK with DNB instead of MD?",
  "Decided: maximum service bond I accept (years / ₹)",
  "Read the MCC rules: Round 1 free exit, R2+ deposit forfeited, Round 3 seat cannot be resigned",
  "List is ordered by PREFERENCE (allotment always gives the highest choice available) — not by chance",
  "List has enough 'Likely' seats at the bottom so you don't end up with nothing",
  "Checked each shortlisted college's fee / stipend / bond annexure on MCC before locking",
  "Spoke to at least 2 seniors for each of my top 10 choices",
  "Downloaded a Backup of this planner",
];

export function strategy(items: string[], air: number, cat: string) {
  const cs = items.map((id) => BY_ID.get(id)!).filter(Boolean);
  const count = { good: 0, ok: 0, mid: 0, bad: 0 };
  cs.forEach((c) => count[chance(c, air, cat).k]++);
  const warn: string[] = [];
  if (cs.length && count.good + count.ok < 5) warn.push(`Only ${count.good + count.ok} seats reached your AIR in 2025 — add more safe options at the bottom.`);
  if (count.bad > 0) warn.push(`${count.bad} "Unlikely" choices — fine as dream picks at the top, but they won't be allotted on past data.`);
  const unrated = cs.filter((c) => !RESEARCH[c.id]).length;
  if (unrated) warn.push(`${unrated} choices have no online research yet — check them with seniors.`);
  const avoid = cs.filter((c) => verdictOf(c).verdict === "Avoid");
  if (avoid.length) warn.push(`${avoid.length} choice(s) have an "Avoid" verdict: ${avoid.map((c) => shortName(c)).slice(0, 4).join(", ")} — keep them only if you'd truly join.`);
  const mcc = cs.filter((c) => c.counselling === "MCC").length;
  if (mcc && mcc < cs.length) warn.push("This list mixes MCC and Maharashtra state seats — they are filled in separate counselling portals.");
  return { count, warn };
}

// Evidence-based score from her 5 priorities (no personal ratings needed). 0–100.
const CONF_PTS: Record<string, number> = { High: 1, Medium: 0.75, Low: 0.4, Unverified: 0.1 };
export function autoScore(c: College, w: Weights) {
  const r = RESEARCH[c.id];
  const conf = (f: keyof Research) => (r ? CONF_PTS[(r[f] as Param).confidence] ?? 0 : 0);
  const sp = SUPERSPEC[c.id];
  const ss = sp ? Math.min(1, 0.6 + Object.keys(sp.areas).length / 8 * 0.4) : r ? Math.min(1, conf("super_speciality") * 0.7 + Math.min((r.super_speciality.available ?? []).length, 6) / 6 * 0.3) : 0;
  const d = OFFICIAL[c.id]?.bond_doc;
  const yrs = Number((d?.service_years ?? "").match(/\d/)?.[0] ?? NaN);
  const bond = c.kind === "pdnb" || c.kind === "mhpriv" ? 1 : yrs >= 2 ? 0.3 : yrs === 1 ? 0.6 : 0.5;
  const parts: [number, number][] = [[ss, w.ss], [conf("hands_on"), w.hands], [conf("toxicity"), w.tox], [bond, w.bond]];
  if (isDnb(c)) parts.push([0.5, w.dnb]); // pass rate unpublished → neutral
  const tw = parts.reduce((a, [, x]) => a + x, 0) || 1;
  return Math.round((parts.reduce((a, [v, x]) => a + v * x, 0) / tw) * 100);
}

// Suggested choice order for one counselling portal.
export const feeNum = (c: College) => { const t = fee(c); const m = t?.match(/(?:₹|Rs\.?)\s?([\d,.]+)\s*(lakh|L\b|Cr|crore)?/i); if (!m) return null; let n = parseFloat(m[1].replace(/,/g, "")); const u = (m[2] || "").toLowerCase(); if (u.startsWith("l")) n *= 1e5; if (u.startsWith("c")) n *= 1e7; return n; };
export const stipendNum = (c: College) => { const t = stipend(c); const m = t?.match(/(?:₹|Rs\.?)\s?([\d,]+)/); return m ? parseInt(m[1].replace(/,/g, "")) : null; };
export const bondYears = (c: College) => { const d = OFFICIAL[c.id]?.bond_doc; const t = d?.service_years ?? strip(c.bond); const m = t?.match(/(\d)\s*(?:-\s*\d\s*)?years?/i); if (c.kind === "pdnb" || c.kind === "mhpriv") return 0; return m ? parseInt(m[1]) : (d && !d.service_years && !d.service_bond ? 0 : null); };
// Why a college is excluded by her preferences (null = allowed).
export function excludedBy(c: College, p: Prefs): string | null {
  if (c.counselling === "MH-CET" && p.mhEligible === "no") return "Maharashtra state quota — not eligible";
  if (!p.dnbOk && isDnb(c)) return "DNB excluded by your preference";
  if (p.states.length && !p.states.includes(c.state)) return "State not in your allowed list";
  const f = feeNum(c); if (p.budgetPerYear && f && f > p.budgetPerYear) return `Fee ${money(fee(c))} over your ₹${(p.budgetPerYear / 1e5).toFixed(0)} L/yr budget`;
  const b = bondYears(c); if (b !== null && b > p.maxBondYears) return `Service bond ${b} yr > your limit ${p.maxBondYears}`;
  const st = stipendNum(c); if (p.minStipend && st && st < p.minStipend) return `Stipend ₹${st.toLocaleString("en-IN")} below your minimum`;
  return null;
}
export function autoList(counselling: string, air: number, cat: string, w: Weights, p: Prefs = DEFAULT_PREFS) {
  const tier = (c: College) => ({ "Join": 0, "Backup only": 1 } as Record<string, number>)[verdictOf(c).verdict] ?? 9;
  return COLLEGES.filter((c) => c.counselling === counselling && tier(c) < 9 && chance(c, air, cat).k !== "bad" && !excludedBy(c, p))
    .sort((a, b) => region(a.state) - region(b.state) || tier(a) - tier(b) || STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state) || autoScore(b, w) - autoScore(a, w))
    .map((c) => c.id);
}

// ---------- AI recommended ranking (her 5 priorities, in order, from the evidence in this app) ----------
export type Rec = { id: string; score: number; tier: "Dream" | "Core" | "Safe"; why: string[]; watch: string[] };
const CONFV: Record<string, number> = { High: 3, Medium: 2, Low: 1, Unverified: 0 };
const DEAL = /suicide|harass|assault|unpaid|not paid|withh|ragging|threat culture|strike/i;
export function aiRank(counselling: string, air: number, cat: string, p: Prefs, stateWeight = 6): Rec[] {
  const out: Rec[] = [];
  for (const c of COLLEGES) {
    if (c.counselling !== counselling) continue;
    const ch = chance(c, air, cat); if (ch.k === "bad") continue;
    const v = verdictOf(c); if (v.verdict === "Avoid" || v.verdict === "Not assessed") continue;
    if (excludedBy(c, p)) continue;
    const why: string[] = [], watch: string[] = []; let score = 0;
    // 1. super-speciality (max 40)
    const sp = SUPERSPEC[c.id]; const r = RESEARCH[c.id]; const rs = RESIDENT[c.id]; const st = SITES[c.id];
    const strong = sp ? Object.keys(sp.areas).filter((a) => ["Cardiac", "Neuro", "Renal/Transplant", "GI surgery", "Onco", "Paeds"].includes(a)) : [];
    if (sp) { score += Math.min(40, 16 + strong.length * 4); why.push(`Priority 1 · official DM/MCh/DNB-SS courses running in ${Object.keys(sp.areas).join(", ")} (MCC NEET-SS 2025) — proof those departments function.`); }
    else if (r && r.super_speciality.confidence !== "Unverified") { score += 10 + CONFV[r.super_speciality.confidence] * 4; why.push(`Priority 1 · ${r.super_speciality.summary.slice(0, 140)} [${r.super_speciality.confidence.toLowerCase()} evidence]`); }
    else { watch.push("Priority 1 · no super-speciality department could be verified — ask which OTs PGs actually rotate through."); }
    if (st?.icu_beds || st?.ot_count) why.push(`Hospital site: ${[st.icu_beds && `ICU ${st.icu_beds}`, st.ot_count && `OT ${st.ot_count}`].filter(Boolean).join(" · ")}.`);
    // 2. hands-on (max 20)
    if (rs && rs.hands_on.confidence !== "Unverified") {
      const neg = /observ|limited|no hands|restricted|consultant-led|clerical/i.test(rs.hands_on.summary);
      score += neg ? 4 : 8 + CONFV[rs.hands_on.confidence] * 4;
      (neg ? watch : why).push(`Priority 2 · ${rs.hands_on.summary.slice(0, 150)} [${rs.hands_on.confidence.toLowerCase()}]`);
    } else watch.push("Priority 2 · hands-on volume not verifiable online — the key question for seniors.");
    // 3. hours / toxicity (max 20)
    const flags = (rs?.red_flags ?? []).filter((f) => DEAL.test(f));
    if (flags.length) { score += 2; watch.push(`Priority 3 · ${flags[0].slice(0, 150)}`); }
    else if (rs && rs.hours_culture.confidence !== "Unverified") { score += 10 + CONFV[rs.hours_culture.confidence] * 3; why.push(`Priority 3 · ${rs.hours_culture.summary.slice(0, 140)} [${rs.hours_culture.confidence.toLowerCase()}]`); }
    else { score += 8; watch.push("Priority 3 · no reports either way on duty hours — ask residents about 24-h duties and post-call off."); }
    // 4. DNB pass (neutral)
    if (isDnb(c)) watch.push("Priority 4 · NBEMS publishes no institute pass rate — ask the department for the last 3 batches.");
    // 5. bond (max 10) + money realism
    const by = bondYears(c);
    if (by === 0) { score += 10; why.push("Priority 5 · no service bond" + (c.kind === "mhpriv" ? " (3 years' fee if you resign after the cut-off)" : "") + "."); }
    else if (by === 1) { score += 6; why.push(`Priority 5 · 1-year service bond: ${bondShort(c)}.`); }
    else if (by !== null) { score += 2; watch.push(`Priority 5 · service bond ${bondShort(c)}.`); }
    else watch.push("Priority 5 · bond terms not verified — read the college's bond PDF on MCC.");
    const f = feeNum(c), stp = stipendNum(c);
    if (f && f >= 2.5e6) { score -= 8; watch.push(`Cost · about ${money(fee(c))}/yr (≈ ${lakh(f * 3)} for 3 years).`); }
    else if (f && f >= 1.2e6) { score -= 3; watch.push(`Cost · ${money(fee(c))}/yr.`); }
    else if (isDnb(c)) why.push("Cost · DNB fee ₹1.25 L/yr.");
    if (stp && stp >= 70000) why.push(`Stipend ₹${stp.toLocaleString("en-IN")}/month (official declaration).`);
    else if (stp && stp < 50000) watch.push(`Stipend only ₹${stp.toLocaleString("en-IN")}/month declared.`);
    if (v.verdict === "Backup only") { score -= 12; watch.push(`Verdict "Backup only": ${v.headline}`); } else why.unshift(`Verdict: ${v.verdict} — ${v.headline}`);
    // chance → tier, and a line on reachability
    const d25 = deepest(c, "2025", cat), d24 = deepest(c, "2024", cat);
    const tier: Rec["tier"] = ch.k === "good" ? "Safe" : ch.k === "ok" ? "Core" : "Dream";
    why.push(ch.k === "good" ? `Reach · ${ch.t} (2025 closing ${fmt(d25)}, 2024 ${fmt(d24)}).` : ch.k === "ok" ? `Reach · ${ch.t} (closing ${fmt(d25)}); not reached in 2024 (${fmt(d24)}).` : `Reach · borderline: 2025 closing ${fmt(d25)} vs your ${fmt(air)} — a free shot at the top of the list.`);
    // state preference tie-break (small, so it never beats evidence)
    const si = STATE_ORDER.indexOf(c.state); const pi = PREFERRED.indexOf(c.state);
    score += pi >= 0 ? stateWeight * (1 - pi / (PREFERRED.length + 1)) : si >= STATE_ORDER.length - 2 ? -stateWeight : 0; // preferred states earn up to stateWeight; J&K/Ladakh lose it
    out.push({ id: c.id, score: Math.round(score), tier, why, watch });
  }
  return out.sort((a, b) => b.score - a.score || STATE_ORDER.indexOf(BY_ID.get(a.id)!.state) - STATE_ORDER.indexOf(BY_ID.get(b.id)!.state));
}
const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(0)} L`);

// ---------- One label per priority, for every college ----------
export type PLabel = { n: number; key: string; label: string; level: "good" | "ok" | "mid" | "bad" | "none"; tip: string };
export function priorityLabels(c: College): PLabel[] {
  const sp = SUPERSPEC[c.id]; const r = RESEARCH[c.id]; const rs = RESIDENT[c.id]; const st = SITES[c.id];
  const strong = sp ? Object.keys(sp.areas).filter((a) => ["Cardiac", "Neuro", "Renal/Transplant", "GI surgery", "Onco", "Paeds"].includes(a)) : [];
  const ssc = r?.super_speciality.confidence ?? "Unverified";
  const siteDepts = st ? st.departments.filter((d) => /cardiac|ctvs|neuro|transplant|onco|paedi|pedi|nicu|picu/i.test(d)).length : 0;
  const ss: PLabel = sp && strong.length >= 3 ? { n: 1, key: "Super-spec", label: `High — ${strong.length} super-speciality depts, officially confirmed`, level: "good", tip: `DM/MCh/DNB-SS courses running in ${Object.keys(sp.areas).join(", ")} (MCC NEET-SS 2025)` }
    : sp ? { n: 1, key: "Super-spec", label: `Medium — only ${Object.keys(sp.areas).join(", ")} (officially confirmed)`, level: "ok", tip: "Official courses in fewer than 3 core areas" }
    : siteDepts >= 3 ? { n: 1, key: "Super-spec", label: "Medium — only the hospital website claims them", level: "ok", tip: st!.departments.join(", ") }
    : ssc === "High" || ssc === "Medium" ? { n: 1, key: "Super-spec", label: "Medium — mentioned online, not confirmed", level: "ok", tip: r!.super_speciality.summary }
    : ssc === "Low" || siteDepts > 0 ? { n: 1, key: "Super-spec", label: "Low — little super-speciality work", level: "mid", tip: r?.super_speciality.summary ?? st?.departments.join(", ") ?? "" }
    : { n: 1, key: "Super-spec", label: "Missing — nothing found online", level: "none", tip: "No department could be verified" };
  const hs = rs?.hands_on; const neg = hs ? /observ|limited|no hands|restricted|consultant-led|clerical/i.test(hs.summary) : false;
  const ho: PLabel = hs && hs.confidence !== "Unverified" ? (neg ? { n: 2, key: "Hands-on", label: "Poor — residents mostly watch", level: "bad", tip: hs.summary } : hs.confidence === "Low" ? { n: 2, key: "Hands-on", label: "Unclear — no reliable resident review", level: "mid", tip: hs.summary } : { n: 2, key: "Hands-on", label: "Good — residents say they do cases", level: "good", tip: hs.summary })
    : r && r.hands_on.confidence !== "Unverified" ? { n: 2, key: "Hands-on", label: "Some — reported, but not by residents", level: "ok", tip: r.hands_on.summary }
    : (st?.anaesthesia_dept?.services.length ?? 0) > 0 ? { n: 2, key: "Hands-on", label: "Unclear — no resident has said", level: "mid", tip: st!.anaesthesia_dept!.services.join(", ") }
    : { n: 2, key: "Hands-on", label: "Missing — nothing found online", level: "none", tip: "Nothing online; only residents can tell you" };
  const flags = (rs?.red_flags ?? []).filter((f) => /suicide|harass|assault|unpaid|not paid|withh|ragging|threat culture|strike/i.test(f));
  const hc = rs?.hours_culture;
  const tx = TOXHOURS[c.id]?.toxicity; const cnt = tx?.count ?? {}; const serious = (cnt.suicides ?? 0) + (cnt.unknown_deaths ?? 0); const minor = (cnt.strikes ?? 0) + (cnt.harassment ?? 0) + (cnt.resignations ?? 0);
  const hr: PLabel = tx && tx.cell && serious > 0 ? { n: 3, key: "Hours", label: serious > 1 ? `Red flag — ${serious} deaths reported` : "Red flag — a death reported", level: "bad", tip: tx.cell }
    : tx && tx.cell && minor > 0 ? { n: 3, key: "Hours", label: "Caution — complaints reported", level: "mid", tip: tx.cell }
    : tx && /nothing (adverse|bad) found|^no resident (incident|item)|nothing about (this|residents|pgs)/i.test(tx.cell) && !flags.length ? { n: 3, key: "Hours", label: "OK — nothing bad found online", level: "ok", tip: tx.cell }
    : tx && /toxic|harass|unpaid|not paid|strike/i.test(tx.cell) ? { n: 3, key: "Hours", label: "Caution — complaints reported", level: "mid", tip: tx.cell }
    : flags.length && hc && CONFV[hc.confidence] >= 2 ? { n: 3, key: "Hours", label: "Red flag — serious resident complaints", level: "bad", tip: flags[0] }
    : flags.length ? { n: 3, key: "Hours", label: "Caution — resident complaints", level: "mid", tip: flags[0] }
    : hc && hc.confidence !== "Unverified" ? (CONFV[hc.confidence] >= 2 ? { n: 3, key: "Hours", label: "Good — residents report sane hours", level: "good", tip: hc.summary } : { n: 3, key: "Hours", label: "Unclear — only weak reports", level: "mid", tip: hc.summary })
    : r && r.toxicity.confidence !== "Unverified" ? { n: 3, key: "Hours", label: "Unclear — some reports, read the text", level: "ok", tip: r.toxicity.summary }
    : { n: 3, key: "Hours", label: "Missing — nothing found online", level: "none", tip: "No reports either way" };
  const dnb: PLabel = isDnb(c) ? { n: 4, key: "DNB pass", label: "Missing — NBEMS does not publish it", level: "none", tip: "NBEMS publishes no institute-wise pass rate; ask for the last 3 batches" } : { n: 4, key: "DNB pass", label: "Not needed — MD seat", level: "ok", tip: "MD — pass rate not part of your criteria" };
  const by = bondYears(c);
  const bd: PLabel = by === 0 ? { n: 5, key: "Bond", label: "No bond", level: "good", tip: bondShort(c) } : by === 1 ? { n: 5, key: "Bond", label: "1-year bond", level: "ok", tip: bondShort(c) } : by !== null ? { n: 5, key: "Bond", label: `${by}-year bond`, level: "bad", tip: bondShort(c) } : { n: 5, key: "Bond", label: "Missing — bond not confirmed", level: "none", tip: strip(c.bond).slice(0, 120) };
  return [ss, ho, hr, dnb, bd];
}

// ---------- Sheet tab: her friend's list with 7 columns, blank when nothing is verified ----------
import sheetData from "./sheet.json";
export const SHEET = sheetData as { state: string; given: string; id: string | null; matched: string | null }[];
export const SHEET_STATES = ["Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Himachal Pradesh", "Uttarakhand", "Punjab", "Chhattisgarh", "Jharkhand", "Karnataka", "Tamil Nadu", "Meghalaya", "Assam", "Odisha", "Manipur", "Andhra Pradesh"];
const HOURS = /\b\d{1,2}(?:\s*[-–to]+\s*\d{1,2})?\s*(?:h\b|hr|hrs|hour)[^.;]{0,60}/gi;
const TOX = /suicide|death|died|resign|strike|harass|unpaid|not paid|withh|protest|ragging|threat culture|assault/i;
// Multispeciality cell in plain words: official super-speciality training first, then what only the hospital website claims.
const AREA_NAME: Record<string, string> = { "Cardiac": "Heart", "Neuro": "Brain & spine", "Renal/Transplant": "Kidney & transplant", "GI surgery": "Stomach & liver (GI) surgery", "Onco": "Cancer", "Paeds": "Children's surgery", "Critical care": "Critical care (ICU)", "Vascular/Thoracic": "Blood vessel & chest surgery" };
const DEPTS: [RegExp, string][] = [[/cardiac surg|ctvs|cvts|cardiothoracic|cardio-?thoracic/i, "Heart surgery"], [/cardiolog|cath/i, "Cardiology"], [/neurosurg|neuro surg|spine surg/i, "Brain & spine surgery"],
  [/kidney transplant|renal transplant/i, "Kidney transplant"], [/liver transplant/i, "Liver transplant"], [/nephro|dialysis/i, "Kidney (dialysis)"], [/urolog/i, "Urology"],
  [/gi surg|gastro.{0,20}surg|hpb|surgical gastro/i, "GI surgery"], [/onco/i, "Cancer surgery"], [/p(a)?ediatric surg/i, "Children's surgery"], [/nicu|picu|neonat/i, "Newborn / child ICU"],
  [/trauma|emergenc|casualty/i, "Trauma & emergency"], [/burn/i, "Burns"], [/pain/i, "Pain clinic"]];
export function multiText(c: College) {
  const sp = SUPERSPEC[c.id]; const st = SITES[c.id]; const r = RESEARCH[c.id];
  const site = [...new Set(DEPTS.filter(([re]) => (st?.departments ?? []).some((d) => re.test(d))).map(([, n]) => n))];
  if (sp) return `Officially confirmed: ${Object.keys(sp.areas).map((a) => AREA_NAME[a] ?? a).join(", ")}.` + (site.length ? ` Website also lists: ${site.join(", ")}.` : "");
  if (site.length) return `Hospital website lists: ${site.join(", ")}. Not officially confirmed.`;
  return r && r.super_speciality.confidence !== "Unverified" ? r.super_speciality.summary : "";
}
export function sheetRow(c: College) {
  const rs = RESIDENT[c.id]; const r = RESEARCH[c.id]; const sp = SUPERSPEC[c.id]; const st = SITES[c.id];
  const hands = rs && rs.hands_on.confidence !== "Unverified" ? rs.hands_on.summary : r && r.hands_on.confidence !== "Unverified" ? r.hands_on.summary : "";
  const multi = multiText(c);
  const toxItems = [...(rs?.red_flags ?? []), ...(rs?.cons ?? []).map((x) => x.text), ...(r?.cons ?? []).map((x) => x.text)].filter((t) => TOX.test(t));
  const tox = [...new Set(toxItems)].slice(0, 3).join(" · ");
  const hoursText = [rs?.hours_culture.summary ?? "", ...(rs?.hours_culture.items ?? []).map((i) => i.text), rs?.hands_on.summary ?? ""].join(" ");
  const hours = [...new Set((hoursText.match(HOURS) ?? []).map((m) => m.trim()))].slice(0, 3).join(" · ");
  const icuText = [hoursText, st?.anaesthesia_dept?.notes ?? "", st?.academics ?? ""].join(" ");
  const icu = (icuText.match(/[^.]{0,60}\bICU\b[^.]{0,80}(?:week|posting|rotation|month)[^.]{0,40}/i) ?? [""])[0].trim();
  const b = OFFICIAL[c.id]?.bond_doc; const bond = b && (b.service_years || b.service_bond || b.leaving_penalty) ? [b.service_years, b.service_bond, b.leaving_penalty && `leaving: ${b.leaving_penalty}`].filter(Boolean).join(" · ") : c.kind === "pdnb" ? "Private DNB hospitals can't take a bond (NBEMS rule)" : c.kind === "mhpriv" ? "None; 3 yrs' fee if you resign late" : "";
  const t = TOXHOURS[c.id];
  return { bond, stipend: money(stipend(c)) ?? "", hands, multi, tox: t?.toxicity.cell || tox, hours: t?.hours_per_day.cell || hours, icu: t?.icu_per_week.cell || icu };
}
