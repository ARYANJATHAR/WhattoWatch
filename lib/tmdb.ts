import {
  GENRE_MAP,
  MOOD_MAP,
  PROVIDER_MAP,
  buildHookLine,
  type Pick,
  type QuizAnswers,
} from "./quiz";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

function key(): string | null {
  return process.env.TMDB_API_KEY || null;
}

type MediaKind = "movie" | "tv";

interface TmdbRow {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  release_date?: string;
  first_air_date?: string;
  _media: MediaKind;
}

interface TmdbDetails {
  runtime?: number;
  number_of_seasons?: number;
  "watch/providers"?: {
    results?: Record<string, { flatrate?: Array<{ provider_id: number; provider_name: string; logo_path: string | null }> }>;
  };
}

const FETCH_TIMEOUT_MS = 10_000;

async function tmdb(path: string, params: Record<string, string>): Promise<unknown> {
  const k = key();
  if (!k) return null;
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", k);
  url.searchParams.set("language", "en-US");
  for (const [kk, vv] of Object.entries(params)) {
    if (vv) url.searchParams.set(kk, vv);
  }
  // Bounded: an upstream hang must never hang our route.
  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json() as Promise<unknown>;
}

function asRows(data: unknown, m: MediaKind): TmdbRow[] {
  const results = (data as { results?: Omit<TmdbRow, "_media">[] } | null)?.results;
  if (!Array.isArray(results)) return [];
  return results.map((r) => ({ ...r, _media: m }));
}

// Demo fallback so the UI works with no API key
function demoPicks(a: QuizAnswers): Pick[] {
  const titles = [
    { title: "3 Idiots", year: "2009", rating: 8.4 },
    { title: "Andhadhun", year: "2018", rating: 8.2 },
    { title: "The Dark Knight", year: "2008", rating: 9.0 },
    { title: "Dangal", year: "2016", rating: 8.3 },
    { title: "Scam 1992 (Series)", year: "2020", rating: 9.3 },
  ];
  return titles.map((t, i) => ({
    id: 1000 + i,
    mediaType: t.title.includes("Series") ? "tv" : "movie",
    title: t.title,
    year: t.year,
    poster: null,
    backdrop: null,
    overview:
      "Demo pick — add TMDB_API_KEY to .env.local for live posters, ratings and providers.",
    rating: t.rating,
    voteCount: 1000,
    runtimeOrSeasons: "—",
    genres: ["Drama"],
    providers: [],
    hookLine: buildHookLine(a.mood, ["Drama"], t.title),
  }));
}

/* Movie genre id → TV genre id. TV has no Action(28)/Thriller(53)/
   Horror(27)/Romance(10749)/Fantasy(14) buckets, so untranslated ids
   would silently return ZERO tv results. */
const TV_GENRE_FALLBACK: Record<string, string> = {
  "28": "10759", // Action → Action & Adventure
  "12": "10759", // Adventure → Action & Adventure
  "14": "10765", // Fantasy → Sci-Fi & Fantasy
  "27": "9648", // Horror → Mystery
  "10749": "18", // Romance → Drama
  "878": "10765", // Sci-Fi → Sci-Fi & Fantasy
  "53": "80", // Thriller → Crime
};

/* The quiz picker offers TV buckets (10759/10765) that don't exist on
   the movie endpoint — untranslated they'd poison movie queries. */
const MOVIE_GENRE_FALLBACK: Record<string, string> = {
  "10759": "28", // Action-Adventure → Action
  "10765": "878", // Sci-Fi & Fantasy → Sci-Fi
};

function translateGenres(media: "movie" | "tv", ids: string[]): string[] {
  const table = media === "tv" ? TV_GENRE_FALLBACK : MOVIE_GENRE_FALLBACK;
  return [...new Set(ids.map((g) => table[g] || g))];
}

