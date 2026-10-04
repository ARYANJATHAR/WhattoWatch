import { createHmac, timingSafeEqual } from "node:crypto";

type ShortClaim = { title: string; year: string; kind: "movie" | "tv"; expires: number };
function secret(): string | null {
  const value = process.env.SHORTS_SIGNING_SECRET;
  return value && value.length >= 32 ? value : null;
}
export function signShort(title: string, year: string, kind: "movie" | "tv"): string | undefined {
  const key = secret();
  if (!key) return undefined;
  const payload = Buffer.from(JSON.stringify({ title, year, kind, expires: Date.now() + 15 * 60_000 })).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}
export function verifyShort(token: string): ShortClaim | null {
  const key = secret();
  if (!key || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = createHmac("sha256", key).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString()) as ShortClaim;
    if (typeof claim.title !== "string" || !claim.title.trim() || claim.title.length > 200 ||
      typeof claim.year !== "string" || !/^(\d{4})?$/.test(claim.year) ||
      !["movie", "tv"].includes(claim.kind) || !Number.isFinite(claim.expires) ||
      claim.expires <= Date.now() || claim.expires > Date.now() + 15 * 60_000) return null;
    return claim;
  } catch { return null; }
}
