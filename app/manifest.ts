import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhatoWatch — Stop scrolling. Start watching.",
    short_name: "WhatoWatch",
    description:
      "6 questions. 5 picks. 5 hype Shorts. One decision. Tonight's watch, sorted.",
    start_url: "/",
    display: "standalone",
    background_color: "#8584bd",
    theme_color: "#8584bd",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
