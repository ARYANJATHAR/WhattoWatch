export type QuizAnswers = {
  format: "movie" | "tv" | "either";
  mood: "laugh" | "thrill" | "cry" | "mindbend" | "chill";
  time: "short" | "standard" | "binge" | "any";
  genres: string[]; // TMDB genre ids as strings
  language: "hi" | "en" | "either";
  providers: string[]; // TMDB provider ids as strings
};

export type Pick = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  year: string;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  rating: number;
  voteCount: number;
  runtimeOrSeasons: string;
  genres: string[];
  providers: { id: number; name: string; logo: string | null }[];
  hookLine: string;
};

export type ShortResult = {
  videoId: string | null;
  title: string | null;
  channel: string | null;
  views: number | null;
  thumbnail: string | null;
  embedUrl: string | null;
  watchUrl: string;
  fallback: boolean;
};

/* Complete movie + TV genre buckets. Every id in MOOD_MAP and in the
   quiz picker MUST resolve here, or chips render blank. */
export const GENRE_MAP: Record<string, string> = {
  "28": "Action",
  "12": "Adventure",
  "16": "Animation",
  "35": "Comedy",
  "80": "Crime",
  "99": "Documentary",
  "18": "Drama",
  "10751": "Family",
  "14": "Fantasy",
  "36": "History",
  "27": "Horror",
  "10402": "Music",
  "9648": "Mystery",
  "10749": "Romance",
  "878": "Sci-Fi",
  "10770": "TV Movie",
  "53": "Thriller",
  "10752": "War",
  "37": "Western",
  "10759": "Action-Adventure",
  "10762": "Kids",
  "10763": "News",
  "10764": "Reality",
  "10765": "Sci-Fi & Fantasy",
  "10766": "Soap",
  "10767": "Talk",
  "10768": "War & Politics",
};

export const PROVIDER_MAP: Record<string, string> = {
  "8": "Netflix",
  "119": "Prime Video",
  "2336": "JioHotstar",
  "232": "Zee5",
  "237": "SonyLIV",
};

/** Legacy TMDB ids from older deployments / bookmarked URLs. */
const PROVIDER_ALIASES: Record<string, string> = {
  "9": "119",
  "122": "2336",
  "121": "2336",
};

export function normalizeProviders(ids: string[]): string[] {
  const valid = new Set(Object.keys(PROVIDER_MAP));
  return [
    ...new Set(
      ids
        .map((id) => PROVIDER_ALIASES[id] || id)
        .filter((id) => valid.has(id)),
    ),
  ];
}

/** Resolve contradictory format/time pairs before hitting TMDB. */
export function resolveQuizConflicts(a: QuizAnswers): QuizAnswers {
  let { format, time } = a;
  if (format === "movie" && time === "binge") time = "any";
  if (format === "tv" && (time === "short" || time === "standard")) time = "any";
  if (time === "binge" && format === "movie") format = "tv";
  if ((time === "short" || time === "standard") && format === "tv") format = "movie";
  return { ...a, format, time, providers: normalizeProviders(a.providers) };
}

export function normalizeQuizAnswers(a: QuizAnswers): QuizAnswers {
  return resolveQuizConflicts({ ...a, providers: normalizeProviders(a.providers) });
}

export function parseRecommendQuery(sp: URLSearchParams): {
  quiz: QuizAnswers;
  page: number;
} {
  const raw = parseInt(sp.get("page") || "1", 10);
  const page = Number.isFinite(raw) && raw >= 1 && raw <= 20 ? raw : 1;
  return { quiz: normalizeQuizAnswers(searchParamsToQuiz(sp)), page };
}

// Mood → TMDB genre ids + sort
export const MOOD_MAP: Record<
  QuizAnswers["mood"],
  { genres: string; sort: string; keywords?: string }
> = {
  laugh: { genres: "35,16,10751", sort: "popularity.desc" },
  thrill: { genres: "28,53,80,27", sort: "vote_average.desc" },
  cry: { genres: "18,10749", sort: "vote_average.desc" },
  mindbend: { genres: "878,9648,53", sort: "vote_average.desc" },
  chill: { genres: "35,10749,12,16", sort: "popularity.desc" },
};

export function buildHookLine(
  mood: QuizAnswers["mood"],
  genres: string[],
  title: string,
): string {
  const moodLine: Record<QuizAnswers["mood"], string> = {
    laugh: "need a laugh",
    thrill: "want your heart racing",
    cry: "are in your feelings",
    mindbend: "want to think sideways",
    chill: "want to switch off",
  };
  const g = genres.slice(0, 2).join(" + ") || "a crowd-pleaser";
  return `Because you ${moodLine[mood]}: ${title} is ${g}.`;
}

export function quizToSearchParams(a: QuizAnswers): URLSearchParams {
  const p = new URLSearchParams();
  p.set("format", a.format);
  p.set("mood", a.mood);
  p.set("time", a.time);
  p.set("genres", a.genres.join(","));
  p.set("language", a.language);
  p.set("providers", a.providers.join(","));
  return p;
}

const FORMATS = ["movie", "tv", "either"] as const;
const MOODS = ["laugh", "thrill", "cry", "mindbend", "chill"] as const;
const TIMES = ["short", "standard", "binge", "any"] as const;
const LANGS = ["hi", "en", "either"] as const;

function oneOf<T extends string>(v: string | null, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(v || "") ? (v as T) : fallback;
}

export function searchParamsToQuiz(sp: URLSearchParams): QuizAnswers {
  // Only numeric TMDB ids survive — junk can never reach the API query.
  const splitIds = (v: string | null) =>
    v ? v.split(",").filter((x) => /^\d+$/.test(x)) : [];
  return {
    format: oneOf(sp.get("format"), FORMATS, "either"),
    mood: oneOf(sp.get("mood"), MOODS, "chill"),
    time: oneOf(sp.get("time"), TIMES, "any"),
    genres: splitIds(sp.get("genres")).slice(0, 3),
    language: oneOf(sp.get("language"), LANGS, "either"),
    providers: normalizeProviders(splitIds(sp.get("providers"))),
  };
}
