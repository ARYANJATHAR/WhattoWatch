import { NextRequest, NextResponse } from "next/server";
import { getTopShort } from "@/lib/youtube";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  // 5 Shorts fire per results page — allow bursts, block abuse.
  const { ok, retryAfterSec } = rateLimit(clientIp(req), { limit: 60, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests — take a breath and retry." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }
  const title = (req.nextUrl.searchParams.get("title") || "").slice(0, 120);
  const year = (req.nextUrl.searchParams.get("year") || "").slice(0, 4);
  const kind = req.nextUrl.searchParams.get("kind") === "tv" ? "tv" : "movie";
  if (!title)
    return NextResponse.json({ error: "title required" }, { status: 400 });
  try {
    const short = await getTopShort(title, year, kind);
    return NextResponse.json({ short, demo: !process.env.YT_API_KEY });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "shorts failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
