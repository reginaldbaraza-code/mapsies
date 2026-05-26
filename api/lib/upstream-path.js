/** Resolve sub-path after /api/<service>/ for Vercel serverless proxies. */
export function getUpstreamPath(req, mount) {
  const raw = req.url ?? "/";
  let pathname = raw.split("?")[0];
  if (pathname.startsWith("http")) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      /* keep pathname */
    }
  }

  const base = mount.endsWith("/") ? mount.slice(0, -1) : mount;
  if (pathname === base) return "";
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length + 1);
  }

  const segments = req.query?.path;
  if (Array.isArray(segments)) return segments.join("/");
  if (typeof segments === "string") return segments;
  return "";
}
