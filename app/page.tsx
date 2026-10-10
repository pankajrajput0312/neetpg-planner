"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  BY_ID, COLLEGES, CRITS, DEFAULT, GUIDE, PREP, PRESETS, RESEARCH, ROUNDS, ROW_HELP, ROW_LABEL, STATE_ORDER,
  beds, bondShort, chance, evidence, money, coverage, deepest, fee, firstRound, fmt, gaps, isDnb, params, place, roundClose, score,
  shortName, stipend, strategy, strip, OFFICIAL, VERDICT_ORDER, verdictKey, verdictOf, autoList, autoScore, joinedLast, ADMITTED, SUPERSPEC, DERIVED, SITES, FUTURE, REC_KEY, SENIOR_METHOD, allPros, allCons, recommendation, seniorChecklist, RESIDENT, typeLabel, TYPE_LABEL, excludedBy, feeNum, stipendNum, bondYears, DEFAULT_PREFS, aiRank, priorityLabels, SHEET, SHEET_STATES, sheetRow,
  type College, type Conf, type Crit, type Param, type Store, type Resident, type Prefs,
} from "./lib";

const KEY = "neetpg-planner-v1";
const Html = ({ h }: { h: string }) => <span dangerouslySetInnerHTML={{ __html: h }} />;
const ConfTag = ({ c }: { c: Conf }) => <span className={"conf " + c}>{c}</span>;
const COV = coverage();

