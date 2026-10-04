import { NextRequest, NextResponse } from "next/server";
import { getTopShort } from "@/lib/youtube";
import { apiRateLimit } from "@/lib/ratelimit";
import { verifyShort } from "@/lib/short-token";

export async function GET(req: NextRequest) {
  const claim = verifyShort(req.nextUrl.searchParams.get("token") || "");
  if (!claim) return NextResponse.json({ error: "A valid recommendation is required." }, { status: 400 });
  const { ok, retryAfterSec, unavailable } = await apiRateLimit(req, "shorts", 30);
  if (!ok) return NextResponse.json(
    { error: unavailable ? "Clips are temporarily unavailable." : "Too many requests — retry shortly." },
    { status: unavailable ? 503 : 429, headers: { "Retry-After": String(retryAfterSec), "Cache-Control": "no-store" } },
  );
  try {
    const short = await getTopShort(claim.title, claim.year, claim.kind);
    return NextResponse.json({ short }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Clips are temporarily unavailable." }, { status: 503 });
  }
}
