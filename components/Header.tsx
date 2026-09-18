"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#8584bd]/95 border-b border-[#1a1a1a]/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-[17px] flex items-center justify-between gap-4">
        <Link href="/quiz" className="mono-tag text-[#f9f5f2] hover:text-[#f4ed36] transition-colors">
          ★ Take the quiz
        </Link>

        <Link href="/" className="font-poster text-[30px] leading-none text-[#f4ed36] text-center tracking-wide">
          WHATOWATCH
        </Link>

        <div className="flex items-center gap-4">
          <span className="mono-tag hidden md:inline text-[#f9f5f2]/80">
            6 Qs · 5 Picks · 1 Night
          </span>
          <Link href="/quiz" className="btn-gate !py-2.5 !px-5 !text-sm">
            Find a watch
          </Link>
        </div>
      </div>
    </header>
  );
}