export default function Page() {
  const [s, setS] = useState<Store>(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"explore" | "compare" | "saved" | "lists" | "ai" | "sheet" | "decide">("explore");
  const [onlySaved, setOnlySaved] = useState(false);
  const [q, setQ] = useState("");
  const [fState, setFState] = useState<string[]>([]);
  const [fCoun, setFCoun] = useState("");
  const [fKind, setFKind] = useState<string[]>([]);
  const [fChance, setFChance] = useState<string[]>([]);
  const [fVerdict, setFVerdict] = useState<string[]>([]);
  const [fRec, setFRec] = useState<string[]>([]);
  const [rk, setRk] = useState<{ min: string; max: string; round: string }>({ min: "", max: "", round: "" });
  const flip = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const [onlyResearched, setOnlyResearched] = useState(false);
  const [sort, setSort] = useState("state");
  const [open, setOpen] = useState<string | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  // ---- cross-device sync (Netlify function /api/sync) ----
  const [syncSecret, setSyncSecret] = useState<string>("");
  const [syncId, setSyncId] = useState<string>("");
  const [syncMsg, setSyncMsg] = useState<string>("");
  const [readOnly, setReadOnly] = useState<string | null>(null); // public id being viewed
  const [stateWeight, setStateWeight] = useState(12);
  const sha = async (t: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  const [limit, setLimit] = useState(60);
  const [listView, setListView] = useState<"rows" | "cards">("rows");
  const [lf, setLf] = useState<{ state: string[]; kind: string[]; verdict: string[]; chance: string[]; min: string; max: string }>({ state: [], kind: [], verdict: [], chance: [], min: "", max: "" });
  const prefs: Prefs = { ...DEFAULT_PREFS, ...(s.prefs ?? {}) };
  const setPrefs = (p: Partial<Prefs>) => up({ prefs: { ...prefs, ...p } });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const old = JSON.parse(raw);
        // v1 stored a single `weights` object: keep it as the first priority set.
        if (old.weights && !old.sets) old.sets = [{ ...PRESETS[0], weights: old.weights }, ...PRESETS.slice(1)];
        setS({ ...DEFAULT, ...old });
      }
    } catch {}
    setLoaded(true);
    (async () => {
      const view = new URLSearchParams(location.search).get("view");
      if (view) {
        setReadOnly(view); setSyncMsg("Loading shared lists…");
        try { const r = await fetch(`/api/sync?id=${view}`); if (r.ok) { const j = await r.json(); setS({ ...DEFAULT, ...j.data }); setSyncMsg("Viewing shared lists (read-only) · updated " + new Date(j.updatedAt).toLocaleString()); } else setSyncMsg("Shared lists not found."); } catch { setSyncMsg("Could not load shared lists."); }
        return;
      }
      let sec = ""; try { sec = localStorage.getItem("neetpg-sync-secret") ?? ""; } catch {}
      if (sec) { setSyncSecret(sec); const id = await sha(sec); setSyncId(id); await pull(sec, id); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pull = async (sec: string, id: string) => {
    try {
      const r = await fetch(`/api/sync?id=${id}`);
      if (r.status === 404) { setSyncMsg("Sync on — nothing saved on the server yet; your changes will upload."); return; }
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json(); let localAt = 0; try { localAt = +(localStorage.getItem("neetpg-sync-at") ?? 0); } catch {}
      if (j.updatedAt > localAt) { setS({ ...DEFAULT, ...j.data }); try { localStorage.setItem("neetpg-sync-at", String(j.updatedAt)); } catch {} setSyncMsg("Synced from server · " + new Date(j.updatedAt).toLocaleString()); }
      else setSyncMsg("Sync on · up to date");
    } catch { setSyncMsg("Sync: server not reachable (works on the deployed site, not on localhost)"); }
  };
  const push = async (sec: string, data: Store) => {
    try {
      const r = await fetch("/api/sync", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: sec, data }) });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json(); setSyncId(j.id); try { localStorage.setItem("neetpg-sync-at", String(j.updatedAt)); } catch {}
      setSyncMsg("Saved to server · " + new Date(j.updatedAt).toLocaleTimeString());
    } catch { setSyncMsg("Sync: could not save (server not reachable)"); }
  };
  const enableSync = async (sec: string) => {
    if (sec.length < 8) { alert("Use at least 8 characters."); return; }
    try { localStorage.setItem("neetpg-sync-secret", sec); } catch {}
    setSyncSecret(sec); const id = await sha(sec); setSyncId(id); await pull(sec, id); await push(sec, s);
  };
  const disableSync = () => { try { localStorage.removeItem("neetpg-sync-secret"); } catch {} setSyncSecret(""); setSyncId(""); setSyncMsg("Sync off — data stays only in this browser."); };
  useEffect(() => { if (loaded && !readOnly) try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, [s, loaded, readOnly]);
  useEffect(() => { if (!loaded || readOnly || !syncSecret) return; const t = setTimeout(() => push(syncSecret, s), 1500); return () => clearTimeout(t); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);
  useEffect(() => { setLimit(60); }, [q, fState, fCoun, fKind, fChance, fVerdict, fRec, rk, onlyResearched, sort]);

  const up = (p: Partial<Store>) => setS((o) => ({ ...o, ...p }));
  const set = s.sets.find((x) => x.id === s.activeSet) ?? s.sets[0];
  const w = set.weights;
  const list = s.lists.find((l) => l.id === s.active) ?? s.lists[0];
  const setItems = (items: string[]) => up({ lists: s.lists.map((l) => (l.id === list.id ? { ...l, items } : l)) });
  const inList = new Set(list?.items ?? []);
  const myScore = (c: College) => score(s.ratings[c.id], w, isDnb(c));

  const saved = s.saved ?? [];
  const inRank = (c: College) => {
    const d = deepest(c, "2025", s.cat);
    if (rk.min && d < +rk.min) return false; if (rk.max && (!d || d > +rk.max)) return false;
    if (rk.round) { const r = firstRound(c, "2025", s.cat, s.air); if (!r || ROUNDS.indexOf(r) > ROUNDS.indexOf(rk.round)) return false; }
    return true;
  };
  const base = useMemo(() => {
    const t = q.toLowerCase();
    return COLLEGES.filter((c) =>
      (!t || (c.name + " " + c.state).toLowerCase().includes(t)) &&
      (!fState.length || fState.includes(c.state)) && (!fCoun || c.counselling === fCoun) && inRank(c) && (!fKind.length || fKind.includes(c.kind)) && (!fRec.length || fRec.includes(recommendation(c).rec)) &&
      (!onlyResearched || RESEARCH[c.id]) && (!onlySaved || saved.includes(c.id)));
  }, [q, fState, fCoun, fKind, fRec, rk, onlyResearched, onlySaved, saved]);
  const counts = useMemo(() => {
    const n = { good: 0, ok: 0, mid: 0, bad: 0 };
    base.forEach((c) => n[chance(c, s.air, s.cat).k]++);
    return n;
  }, [base, s.air, s.cat]);
  const rows = useMemo(() => {
    const r = base.filter((c) => (!fChance.length || fChance.includes(chance(c, s.air, s.cat).k)) && (!fVerdict.length || fVerdict.includes(verdictOf(c).verdict)));
    const sc = (c: College) => myScore(c) ?? -1;
    if (sort === "deep") r.sort((a, b) => deepest(b, "2025", s.cat) - deepest(a, "2025", s.cat));
    if (sort === "state") r.sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state) || deepest(b, "2025", s.cat) - deepest(a, "2025", s.cat));
    if (sort === "score") r.sort((a, b) => sc(b) - sc(a));
    if (sort === "pros") r.sort((a, b) => (RESEARCH[b.id]?.pros.length ?? -1) - (RESEARCH[b.id]?.cons.length ?? 0) - ((RESEARCH[a.id]?.pros.length ?? -1) - (RESEARCH[a.id]?.cons.length ?? 0)));
    if (sort === "name") r.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "verdict") r.sort((a, b) => VERDICT_ORDER.indexOf(verdictOf(a).verdict) - VERDICT_ORDER.indexOf(verdictOf(b).verdict) || deepest(b, "2025", s.cat) - deepest(a, "2025", s.cat));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, fChance, fVerdict, sort, s.cat, s.air, s.ratings, w]);

  const move = (from: number, to: number) => {
    if (!list || to < 0 || to >= list.items.length || from === to) return;
    const it = [...list.items]; const [x] = it.splice(from, 1); it.splice(to, 0, x); setItems(it);
  };
  const toggle = (id: string) => setItems(inList.has(id) ? list.items.filter((x) => x !== id) : [...list.items, id]);
  const toggleSave = (id: string) => up({ saved: saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id] });
  const toggleCompare = (id: string) => up({ compare: s.compare.includes(id) ? s.compare.filter((x) => x !== id) : [...s.compare, id].slice(-6) });
  const rate = (id: string, k: Crit, v: number) => up({ ratings: { ...s.ratings, [id]: { ...s.ratings[id], [k]: v || undefined } } });
  const tick = (id: string, i: number) => {
    const cur = s.checked[id] ?? [];
    up({ checked: { ...s.checked, [id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] } });
  };
  const setWeights = (k: Crit, v: number) => up({ sets: s.sets.map((x) => (x.id === set.id ? { ...x, weights: { ...x.weights, [k]: v } } : x)) });

  const download = (name: string, text: string, type: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  };
  const exportCsv = () => {
    const esc = (v: unknown) => `"${strip(String(v ?? "")).replace(/"/g, '""')}"`;
    const head = ["#", "College", "State", "Counselling", "Type", "Chance", "2025 R1", "2025 R2", "2025 R3", "2025 Stray", "2024 deepest", `My score (${set.name})`, "Beds", "Fee", "Stipend", "Bond", "Penalty", "Note"];
    const lines = list.items.map((id, i) => {
      const c = BY_ID.get(id)!;
      return [i + 1, c.name, c.state, c.counselling, c.kindLabel, chance(c, s.air, s.cat).t, ...roundClose(c, "2025", s.cat), deepest(c, "2024", s.cat),
        myScore(c) ?? "", RESEARCH[id]?.beds, fee(c), stipend(c), c.bond, c.penalty, s.notes[id] ?? ""].map(esc).join(",");
    });
    download(`${list.name}.csv`, [head.map(esc).join(","), ...lines].join("\n"), "text/csv");
  };
  const restore = (f: File) => f.text().then((t) => { try { setS({ ...DEFAULT, ...JSON.parse(t) }); } catch { alert("Not a valid backup file"); } });
  const byScore = (a: string, b: string) => (myScore(BY_ID.get(b)!) ?? -1) - (myScore(BY_ID.get(a)!) ?? -1);

  const states = STATE_ORDER.filter((x) => COLLEGES.some((c) => c.state === x));
  const kinds = [...new Map(COLLEGES.map((c) => [c.kind, c.kindLabel.split(" (")[0]])).entries()];

  /* ---------- small building blocks ---------- */
  const multi = (label: string, sel: string[], opts: [string, string][], set: (v: string[]) => void) => (
    <details className="ms">
      <summary>{label}{sel.length ? <b> · {sel.length}</b> : ""}</summary>
      <div className="ms-list">
        {opts.map(([k, l]) => <label key={k}><input type="checkbox" checked={sel.includes(k)} onChange={() => set(flip(sel, k))} /> {l}</label>)}
        {sel.length > 0 && <button onClick={() => set([])}>Clear</button>}
      </div>
    </details>
  );
  const cellCls = (v: number | null) => (v && v >= s.air ? "hit" : v && v >= s.air * 0.9 ? "near" : "");
  const stripView = (c: College) => {
    const r25 = roundClose(c, "2025", s.cat); const d24 = deepest(c, "2024", s.cat); const j = joinedLast(c, s.cat);
    return (
      <div className="cut">
        <div className="cut-head"><span>2025 closing AIR</span><span className="muted">2024 last: <b>{fmt(d24)}</b></span></div>
        <div className="cut-row">
          {r25.map((v, i) => <div key={i} className={"cell " + cellCls(v)}><small>{ROUNDS[i]}</small><b>{fmt(v)}</b></div>)}
        </div>
        {j && (j.aiq || j.state) && <p className="joined">Last who joined (2025): {j.aiq ? <>AIQ <b>{fmt(j.aiq)}</b></> : null}{j.aiq && j.state ? " · " : ""}{j.state ? <>State quota <b>{fmt(j.state)}</b></> : null}</p>}
      </div>
    );
  };
  const dots = (c: College) => (
    <div className="dots">
      {evidence(c).map((e) => <span key={e.label} className={"dot " + e.level} title={e.tip}>{e.label}</span>)}
    </div>
  );
  const facts = (c: College) => (
    <div className="kpis">
      <div title={fee(c) ?? ""}><small>Fee / year</small><b>{money(fee(c)) ?? "—"}</b></div>
      <div title={stipend(c) ?? ""}><small>Stipend</small><b>{money(stipend(c)) ?? "—"}</b></div>
      <div title={bondShort(c)}><small>Bond</small><b>{bondShort(c)}</b></div>
    </div>
  );
  const card = (c: College, children?: React.ReactNode) => {
    const ch = chance(c, s.air, s.cat); const v = verdictOf(c);
    return (
      <article className="card">
        <div className="card-top">
          <h3 onClick={() => setOpen(c.id)}>{shortName(c)}</h3>
          <p className="sub">{[place(c), c.state].filter(Boolean).join(", ")} · {c.kindLabel.split(" (")[0]}</p>
          <div className="tags">
            <span className="tag type-tag">{typeLabel(c)}</span>
            <span className={"tag v-" + verdictKey(v.verdict)}>{v.verdict}</span>
            <span className={"tag " + ch.k} title={ch.t}>{ch.short} at {fmt(s.air)}</span>
          </div>
          {v.verdict !== "Not assessed" ? <p className="headline">{v.headline}</p> : <p className="headline muted">{recommendation(c).data_verdict}</p>}
          <p className={"foryou r-" + REC_KEY[recommendation(c).rec]}><b>For you: {recommendation(c).rec}</b> — {recommendation(c).rec_why}</p>
          <div className="plabels">{priorityLabels(c).map((l) => <span key={l.n} className={"pl " + l.level} title={`${l.n}. ${l.key}: ${l.tip}`}><small>{l.n} {l.key}</small>{l.label}</span>)}</div>
        </div>
        {stripView(c)}
        {facts(c)}
        <div className="actions">
          {children ?? (<>
            <button className="ghost" onClick={() => setOpen(c.id)}>Details</button>
            <button className={"ghost" + (s.compare.includes(c.id) ? " sel" : "")} onClick={() => toggleCompare(c.id)}>{s.compare.includes(c.id) ? "✓ Compare" : "Compare"}</button>
            <button className={"ghost star" + (saved.includes(c.id) ? " sel" : "")} title="Save for later — considering, not in a list" onClick={() => toggleSave(c.id)}>{saved.includes(c.id) ? "★ Saved" : "☆ Save"}</button>
            <button className={"primary" + (inList.has(c.id) ? " added" : "")} onClick={() => toggle(c.id)}>
              {inList.has(c.id) ? `#${list.items.indexOf(c.id) + 1} in list ✓` : "+ Add"}
            </button>
          </>)}
        </div>
      </article>
    );
  };

  const drawer = (c: College) => {
    const r = RESEARCH[c.id]; const done = s.checked[c.id] ?? []; const ch = chance(c, s.air, s.cat);
    return (
      <div className="overlay" onClick={() => setOpen(null)}>
        <aside className="drawer" onClick={(e) => e.stopPropagation()}>
          <button className="close" onClick={() => setOpen(null)} aria-label="Close">✕</button>
          <h2>{shortName(c)}</h2>
          <p className="muted">{c.name}</p>
          <p><span className={"tag " + ch.k}>{ch.t}</span> <span className="type">{c.kindLabel}</span></p>
          {dots(c)}
          <div className="plabels">{priorityLabels(c).map((l) => <span key={l.n} className={"pl " + l.level} title={l.tip}><small>{l.n} {l.key}</small>{l.label}</span>)}</div>
          <div className="row-btns">
            <button className={"primary" + (inList.has(c.id) ? " added" : "")} onClick={() => toggle(c.id)}>{inList.has(c.id) ? `#${list.items.indexOf(c.id) + 1} in “${list.name}” ✓` : `+ Add to “${list.name}”`}</button>
            <button onClick={() => toggleCompare(c.id)}>{s.compare.includes(c.id) ? "✓ In compare" : "Add to compare"}</button>
            <button className={saved.includes(c.id) ? "sel" : ""} onClick={() => toggleSave(c.id)}>{saved.includes(c.id) ? "★ Saved for later" : "☆ Save for later"}</button>
          </div>

          {(() => { const v = verdictOf(c); return (
            <div className={"vbox v-" + verdictKey(v.verdict)}>
              <p><b>Verdict: {v.verdict}</b> {v.confidence && <span className={"conf " + v.confidence}>{v.confidence} confidence</span>}</p>
              <p>{v.headline}</p>
              {v.reasons.length > 0 && <ul>{v.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
              {v.deal_breakers.length > 0 && <><b className="small">Deal-breakers</b><ul className="cons">{v.deal_breakers.map((x) => <li key={x}>{x}</li>)}</ul></>}
              {v.verify.length > 0 && <><b className="small">Verify before locking</b><ul>{v.verify.map((x) => <li key={x}>{x}</li>)}</ul></>}
              <p className="muted small">Verdict = “if allotted, should I join?”, judged on your 5 priorities from the evidence below. It's a guide, not a guarantee — seniors' input beats it.</p>
            </div>); })()}

          <h4>Cutoffs — closing AIR per round</h4>
          <table className="rk"><thead><tr><th></th>{ROUNDS.map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>
            {["2025", "2024"].flatMap((y) => Object.entries(c.ranks[y] ?? {}).filter(([, v]) => v.some(Boolean)).map(([cat, v]) => (
              <tr key={y + cat}><th title={ROW_HELP[cat]}>{y} · {ROW_LABEL[cat] ?? cat}</th>{v.map((x, i) => {
                const src = c.sources[y]?.[i];
                return <td key={i} className={cellCls(x)}>{x && src ? <a href={src} target="_blank" rel="noopener">{fmt(x)}</a> : fmt(x)}</td>;
              })}</tr>)))}
          </tbody></table>
          <p className="muted small">Filled = reached your AIR ({fmt(s.air)}) · dashed = within 10%. Click a number for the official PDF. Your rank reached it in 2025 at: <b>{firstRound(c, "2025", s.cat, s.air) ?? "—"}</b>.</p>

          {ADMITTED[c.id] && (() => { const a = ADMITTED[c.id]; const L = (k: string) => fmt(a.last[k]); return (<>
            <h4>2025 final admissions — who actually joined</h4>
            <div className="kv">
              <span>Seats filled</span><b>{a.total} ({a.aiq} AIQ · {a.state} state quota)</b>
              <span>Last AIR joined, AIQ</span><span>Open <b>{L("AIQ Open")}</b> · OBC <b>{L("AIQ OBC")}</b></span>
              <span>Last AIR joined, state</span><span>Open <b>{L("State Open")}</b> · OBC <b>{L("State OBC")}</b> <small className="muted">(state quota needs that state's eligibility)</small></span>
            </div>
            <p className="muted small">From the 2025 admitted-candidates list you shared (summary only, no names). “Joined” can be lower than the allotment closing, because some allottees don't join.</p>
          </>); })()}

          {SUPERSPEC[c.id] && (<>
            <h4>Super-speciality departments — official (MCC NEET-SS 2025 counselling)</h4>
            <div className="kv">
              {Object.entries(SUPERSPEC[c.id].areas).map(([a, progs]) => <Fragment key={a}><span>{a}</span><span>{progs.join(" · ")}</span></Fragment>)}
            </div>
            <p className="muted small">A hospital can only run a DM/MCh/DNB-SS course if that department actually functions with faculty and case load — this is the strongest evidence for your priority #1. Ask seniors whether anaesthesia PGs rotate through these OTs.</p>
          </>)}

          <h4>Money & bond</h4>
          <div className="kv">
            <span>Fee / year</span><b>{fee(c) ?? "Not found"}</b>
            <span>Stipend (yr 1)</span><b>{stipend(c) ?? "Not found"}</b>
            <span>Beds</span><b>{r?.beds ?? "Not found"}</b>
            {OFFICIAL[c.id]?.bond_doc && (() => { const d = OFFICIAL[c.id].bond_doc!; return (<>
              <span>Official bond{d.doc_year ? ` (${d.doc_year})` : ""}</span>
              <span><b>{[d.service_years, d.service_bond].filter(Boolean).join(" · ") || "No service bond stated"}</b>
                {d.leaving_penalty && <><br />Leaving: {d.leaving_penalty}</>}
                {d.applies_to && <><br /><small>Applies to: {d.applies_to}</small></>}
                {d.other && <><br /><small>{d.other}</small></>}
                {d.quote && <><br /><small className="muted">“{d.quote}”</small></>}
                <br /><small className="muted">From the bond document the college uploaded to MCC (link below).</small></span>
            </>); })()}
            <span>State / rule bond</span><span><Html h={c.bond} /></span>
            <span>Leaving penalty</span><span><Html h={c.penalty} /></span>
            {OFFICIAL[c.id]?.forfeit && <><span>MCC forfeit</span><span>{OFFICIAL[c.id].forfeit}</span></>}
            {OFFICIAL[c.id]?.mcc_note && <><span>College note to MCC</span><span>{OFFICIAL[c.id].mcc_note}</span></>}
            {OFFICIAL[c.id]?.mcc_code && <><span>Official sheets</span><span>
              <a href={`https://mcc.admissions.nic.in/Counseling/Handler/ViewInstituteProfileDetailsDynamic.ashx?boardId=140012521&InstituteId=${OFFICIAL[c.id].mcc_code}`} target="_blank" rel="noopener">MCC fee & stipend sheet</a>
              {OFFICIAL[c.id].mcc_bond_doc && <> · <a href={`https://mcc.admissions.nic.in/Counseling/Handler/ViewInstituteProfileDynamic.ashx?boardId=140012521&InstituteId=${OFFICIAL[c.id].mcc_code}&Type=BM`} target="_blank" rel="noopener">MCC bond document</a></>}
            </span></>}
            {r && <><span>Bond (online)</span><span>{r.bond.summary} <ConfTag c={r.bond.confidence} /></span></>}
          </div>

          <h4>Senior's checklist — what to know before placing this college</h4>
          <p className="legend muted"><span className="stdot have" /> already in the app (official data) · <span className="stdot partial" /> partly known — verify · <span className="stdot ask" /> not available online — <b>you</b> ask seniors/college, then tick it</p>
          <table className="chk-t"><tbody>
            {seniorChecklist(c, s.cat, s.notes[c.id]).map((k) => {
              const done = (s.verified[c.id] ?? []).includes(k.label); const st = done ? "have" : k.status;
              return (
                <tr key={k.label} className={"st-" + st}>
                  <td><span className="stdot" />{k.label}</td>
                  <td>{k.value}</td>
                  <td className="small">{k.status === "have" ? <span className="muted">✓ in app</span> : (
                    <label className="verify"><input type="checkbox" checked={done} onChange={() => up({ verified: { ...s.verified, [c.id]: done ? (s.verified[c.id] ?? []).filter((x) => x !== k.label) : [...(s.verified[c.id] ?? []), k.label] } })} />
                      {done ? "✓ you verified" : (k.status === "partial" ? "Verify: " : "Ask: ") + k.how}</label>)}</td>
                </tr>);
            })}
          </tbody></table>
          <p className="muted small">{(() => { const rows = seniorChecklist(c, s.cat, s.notes[c.id]); const open = rows.filter((k) => k.status !== "have" && !(s.verified[c.id] ?? []).includes(k.label)).length; return open ? `${open} item(s) still to ask before you lock this college.` : "Everything checked — you can place this college with confidence."; })()}</p>

          {RESIDENT[c.id] && (() => { const rs = RESIDENT[c.id]; const block = (t: string, x: Resident["hands_on"]) => (
            <div className="param"><b>{t}</b> <ConfTag c={x.confidence} /><p>{x.summary}</p>
              {x.items.length > 0 && <ul className="small">{x.items.map((i, k) => <li key={k}>{i.text} <span className={"src " + i.src}>{i.src}</span>{i.url && <a href={i.url} target="_blank" rel="noopener"> ↗</a>}{i.date && <span className="muted"> · {i.date}</span>}</li>)}</ul>}
            </div>); return (<>
            <h4>What residents, news & department pages say — hands-on and hours</h4>
            {block("Hands-on training", rs.hands_on)}
            {block("Duty hours, calls, culture", rs.hours_culture)}
            {rs.stipend_paid_on_time && <p className="small"><b>Stipend paid on time?</b> {rs.stipend_paid_on_time}</p>}
            <p className="muted small">forum = anonymous residents (weak alone); news = reported; official = college/NMC page; snippet = only the search result text was readable.</p>
          </>); })()}

          <h4>Pros & cons <span className="muted">(official data · hospital site · residents/news · web research)</span></h4>
          <div className="pc">
            <ul className="pros">{allPros(c).length ? allPros(c).map((p, i) => <li key={i}>{p.text} <span className={"src " + p.src}>{p.src}</span>{p.url && <a href={p.url} target="_blank" rel="noopener">↗</a>}</li>) : <li className="muted">Nothing found</li>}</ul>
            <ul className="cons">{allCons(c).length ? allCons(c).map((p, i) => <li key={i}>{p.text} <span className={"src " + p.src}>{p.src}</span>{p.url && <a href={p.url} target="_blank" rel="noopener">↗</a>}</li>) : <li className="muted">Nothing found</li>}</ul>
          </div>
          {SITES[c.id] && SITES[c.id].site_status !== "no_site" && (() => { const st = SITES[c.id]; return (<>
            <h4>Hospital website check <span className="muted">({st.site_status})</span></h4>
            <div className="kv">
              <span>Departments shown</span><span>{st.departments.length ? st.departments.join(", ") + (st.generic_claim ? " (generic claim page)" : "") : "None listed"}</span>
              {(st.icu_beds || st.ot_count || st.beds) && <><span>ICU / OT / beds</span><span>{[st.icu_beds && `ICU ${st.icu_beds}`, st.ot_count && `OT ${st.ot_count}`, st.beds && `${st.beds} beds`].filter(Boolean).join(" · ")}</span></>}
              {st.anaesthesia_dept && (st.anaesthesia_dept.faculty || st.anaesthesia_dept.services.length || st.anaesthesia_dept.notes) && <><span>Anaesthesia dept</span><span>{[st.anaesthesia_dept.faculty && `faculty: ${st.anaesthesia_dept.faculty}`, st.anaesthesia_dept.pg_seats && `PG seats: ${st.anaesthesia_dept.pg_seats}`, st.anaesthesia_dept.services.length && `services: ${st.anaesthesia_dept.services.join(", ")}`, st.anaesthesia_dept.simulation_or_workshops, st.anaesthesia_dept.notes].filter(Boolean).join(" · ")} {st.anaesthesia_dept.url && <a href={st.anaesthesia_dept.url} target="_blank" rel="noopener">page ↗</a>}</span></>}
              {st.hostel && <><span>Hostel</span><span>{st.hostel}</span></>}
              {st.academics && <><span>Academics</span><span>{st.academics}</span></>}
              <span>Sources</span><span>{st.sources.slice(0, 5).map((u, i) => <a key={i} href={u} target="_blank" rel="noopener">[{i + 1}] </a>)}</span>
            </div>
          </>); })()}

          {r && (<>
            <h4>Your 5 priorities — what the research found</h4>
            {params(c).filter(([k]) => k !== "bond").map(([k, label, f]) => {
              const p = r[f] as Param;
              return (<div key={k} className="param"><b>{label}</b> <ConfTag c={p.confidence} /><p>{p.summary}</p>
                {p.available?.length ? <div className="chips">{p.available.map((a) => <span key={a}>{a}</span>)}</div> : null}</div>);
            })}

            {r.missing.length > 0 && (<>
              <h4>Still missing — ask seniors / the college <span className="muted">({done.length}/{r.missing.length})</span></h4>
              <ul className="todo">{r.missing.map((m, i) => (
                <li key={i}><label><input type="checkbox" checked={done.includes(i)} onChange={() => tick(c.id, i)} /> {m}</label></li>))}</ul>
            </>)}
          </>)}
          {!r && <p className="note">No online research for this college (its 2025 closing is far from your AIR). Official summary: <Html h={c.ss} /></p>}

          <h4>My ratings <span className="muted">(1–5, after talking to seniors)</span></h4>
          <div className="rate">
            {params(c).map(([k, label]) => (
              <label key={k}>{label}
                <span className="stars">{[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className={(s.ratings[c.id]?.[k] ?? 0) >= n ? "on" : ""} onClick={() => rate(c.id, k, s.ratings[c.id]?.[k] === n ? 0 : n)}>{n}</button>))}
                </span>
              </label>))}
          </div>
          <textarea placeholder="My notes (senior feedback, stipend actually paid, duty hours…)" value={s.notes[c.id] ?? ""}
            onChange={(e) => up({ notes: { ...s.notes, [c.id]: e.target.value } })} />
        </aside>
      </div>
    );
  };

  const st = strategy(list?.items ?? [], s.air, s.cat);
  const cmp = s.compare.map((id) => BY_ID.get(id)).filter(Boolean) as College[];

  return (
    <main>
      <header className="top">
        <div className="brand">
          <h1>Anaesthesia PG Choice Planner</h1>
          <span className="muted">NEET-PG 2026 · MD / DNB · {COLLEGES.length} seats · official 2024–25 cutoffs</span>
        </div>
        <div className="profile">
          <label>AIR <input type="number" min={1} value={s.air} onChange={(e) => up({ air: Math.max(1, +e.target.value || 1) })} /></label>
          <label>Category <select value={s.cat} onChange={(e) => up({ cat: e.target.value as Store["cat"] })}><option>OBC</option><option>Open</option></select></label>
          <label>Priorities <select value={set.id} onChange={(e) => up({ activeSet: e.target.value })}>{s.sets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <details className="weights"><summary>Weights</summary>
            {CRITS.map(([k, label]) => (
              <label key={k} className="w">{label} <input type="range" min={0} max={50} value={w[k]} onChange={(e) => setWeights(k, +e.target.value)} /> <b>{w[k]}</b></label>))}
            <div className="row-btns">
              <button onClick={() => { const n = prompt("Name for new priority set", set.name + " (copy)"); if (n) { const id = "p" + Date.now(); up({ sets: [...s.sets, { id, name: n, weights: { ...w } }], activeSet: id }); } }}>Save as new</button>
              <button onClick={() => { const n = prompt("Rename priority set", set.name); if (n) up({ sets: s.sets.map((x) => (x.id === set.id ? { ...x, name: n } : x)) }); }}>Rename</button>
              <button onClick={() => { if (s.sets.length > 1 && confirm(`Delete “${set.name}”?`)) { const r = s.sets.filter((x) => x.id !== set.id); up({ sets: r, activeSet: r[0].id }); } }}>Delete</button>
            </div>
          </details>
          <details className="weights sync"><summary>{readOnly ? "👁 Shared view" : syncSecret ? "☁ Sync on" : "☁ Sync / share"}</summary>
            {readOnly ? <p className="small">{syncMsg} <br />Open the site without <code>?view=</code> to use your own planner.</p> : (<>
              <p className="small muted">Use the same sync code on every device to see the same lists. Share the read-only link with anyone.</p>
              <div className="row-btns">
                <input type="text" placeholder="sync code (≥8 chars, keep it secret)" value={syncSecret} onChange={(e) => setSyncSecret(e.target.value)} style={{ flex: 1 }} />
                <button onClick={() => { const c = Math.random().toString(36).slice(2, 10) + "-" + Math.random().toString(36).slice(2, 8); setSyncSecret(c); }}>Generate</button>
                <button className="primary" onClick={() => enableSync(syncSecret)}>Enable sync</button>
                {syncId && <button onClick={disableSync}>Turn off</button>}
              </div>
              {syncMsg && <p className="small">{syncMsg}</p>}
              {syncId && (<p className="small">Read-only share link: <code>{`${typeof location !== "undefined" ? location.origin : ""}/?view=${syncId}`}</code> <button onClick={() => navigator.clipboard.writeText(`${location.origin}/?view=${syncId}`)}>Copy</button></p>)}
            </>)}
          </details>
        </div>
        {readOnly && <div className="hint">👁 You are viewing someone's shared lists (read-only). Changes you make here are not saved.</div>}
        <nav>
          {([["explore", "Explore"], ["compare", `Compare (${cmp.length})`], ["saved", `Saved (${saved.length})`], ["lists", `My list (${list?.items.length ?? 0})`], ["ai", "AI ranking"], ["sheet", "Sheet"], ["decide", "Before you decide"]] as const).map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>))}
        </nav>
      </header>

      {tab === "explore" && (<>
        <div className="chances">
          {([["good", "Likely", "reached in both years"], ["ok", "Possible", "reached in 2025"], ["mid", "Borderline", "within 10%"], ["bad", "Unlikely", "not reached"]] as const).map(([k, l, d]) => (
            <button key={k} className={"chance " + k + (fChance.includes(k) ? " on" : "")} onClick={() => setFChance(flip(fChance, k))}>
              <b>{counts[k]}</b><span>{l}</span><small>{d}</small>
            </button>))}
        </div>
        <div className="filters">
          <input type="search" placeholder="Search college, city or state…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={fCoun} onChange={(e) => setFCoun(e.target.value)}><option value="">MCC + Maharashtra</option><option value="MCC">MCC (AIQ / deemed / DNB)</option><option value="MH-CET">Maharashtra state quota</option></select>
          {multi("States", fState, states.map((x) => [x, x]), setFState)}
          {multi("College type", fKind, Object.entries(TYPE_LABEL), setFKind)}
          {multi("Verdicts", fVerdict, VERDICT_ORDER.map((v) => [v, v]), setFVerdict)}
          {multi("For you", fRec, [["Put high", "Put high"], ["Backup only", "Backup only"], ["Leave out", "Leave out"]], setFRec)}
          <span className="rankf"><small>2025 closing AIR</small><input type="number" placeholder="from" value={rk.min} onChange={(e) => setRk({ ...rk, min: e.target.value })} /><input type="number" placeholder="to" value={rk.max} onChange={(e) => setRk({ ...rk, max: e.target.value })} />
            <select value={rk.round} onChange={(e) => setRk({ ...rk, round: e.target.value })} title="Reached your AIR by this round in 2025"><option value="">any round</option><option value="R1">reached by R1</option><option value="R2">by R2</option><option value="R3">by R3</option><option value="Stray">by Stray</option></select></span>
          {(fState.length || fKind.length || fVerdict.length || fRec.length || fChance.length || rk.min || rk.max || rk.round) ? <button className="ghost" onClick={() => { setFState([]); setFKind([]); setFVerdict([]); setFRec([]); setFChance([]); setRk({ min: "", max: "", round: "" }); }}>Clear filters</button> : null}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="deep">Sort: easiest to get</option><option value="state">Sort: my state order</option>
            <option value="score">Sort: my score</option><option value="verdict">Sort: best verdict</option><option value="pros">Sort: more pros than cons</option><option value="name">Sort: A–Z</option>
          </select>
          <label className="chk"><input type="checkbox" checked={onlyResearched} onChange={(e) => setOnlyResearched(e.target.checked)} /> Researched only</label>
          <label className="chk"><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /> ★ Saved only</label>
          <select value={list?.id} onChange={(e) => up({ active: e.target.value })} title="List that “+ Add” puts colleges into">
            {s.lists.map((l) => <option key={l.id} value={l.id}>Adding to: {l.name}</option>)}
          </select>
        </div>
        <p className="legend muted">
          Closing AIR cells: <span className="cell-key hit">filled</span> = your AIR was reached · <span className="cell-key near">dashed</span> = within 10%. Tap a college for pros, cons, the five priorities and official bond documents.
        </p>
        <div className="grid">{rows.slice(0, limit).map((c) => <div key={c.id} className="gcell">{card(c)}</div>)}</div>
        {rows.length > limit && <button className="more" onClick={() => setLimit(limit + 60)}>Show more ({rows.length - limit} left)</button>}
        {rows.length === 0 && <p className="muted">No colleges match these filters.</p>}
      </>)}

      {tab === "compare" && (
        cmp.length === 0 ? <p className="empty">Tap <b>Compare</b> on up to 6 colleges in Explore to see them side by side.</p> : (
          <div className="cmpwrap"><table className="cmp">
            <thead><tr><th></th>{cmp.map((c) => <th key={c.id}><b onClick={() => setOpen(c.id)}>{shortName(c)}</b><br /><span className="muted">{c.state}</span><br /><button onClick={() => toggleCompare(c.id)}>Remove</button></th>)}</tr></thead>
            <tbody>
              <tr><th>Verdict</th>{cmp.map((c) => { const v = verdictOf(c); return <td key={c.id} className={"v-" + verdictKey(v.verdict)}><b>{v.verdict}</b><br /><small>{v.headline}</small></td>; })}</tr>
              <tr><th>For you</th>{cmp.map((c) => { const d = recommendation(c); return <td key={c.id} className={"r-" + REC_KEY[d.rec]}><b>{d.rec}</b><br /><small>{d.rec_why}</small></td>; })}</tr>
              <tr><th>5 priorities</th>{cmp.map((c) => <td key={c.id}><div className="plabels">{priorityLabels(c).map((l) => <span key={l.n} className={"pl " + l.level} title={l.tip}><small>{l.n} {l.key}</small>{l.label}</span>)}</div></td>)}</tr>
              <tr><th>Seat type</th>{cmp.map((c) => <td key={c.id}>{c.kindLabel}</td>)}</tr>
              <tr><th>Chance</th>{cmp.map((c) => { const ch = chance(c, s.air, s.cat); return <td key={c.id}><span className={"pill " + ch.k}>{ch.short}</span><br /><small>{ch.t}</small></td>; })}</tr>
              {ROUNDS.map((r, i) => <tr key={r}><th>2025 {r}</th>{cmp.map((c) => { const v = roundClose(c, "2025", s.cat)[i]; return <td key={c.id} className={cellCls(v)}>{fmt(v)}</td>; })}</tr>)}
              <tr><th>2024 deepest</th>{cmp.map((c) => { const v = deepest(c, "2024", s.cat); return <td key={c.id} className={cellCls(v)}>{fmt(v)}</td>; })}</tr>
              <tr><th>Fee / year</th>{cmp.map((c) => <td key={c.id} title={fee(c) ?? ""}>{money(fee(c)) ?? "?"}</td>)}</tr>
              <tr><th>Stipend yr 1</th>{cmp.map((c) => <td key={c.id} title={stipend(c) ?? ""}>{money(stipend(c)) ?? "?"}</td>)}</tr>
              <tr><th>Beds</th>{cmp.map((c) => <td key={c.id} title={RESEARCH[c.id]?.beds ?? ""}>{beds(c) ?? "?"}</td>)}</tr>
              <tr><th>Service bond</th>{cmp.map((c) => <td key={c.id}>{bondShort(c)}</td>)}</tr>
              <tr><th>Leaving penalty</th>{cmp.map((c) => <td key={c.id} className="small">{strip(c.penalty).split(";")[0]}</td>)}</tr>
              {CRITS.filter(([k]) => k !== "bond").map(([k, label, f]) => (
                <tr key={k}><th>{label}</th>{cmp.map((c) => { const p = RESEARCH[c.id]?.[f] as Param | undefined;
                  return <td key={c.id} className="small">{k === "dnb" && !isDnb(c) ? "n/a (MD)" : p ? <><ConfTag c={p.confidence} /> {p.summary}</> : "Not researched"}</td>; })}</tr>))}
              <tr><th>Pros</th>{cmp.map((c) => <td key={c.id} className="small"><ul className="pros">{RESEARCH[c.id]?.pros.slice(0, 4).map((p, i) => <li key={i}>{p.text}</li>)}</ul></td>)}</tr>
              <tr><th>Cons</th>{cmp.map((c) => <td key={c.id} className="small"><ul className="cons">{RESEARCH[c.id]?.cons.slice(0, 4).map((p, i) => <li key={i}>{p.text}</li>)}</ul></td>)}</tr>
              <tr><th>Missing evidence</th>{cmp.map((c) => <td key={c.id}>{gaps(c) ?? "–"} of {params(c).length} priorities</td>)}</tr>
              <tr><th>My score</th>{cmp.map((c) => <td key={c.id}><b>{myScore(c) ?? "unrated"}</b></td>)}</tr>
              <tr><th></th>{cmp.map((c) => <td key={c.id}><button className={"primary" + (inList.has(c.id) ? " added" : "")} onClick={() => toggle(c.id)}>{inList.has(c.id) ? "In list ✓" : "+ Add to list"}</button></td>)}</tr>
            </tbody>
          </table></div>
        )
      )}

      {tab === "saved" && (
        <div className="savedwrap">
          <section className="strategy">
            <h2>Saved for later <span className="muted">({saved.length})</span></h2>
            <p className="muted small">Colleges you're considering but haven't placed in a list. Add them to “{list?.name}” when you decide, or remove them. Nothing here goes into counselling.</p>
          </section>
          {saved.length === 0 ? <p className="empty">Nothing saved yet — tap ☆ Save on any college in Explore.</p> : (
            <div className="ltwrap"><table className="lt">
              <thead><tr><th>College</th><th>Type</th><th>Verdict</th><th>Chance</th><th className="num">2025 closing</th><th>Fee / yr</th><th>Stipend</th><th>Bond</th><th></th></tr></thead>
              <tbody>{saved.map((id) => { const c = BY_ID.get(id); if (!c) return null; const ch = chance(c, s.air, s.cat); const v = verdictOf(c); const d = deepest(c, "2025", s.cat); return (
                <tr key={id}>
                  <td className="cn"><b onClick={() => setOpen(id)}>{shortName(c)}</b><small>{[place(c), c.state].filter(Boolean).join(", ")}</small></td>
                  <td className="small">{typeLabel(c)}</td>
                  <td><span className={"vtag v-" + verdictKey(v.verdict)} title={v.headline}>{v.verdict}</span></td>
                  <td><span className={"pill " + ch.k} title={ch.t}>{ch.short}</span></td>
                  <td className={"num " + cellCls(d || null)}>{fmt(d)}</td>
                  <td title={fee(c) ?? ""}>{money(fee(c)) ?? "?"}</td><td title={stipend(c) ?? ""}>{money(stipend(c)) ?? "?"}</td>
                  <td className="bond" title={bondShort(c)}>{bondShort(c)}</td>
                  <td className="acts"><button className={"primary" + (inList.has(id) ? " added" : "")} onClick={() => toggle(id)}>{inList.has(id) ? "In list ✓" : "+ Add to list"}</button><button onClick={() => setOpen(id)} title="Details">ⓘ</button><button onClick={() => toggleSave(id)} title="Remove from saved">✕</button></td>
                </tr>); })}</tbody>
            </table></div>)}
        </div>
      )}

      {tab === "lists" && list && (<>
        <div className="filters">
          <select value={list.id} onChange={(e) => up({ active: e.target.value })}>{s.lists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.items.length})</option>)}</select>
          <button className="primary" onClick={() => {
            if (!confirm("Create / replace the two auto lists (MCC and Maharashtra state) using your priorities and state order?")) return;
            const mk = (id: string, name: string, items: string[]) => ({ id, name, items });
            const auto = [mk("auto-mcc", "Auto: MCC (AIQ / deemed / DNB)", autoList("MCC", s.air, s.cat, w, prefs)), ...(prefs.mhEligible === "no" ? [] : [mk("auto-mh", "Auto: Maharashtra state quota", autoList("MH-CET", s.air, s.cat, w, prefs))])];
            up({ lists: [...auto, ...s.lists.filter((l) => !l.id.startsWith("auto-"))], active: "auto-mcc" });
          }}>Auto-build my lists</button>
          <button onClick={() => { const n = prompt("New list name"); if (n) { const id = "l" + Date.now(); up({ lists: [...s.lists, { id, name: n, items: [] }], active: id }); } }}>+ New list</button>
          <button onClick={() => { const n = prompt("Rename list", list.name); if (n) up({ lists: s.lists.map((l) => (l.id === list.id ? { ...l, name: n } : l)) }); }}>Rename</button>
          <button onClick={() => { const id = "l" + Date.now(); up({ lists: [...s.lists, { id, name: list.name + " (copy)", items: [...list.items] }], active: id }); }}>Duplicate</button>
          <button onClick={() => { if (s.lists.length > 1 && confirm(`Delete “${list.name}”?`)) { const r = s.lists.filter((l) => l.id !== list.id); up({ lists: r, active: r[0].id }); } }}>Delete</button>
          <button onClick={() => confirm(`Reorder by your score (“${set.name}”)?`) && setItems([...list.items].sort(byScore))}>Sort by my score</button>
          <button onClick={exportCsv}>Export CSV</button>
          <button onClick={() => navigator.clipboard.writeText(list.items.map((id, i) => `${i + 1}. ${BY_ID.get(id)?.name}`).join("\n"))}>Copy order</button>
          <button onClick={() => download("neetpg-planner-backup.json", JSON.stringify(s), "application/json")}>Backup</button>
          <label className="btn">Restore<input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} /></label>
        </div>
        <section className="builder">
          <h2>Build my list — what the list depends on</h2>
          <p className="muted small">Fill these once; “Auto-build my lists” uses them, and any college that breaks a rule shows why. Your AIR and category are in the header.</p>
          <div className="bgrid">
            <label>Maharashtra state quota eligible? (MBBS in MH, or AIQ/central seat + MH domicile)
              <select value={prefs.mhEligible} onChange={(e) => setPrefs({ mhEligible: e.target.value as Prefs["mhEligible"] })}><option value="unknown">Not sure yet</option><option value="yes">Yes</option><option value="no">No — MCC only</option></select></label>
            <label>Fee budget per year (₹ lakh; blank = no limit)
              <input type="number" min={0} step={0.5} value={prefs.budgetPerYear ? prefs.budgetPerYear / 1e5 : ""} onChange={(e) => setPrefs({ budgetPerYear: e.target.value ? +e.target.value * 1e5 : null })} placeholder="e.g. 15" /></label>
            <label>DNB acceptable?
              <select value={prefs.dnbOk ? "yes" : "no"} onChange={(e) => setPrefs({ dnbOk: e.target.value === "yes" })}><option value="yes">Yes — MD or DNB</option><option value="no">No — MD only</option></select></label>
            <label>Maximum service bond I accept (years)
              <select value={prefs.maxBondYears} onChange={(e) => setPrefs({ maxBondYears: +e.target.value })}><option value={0}>None</option><option value={1}>1 year</option><option value={2}>2 years</option><option value={5}>Any</option></select></label>
            <label>Minimum stipend (₹/month; blank = none)
              <input type="number" min={0} step={1000} value={prefs.minStipend ?? ""} onChange={(e) => setPrefs({ minStipend: e.target.value ? +e.target.value : null })} placeholder="e.g. 43000" /></label>
            <label>Only these states (blank = all states, in your order: Delhi, Maharashtra, UP, MP, Gujarat, Rajasthan, then the rest, J&K last)
              {multi("States allowed", prefs.states, states.map((x) => [x, x]), (v) => setPrefs({ states: v }))}</label>
          </div>
          <details><summary className="muted small">What you need before the list is final (documents & decisions)</summary>
            <ul className="needs">
              <li>NEET-PG 2026 scorecard: exact AIR and score</li><li>Central-list OBC-NCL certificate (FY 2025-26 income, MCC annexure format)</li>
              <li>Maharashtra caste certificate + caste validity + state NCL (only for MH quota)</li><li>MBBS college, admission quota and internship completion date</li>
              <li>Domicile certificate (if MBBS outside Maharashtra on AIQ/central seat)</li><li>Family decision on fee budget (×3 years + hostel + deposits)</li>
              <li>Decision: DNB acceptable or MD only</li><li>Decision: maximum bond years / penalty you would sign</li>
              <li>Bank: MCC deposit (₹10k OBC / ₹2 L deemed) and state deposit ready</li><li>Seniors spoken to for each top-10 choice (hands-on & hours)</li>
              <li>Read the Round 3 rule: a joined Round 3 seat cannot be resigned</li><li>Backup copy of this planner (My list → Backup)</li>
            </ul>
          </details>
        </section>
        <section className="strategy">
          <div className="mix">
            {(["good", "ok", "mid", "bad"] as const).map((k) => <span key={k} className={"pill " + k}>{st.count[k]} {{ good: "Likely", ok: "Possible", mid: "Borderline", bad: "Unlikely" }[k]}</span>)}
          </div>
          {(() => { const ex = list.items.filter((id) => BY_ID.get(id) && excludedBy(BY_ID.get(id)!, prefs)).length; return ex ? <p className="small"><b>⚠ {ex} choice(s) break your own rules</b> (budget / DNB / bond / eligibility) — marked in the table.</p> : null; })()}
          {st.warn.length ? <ul>{st.warn.map((x) => <li key={x}>{x}</li>)}</ul> : list.items.length > 0 && <p className="muted">List mix looks healthy.</p>}
          <p className="muted small"><b>Auto lists</b> = verdict “Join, after checks” first, then “Backup only”; within each, your state order (Delhi → Maharashtra → UP → MP → Gujarat → Rajasthan → everything else, J&amp;K last), then the evidence score from your 5 priorities. “Avoid” and out-of-reach seats are left out — reorder freely.</p>
          <p className="muted small">Order by <b>preference</b>: counselling gives you the highest choice that's still available, so a dream college at #1 never hurts. Grab the ⠿ handle to drag a row, use ▲ ▼, or type a position number. Click a college name for full details.</p>
        </section>
        {list.items.length === 0 && <p className="empty">Empty list — add colleges from Explore or Compare.</p>}
        <p className="hint">⠿ <b>Drag any row or card by its handle to reorder</b> — or use ▲ ▼ / ◀ ▶, or type a position number. The order you see is your counselling choice order.</p>
        <div className="viewtoggle">
          <button className={listView === "rows" ? "on" : ""} onClick={() => setListView("rows")}>☰ Ranked table</button>
          <button className={listView === "cards" ? "on" : ""} onClick={() => setListView("cards")}>▦ Cards</button>
        </div>
        <div className="lfilters">
          {multi("State", lf.state, states.map((x) => [x, x]), (v) => setLf({ ...lf, state: v }))}
          {multi("College type", lf.kind, Object.entries(TYPE_LABEL), (v) => setLf({ ...lf, kind: v }))}
          {multi("Verdict", lf.verdict, VERDICT_ORDER.map((v) => [v, v]), (v) => setLf({ ...lf, verdict: v }))}
          {multi("Chance", lf.chance, [["good", "Likely"], ["ok", "Possible"], ["mid", "Borderline"], ["bad", "Unlikely"]], (v) => setLf({ ...lf, chance: v }))}
          <span className="rankf"><small>2025 closing</small><input type="number" placeholder="from" value={lf.min} onChange={(e) => setLf({ ...lf, min: e.target.value })} /><input type="number" placeholder="to" value={lf.max} onChange={(e) => setLf({ ...lf, max: e.target.value })} /></span>
          {(lf.state.length || lf.kind.length || lf.verdict.length || lf.chance.length || lf.min || lf.max) ? <button className="ghost" onClick={() => setLf({ state: [], kind: [], verdict: [], chance: [], min: "", max: "" })}>Clear</button> : null}
          <select onChange={(e) => { const k = e.target.value; e.target.value = ""; if (!k) return; const sorters: Record<string, (a: string, b: string) => number> = {
              chance: (a, b) => ["good", "ok", "mid", "bad"].indexOf(chance(BY_ID.get(a)!, s.air, s.cat).k) - ["good", "ok", "mid", "bad"].indexOf(chance(BY_ID.get(b)!, s.air, s.cat).k),
              verdict: (a, b) => VERDICT_ORDER.indexOf(verdictOf(BY_ID.get(a)!).verdict) - VERDICT_ORDER.indexOf(verdictOf(BY_ID.get(b)!).verdict),
              fee: (a, b) => (feeNum(BY_ID.get(a)!) ?? 9e9) - (feeNum(BY_ID.get(b)!) ?? 9e9),
              stipend: (a, b) => (stipendNum(BY_ID.get(b)!) ?? 0) - (stipendNum(BY_ID.get(a)!) ?? 0),
              score: (a, b) => autoScore(BY_ID.get(b)!, w) - autoScore(BY_ID.get(a)!, w),
              state: (a, b) => STATE_ORDER.indexOf(BY_ID.get(a)!.state) - STATE_ORDER.indexOf(BY_ID.get(b)!.state),
              bond: (a, b) => (bondYears(BY_ID.get(a)!) ?? 9) - (bondYears(BY_ID.get(b)!) ?? 9),
              mine: byScore };
            if (confirm("Reorder the whole list by " + k + "? (your manual order will be replaced)")) setItems([...list.items].sort(sorters[k])); }}>
            <option value="">Sort list by…</option><option value="chance">Chance (likely first)</option><option value="verdict">Verdict (best first)</option><option value="state">My state order</option>
            <option value="fee">Fee (lowest first)</option><option value="stipend">Stipend (highest first)</option><option value="bond">Bond (lightest first)</option><option value="score">Evidence score</option><option value="mine">My ratings score</option>
          </select>
          <span className="muted small">Filters only hide rows; sort rewrites the order.</span>
        </div>
        {listView === "rows" && list.items.length > 0 && (
          <div className="ltwrap"><table className="lt">
            <thead><tr><th></th><th>#</th><th>College</th><th>Type</th><th>Verdict</th><th>Chance</th><th>5 priorities</th><th className="num">2025 R1</th><th className="num">R2</th><th className="num">R3</th><th className="num">Stray</th><th>Fee / yr</th><th>Stipend</th><th>Bond</th><th className="num">Score</th><th></th></tr></thead>
            <tbody>
              {list.items.map((id, i) => {
                const c = BY_ID.get(id); if (!c) return null;
                const ch = chance(c, s.air, s.cat); const v = verdictOf(c); const prev = i > 0 ? BY_ID.get(list.items[i - 1])?.state : null;
                if ((lf.state.length && !lf.state.includes(c.state)) || (lf.kind.length && !lf.kind.includes(c.kind)) || (lf.verdict.length && !lf.verdict.includes(v.verdict)) || (lf.chance.length && !lf.chance.includes(ch.k)) || (lf.min && deepest(c, "2025", s.cat) < +lf.min) || (lf.max && deepest(c, "2025", s.cat) > +lf.max)) return null;
                const ex = excludedBy(c, prefs);
                return (<Fragment key={id}>
                  {prev !== c.state && <tr className="stateh"><td colSpan={16}>{c.state}</td></tr>}
                  <tr className={(drag === i ? "dragging" : "") + (over === i && drag !== null && drag !== i ? " over" : "")} draggable
                    onDragStart={() => setDrag(i)} onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver(null)}
                    onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); setOver(null); }} onDragEnd={() => { setDrag(null); setOver(null); }}>
                    <td className="hcell"><span className="handle" title="Drag to reorder">⠿</span></td>
                    <td><input className="pos" type="number" min={1} max={list.items.length} value={i + 1} onChange={(e) => move(i, Math.min(list.items.length, Math.max(1, +e.target.value || 1)) - 1)} /></td>
                    <td className="cn"><b onClick={() => setOpen(id)}>{shortName(c)}</b><small>{place(c)}{ex && <> · <b>⚠ {ex}</b></>}</small></td>
                    <td className="small">{typeLabel(c)}</td>
                    <td><span className={"vtag v-" + verdictKey(v.verdict)} title={v.headline}>{v.verdict}</span></td>
                    <td><span className={"pill " + ch.k} title={ch.t}>{ch.short}</span></td>
                    <td><div className="plabels mini">{priorityLabels(c).map((l) => <span key={l.n} className={"pl " + l.level} title={`${l.n}. ${l.key}: ${l.tip}`}>{l.n}·{l.label}</span>)}</div></td>
                    {roundClose(c, "2025", s.cat).map((x, j) => <td key={j} className={"num " + cellCls(x)}>{fmt(x)}</td>)}
                    <td title={fee(c) ?? ""}>{money(fee(c)) ?? "?"}</td>
                    <td title={stipend(c) ?? ""}>{money(stipend(c)) ?? "?"}</td>
                    <td className="bond" title={bondShort(c)}>{bondShort(c)}</td>
                    <td className="num">{autoScore(c, w)}</td>
                    <td className="acts"><button onClick={() => move(i, i - 1)} title="Up">▲</button><button onClick={() => move(i, i + 1)} title="Down">▼</button><button onClick={() => setOpen(id)} title="Details">ⓘ</button><button onClick={() => toggle(id)} title="Remove">✕</button></td>
                  </tr>
                </Fragment>);
              })}
            </tbody>
          </table></div>
        )}
        {listView === "cards" && (
          <div className="hlist">
          {list.items.map((id, i) => {
            const c = BY_ID.get(id); if (!c) return null;
            if ((lf.state.length && !lf.state.includes(c.state)) || (lf.kind.length && !lf.kind.includes(c.kind)) || (lf.verdict.length && !lf.verdict.includes(verdictOf(c).verdict)) || (lf.chance.length && !lf.chance.includes(chance(c, s.air, s.cat).k)) || (lf.min && deepest(c, "2025", s.cat) < +lf.min) || (lf.max && deepest(c, "2025", s.cat) > +lf.max)) return null;
            return (
              <div key={id} className={"slot" + (drag === i ? " dragging" : "") + (over === i && drag !== null && drag !== i ? " over" : "")} draggable
                onDragStart={() => setDrag(i)} onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver(null)}
                onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); setOver(null); }} onDragEnd={() => { setDrag(null); setOver(null); }}>
                <div className="cardhandle" title="Drag to reorder">⠿ drag to reorder · #{i + 1}</div>
                {card(c, <>
                  <input className="pos" type="number" min={1} max={list.items.length} value={i + 1} title="Type a position to move"
                    onChange={(e) => move(i, Math.min(list.items.length, Math.max(1, +e.target.value || 1)) - 1)} />
                  <button onClick={() => move(i, i - 1)} title="Move left">◀</button>
                  <button onClick={() => move(i, i + 1)} title="Move right">▶</button>
                  <button onClick={() => setOpen(id)}>Details</button>
                  <button onClick={() => toggle(id)} title="Remove from list">✕</button>
                </>)}
              </div>);
          })}
          </div>
        )}
      </>)}

      {tab === "ai" && (() => {
        const mcc = aiRank("MCC", s.air, s.cat, prefs, stateWeight); const mh = prefs.mhEligible === "no" ? [] : aiRank("MH-CET", s.air, s.cat, prefs, stateWeight);
        const useAs = (name: string, recs: typeof mcc) => { if (!confirm(`Create list “${name}” with these ${recs.length} colleges in this order?`)) return; const id = "ai-" + Date.now(); up({ lists: [{ id, name, items: recs.map((r) => r.id) }, ...s.lists], active: id }); setTab("lists"); };
        const block = (title: string, recs: typeof mcc, listName: string) => (
          <section className="panel">
            <div className="row-btns" style={{ justifyContent: "space-between", alignItems: "center" }}><h2>{title} <span className="muted">({recs.length})</span></h2>{recs.length > 0 && <button className="primary" onClick={() => useAs(listName, recs)}>Use as my list</button>}</div>
            {recs.length === 0 && <p className="muted">Nothing qualifies under your current rules (Build my list) at this AIR.</p>}
            <div className="ltwrap"><table className="lt airank"><thead><tr><th>#</th><th>College</th><th>Tier</th><th className="num">Score</th><th>Why it is here</th><th>Check before locking</th></tr></thead><tbody>
              {recs.map((r, i) => { const c = BY_ID.get(r.id)!; const ch = chance(c, s.air, s.cat); return (
                <tr key={r.id}><td className="num"><b>{i + 1}</b></td>
                  <td className="cn"><b onClick={() => setOpen(r.id)}>{shortName(c)}</b><small>{[place(c), c.state].filter(Boolean).join(", ")} · {typeLabel(c)}</small><br /><span className={"tag " + ch.k}>{ch.short}</span> <span className={"tag v-" + verdictKey(verdictOf(c).verdict)}>{verdictOf(c).verdict}</span><div className="plabels mini">{priorityLabels(c).map((l) => <span key={l.n} className={"pl " + l.level} title={`${l.n}. ${l.key}: ${l.tip}`}>{l.n}·{l.label}</span>)}</div></td>
                  <td><span className={"tag " + (r.tier === "Safe" ? "good" : r.tier === "Core" ? "ok" : "mid")}>{r.tier}</span></td>
                  <td className="num">{r.score}</td>
                  <td className="small"><ul className="pros">{r.why.map((w, k) => <li key={k}>{w}</li>)}</ul></td>
                  <td className="small"><ul className="cons">{r.watch.map((w, k) => <li key={k}>{w}</li>)}</ul></td></tr>); })}
            </tbody></table></div>
          </section>);
        return (
          <div className="decide">
            <section className="panel">
              <h2>AI recommended ranking — how it was decided</h2>
              <p>Every college still in reach (closed within 10% of your AIR in 2025) and not “Avoid” is scored on <b>your five priorities in your order</b>, then ordered by score. The list is in <b>preference order</b>, not probability order — counselling gives the highest choice still available, so a “Dream” pick at #1 costs nothing, and the “Safe” picks lower down protect you.</p>
              <ul>
                <li><b>1. Super-speciality (up to 40 points)</b> — official DM/MCh/DNB-SS courses listed by MCC for 2025 count most (a running course proves the department exists); hospital-site or research claims count less.</li>
                <li><b>2. Hands-on (up to 20)</b> — resident/alumni/department evidence; wording like “observe only” or “consultant-led” scores low.</li>
                <li><b>3. Hours &amp; toxicity (up to 20)</b> — documented harassment, suicides, strikes or unpaid stipend pull the score down hard.</li>
                <li><b>4. DNB pass rate</b> — never published per institute, so it is neutral and listed as a question to ask.</li>
                <li><b>5. Bond (up to 10)</b> — no bond 10, one year 6, two or more 2. Fees above ₹12 L/yr and stipends under ₹50k are flagged; “Backup only” verdicts lose 12.</li>
                <li>Your state order (Delhi → Maharashtra → UP → MP → Gujarat → Rajasthan → rest, J&amp;K last) adds points set by the slider below. Your rules in <b>Build my list</b> (budget, DNB, bond, eligibility) are applied first.</li>
              </ul>
              <label className="w" style={{ maxWidth: 520 }}>How much should your state order matter? <input type="range" min={0} max={40} value={stateWeight} onChange={(e) => setStateWeight(+e.target.value)} /> <b>{stateWeight === 0 ? "evidence only" : stateWeight <= 10 ? "tie-break" : stateWeight <= 25 ? "balanced" : "state first"}</b></label>
              <p className="muted small">Tiers: <b>Safe</b> = reached your AIR in both 2024 and 2025 · <b>Core</b> = reached in 2025 only · <b>Dream</b> = within 10% of the 2025 closing. Scores change when you edit your rules or AIR. The “Check before locking” column is what only seniors or the college can answer.</p>
            </section>
            {block("MCC counselling (AIQ · deemed · DNB)", mcc, "AI: MCC")}
            {prefs.mhEligible !== "no" && block("Maharashtra state quota (only if you are eligible)", mh, "AI: Maharashtra state")}
          </div>);
      })()}

      {tab === "sheet" && (() => {
        const cols = ["Bond", "Stipend", "Hands on", "Multispeciality exposure", "Toxicity (resignations / suicides / unknown deaths)", "Working hours / day", "ICU posting hrs / week"];
        const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const csv = () => { const lines = [["State", "College", "Verdict", "For you", "Chance", "2025 closing", ...cols].map(esc).join(",")];
          for (const st of SHEET_STATES) for (const row of SHEET.filter((x) => x.state === st)) { const c = row.id ? BY_ID.get(row.id) : null; const d = c ? sheetRow(c) : null; const L = c ? priorityLabels(c) : null;
            lines.push([st, row.given, c ? verdictOf(c).verdict : "", c ? recommendation(c).rec : "", c ? chance(c, s.air, s.cat).short : "", c ? deepest(c, "2025", s.cat) : "",
              d && `${L![4].label} — ${d.bond}`, d?.stipend, d && `${L![1].label} — ${d.hands}`, d && `${L![0].label} — ${d.multi}`, d && `${L![2].label} — ${d.tox}`, d?.hours, d?.icu].map(esc).join(",")); }
          download("shortlist-sheet.csv", lines.join("\n"), "text/csv"); };
        const cell = (l: ReturnType<typeof priorityLabels>[number] | null, text: string) => (<td className="small cell-text">{l && <span className={"pl inline " + l.level} title={l.tip}>{l.label}</span>}{text && <div>{text}</div>}</td>);
        const counts = { join: 0, check: 0, backup: 0, avoid: 0, na: 0 };
        SHEET.forEach((row) => { const c = row.id ? BY_ID.get(row.id) : null; counts[(c ? verdictKey(verdictOf(c).verdict) : "na") as keyof typeof counts]++; });
        return (
          <div className="decide">
            <section className="strategy">
              <div className="row-btns" style={{ justifyContent: "space-between", alignItems: "center" }}><h2>Shortlist sheet <span className="muted">({SHEET.length} colleges)</span></h2><div className="row-btns"><a className="btn" href="/NEETPG_Anaesthesia_Shortlist_Sheet.xlsx" download>Download Excel</a><button onClick={csv}>Export CSV</button></div></div>
              <div className="mix"><span className="tag v-join">✓ Join {counts.join}</span><span className="tag v-check">Join after checks {counts.check}</span><span className="tag v-backup">Backup only {counts.backup}</span><span className="tag v-avoid">Avoid {counts.avoid}</span><span className="tag v-na">Not assessed / not in data {counts.na}</span></div>
              <p className="muted small">Maharashtra first, then the other states in the order given. Each evidence cell starts with a label (green good · blue acceptable · amber caution · red problem · dashed = unverified) followed by the text found. A blank cell means nothing was verified — not that the answer is "no". Click a name for the full detail panel.</p>
            </section>
            <div className="ltwrap"><table className="lt sheet">
              <thead>
                <tr className="seg"><th colSpan={2}></th><th colSpan={2}>Reach</th><th colSpan={2}>Money &amp; bond</th><th colSpan={2}>Training</th><th colSpan={3}>Daily life</th></tr>
                <tr><th>College</th><th>Verdict · for you</th><th>Chance</th><th className="num">2025 closing</th><th>Bond</th><th>Stipend</th><th>Multispeciality exposure</th><th>Hands on</th><th>Toxicity (resignations / suicides / unknown deaths)</th><th>Working hours / day</th><th>ICU posting hrs / week</th></tr>
              </thead>
              <tbody>{SHEET_STATES.map((st) => (<Fragment key={st}>
                <tr className="stateh"><td colSpan={11}>{st}</td></tr>
                {SHEET.filter((x) => x.state === st).map((row) => { const c = row.id ? BY_ID.get(row.id) : null; const d = c ? sheetRow(c) : null; const L = c ? priorityLabels(c) : null; const v = c ? verdictOf(c) : null; const ch = c ? chance(c, s.air, s.cat) : null; return (
                  <tr key={row.given}>
                    <td className="cn">{c ? <b onClick={() => setOpen(c.id)}>{row.given}</b> : <b className="muted">{row.given}</b>}<small>{c ? `${shortName(c)} · ${typeLabel(c)}` : "not in app data"}</small></td>
                    <td>{v && <><span className={"vtag v-" + verdictKey(v.verdict)} title={v.headline}>{v.verdict}</span><br /><small className={"r-" + REC_KEY[recommendation(c!).rec]} style={{ padding: "1px 6px", borderRadius: 6 }}>{recommendation(c!).rec}</small><div className="small muted" style={{ marginTop: 4, maxWidth: 220 }}>{v.headline}</div></>}</td>
                    <td>{ch && <span className={"pill " + ch.k} title={ch.t}>{ch.short}</span>}</td>
                    <td className={"num " + (c ? cellCls(deepest(c, "2025", s.cat) || null) : "")}>{c ? fmt(deepest(c, "2025", s.cat)) : ""}</td>
                    {d ? (<>
                      {cell(L![4], d.bond)}<td className="small cell-text">{d.stipend}</td>
                      {cell(L![0], d.multi)}{cell(L![1], d.hands)}{cell(L![2], d.tox)}
                      <td className="small cell-text">{d.hours}</td><td className="small cell-text">{d.icu}</td>
                    </>) : [0, 1, 2, 3, 4, 5, 6].map((i) => <td key={i} />)}
                  </tr>); })}
              </Fragment>))}</tbody></table></div>
          </div>);
      })()}

      {tab === "decide" && (
        <div className="decide">
          <section className="panel">
            <h2>How a senior candidate decides — the 10 checks</h2>
            <ol className="method">{SENIOR_METHOD.map((m) => <li key={m.t}><b>{m.t}</b><p>{m.d}</p></li>)}</ol>
            <p className="muted small">Every college's detail panel has this as a live checklist, pre-filled with what the app already knows and what you still have to ask.</p>
          </section>
          <section className="panel">
            <h2>Future scope of Anaesthesiology</h2>
            {FUTURE.sections.length === 0 && <p className="muted">Being researched — appears here when ready.</p>}
            {FUTURE.sections.map((g) => (
              <details key={g.title} className="fs" open>
                <summary><b>{g.title}</b></summary>
                <p>{g.summary}</p>
                <ul>{g.points.map((p, i) => <li key={i}>{p.text} {p.evidence && <span className={"src " + (p.evidence === "official" ? "official" : p.evidence.startsWith("general") ? "general" : "news")}>{p.evidence}</span>} {p.url && <a href={p.url} target="_blank" rel="noopener">↗</a>}</li>)}</ul>
                <div className="two">
                  {g.red_flags.length > 0 && <div><h4>Red flags</h4><ul className="cons">{g.red_flags.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                  {g.ask_seniors.length > 0 && <div><h4>Ask seniors</h4><ul>{g.ask_seniors.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                </div>
              </details>))}
          </section>
          <section className="panel">
            <h2>Checklist before locking choices <span className="muted">({s.prep.length}/{PREP.length})</span></h2>
            <ul className="todo">{PREP.map((p, i) => (
              <li key={i}><label><input type="checkbox" checked={s.prep.includes(i)} onChange={() => up({ prep: s.prep.includes(i) ? s.prep.filter((x) => x !== i) : [...s.prep, i] })} /> {p}</label></li>))}</ul>
          </section>
          <section className="panel">
            <h2>What you must know about each seat — and how much we have</h2>
            <p className="muted">Coverage across the {COV.n} colleges in your reach that were researched online.</p>
            <table className="cov"><thead><tr><th>Detail</th><th>Known</th><th>How to fill the gap</th></tr></thead><tbody>
              {COV.rows.map((r) => (
                <tr key={r.what}><td>{r.what}</td>
                  <td><div className="bar"><span style={{ width: `${(r.have / COV.n) * 100}%` }} /></div><small>{r.have}/{COV.n}</small></td>
                  <td className="small">{r.how}</td></tr>))}
            </tbody></table>
          </section>
          {GUIDE.sections.map((g) => (
            <section key={g.title} className="panel">
              <h2>{g.title}</h2>
              <p>{g.summary}</p>
              <ul>{g.points.map((p, i) => <li key={i}>{p.text} {p.url && <a href={p.url} target="_blank" rel="noopener">source</a>}</li>)}</ul>
              <div className="two">
                {g.red_flags.length > 0 && <div><h4>Red flags</h4><ul className="cons">{g.red_flags.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                {g.ask_seniors.length > 0 && <div><h4>Ask seniors</h4><ul>{g.ask_seniors.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              </div>
            </section>))}
        </div>
      )}

      {open && BY_ID.get(open) && drawer(BY_ID.get(open)!)}

      <footer className="muted small foot">
        Cutoffs: official MCC & Maharashtra CET Cell result PDFs (2024–25). Online research: web, news & forum sources — forum = anecdotal. Past cutoffs never guarantee a 2026 seat. Bonds are 2025 rules; re-check 2026 brochures. Your data stays in this browser — use Backup.
      </footer>
    </main>
  );
}
