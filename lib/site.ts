/* Canonical site URL for sitemap/robots/OG absolute URLs.
   No custom domain needed: on Vercel, VERCEL_URL auto-resolves to the
   deployment URL. Set NEXT_PUBLIC_SITE_URL only to pin a canonical
   domain (custom domain or production vercel.app URL). */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://whatowatch.vercel.app";
  return raw.replace(/\/$/, "");
}
