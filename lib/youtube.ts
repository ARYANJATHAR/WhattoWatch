import type { ShortResult } from "./quiz";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

// In-memory cache (per server instance) — 7 day TTL to protect quota.
// Bounded + successes only: a transient failure must never poison the
// cache, and the map must never grow without limit.
const cache = new Map<string, { at: number; data: ShortResult }>();
const TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE = 500;

function cacheSet(k: string, data: ShortResult) {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(k, { at: Date.now(), data });
}

function ytKey(): string | null {
  return process.env.YT_API_KEY || null;
}

function watchFallback(title: string, year: string): ShortResult {
  const q = encodeURIComponent(`${title} ${year} best scene short`);
  return {
    videoId: null,
    title: null,
    channel: null,
    views: null,
    thumbnail: null,
    embedUrl: null,
    watchUrl: `https://www.youtube.com/results?search_query=${q}`,
    fallback: true,
  };
}

/* ---- Relevance gating -------------------------------------------------
   Old code ranked purely by views, so a viral-but-unrelated video that
   merely mentioned the title would win. Now a candidate must share
   real words with the film/series title, and title-match outranks
   raw view counts. */

const STOP = new Set([
  "the", "a", "an", "and", "of", "in", "on", "to", "for", "with", "vs",
  "movie", "film", "series", "serial", "episode", "season", "scene",
  "scenes", "short", "shorts", "best", "top", "official", "trailer",
  "teaser", "clip", "clips", "full", "video", "watch", "part",
]);

function keywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
}

/** Devanagari / non-Latin titles — keyword matching won't work on Latin snippets. */
function isNonLatinTitle(title: string): boolean {
  return /[^\x00-\x7F]/.test(title) && keywords(title).length === 0;
}

/** Fraction of title keywords present in the video title (0..1). */
function relevance(videoTitle: string, keys: string[]): number {
  if (!keys.length) return 0.5; // e.g. "Up", "It" — nothing to match on
  const t = ` ${videoTitle.toLowerCase().replace(/[^a-z0-9 ]/g, " ")} `;
  let hits = 0;
  for (const k of keys) if (t.includes(` ${k} `) || t.includes(` ${k}s `)) hits++;
  return hits / keys.length;
}

