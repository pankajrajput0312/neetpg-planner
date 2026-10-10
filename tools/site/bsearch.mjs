// Search through headless Chrome (real browser → engines serve real results). Usage: node bsearch.mjs "query" [engine: bing|brave|ddg]
import { createRequire } from "module";
const require = createRequire("/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/mccprof/package.json");
const puppeteer = require("puppeteer-core");
const q = process.argv[2]; const want = process.argv[3];
// Engines in order of current reliability (tested 2026-10-10): DDG good, Bing degrades after ~12 queries, Brave captchas.
const order = want && want !== "auto" ? [want] : ["ddg", "bing", "brave"];
const urls = { bing: `https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=en&cc=IN`, brave: `https://search.brave.com/search?q=${encodeURIComponent(q)}&source=web`, ddg: `https://duckduckgo.com/?q=${encodeURIComponent(q)}&ia=web` };
const words = q.toLowerCase().split(/\W+/).filter(w => w.length >= 5);
const relevant = (r) => { const t = (r.url + " " + r.title + " " + r.snippet).toLowerCase(); return words.filter(w => t.includes(w)).length >= Math.min(2, words.length); };
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--lang=en-IN"] });
try {
  const p = await b.newPage();
  await p.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36");
  await p.setViewport({ width: 1280, height: 900 });
  let done = false;
  for (const eng of order) {
    try { await p.goto(urls[eng], { waitUntil: "networkidle2", timeout: 45000 }); } catch (e) { console.log(`${eng}: load failed (${e.message.slice(0, 60)})`); continue; }
    await new Promise(r => setTimeout(r, 1200));
    const res = await p.evaluate((eng) => {
      const sel = { bing: "li.b_algo", brave: "#results .snippet, [data-type=web]", ddg: "article[data-testid=result], .result" }[eng];
      const out = [];
      for (const el of document.querySelectorAll(sel)) {
        const a = el.querySelector("h2 a, a[href^='http']"); if (!a) continue;
        const title = (el.querySelector("h2, h3") || a).innerText.trim();
        const snippet = el.innerText.replace(title, "").replace(/\s+/g, " ").trim().slice(0, 260);
        out.push({ url: a.href, title: title.slice(0, 120), snippet });
        if (out.length >= 10) break;
      }
      return out;
    }, eng);
    const real = (u) => { const m = u.match(/[?&]u=a1([A-Za-z0-9_-]+)/); if (!m) return u; try { return Buffer.from(m[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); } catch { return u; } };
    for (const r of res) r.url = real(r.url);
    const good = res.filter(relevant).length;
    if (res.length && (good >= 2 || good >= res.length * 0.4)) {
      console.log(`${eng}: ${res.length} results (${good} match the query) for: ${q}`);
      for (const r of res) console.log(`${r.url}\n   ${r.title}\n   ${r.snippet}\n`);
      done = true; break;
    }
    console.log(`${eng}: ${res.length} results but only ${good} relevant — trying next engine`);
  }
  if (!done) console.log("[no engine gave relevant results — simplify the query (college short name + one topic word) and retry once later]");
} catch (e) { console.log("SEARCH FAILED:", e.message); }
await b.close();
