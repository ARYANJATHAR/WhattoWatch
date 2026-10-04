import type { Metadata, Viewport } from "next";
import { Anton, Archivo, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ThemeProvider from "../components/ThemeProvider";
import { siteUrl } from "../lib/site";
import { connection } from "next/server";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const bodyBold = Archivo({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-body-bold" });
const ui = Inter({ subsets: ["latin"], variable: "--font-ui" });
const mono = JetBrains_Mono({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-mono2" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "WhatoWatch — Stop scrolling. Start watching.",
  description:
    "Answer 6 quick questions and get exactly 5 movie/series picks, each with its most-hyped YouTube Short. A Saturday-morning cartoon confessional for the chronically indecisive.",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "WhatoWatch — Stop scrolling. Start watching.",
    description:
      "6 questions. 5 picks. 5 hype Shorts. One decision. Tonight's watch, sorted.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "WhatoWatch" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatoWatch — Stop scrolling. Start watching.",
    description:
      "6 questions. 5 picks. 5 hype Shorts. One decision. Tonight's watch, sorted.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#8584bd",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nonces must be generated per request, never embedded in a static page.
  await connection();
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${display.variable} ${bodyBold.variable} ${ui.variable} ${mono.variable} min-h-full flex flex-col bg-[#8584bd] text-[#f9f5f2]`}
      >
        <ThemeProvider>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