function genresFor(media: "movie" | "tv", ids: string[]): string {
  // "|" = OR in TMDB. "," would mean AND (title must be ALL genres
  // at once) and usually returns nothing → wrong/empty picks.
  return translateGenres(media, ids).join("|");
}

/* Time answers imply a shape: "binge" means series, "under 90 min" and
   "around 2 hours" mean movies. Runtime bounds only exist on the movie
   endpoint — sending them to discover/tv is silently ignored. */
function mediaFor(a: QuizAnswers): ("movie" | "tv")[] {
  if (a.format !== "either") return [a.format];
  if (a.time === "binge") return ["tv"];
  if (a.time === "short" || a.time === "standard") return ["movie"];
  return ["movie", "tv"];
}

type DiscoverOpts = { relaxed?: boolean };

async function discover(a: QuizAnswers, opts: DiscoverOpts = {}): Promise<TmdbRow[]> {
  const mood = MOOD_MAP[a.mood];
  const picked = a.genres.length ? a.genres : mood.genres.split(",");
  const media = mediaFor(a);

  const all: TmdbRow[] = [];
  for (const m of media) {
    const base: Record<string, string> = {
      sort_by: mood.sort,
      "vote_count.gte": opts.relaxed ? "100" : "300",
      "vote_average.gte": opts.relaxed ? "6.0" : "6.5",
      with_genres: genresFor(m, picked),
      watch_region: "IN",
    };
    if (!opts.relaxed) {
      if (a.language === "hi") base.with_original_language = "hi";
      if (a.language === "en") base.with_original_language = "en";
      if (a.providers.length) {
        // flatrate = actually streaming (not rent/buy); "|" = on ANY of my OTTs
        base.with_watch_monetization_types = "flatrate";
        base.with_watch_providers = a.providers.join("|");
      }
    }
    if (m === "movie") {
      if (a.time === "short") base["with_runtime.lte"] = "90";
      if (a.time === "standard") {
        base["with_runtime.gte"] = "80";
        base["with_runtime.lte"] = "200";
      }
    }

    const path = m === "movie" ? "/discover/movie" : "/discover/tv";
    const data = await tmdb(path, { ...base, page: "1" });
    all.push(...asRows(data, m));
    if (all.length < 12) {
      const p2 = await tmdb(path, { ...base, page: "2" });
      all.push(...asRows(p2, m));
    }
  }
  return all;
}

export type RecommendationResult = {
  picks: Pick[];
  /** True when strict filters matched nothing and genres-only results are shown. */
  relaxed: boolean;
};

