"use client";

import Link from "next/link";
import { GithubLogo, LinkedinLogo, XLogo } from "@phosphor-icons/react";

const SOCIALS = [
  { href: "https://github.com/ARYANJATHAR", label: "GitHub", Icon: GithubLogo },
  { href: "https://x.com/ARYANJATHAR4", label: "X", Icon: XLogo },
  { href: "https://www.linkedin.com/in/aryanjathar07/", label: "LinkedIn", Icon: LinkedinLogo },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#8584bd]/95 border-b border-[#1a1a1a]/15">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-[17px] flex items-center justify-between gap-4 min-h-[68px]">
        <Link
          href="/quiz"
          className="mono-tag hidden md:inline text-[#f9f5f2] hover:text-[#f4ed36] transition-colors"
        >
          ★ Take the quiz
        </Link>
        {/* Spacer keeps the right-side pill from crowding on mobile */}
        <span className="md:hidden w-10" aria-hidden />

        {/* True optical center regardless of side-item widths */}
        <Link
          href="/"
          className="font-poster absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[26px] sm:text-[30px] leading-none tracking-wide text-[#f4ed36] text-center whitespace-nowrap"
        >
          WHATOWATCH
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="mono-tag hidden lg:inline text-[#f9f5f2]/80">
            6 Qs · 5 Picks · 1 Night
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            {SOCIALS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="me noreferrer"
                aria-label={label}
                className="grid place-items-center w-9 h-9 rounded-full border border-[#f9f5f2]/40 text-[#f9f5f2] transition-colors hover:text-[#f4ed36] hover:border-[#f4ed36]"
              >
                <Icon size={17} weight="bold" />
              </a>
            ))}
          </span>
          <Link href="/quiz" className="btn-gate !py-2.5 !px-5 !text-sm">
            Find a watch
          </Link>
        </div>
      </div>
    </header>
  );
}
