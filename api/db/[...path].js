import { getUpstreamPath } from "../lib/upstream-path.js";

const UPSTREAM = "https://v6.db.transport.rest";
const MOUNT = "/api/db";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const path = getUpstreamPath(req, MOUNT);
  const raw = req.url ?? "";
  const qs = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  const target = path ? `${UPSTREAM}/${path}${qs}` : `${UPSTREAM}${qs}`;

  try {
    const upstream = await fetch(target, {
      headers: { "User-Agent": "FastRoute/1.0 (Vercel proxy)" },
      signal: AbortSignal.timeout(90000),
    });

    const body = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(502).json({
      error: "proxy_failed",
      message: err.message || "Upstream unreachable",
    });
  }
}
