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

Without keys the app runs on demo data.

## Scripts

- `npm run dev` — local dev
- `npm run build` — production build
- `npm run lint` — must be clean before pushing

## Deploy (Vercel)

Framework preset: Next.js. Add `TMDB_API_KEY` and `YT_API_KEY` as
Production + Preview environment variables. No database required.

⚠️ YouTube quota: one full results page costs ~1,500 units of the 10,000/day
default. Watch usage in Google Cloud Console after launch.
