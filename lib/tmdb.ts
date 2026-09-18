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
const TARGET_PICKS = 5;
const CANDIDATE_POOL = 25;

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

const TV_GENRE_FALLBACK: Record<string, string> = {
  "28": "10759",
  "12": "10759",
  "14": "10765",
  "27": "9648",
  "10749": "18",
  "878": "10765",
  "53": "80",
};

const MOVIE_GENRE_FALLBACK: Record<string, string> = {
  "10759": "28",
  "10765": "878",
};

function translateGenres(media: "movie" | "tv", ids: string[]): string[] {
  const table = media === "tv" ? TV_GENRE_FALLBACK : MOVIE_GENRE_FALLBACK;
  return [...new Set(ids.map((g) => table[g] || g))];
}

function genresFor(media: "movie" | "tv", ids: string[]): string {
  return translateGenres(media, ids).join("|");
}

function mediaFor(a: QuizAnswers): ("movie" | "tv")[] {
  if (a.format !== "either") return [a.format];
  if (a.time === "binge") return ["tv"];
  if (a.time === "short" || a.time === "standard") return ["movie"];
  return ["movie", "tv"];
}

type DiscoverOpts = { relaxed?: boolean; softRelaxed?: boolean; page?: number };

function applyLanguageFilter(
  base: Record<string, string>,
  a: QuizAnswers,
  strict: boolean,
): void {
  if (a.language === "en") {
    base.with_original_language = "en";
    return;
  }
  if (a.language === "hi") {
    // Strict: Hindi originals. Relaxed: broader Indian cinema — never Hollywood.
    if (strict) base.with_original_language = "hi";
    else base.with_origin_country = "IN";
  }
}

