# WhatoWatch

**Stop scrolling. Start watching.**

WhatoWatch helps you choose a movie or series through six quick questions about format, mood, time, genres, language, and streaming subscriptions. It gives you five recommendations with TMDB ratings, streaming availability in India, and YouTube Shorts or search links to preview each pick.

Built with Next.js, React, TypeScript, and Tailwind CSS. No account is required.

## Run locally

Install Node.js and npm, then run:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Without API keys, the app uses demo recommendations.

For live movie data, set `TMDB_API_KEY` in `.env.local`. For embedded YouTube previews, also set `YT_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and a `SHORTS_SIGNING_SECRET` of at least 32 characters. Without the clip configuration, previews fall back to YouTube search links. Live production recommendations also require the Redis configuration.

For a production build, run `npm run build`, then `npm start`.
