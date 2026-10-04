import { createHash } from "node:crypto";

export function hasSecurityStore(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
export function storeKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
export async function redis<T>(command: (string | number)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || new URL(url).protocol !== "https:") throw new Error("Security store unavailable");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command), cache: "no-store", signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) throw new Error("Security store unavailable");
  const body = await response.json() as { result: T; error?: string };
  if (body.error) throw new Error("Security store unavailable");
  return body.result;
}
const RESERVE = `
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
if used + tonumber(ARGV[1]) > tonumber(ARGV[2]) then return 0 end
redis.call('INCRBY', KEYS[1], ARGV[1])
if used == 0 then redis.call('PEXPIRE', KEYS[1], ARGV[3]) end
return 1`;
export async function reserveBudget(key: string, cost: number, limit: number, ttlMs: number): Promise<boolean> {
  return await redis<number>(["EVAL", RESERVE, 1, `whatowatch:${key}`, cost, limit, ttlMs]) === 1;
}