function dedupeRows(rows: TmdbRow[]): TmdbRow[] {
  const seen = new Set<number>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

async function fetchDiscoverPages(
  path: string,
  base: Record<string, string>,
  m: MediaKind,
  startPage: number,
): Promise<TmdbRow[]> {
  const data = await tmdb(path, { ...base, page: String(startPage) });
  const rows = asRows(data, m);
  if (rows.length < 12) {
    const p2 = await tmdb(path, { ...base, page: String(startPage + 1) });
    rows.push(...asRows(p2, m));
  }
  return rows;
}

async function discover(a: QuizAnswers, opts: DiscoverOpts = {}): Promise<TmdbRow[]> {
  const mood = MOOD_MAP[a.mood];
  const picked = a.genres.length ? a.genres : mood.genres.split(",");
  const media = mediaFor(a);
  const startPage = opts.page ?? 1;
  const strict = !opts.relaxed && !opts.softRelaxed;

  const all: TmdbRow[] = [];
  for (const m of media) {
    const base: Record<string, string> = {
      sort_by: mood.sort,
      "vote_count.gte": opts.relaxed ? "100" : "300",
      "vote_average.gte": opts.relaxed ? "6.0" : "6.5",
      with_genres: genresFor(m, picked),
      watch_region: "IN",
    };
    applyLanguageFilter(base, a, strict);
    if (strict && a.providers.length) {
      base.with_watch_monetization_types = "flatrate";
      base.with_watch_providers = a.providers.join("|");
    }
    if (strict && m === "movie") {
      if (a.time === "short") base["with_runtime.lte"] = "90";
      if (a.time === "standard") {
        base["with_runtime.gte"] = "80";
        base["with_runtime.lte"] = "200";
      }
    }

    const path = m === "movie" ? "/discover/movie" : "/discover/tv";

    // Hindi strict: merge Hindi-language + Indian-origin pools for volume.
    if (a.language === "hi" && strict) {
      const hiBase: Record<string, string> = { ...base, with_original_language: "hi" };
      delete hiBase.with_origin_country;
      const inBase: Record<string, string> = { ...base, with_origin_country: "IN" };
      delete inBase.with_original_language;
      const [hiRows, inRows] = await Promise.all([
        fetchDiscoverPages(path, hiBase, m, startPage),
        fetchDiscoverPages(path, inBase, m, startPage),
      ]);
      all.push(...dedupeRows([...hiRows, ...inRows]));
      continue;
    }

    all.push(...await fetchDiscoverPages(path, base, m, startPage));
  }
  return dedupeRows(all);
}

export type RecommendationResult = {
  picks: Pick[];
  relaxed: boolean;
};

function wantedIds(a: QuizAnswers, m: "movie" | "tv"): Set<string> {
  const ids = a.genres.length ? a.genres : MOOD_MAP[a.mood].genres.split(",");
  return new Set(translateGenres(m, ids));
}

function overlap(a: QuizAnswers, r: TmdbRow): number {
  const want = wantedIds(a, r._media);
  return (r.genre_ids || []).filter((g) => want.has(String(g))).length;
}

function scoreRows(a: QuizAnswers, all: TmdbRow[]): Array<{ r: TmdbRow; score: number }> {
  const seen = new Set<string>();
  return all
    .filter((r) => r.poster_path)
    .filter((r) => overlap(a, r) > 0)
    .map((r) => {
      const pop = Math.min((r.popularity || 0) / 200, 1);
      const vote = (r.vote_average || 0) / 10;
      const year = parseInt(
        (r.release_date || r.first_air_date || "2000").slice(0, 4),
        10,
      );
      const recency = Math.max(0, Math.min(1, (year - 1995) / 30));
      const genreFit = Math.min(overlap(a, r) / 2, 1);
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
    .slice(0, CANDIDATE_POOL);
}

interface ScoredPick extends Pick {
  _score: number;
}

async function buildPick(
  a: QuizAnswers,
  r: TmdbRow,
  score: number,
  maxRuntimeMin = 105,
): Promise<ScoredPick | null> {
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
  if (a.time === "short" && m === "movie" && runtimeMin != null && runtimeMin > maxRuntimeMin) {
    return null;
  }

  const want = wantedIds(a, m);
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
  return {
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
  };
}

async function rowsToPicks(
  a: QuizAnswers,
  scored: Array<{ r: TmdbRow; score: number }>,
  maxRuntimeMin = 105,
): Promise<ScoredPick[]> {
  const picks: ScoredPick[] = [];
  for (const { r, score } of scored) {
    if (picks.length >= TARGET_PICKS) break;
    const pick = await buildPick(a, r, score, maxRuntimeMin);
    if (pick) picks.push(pick);
  }
  return picks;
}

function sortByProviders(a: QuizAnswers, picks: ScoredPick[]): void {
  if (!a.providers.length) return;
  const mine = new Set(a.providers.map(Number));
  picks.sort((x, y) => {
    const xm = x.providers.some((p) => mine.has(p.id)) ? 1 : 0;
    const ym = y.providers.some((p) => mine.has(p.id)) ? 1 : 0;
    if (xm !== ym) return ym - xm;
    return y._score - x._score;
  });
}

export async function getRecommendations(
  a: QuizAnswers,
  page = 1,
): Promise<RecommendationResult> {
  if (!key()) return { picks: demoPicks(a), relaxed: false };

  let relaxed = false;
  let all = await discover(a, { page });
  let picks = await rowsToPicks(a, scoreRows(a, all));

  // Soft-relaxed: keep language, drop OTT + runtime filters.
  if (!picks.length) {
    all = await discover(a, { softRelaxed: true, page });
    picks = await rowsToPicks(a, scoreRows(a, all), 150);
    relaxed = picks.length > 0;
  }
  // Full relaxed: genres/mood only.
  if (!picks.length) {
    all = await discover(a, { relaxed: true, page });
    picks = await rowsToPicks(a, scoreRows(a, all));
    relaxed = picks.length > 0;
  }

  // Still short? Pull the next TMDB page before giving up.
  if (picks.length < TARGET_PICKS) {
    const more = await discover(a, { relaxed, page: page + 2 });
    if (more.length) {
      const extra = scoreRows(a, more).filter(
        ({ r }) => !picks.some((p) => p.id === r.id && p.mediaType === r._media),
      );
      const morePicks = await rowsToPicks(a, extra);
      picks = [...picks, ...morePicks].slice(0, TARGET_PICKS);
    }
  }

  sortByProviders(a, picks);

  // Live API key present — never silently swap in demo titles.
  if (!picks.length) return { picks: [], relaxed };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clean = picks.map(({ _score, ...p }) => p);
  return { picks: clean, relaxed };
}
