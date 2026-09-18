"use client";

import Link from "next/link";
import { ArrowRight, Brain, Coffee, Drop, Lightning, Smiley } from "@phosphor-icons/react";
import Reveal from "./Reveal";

const MARQUEE = [
  "Thriller night",
  "Feel-good comedy",
  "Mind-bending sci-fi",
  "True-crime binge",
  "Cozy romance",
  "Under-90-minutes",
  "Critics darling",
  "Cult classic",
];

const MOODS = [
  { icon: Smiley, label: "Laugh it out", sub: "Comedies & feel-good chaos", bg: "#b5c995", ink: "#1a1a1a" },
  { icon: Lightning, label: "Heart racing", sub: "Thrillers, crime, horror", bg: "#f9f5f2", ink: "#1a1a1a" },
  { icon: Drop, label: "In your feelings", sub: "Dramas that land", bg: "#f8c1ba", ink: "#1a1a1a" },
  { icon: Brain, label: "Think sideways", sub: "Sci-fi & mysteries", bg: "#ac4f98", ink: "#f9f5f2" },
  { icon: Coffee, label: "Switch off", sub: "Easy, cozy rewatches", bg: "#c94245", ink: "#f9f5f2" },
];

export function Marquee() {
  return (
    <section className="bg-[#c94245] border-y-2 border-black overflow-hidden py-3" aria-hidden>
      <div className="flex w-max animate-marquee gap-8 pr-8">
        {[...MARQUEE, ...MARQUEE].map((m, i) => (
          <span
            key={i}
            className="mono-tag !text-[13px] text-[#f9f5f2] whitespace-nowrap flex items-center gap-8"
          >
            {m} <span className="text-[#f4ed36]">★</span>
          </span>
        ))}
      </div>
    </section>
  );
}

export function MoodRail() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
      <Reveal>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-poster text-4xl md:text-6xl leading-[0.95] text-[#f4ed36]">
            PICK A MOOD,
            <br />
            <span className="text-[#f9cc73]">WE DO THE REST</span>
          </h2>
          <Link href="/quiz" className="link-underline hidden sm:inline-flex items-center gap-1.5">
            Start quiz <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </Reveal>
      <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {MOODS.map((m, i) => (
          <Reveal key={m.label} delay={0.06 * i} className="shrink-0">
            <Link
              href="/quiz"
              className="confetti-card card-hover group flex items-center gap-4 w-72 border-2 border-black"
              style={{ background: m.bg, color: m.ink }}
            >
              <span className="grid place-items-center w-12 h-12 rounded-[6px] border-2 border-black bg-[#f9f5f2] text-black shrink-0">
                <m.icon size={22} weight="duotone" />
              </span>
              <span>
                <span className="mono-tag block">{m.label}</span>
                <span className="block text-sm mt-1.5 font-medium opacity-90">{m.sub}</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
