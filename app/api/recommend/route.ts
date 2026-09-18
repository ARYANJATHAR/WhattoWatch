import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/tmdb";
import { searchParamsToQuiz } from "@/lib/quiz";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const { ok, retryAfterSec } = rateLimit(clientIp(req), { limit: 30, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests — take a breath and retry." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }
  try {
    const quiz = searchParamsToQuiz(req.nextUrl.searchParams);
    const { picks, relaxed } = await getRecommendations(quiz);
    return NextResponse.json({ picks, relaxed, demo: !process.env.TMDB_API_KEY });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "recommend failed";
    // Never leak upstream internals/keys — status only.
    const safe = message.startsWith("TMDB ") ? "Movie service is down — try again." : message;
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
