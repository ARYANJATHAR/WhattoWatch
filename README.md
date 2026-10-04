# WhatoWatch — Stop scrolling. Start watching.

Answer 6 quick questions (format, mood, time, genres, language, subscriptions)
and get exactly 5 movie/series picks, each with its most-hyped YouTube Short.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

| Variable               | Where to get it                                              |
| ---------------------- | ------------------------------------------------------------ |
| `TMDB_API_KEY`         | https://www.themoviedb.org/settings/api                     |
| `YT_API_KEY`           | Google Cloud Console → YouTube Data API v3 (quota: 10k units/day) |
| `NEXT_PUBLIC_SITE_URL` | Optional — pins the canonical domain (defaults to Vercel's deployment URL) |
| `UPSTASH_REDIS_REST_URL` | HTTPS Redis REST endpoint; required for live production APIs |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST credential; server-side only |
| `SHORTS_SIGNING_SECRET` | Random secret of at least 32 characters; required for embedded clips |
| `TRUSTED_CLIENT_IP_HEADER` | Optional, only for a header your ingress strips and overwrites with one verified client IP |

Without keys the app runs on demo data.

Generate the signing secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
All server instances must use the same signing secret and Redis store. Redis access
must permit GET, SET and EVAL. Paid YouTube searches require the store in every
environment. If the store or signing secret is missing, clips fall back to YouTube
search links. Live production recommendation requests return 503 when the store is
missing or unavailable. Demo mode remains available without Redis.

Vercel uses its platform client-IP header automatically. On other hosts, configure
the trusted header only after verifying ingress overwrites it. Without one, requests
share an `unknown` identity; caller-supplied forwarding chains are never trusted.

## Scripts

- `npm run dev` — local dev
- `npm run build` — production build
- `npm run lint` — must be clean before pushing
- `npm run test:security` — security regression checks with mocked upstreams

## Deploy (Vercel)

Framework preset: Next.js. Add `TMDB_API_KEY` and `YT_API_KEY` as
Production + Preview environment variables, together with both Redis variables and
`SHORTS_SIGNING_SECRET`. No application database is required; Redis stores security
counters, locks and clip-cache entries. Restrict provider API keys to their intended
APIs and monitor the provider quota independently.

YouTube searches reserve 100 units each and video-detail requests reserve 1 unit.
The app atomically caps its usage at 8,000 units per Pacific calendar day, leaving
headroom within the standard 10,000-unit quota. Other applications using the same
Google project are outside this counter. Successful clips are cached for 7 days;
fallbacks for 60 seconds. Duplicate in-flight requests share work or use a fallback.

Recommendation work is capped at 32 upstream requests and 12 unique detail lookups,
with an 18-second overall deadline and at most 3 concurrent detail requests per
workflow. Repeated normalized results are cached locally for 5 minutes.

Pages use per-request script nonces and an enforced Content Security Policy, so
HTML is dynamically rendered. Inline styles remain allowed for React animations;
production scripts do not permit unsafe-inline or unsafe-eval.

## Hardcoded data

Without `TMDB_API_KEY`, the five demo titles are 3 Idiots, Andhadhun, The Dark Knight,
Dangal, and Scam 1992, with fixed years, ratings and placeholder metadata. Live
titles, ratings, posters, descriptions, runtimes and streaming availability come
from TMDB. Clip metadata comes from YouTube.

Quiz labels, genre/provider ID mappings, mood mappings, scoring weights, filtering
thresholds and India (`IN`) as the streaming region are fixed product rules. Hindi
queries also include Indian-origin titles; they do not guarantee Hindi audio.
Branding, social/contact links and the fallback canonical URL are static. Set
`NEXT_PUBLIC_SITE_URL` to override the latter.

## Development dependency mitigation

Next.js and its ESLint config are pinned to 16.3.8. Patched brace-expansion versions
are enforced through npm overrides. `braces` 3.0.3 has no published patched release
for GHSA-vfj7-8cjw-p6xm, so the postinstall script reproducibly bounds parser nesting
to 64 AST levels before recursive compilation/expansion. Normal glob patterns are
covered by regression checks. Do not skip install scripts; `npm run test:security`
will fail if this patch is missing. npm audit may still report the braces advisory
and its dependency chain because it checks package versions, not the local patch.
Review and remove the mitigation when a supported upstream fix becomes available.
