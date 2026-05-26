const UPSTREAM = "https://nominatim.openstreetmap.org";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const segments = req.query.path;
  const path = Array.isArray(segments) ? segments.join("/") : segments || "";
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const target = `${UPSTREAM}/${path}${qs}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "FastRoute/1.0 (Vercel proxy)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });

    const body = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: "proxy_failed", message: err.message });
  }
}
