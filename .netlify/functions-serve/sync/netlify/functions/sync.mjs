
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/sync.mts
import { getStore } from "@netlify/blobs";
var hash = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
var sync_default = async (req, _ctx) => {
  const store = getStore("planner");
  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!/^[a-f0-9]{32}$/.test(id)) return json({ error: "bad id" }, 400);
    const rec = await store.get(id, { type: "json" });
    return rec ? json(rec) : json({ error: "not found" }, 404);
  }
  if (req.method === "PUT") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }
    if (!body.secret || body.secret.length < 8 || body.data === void 0) return json({ error: "secret (\u22658 chars) and data required" }, 400);
    const raw = JSON.stringify(body.data);
    if (raw.length > 2e6) return json({ error: "too large" }, 413);
    const id = await hash(body.secret);
    const updatedAt = Date.now();
    await store.setJSON(id, { data: body.data, updatedAt });
    return json({ id, updatedAt });
  }
  return json({ error: "method" }, 405);
};
var config = { path: "/api/sync" };
export {
  config,
  sync_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc3luYy5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIE5ldGxpZnkgRnVuY3Rpb246IHNoYXJlZCBzdG9yYWdlIGZvciB0aGUgcGxhbm5lci5cbi8vICAgR0VUICAvYXBpL3N5bmM/aWQ9PHB1YmxpY0lkPiAgICAgICAgICAgIFx1MjE5MiB7IGRhdGEsIHVwZGF0ZWRBdCB9ICAoYW55b25lIHdpdGggdGhlIGlkIGNhbiByZWFkKVxuLy8gICBQVVQgIC9hcGkvc3luYyAgeyBzZWNyZXQsIGRhdGEgfSAgICAgICAgXHUyMTkyIHNhdmVzIHVuZGVyIHNoYTI1NihzZWNyZXQpOyByZXR1cm5zIHsgaWQsIHVwZGF0ZWRBdCB9XG4vLyBUaGUgcHVibGljIGlkIGlzIHRoZSBoYXNoIG9mIHRoZSBzZWNyZXQsIHNvIGEgc2hhcmUgbGluayByZXZlYWxzIG5vdGhpbmcgdGhhdCBhbGxvd3Mgd3JpdGluZy5cbmltcG9ydCB7IGdldFN0b3JlIH0gZnJvbSBcIkBuZXRsaWZ5L2Jsb2JzXCI7XG5pbXBvcnQgdHlwZSB7IENvbnRleHQgfSBmcm9tIFwiQG5ldGxpZnkvZnVuY3Rpb25zXCI7XG5cbmNvbnN0IGhhc2ggPSBhc3luYyAoczogc3RyaW5nKSA9PiBBcnJheS5mcm9tKG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KFwiU0hBLTI1NlwiLCBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUocykpKSkubWFwKChiKSA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpLmpvaW4oXCJcIikuc2xpY2UoMCwgMzIpO1xuY29uc3QganNvbiA9IChib2R5OiB1bmtub3duLCBzdGF0dXMgPSAyMDApID0+IG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShib2R5KSwgeyBzdGF0dXMsIGhlYWRlcnM6IHsgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsIFwiY2FjaGUtY29udHJvbFwiOiBcIm5vLXN0b3JlXCIgfSB9KTtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcTogUmVxdWVzdCwgX2N0eDogQ29udGV4dCkgPT4ge1xuICBjb25zdCBzdG9yZSA9IGdldFN0b3JlKFwicGxhbm5lclwiKTtcbiAgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIpIHtcbiAgICBjb25zdCBpZCA9IG5ldyBVUkwocmVxLnVybCkuc2VhcmNoUGFyYW1zLmdldChcImlkXCIpID8/IFwiXCI7XG4gICAgaWYgKCEvXlthLWYwLTldezMyfSQvLnRlc3QoaWQpKSByZXR1cm4ganNvbih7IGVycm9yOiBcImJhZCBpZFwiIH0sIDQwMCk7XG4gICAgY29uc3QgcmVjID0gYXdhaXQgc3RvcmUuZ2V0KGlkLCB7IHR5cGU6IFwianNvblwiIH0pO1xuICAgIHJldHVybiByZWMgPyBqc29uKHJlYykgOiBqc29uKHsgZXJyb3I6IFwibm90IGZvdW5kXCIgfSwgNDA0KTtcbiAgfVxuICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQVVRcIikge1xuICAgIGxldCBib2R5OiB7IHNlY3JldD86IHN0cmluZzsgZGF0YT86IHVua25vd24gfTtcbiAgICB0cnkgeyBib2R5ID0gYXdhaXQgcmVxLmpzb24oKTsgfSBjYXRjaCB7IHJldHVybiBqc29uKHsgZXJyb3I6IFwiYmFkIGpzb25cIiB9LCA0MDApOyB9XG4gICAgaWYgKCFib2R5LnNlY3JldCB8fCBib2R5LnNlY3JldC5sZW5ndGggPCA4IHx8IGJvZHkuZGF0YSA9PT0gdW5kZWZpbmVkKSByZXR1cm4ganNvbih7IGVycm9yOiBcInNlY3JldCAoXHUyMjY1OCBjaGFycykgYW5kIGRhdGEgcmVxdWlyZWRcIiB9LCA0MDApO1xuICAgIGNvbnN0IHJhdyA9IEpTT04uc3RyaW5naWZ5KGJvZHkuZGF0YSk7XG4gICAgaWYgKHJhdy5sZW5ndGggPiAyXzAwMF8wMDApIHJldHVybiBqc29uKHsgZXJyb3I6IFwidG9vIGxhcmdlXCIgfSwgNDEzKTtcbiAgICBjb25zdCBpZCA9IGF3YWl0IGhhc2goYm9keS5zZWNyZXQpOyBjb25zdCB1cGRhdGVkQXQgPSBEYXRlLm5vdygpO1xuICAgIGF3YWl0IHN0b3JlLnNldEpTT04oaWQsIHsgZGF0YTogYm9keS5kYXRhLCB1cGRhdGVkQXQgfSk7XG4gICAgcmV0dXJuIGpzb24oeyBpZCwgdXBkYXRlZEF0IH0pO1xuICB9XG4gIHJldHVybiBqc29uKHsgZXJyb3I6IFwibWV0aG9kXCIgfSwgNDA1KTtcbn07XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7IHBhdGg6IFwiL2FwaS9zeW5jXCIgfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFJQSxTQUFTLGdCQUFnQjtBQUd6QixJQUFNLE9BQU8sT0FBTyxNQUFjLE1BQU0sS0FBSyxJQUFJLFdBQVcsTUFBTSxPQUFPLE9BQU8sT0FBTyxXQUFXLElBQUksWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsU0FBUyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLE1BQU0sR0FBRyxFQUFFO0FBQ2pNLElBQU0sT0FBTyxDQUFDLE1BQWUsU0FBUyxRQUFRLElBQUksU0FBUyxLQUFLLFVBQVUsSUFBSSxHQUFHLEVBQUUsUUFBUSxTQUFTLEVBQUUsZ0JBQWdCLG9CQUFvQixpQkFBaUIsV0FBVyxFQUFFLENBQUM7QUFFekssSUFBTyxlQUFRLE9BQU8sS0FBYyxTQUFrQjtBQUNwRCxRQUFNLFFBQVEsU0FBUyxTQUFTO0FBQ2hDLE1BQUksSUFBSSxXQUFXLE9BQU87QUFDeEIsVUFBTSxLQUFLLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRSxhQUFhLElBQUksSUFBSSxLQUFLO0FBQ3RELFFBQUksQ0FBQyxpQkFBaUIsS0FBSyxFQUFFLEVBQUcsUUFBTyxLQUFLLEVBQUUsT0FBTyxTQUFTLEdBQUcsR0FBRztBQUNwRSxVQUFNLE1BQU0sTUFBTSxNQUFNLElBQUksSUFBSSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBQ2hELFdBQU8sTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsT0FBTyxZQUFZLEdBQUcsR0FBRztBQUFBLEVBQzNEO0FBQ0EsTUFBSSxJQUFJLFdBQVcsT0FBTztBQUN4QixRQUFJO0FBQ0osUUFBSTtBQUFFLGFBQU8sTUFBTSxJQUFJLEtBQUs7QUFBQSxJQUFHLFFBQVE7QUFBRSxhQUFPLEtBQUssRUFBRSxPQUFPLFdBQVcsR0FBRyxHQUFHO0FBQUEsSUFBRztBQUNsRixRQUFJLENBQUMsS0FBSyxVQUFVLEtBQUssT0FBTyxTQUFTLEtBQUssS0FBSyxTQUFTLE9BQVcsUUFBTyxLQUFLLEVBQUUsT0FBTywyQ0FBc0MsR0FBRyxHQUFHO0FBQ3hJLFVBQU0sTUFBTSxLQUFLLFVBQVUsS0FBSyxJQUFJO0FBQ3BDLFFBQUksSUFBSSxTQUFTLElBQVcsUUFBTyxLQUFLLEVBQUUsT0FBTyxZQUFZLEdBQUcsR0FBRztBQUNuRSxVQUFNLEtBQUssTUFBTSxLQUFLLEtBQUssTUFBTTtBQUFHLFVBQU0sWUFBWSxLQUFLLElBQUk7QUFDL0QsVUFBTSxNQUFNLFFBQVEsSUFBSSxFQUFFLE1BQU0sS0FBSyxNQUFNLFVBQVUsQ0FBQztBQUN0RCxXQUFPLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQztBQUFBLEVBQy9CO0FBQ0EsU0FBTyxLQUFLLEVBQUUsT0FBTyxTQUFTLEdBQUcsR0FBRztBQUN0QztBQUVPLElBQU0sU0FBUyxFQUFFLE1BQU0sWUFBWTsiLAogICJuYW1lcyI6IFtdCn0K
