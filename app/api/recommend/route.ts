import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/tmdb";
import { parseRecommendQuery } from "@/lib/quiz";
import { apiRateLimit } from "@/lib/ratelimit";
import { signShort } from "@/lib/short-token";

export async function GET(req: NextRequest) {
  const { ok, retryAfterSec, unavailable } = await apiRateLimit(req, "recommend", 15);
  if (!ok) {
    return NextResponse.json(
      { error: unavailable ? "Recommendations are temporarily unavailable." : "Too many requests — take a breath and retry." },
      { status: unavailable ? 503 : 429, headers: { "Retry-After": String(retryAfterSec), "Cache-Control": "no-store" } },
    );
  }
  try {
    const { quiz, page } = parseRecommendQuery(req.nextUrl.searchParams);
    const { picks, relaxed } = await getRecommendations(quiz, page, req.signal);
    return NextResponse.json({ picks: picks.map(p => ({ ...p, shortToken: signShort(p.title, p.year, p.mediaType) })), relaxed, demo: !process.env.TMDB_API_KEY }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Movie service is unavailable — try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
