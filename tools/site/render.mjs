// Render a JS-heavy page in headless Chrome and print its visible text. Usage: node render.mjs URL
import { createRequire } from "module";
const require = createRequire("/private/tmp/claude-501/-Users-pankaj-Documents-code-getsetyo-ai/ae80d34b-f067-4b49-8fb6-9b0ebe899157/scratchpad/mccprof/package.json");
const puppeteer = require("puppeteer-core");
const url = process.argv[2];
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
  const p = await b.newPage();
  await p.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36");
  const r = await p.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  console.log("HTTP", r?.status(), url);
  const text = await p.evaluate(() => document.body.innerText);
  console.log(text.slice(0, 15000));
  const links = await p.$$eval("a[href]", (as) => as.slice(0, 60).map((a) => a.href + " | " + a.textContent.trim().slice(0, 60)));
  console.log("\n[links]\n" + links.join("\n"));
} catch (e) { console.log("RENDER FAILED:", e.message); }
await b.close();
