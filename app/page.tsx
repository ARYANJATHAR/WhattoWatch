"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import HeroArt, { Confetti } from "@/components/HeroArt";
import Reveal from "@/components/Reveal";
import { Marquee, MoodRail } from "@/components/LandingExtras";

const STEPS = [
  {
    n: "01",
    title: "TELL US THE MOOD",
    body: "Movie or series, the vibe you are chasing, how much time you have, the languages you watch in, and the subscriptions you actually pay for. Sixty seconds, no account.",
    bg: "#b5c995",
    ink: "#1a1a1a",
  },
  {
    n: "02",
    title: "GET EXACTLY FIVE PICKS",
    body: "Grounded in real TMDB ratings and filtered to what is streaming on your OTTs tonight. No infinite grid, no forty-minute scroll before you press play.",
    bg: "#f9f5f2",
    ink: "#1a1a1a",
  },
  {
    n: "03",
    title: "FEEL THE HOOK, COMMIT",
    body: "Every pick carries its highest-engagement YouTube Short. Watch five thirty-second hooks, feel which one grabs you, and that is your evening sorted.",
    bg: "#f8c1ba",
    ink: "#1a1a1a",
  },
];

export default function Home() {
  return (
    <main className="bg-[#8584bd]">
      {/* ---------- Poster hero ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-14 md:pt-12 md:pb-20 text-center">
        <p className="mono-tag inline-block border border-[#f9f5f2]/60 rounded-full px-4 py-2 text-[#f9f5f2]">
          ★ For the chronically indecisive
        </p>

        <h1 className="font-poster mt-6 leading-[0.95] text-[clamp(56px,10vw,160px)]">
          <span className="hero-line text-[#f4ed36]">STOP</span>
          <span className="hero-line text-[#f9cc73]">SCROLLING.</span>
          <span className="hero-line text-[#f4ed36]">START</span>
          <span className="hero-line text-[#f9f5f2]">WATCHING.</span>
        </h1>

        <div className="mt-4 flex justify-center">
          <HeroArt />
        </div>

        <p className="mono-micro mx-auto mt-8 max-w-[56ch] text-[#f9f5f2]">
          Answer 6 quick questions about your mood, time, and subscriptions.
          WhatoWatch hands you exactly 5 fitting picks — each with its
          most-hyped YouTube Short, so a 30-second hook decides for you.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link href="/quiz" className="btn-gate">
            Find my 5 picks <ArrowRight size={18} weight="bold" />
          </Link>
          <Link href="/results?mood=thrill&format=either" className="btn-outline">
            Surprise me
          </Link>
        </div>
        <div className="mt-4">
          <Link href="#how" className="link-underline">
            or skip the quiz, surprise me ↓
          </Link>
        </div>

        <dl className="mx-auto mt-10 flex items-center justify-center gap-8 max-w-md">
          {[
            ["6", "questions"],
            ["5", "picks, no more"],
            ["30s", "per hook"],
          ].map(([v, l]) => (
            <div key={l} className="text-center">
              <dt className="sr-only">{l}</dt>
              <dd className="font-poster text-4xl text-[#f4ed36]">{v}</dd>
              <dd className="mono-tag mt-1 text-[#f9f5f2]/80">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Marquee />

      {/* ---------- How it works: confetti cards on violet ---------- */}
      <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16">
        <Reveal>
          <p className="mono-tag text-[#f4ed36]">★ How it works</p>
          <h2 className="font-poster mt-3 text-[clamp(36px,5vw,88px)] leading-[0.95] text-[#f9f5f2] max-w-[16ch]">
            FROM “WHAT SHOULD I WATCH?” TO PLAY IN 2 MIN
          </h2>
        </Reveal>
        <Confetti className="w-48 h-auto mt-6" />
        <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.06 * i}>
              <article
                className="confetti-card card-hover border-2 border-black min-h-[240px] flex flex-col justify-between"
                style={{ background: s.bg, color: s.ink }}
              >
                <div className="flex items-start justify-between">
                  <span className="mono-tag border border-current rounded-full px-3 py-1.5">
                    Step {s.n}
                  </span>
                  <span className="font-poster text-5xl leading-none opacity-25">{s.n}</span>
                </div>
                <div>
                  <h3 className="font-poster text-3xl leading-[0.9] mt-6">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-snug font-medium">{s.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Movie-night strip — what the night actually looks like */}
        <Reveal className="mt-10">
          <div className="dark-text-card">
            <p className="font-bold-body text-base text-[#1a1a1a]">★ TONIGHT&apos;S FEATURE PRESENTATION</p>
            <p className="mono-micro mt-1 text-[#1a1a1a]/70">
              No endless grid. No forty-minute scroll. Just the reel.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="confetti-card card-hover border-2 border-black bg-[#b5c995] text-[#1a1a1a]">
                <p className="mono-tag">Reel 01 ★ Real ratings</p>
                <p className="font-poster mt-2 text-2xl leading-[0.95]">TMDB-POWERED, NO FILLER</p>
                <p className="mt-2 text-sm font-medium">Only titles rated 6.5+ by thousands of viewers make the cut.</p>
              </div>
              <div className="confetti-card card-hover border-2 border-black bg-[#f4ed36] text-black">
                <p className="mono-tag">Reel 02 ★ Your OTTs only</p>
                <p className="font-poster mt-2 text-2xl leading-[0.95]">STREAMING WHERE YOU PAY</p>
                <p className="mt-2 text-sm font-medium">Every pick is filtered to Netflix, Prime, Hotstar &amp; co. — playable tonight.</p>
              </div>
              <div className="confetti-card card-hover border-2 border-black bg-[#f8c1ba] text-[#1a1a1a]">
                <p className="mono-tag">Reel 03 ★ 30-sec hooks</p>
                <p className="font-poster mt-2 text-2xl leading-[0.95]">WATCH THE SHORT, FEEL IT</p>
                <p className="mt-2 text-sm font-medium">Five hype Shorts, one gut reaction. The one that grabs you wins.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <MoodRail />
    </main>
  );
}
