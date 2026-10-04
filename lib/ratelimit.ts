import { isIP } from "node:net";
import { hasSecurityStore, reserveBudget, storeKey } from "./security-store";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;
let nextPrune = 0;

export function rateLimit(key: string, opts: { limit: number; windowMs: number }) {
  const now = Date.now();
  if (now >= nextPrune) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    nextPrune = now + 1000;
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    if (!b && buckets.size >= MAX_BUCKETS) return { ok: false, retryAfterSec: 1 };
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= opts.limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  b.count++;
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  // The ingress must overwrite this header; an arbitrary forwarding chain is untrusted.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER ||
    (process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : "");
  const value = header ? req.headers.get(header)?.trim() : null;
  return value && isIP(value) ? value : "unknown";
}

export async function apiRateLimit(req: Request, route: "recommend" | "shorts", limit: number) {
  const ip = storeKey(clientIp(req));
  if (hasSecurityStore()) {
    try {
      const minute = Math.floor(Date.now() / 60_000);
      const global = await reserveBudget(`rate:${route}:global:${minute}`, 1, route === "shorts" ? 100 : 60, 120_000);
      const client = global && await reserveBudget(`rate:${route}:${ip}:${minute}`, 1, limit, 120_000);
      return { ok: client, retryAfterSec: 60, unavailable: false };
    } catch { return { ok: false, retryAfterSec: 60, unavailable: true }; }
  }
  // Production live traffic must not silently use per-process counters.
  if (process.env.NODE_ENV === "production" && (process.env.TMDB_API_KEY || process.env.YT_API_KEY)) {
    return { ok: false, retryAfterSec: 60, unavailable: true };
  }
  const global = rateLimit(`${route}:global`, { limit: route === "shorts" ? 100 : 60, windowMs: 60_000 });
  const client = global.ok ? rateLimit(`${route}:${ip}`, { limit, windowMs: 60_000 }) : global;
  return { ...client, unavailable: false };
}
