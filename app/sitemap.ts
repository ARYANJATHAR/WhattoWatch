import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  // /results is query-driven (not indexed) — only static pages listed.
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/quiz`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