/** ISO8601 duration (PT1M30S) → seconds. */
function durationSecs(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

type SearchHit = { id: string; title: string; description: string };

/* YouTube's own category labels — the strongest "is this actually film
   content" signal the API gives us. Fan edits live in 1/24/23; ads and
   off-topic uploads live everywhere else. A title keyword inside a
   Sports/Gaming/News upload is never our scene. */
const REJECT_CATEGORIES = new Set([
  "2", // Autos & Vehicles
  "15", // Pets & Animals
  "17", // Sports
  "19", // Travel & Events
  "20", // Gaming
  "25", // News & Politics
  "26", // Howto & Style
  "27", // Education
  "28", // Science & Technology
  "29", // Nonprofits & Activism
]);
const BOOST_CATEGORIES = new Set([
  "1", // Film & Animation
  "24", // Entertainment
  "23", // Comedy
]);

/* Sponsored/promo uploads that merely borrow the title ("Dangal LED TV
   ad", ticket promos, brand integrations). Real scenes don't carry these. */
const AD_MARKERS = [
  "sponsored by",
  "#ad",
  "paid promotion",
  "use code",
  "promo code",
  "discount code",
  "coupon code",
  "giveaway",
  "shop now",
  "buy now",
  "limited offer",
  "affiliate link",
  "brand collaboration",
];

function adMarkers(hay: string): number {
  let n = 0;
  for (const m of AD_MARKERS) if (hay.includes(m)) n++;
  return n;
}

/* Query-level filters: minus-terms push sports/news/gaming/ads out of the
   result set before we ever see it. ("Run" + cricket = the bug above.) */
const QUERY_MINUS = '-cricket -football -ipl -soccer -election -gameplay -minecraft -pubg -bgmi -vlog -recipe -stock -crypto -advertisement -sponsored -commercial';

async function searchHits(apiKey: string, q: string): Promise<SearchHit[]> {
  const sUrl = new URL(`${YT_BASE}/search`);
  sUrl.searchParams.set("part", "snippet");
  sUrl.searchParams.set("type", "video");
  sUrl.searchParams.set("videoDuration", "short"); // < 4 min, not strictly Shorts
  sUrl.searchParams.set("videoEmbeddable", "true");
  sUrl.searchParams.set("maxResults", "10");
  sUrl.searchParams.set("order", "viewCount");
  sUrl.searchParams.set("regionCode", "IN");
  sUrl.searchParams.set("q", `${q} ${QUERY_MINUS}`);
  sUrl.searchParams.set("key", apiKey);

  const res = await fetch(sUrl.toString(), { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`YT search ${res.status}`);
  const data = await res.json();
  return ((data.items || []) as Array<{ id?: { videoId?: string }; snippet?: { title?: string; description?: string } }>)
    .map((it) => ({
      id: it?.id?.videoId || "",
      title: it?.snippet?.title || "",
      description: it?.snippet?.description || "",
    }))
    .filter((h) => h.id);
}

/* Result-level gates. Single generic words ("Run", "It", "Up", "Gone")
   match half of YouTube — those need cinema context, not just the word. */
const CINEMA_WORDS = [
  "movie", "film", "series", "web series", "scene", "clip", "trailer",
  "teaser", "episode", "season", "dialogue", "actor", "actress", "cinema",
  "hollywood", "bollywood", "hindi", "netflix", "prime video", "hotstar", "jawan",
  "interval", "climax", "bgm", "casting", "audition",
];
const BLOCK_WORDS = [
  "cricket", "football", "ipl", "soccer", "kabaddi", "hockey", "wrestling",
  "election", "breaking news", "live news", "gameplay", "minecraft",
  "pubg", "bgmi", "free fire", "gta", "vlog", "daily vlog", "recipe",
  "cooking", "stock market", "crypto", "football highlights",
];

function clean(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ")} `;
}

/** True when the hit is plausibly ABOUT this film/series. */
function isAboutTitle(hit: SearchHit, title: string, year: string): boolean {
  const hay = clean(`${hit.title} ${hit.description}`);
  const keys = keywords(title);
  const exact = clean(title).trim();

  // Hard block: sports/news/gaming with no cinema signal is never our video.
  const blocked = BLOCK_WORDS.some((w) => hay.includes(clean(w).trim()));
  const cinema = year && hay.includes(year) ? true : CINEMA_WORDS.some((w) => hay.includes(clean(w).trim()));
  if (blocked && !cinema) return false;

  // Non-Latin titles (Bollywood originals): trust year + cinema context.
  if (isNonLatinTitle(title)) return cinema && !blocked;

  // Weak title (one generic word like "Run"): demand the exact title
  // PLUS cinema context (year, "movie", "scene", …). Kills cricket "run outs".
  if (keys.length <= 1) {
    if (!hay.includes(exact)) return false;
    return cinema;
  }

  // Normal title: at least half the real words must appear.
  return relevance(hit.title, keys) >= 0.5;
}

type YtVideo = {
  id: string;
  snippet?: { title?: string; channelTitle?: string; categoryId?: string; description?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string };
};

/**
 * Most-hyped Short that is actually ABOUT the title.
 * Three query angles → dedupe → hard relevance + duration gates →
 * rank by (title-match first, engagement second).
 */
export async function getTopShort(
  title: string,
  year: string,
  kind: "movie" | "tv" = "movie",
): Promise<ShortResult> {
  const cacheKey = `${kind}|${title.toLowerCase()}|${year}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const apiKey = ytKey();
  if (!apiKey) return watchFallback(title, year); // never cache key-less fallbacks

  try {
    const medium = kind === "tv" ? "series" : "movie";
    const nonLatin = isNonLatinTitle(title);
    // Weak (single-word) titles get quoted so "Run" doesn't match "run out".
    const subject = keywords(title).length <= 1 ? `"${title}"` : title;
    const queries = [
      `${subject} ${year} ${medium} best scene`,
      `${subject} ${medium} short`,
      `${subject} ${year} ${medium} dialogue scene`,
      ...(nonLatin
        ? [`${title} ${year} bollywood scene hindi`, `${title} ${year} movie scene`]
        : []),
    ];
    const settled = await Promise.allSettled(queries.map((q) => searchHits(apiKey, q)));
    const seen = new Map<string, SearchHit>();
    for (const s of settled) {
      if (s.status !== "fulfilled") continue;
      for (const h of s.value) if (!seen.has(h.id)) seen.set(h.id, h);
    }
    // Pre-gate on search snippet BEFORE spending videos quota.
    const gated = [...seen.values()].filter((h) => isAboutTitle(h, title, year));
    const ids = gated.slice(0, 30).map((h) => h.id);
    if (!ids.length) throw new Error("no relevant ids");

    const vUrl = new URL(`${YT_BASE}/videos`);
    vUrl.searchParams.set("part", "statistics,snippet,contentDetails");
    vUrl.searchParams.set("id", ids.join(","));
    vUrl.searchParams.set("key", apiKey);
    const vRes = await fetch(vUrl.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!vRes.ok) throw new Error(`YT videos ${vRes.status}`);
    const vData = await vRes.json();

    const keys = keywords(title);
    const candidates = ((vData.items || []) as YtVideo[])
      .map((v) => {
        const vTitle = v.snippet?.title || "";
        const vDesc = v.snippet?.description || "";
        const combined = `${vTitle} ${vDesc}`;
        const rel = relevance(vTitle, keys);
        const secs = durationSecs(v.contentDetails?.duration);
        const views = parseInt(v.statistics?.viewCount || "0", 10);
        const likes = parseInt(v.statistics?.likeCount || "0", 10);
        const comments = parseInt(v.statistics?.commentCount || "0", 10);
        // Short-form hook: hard-reject longform uploads masquerading as Shorts.
        const shortEnough = secs == null || secs <= 300;
        // Second gate at detail stage (snippet can differ from search data).
        const about = isAboutTitle(
          { id: v.id, title: vTitle, description: vDesc },
          title,
          year,
        );
        // Category gate: a title word inside Sports/Gaming/News/etc. is an
        // ad or off-topic upload, never the film. Film/Entertainment/Comedy
        // uploads get a ranking boost instead.
        const cat = v.snippet?.categoryId || "";
        const wrongShelf = REJECT_CATEGORIES.has(cat);
        const rightShelf = BOOST_CATEGORIES.has(cat) ? 3 : 0;
        // Ad gate: promo/sponsored uploads borrowing the title. One marker
        // with a weak title match = out; stacked markers = always out.
        const ads = adMarkers(clean(combined));
        const isAd = ads >= 2 || (ads >= 1 && rel < 1);
        const yearBonus = year && clean(vTitle).includes(` ${year} `) ? 2 : 0;
        const engagement = Math.log10(views + likes * 10 + comments * 20 + 10);
        return {
          v, rel, views, shortEnough, about,
          score: rel * 10 + yearBonus + rightShelf + engagement,
          usable: about && !wrongShelf && !isAd,
        };
      })
      // Must be about THIS title, on a film shelf, not an ad, and short
      // enough to embed as a hook.
      .filter(
        (c) =>
          c.usable &&
          c.rel >= (nonLatin || keys.length <= 1 ? 0 : 0.5) &&
          c.shortEnough,
      )
      .sort((a, b) => b.score - a.score);

    const top = candidates[0];
    if (!top) throw new Error("no relevant short");

    const result: ShortResult = {
      videoId: top.v.id,
      title: top.v.snippet?.title || null,
      channel: top.v.snippet?.channelTitle || null,
      views: top.views,
      thumbnail: `https://i.ytimg.com/vi/${top.v.id}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${top.v.id}`,
      // /watch works for Shorts AND regular uploads; /shorts/ 404s on non-Shorts.
      watchUrl: `https://www.youtube.com/watch?v=${top.v.id}`,
      fallback: false,
    };
    cacheSet(cacheKey, result);
    return result;
  } catch {
    return watchFallback(title, year); // transient — do NOT cache
  }
}
