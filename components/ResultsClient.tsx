"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowClockwise,
  ArrowLeft,
  Check,
  Play,
  Popcorn,
  ShareNetwork,
  Star,
  Ticket,
  WarningCircle,
  YoutubeLogo,
} from "@phosphor-icons/react";
import type { Pick, ShortResult } from "@/lib/quiz";

const EASE = [0.16, 1, 0.3, 1] as const;

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const card = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 90, damping: 20 },
  },
};

/* One accent per card, rotated — never two accents side by side in one row */
const CARD_SKINS = [
  { bg: "#f9f5f2", ink: "#1a1a1a" },
  { bg: "#61609a", ink: "#f9f5f2" },
  { bg: "#b5c995", ink: "#1a1a1a" },
  { bg: "#f9f5f2", ink: "#1a1a1a" },
  { bg: "#f8c1ba", ink: "#1a1a1a" },
];

function formatViews(v: number | null) {
  if (v == null) return "engagement loading";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M views`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K views`;
  return `${v} views`;
}

function ShortBox({ title, year, kind }: { title: string; year: string; kind: "movie" | "tv" }) {
  const [short, setShort] = useState<ShortResult | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/shorts?title=${encodeURIComponent(title)}&year=${encodeURIComponent(year)}&kind=${kind}`)
      .then((r) => r.json())
      .then((d) => {
        if (live) setShort(d.short);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [title, year, kind]);

  if (!short)
    return (
      <div className="w-full lg:w-60 shrink-0">
        <div className="shimmer-mask aspect-[9/16] max-h-80 w-full lg:max-h-none rounded-[6px] border-2 border-black bg-[#1a1a1a]/20" />
        <p className="mono-tag mt-2 opacity-70">Hunting the hype Short…</p>
      </div>
    );

  if (!short.embedUrl)
    return (
      <div className="w-full lg:w-60 shrink-0 aspect-[9/16] max-h-80 lg:max-h-none rounded-[6px] border-2 border-dashed border-black/60 p-5 flex flex-col justify-between bg-white/40">
        <div>
          <YoutubeLogo size={26} weight="duotone" />
          <p className="mono-micro mt-2">No embeddable Short surfaced for this one yet.</p>
        </div>
        <a
          href={short.watchUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-gate !text-sm justify-center text-center"
        >
          Search Shorts on YouTube
        </a>
      </div>
    );

  if (!playing && short.thumbnail) {
    return (
      <div className="w-full lg:w-60 shrink-0">
        <button
          onClick={() => setPlaying(true)}
          aria-label={`Play hype Short for ${title}`}
          className="group relative block aspect-[9/16] max-h-80 lg:max-h-none w-full rounded-[6px] overflow-hidden bg-black border-2 border-black text-left active:scale-[0.98] transition-transform duration-300"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={short.thumbnail}
            alt={`${title} Short thumbnail`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid place-items-center w-14 h-14 rounded-full bg-[#f4ed36] text-black border-2 border-black transition-transform duration-300 group-hover:scale-110">
              <Play size={24} weight="fill" />
            </span>
          </span>
          <span className="absolute bottom-3 left-3 right-3 text-xs font-semibold text-white leading-snug line-clamp-2">
            {short.title}
          </span>
        </button>
        <p className="mono-tag mt-2 truncate opacity-80">{short.channel}</p>
        <p className="mono-tag opacity-60">
          {formatViews(short.views)} · top engagement pick
        </p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-60 shrink-0">
      <div className="aspect-[9/16] max-h-80 lg:max-h-none w-full rounded-[6px] overflow-hidden bg-black border-2 border-black">
        <iframe
          src={`${short.embedUrl}?autoplay=1&rel=0`}
          title={`${title} Short`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="mono-tag mt-2 truncate opacity-80">{short.channel}</p>
      <p className="mono-tag opacity-60">
        {formatViews(short.views)} · top engagement pick
      </p>
      <a
        href={short.watchUrl}
        target="_blank"
        rel="noreferrer"
        className="link-underline inline-flex items-center gap-1 mt-1"
      >
        <YoutubeLogo size={14} weight="fill" /> Open on YouTube
      </a>
    </div>
  );
}

function ResultCard({ pick, rank, skin }: { pick: Pick; rank: number; skin: { bg: string; ink: string } }) {
  return (
    <motion.article
      variants={card}
      className="rounded-[6px] border-2 border-black p-[17px] md:p-6 relative overflow-hidden"
      style={{ background: skin.bg, color: skin.ink }}
    >
      <span
        aria-hidden
        className="font-poster pointer-events-none select-none absolute -top-3 right-3 text-7xl md:text-8xl opacity-15"
      >
        {String(rank).padStart(2, "0")}
      </span>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {pick.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pick.poster}
            alt={`${pick.title} poster`}
            loading="lazy"
            className="w-32 md:w-44 rounded-[6px] shrink-0 self-start border-2 border-black"
          />
        ) : (
          <div className="w-32 md:w-44 aspect-[2/3] rounded-[6px] bg-[#1a1a1a]/10 border-2 border-black shrink-0 grid place-items-center p-3 text-center text-sm">
            <span className="flex flex-col items-center gap-2">
              <Popcorn size={22} weight="duotone" /> {pick.title}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="mono-tag">
            ★ Pick {String(rank).padStart(2, "0")} · {pick.mediaType === "tv" ? "Series" : "Film"}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-poster text-3xl md:text-5xl leading-[0.95]">
              {pick.title}
            </h3>
            <span className="mono-tag opacity-70">{pick.year}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="mono-tag inline-flex items-center gap-1 rounded-full bg-[#f4ed36] text-black border border-black px-3 py-1.5">
              <Star size={13} weight="fill" /> {pick.rating.toFixed(1)}
            </span>
            {pick.runtimeOrSeasons !== "—" && (
              <span className="mono-tag rounded-full border border-current px-3 py-1.5 opacity-80">
                {pick.runtimeOrSeasons}
              </span>
            )}
            {pick.genres.map((g) => (
              <span key={g} className="mono-tag rounded-full border border-current px-3 py-1.5 opacity-80">
                {g}
              </span>
            ))}
          </div>

          <p className="mt-3 font-bold-body text-[16px]">{pick.hookLine}</p>
          <p className="mt-2 text-sm leading-relaxed line-clamp-3 max-w-[62ch] opacity-85">
            {pick.overview}
          </p>

          <div className="mt-4">
            {pick.providers.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono-tag opacity-60">Streaming on</span>
                {pick.providers.map((p) => (
                  <span
                    key={p.id}
                    className="mono-tag rounded-full bg-black/10 border border-current px-3 py-1.5"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mono-micro opacity-70">
                Availability varies by region — check your apps before you commit.
              </p>
            )}
          </div>
        </div>

        <div className="md:order-3">
          <ShortBox title={pick.title} year={pick.year} kind={pick.mediaType} />
        </div>
      </div>
    </motion.article>
  );
}

function Skeleton() {
  return (
    <div className="rounded-[6px] border-2 border-black bg-[#61609a] p-[17px] md:p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="shimmer-mask w-32 md:w-44 aspect-[2/3] rounded-[6px] bg-black/20" />
        <div className="flex-1 space-y-3">
          <div className="shimmer-mask h-4 w-24 rounded bg-black/20" />
          <div className="shimmer-mask h-8 w-2/3 rounded bg-black/20" />
          <div className="shimmer-mask h-4 w-full rounded bg-black/20" />
          <div className="shimmer-mask h-4 w-5/6 rounded bg-black/20" />
        </div>
        <div className="shimmer-mask w-full md:w-60 aspect-[9/16] max-h-60 rounded-[6px] bg-black/20" />
      </div>
    </div>
  );
}

export default function ResultsClient({ qs }: { qs: string }) {
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [relaxed, setRelaxed] = useState(false);
  const [copied, setCopied] = useState(false);

  function load(query: string) {
    setPicks(null);
    setError("");
    fetch(`/api/recommend?${query}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setPicks(d.picks);
          setDemo(!!d.demo);
          setRelaxed(!!d.relaxed);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "load failed"));
  }

  // Initial + quiz-change fetch. The sync resets below track fetch
  // lifecycle (loading → data), not derived render state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(qs);
  }, [qs]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this link:", window.location.href);
    }
  }

  if (error)
    return (
      <main className="bg-[#8584bd] mx-auto max-w-7xl px-4 sm:px-6 py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [...EASE] }}
          className="dark-text-card max-w-xl mx-auto text-center"
        >
          <WarningCircle size={36} weight="duotone" className="mx-auto" />
          <h2 className="font-poster mt-4 text-4xl text-[#1a1a1a]">THE PROJECTOR JAMMED</h2>
          <p className="mono-micro mt-2 text-[#1a1a1a]/80">{error}</p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button onClick={() => load(qs)} className="btn-gate !bg-[#1a1a1a] !text-[#f4ed36] !border-black">
              <ArrowClockwise size={17} weight="bold" /> Try again
            </button>
            <Link href="/quiz" className="btn-outline !text-[#1a1a1a] !border-[#1a1a1a]">
              <ArrowLeft size={17} weight="bold" /> Retake quiz
            </Link>
          </div>
        </motion.div>
      </main>
    );

  if (!picks)
    return (
      <main className="bg-[#8584bd] mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full">
        <p className="mono-tag flex items-center gap-2 text-[#f9f5f2]">
          <span className="w-2 h-2 rounded-full bg-[#f4ed36] animate-breathe" />
          Finding your 5 and hunting their hype Shorts…
        </p>
        <div className="mt-6 grid gap-6 md:gap-8">
          {[0, 1].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </main>
    );

  if (!picks.length)
    return (
      <main className="bg-[#8584bd] mx-auto max-w-7xl px-4 sm:px-6 py-16 w-full">
        <div className="dark-text-card max-w-xl mx-auto text-center">
          <Ticket size={36} weight="duotone" className="mx-auto" />
          <h2 className="font-poster mt-4 text-4xl text-[#1a1a1a]">NOTHING ON THIS REEL</h2>
          <p className="mono-micro mt-2 text-[#1a1a1a]/80">
            Those filters were too strict. Loosen the providers or vibes and spin again.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button onClick={() => load(qs)} className="btn-gate !bg-[#1a1a1a] !text-[#f4ed36]">
              <ArrowClockwise size={17} weight="bold" /> Spin again
            </button>
            <Link href="/quiz" className="btn-outline !text-[#1a1a1a] !border-[#1a1a1a]">
              <ArrowLeft size={17} weight="bold" /> Retake quiz
            </Link>
          </div>
        </div>
      </main>
    );

  return (
    <main className="bg-[#8584bd] mx-auto max-w-7xl px-4 sm:px-6 py-10 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="mono-tag text-[#f4ed36]">★ Your shortlist</p>
          <h2 className="font-poster mt-2 text-[clamp(44px,6vw,88px)] leading-[0.95]">
            <span className="hero-line text-[#f4ed36]">FIVE HOOKS.</span>
            <span className="hero-line text-[#f9f5f2]">ONE WINNER.</span>
          </h2>
          <p className="mono-micro mt-3 text-[#f9f5f2]">
            Watch the Shorts. The one that grabs you is tonight&apos;s answer.
            {demo && " (Demo data — add a TMDB key for live picks.)"}
            {!demo && relaxed && " (Strict filters matched nothing — showing genre matches beyond your OTTs.)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => load(`${qs}&r=${Date.now()}`)} className="btn-outline">
            <ArrowClockwise size={16} weight="bold" /> New 5
          </button>
          <button onClick={share} className="btn-outline">
            {copied ? <Check size={16} weight="bold" /> : <ShareNetwork size={16} weight="bold" />}
            {copied ? "Copied" : "Share"}
          </button>
          <Link href="/quiz" className="btn-gate">
            <ArrowLeft size={16} weight="bold" /> Retake quiz
          </Link>
        </div>
      </div>

      <motion.div variants={list} initial="hidden" animate="show" className="mt-8 grid gap-6 md:gap-8">
        {picks.map((p, i) => (
          <ResultCard key={`${p.id}-${i}`} pick={p} rank={i + 1} skin={CARD_SKINS[i % CARD_SKINS.length]} />
        ))}
      </motion.div>
    </main>
  );
}