export async function getRecommendations(a: QuizAnswers): Promise<RecommendationResult> {
  if (!key()) return { picks: demoPicks(a), relaxed: false };

  // Strict pass (providers + language + runtime), then one relaxed pass
  // (genres only). Relaxed results that match the vibe beat hardcoded
  // demo titles that ignore the quiz entirely.
  let all = await discover(a);
  let relaxed = false;
  if (!all.length) {
    all = await discover(a, { relaxed: true });
    relaxed = all.length > 0;
  }

  /* Post-verification: never trust the API filter blindly. A result
     only survives if at least one of ITS genre ids is one the user
     actually asked for (tv ids translated). This is what stops a
     Comedy/Adventure "Dog Man" landing in an Action/Crime/Horror list. */
  const wantedIds = (m: "movie" | "tv"): Set<string> => {
    const ids = a.genres.length ? a.genres : MOOD_MAP[a.mood].genres.split(",");
    return new Set(translateGenres(m, ids));
  };
  const overlap = (r: TmdbRow): number => {
    const want = wantedIds(r._media);
    return (r.genre_ids || []).filter((g) => want.has(String(g))).length;
  };

  // Score + dedupe franchises (1 per base title)
  const seen = new Set<string>();
  const scored = all
    .filter((r) => r.poster_path)
    .filter((r) => overlap(r) > 0)
    .map((r) => {
      const pop = Math.min((r.popularity || 0) / 200, 1);
      const vote = (r.vote_average || 0) / 10;
      const year = parseInt(
        (r.release_date || r.first_air_date || "2000").slice(0, 4),
        10,
      );
      const recency = Math.max(0, Math.min(1, (year - 1995) / 30));
      // Matching MORE of the asked genres outranks raw popularity.
      const genreFit = Math.min(overlap(r) / 2, 1);
      return { r, score: pop * 0.35 + vote * 0.25 + recency * 0.15 + genreFit * 0.25 };
    })
    .sort((x, y) => y.score - x.score)
    .filter(({ r }) => {
      const base = (r.title || r.name || "")
        .toLowerCase()
        .replace(/[:\-–—].*$/, "")
        .trim();
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    })
    .slice(0, 8);

  const picks: ScoredPick[] = [];
  for (const { r, score } of scored) {
    if (picks.length >= 5) break;
    const m: "movie" | "tv" = r._media;
    let providers: Pick["providers"] = [];
    let runtime = "—";
    let runtimeMin: number | null = null;
    try {
      const det = (await tmdb(`/${m}/${r.id}`, {
        append_to_response: "watch/providers",
      })) as TmdbDetails | null;
      const inProviders = det?.["watch/providers"]?.results?.IN?.flatrate || [];
      providers = inProviders.map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path
          ? `https://image.tmdb.org/t/p/w92${p.logo_path}`
          : null,
      }));
      if (m === "movie" && det?.runtime) {
        runtimeMin = det.runtime;
        runtime = `${det.runtime} min`;
      }
      if (m === "tv" && det?.number_of_seasons)
        runtime = `${det.number_of_seasons} season(s)`;
    } catch {
      /* providers optional */
    }
    // Runtime truth-check: "under 90 min" must never ship a 140-min film
    // that slipped the discover filter (stale cache, bad metadata).
    if (a.time === "short" && m === "movie" && runtimeMin != null && runtimeMin > 105) {
      continue;
    }
    // Matching genres first, so the chips read like the quiz answers.
    const want = wantedIds(m);
    const gnames = (r.genre_ids || [])
      .map((g: number) => ({ id: String(g), name: GENRE_MAP[String(g)] || PROVIDER_MAP[String(g)] }))
      .filter((g: { name: string }) => Boolean(g.name))
      .sort((x: { id: string }, y: { id: string }) =>
        want.has(x.id) && !want.has(y.id) ? -1 : !want.has(x.id) && want.has(y.id) ? 1 : 0,
      )
      .map((g: { name: string }) => g.name)
      .slice(0, 3);
    const title = r.title || r.name || "Untitled";
    const year = (r.release_date || r.first_air_date || "").slice(0, 4);
    picks.push({
      id: r.id,
      mediaType: m,
      title,
      year,
      poster: r.poster_path ? `${IMG}${r.poster_path}` : null,
      backdrop: r.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${r.backdrop_path}`
        : null,
      overview: r.overview || "",
      rating: r.vote_average || 0,
      voteCount: r.vote_count || 0,
      runtimeOrSeasons: runtime,
      genres: gnames,
      providers,
      hookLine: buildHookLine(a.mood, gnames, title),
      _score: score,
    });
  }

  // Titles actually on the user's OTTs float to the top.
  if (a.providers.length) {
    const mine = new Set(a.providers.map(Number));
    picks.sort((x, y) => {
      const xm = x.providers.some((p) => mine.has(p.id)) ? 1 : 0;
      const ym = y.providers.some((p) => mine.has(p.id)) ? 1 : 0;
      if (xm !== ym) return ym - xm;
      return y._score - x._score;
    });
  }

  if (!picks.length) return { picks: demoPicks(a), relaxed };

  // Strip the internal rank before returning.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clean = picks.map(({ _score, ...p }) => p);
  return { picks: clean, relaxed };
}

interface ScoredPick extends Pick {
  _score: number;
}
