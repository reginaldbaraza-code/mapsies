import { CACHE_TTL_MS } from "../config";
import { t } from "../i18n";

const cache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export class TransitError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = "TransitError";
  }
}

export async function fetchJson<T>(url: string, opts?: { cache?: boolean; retries?: number }): Promise<T> {
  const useCache = opts?.cache ?? false;
  const retries = opts?.retries ?? 2;

  if (useCache) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  }

  const existing = inflight.get(url);
  if (existing) return existing as Promise<T>;

  const promise = (async () => {
    let lastErr: Error | null = null;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url);
        if (res.status === 503) throw new TransitError("503", "503");
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          try {
            const data = JSON.parse(text) as {
              code?: string;
              hafasCode?: string;
              message?: string;
              hafasMessage?: string;
            };
            if (data.code === "NOT_FOUND" || data.hafasCode === "LOCATION") {
              throw new TransitError("LOCATION_NOT_FOUND", "LOCATION");
            }
            throw new TransitError(data.message ?? data.hafasMessage ?? `HTTP ${res.status}`);
          } catch (e) {
            if (e instanceof TransitError) throw e;
            throw new TransitError(text || `HTTP ${res.status}`);
          }
        }
        const text = await res.text();
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("text/html") || text.trimStart().startsWith("<")) {
          throw new TransitError(t("error.network"));
        }
        let data: T;
        try {
          data = JSON.parse(text) as T;
        } catch {
          throw new TransitError(t("error.network"));
        }
        if (useCache) cache.set(url, { at: Date.now(), data });
        return data;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        if (e instanceof TransitError && (e.code === "503" || e.code === "LOCATION")) throw e;
        if (e instanceof TypeError && e.message === "Failed to fetch") {
          throw new TransitError(t("error.network"));
        }
        if (i < retries) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
    throw lastErr ?? new TransitError(t("error.unknown"));
  })().finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return promise as Promise<T>;
}
