// Netlify Function: shared storage for the planner.
//   GET  /api/sync?id=<publicId>            → { data, updatedAt }  (anyone with the id can read)
//   PUT  /api/sync  { secret, data }        → saves under sha256(secret); returns { id, updatedAt }
// The public id is the hash of the secret, so a share link reveals nothing that allows writing.
import { getStore } from "@netlify/blobs";


const hash = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async (req: Request) => {
  const store = getStore("planner");
  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!/^[a-f0-9]{32}$/.test(id)) return json({ error: "bad id" }, 400);
    const rec = await store.get(id, { type: "json" });
    return rec ? json(rec) : json({ error: "not found" }, 404);
  }
  if (req.method === "PUT") {
    let body: { secret?: string; data?: unknown };
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
    if (!body.secret || body.secret.length < 8 || body.data === undefined) return json({ error: "secret (≥8 chars) and data required" }, 400);
    const raw = JSON.stringify(body.data);
    if (raw.length > 2_000_000) return json({ error: "too large" }, 413);
    const id = await hash(body.secret); const updatedAt = Date.now();
    await store.setJSON(id, { data: body.data, updatedAt });
    return json({ id, updatedAt });
  }
  return json({ error: "method" }, 405);
};

export const config = { path: "/api/sync" };
