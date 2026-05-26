import { CACHE_TTL_MS } from "../config";

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
        const data = (await res.json()) as T;
        if (useCache) cache.set(url, { at: Date.now(), data });
        return data;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        if (e instanceof TransitError && (e.code === "503" || e.code === "LOCATION")) throw e;
        if (e instanceof TypeError && e.message === "Failed to fetch") {
          throw new TransitError(
            "Netzwerkfehler. Bitte Verbindung prüfen oder später erneut versuchen."
          );
        }
        if (i < retries) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
    throw lastErr ?? new TransitError("Unbekannter Fehler");
  })().finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return promise as Promise<T>;
}
