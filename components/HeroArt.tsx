"use client";

import { motion } from "framer-motion";

/* Flat cartoon mascot — thick black outlines, 3 flat fills, no gradients/shading.
   A loud popcorn bucket peeking through the poster type. */
export function Mascot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 340" className={className} role="img" aria-label="WhatoWatch popcorn mascot">
      {/* body bucket */}
      <path
        d="M70 120 L250 120 L225 300 L95 300 Z"
        fill="#f9f5f2"
        stroke="#000000"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      {/* red stripes */}
      <path d="M115 120 L125 300 L150 300 L145 120 Z" fill="#c94245" stroke="#000000" strokeWidth="5" strokeLinejoin="round" />
      <path d="M175 120 L170 300 L195 300 L205 120 Z" fill="#c94245" stroke="#000000" strokeWidth="5" strokeLinejoin="round" />
      {/* popcorn puffs */}
      <g stroke="#000000" strokeWidth="6" strokeLinejoin="round">
        <circle cx="105" cy="95" r="26" fill="#f4ed36" />
        <circle cx="145" cy="75" r="30" fill="#f9f5f2" />
        <circle cx="185" cy="78" r="28" fill="#f4ed36" />
        <circle cx="222" cy="98" r="24" fill="#f9f5f2" />
        <circle cx="160" cy="105" r="24" fill="#f8c1ba" />
      </g>
      {/* face */}
      <g>
        <ellipse cx="135" cy="200" rx="14" ry="18" fill="#000000" />
        <ellipse cx="185" cy="200" rx="14" ry="18" fill="#000000" />
        <circle cx="139" cy="194" r="5" fill="#f9f5f2" />
        <circle cx="189" cy="194" r="5" fill="#f9f5f2" />
        {/* grin */}
        <path
          d="M125 240 Q160 268 195 240"
          fill="none"
          stroke="#000000"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* blush */}
        <ellipse cx="110" cy="228" rx="10" ry="7" fill="#f8c1ba" />
        <ellipse cx="210" cy="228" rx="10" ry="7" fill="#f8c1ba" />
      </g>
      {/* arms */}
      <path d="M70 190 Q40 200 45 235" fill="none" stroke="#000000" strokeWidth="7" strokeLinecap="round" />
      <path d="M250 190 Q280 200 275 235" fill="none" stroke="#000000" strokeWidth="7" strokeLinecap="round" />
      <circle cx="45" cy="240" r="10" fill="#b5c995" stroke="#000000" strokeWidth="5" />
      <circle cx="275" cy="240" r="10" fill="#b5c995" stroke="#000000" strokeWidth="5" />
      {/* ticket */}
      <g transform="rotate(12 262 280)">
        <rect x="232" y="258" width="64" height="34" rx="4" fill="#f4ed36" stroke="#000000" strokeWidth="5" />
        <text x="264" y="281" textAnchor="middle" fontFamily="monospace" fontWeight="700" fontSize="14" fill="#000000">
          ADMIT
        </text>
      </g>
    </svg>
  );
}

export function Confetti({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      <g stroke="#000000" strokeWidth="4">
        <rect x="10" y="20" width="26" height="26" rx="4" fill="#f4ed36" transform="rotate(-12 23 33)" />
        <circle cx="70" cy="30" r="14" fill="#f8c1ba" />
        <rect x="100" y="15" width="34" height="18" rx="4" fill="#b5c995" transform="rotate(10 117 24)" />
        <circle cx="160" cy="55" r="12" fill="#f9f5f2" />
        <rect x="30" y="70" width="30" height="16" rx="4" fill="#ac4f98" transform="rotate(-8 45 78)" />
        <circle cx="110" cy="85" r="13" fill="#f9cc73" />
        <rect x="150" y="80" width="26" height="26" rx="4" fill="#c94245" transform="rotate(14 163 93)" />
      </g>
    </svg>
  );
}

export default function HeroArt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="relative flex justify-center"
      aria-hidden
    >
      <div className="animate-float">
        <Mascot className="w-64 sm:w-80 md:w-[380px] h-auto drop-shadow-none" />
      </div>
      <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
        <div className="bg-[#1a1a1a] text-[#f4ed36] rounded-full px-5 py-2 border-2 border-black">
          <span className="mono-tag">★ Top hook this week · 8.7 · 2.4M watched the short first</span>
        </div>
      </div>
    </motion.div>
  );
}
