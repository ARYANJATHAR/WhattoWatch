import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-[#f9f5f2] mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div>
          <p className="font-poster text-2xl leading-none text-[#f4ed36]">
            WHATOWATCH
          </p>
          <p className="mono-micro mt-2 text-[#f9f5f2]/80 max-w-[52ch]">
            5 picks, 5 hooks. Ratings and posters by TMDB — this product uses
            the TMDB API but is not endorsed or certified by TMDB. Hooks play
            from YouTube, credit to the creators.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/quiz" className="mono-tag text-[#f9f5f2] hover:text-[#f4ed36] transition-colors">
            Take the quiz
          </Link>
          <Link
            href="/results?mood=thrill&format=either"
            className="mono-tag text-[#f9f5f2] hover:text-[#f4ed36] transition-colors"
          >
            Surprise me
          </Link>
          <a href="https://github.com/ARYANJATHAR" target="_blank" rel="me noreferrer" className="mono-tag text-[#f9f5f2] hover:text-[#f4ed36] transition-colors">
            GitHub
          </a>
          <a href="https://x.com/ARYANJATHAR4" target="_blank" rel="me noreferrer" className="mono-tag text-[#f9f5f2] hover:text-[#f4ed36] transition-colors">
            X
          </a>
          <a href="https://www.linkedin.com/in/aryanjathar07/" target="_blank" rel="me noreferrer" className="mono-tag text-[#f9f5f2] hover:text-[#f4ed36] transition-colors">
            LinkedIn
          </a>
          <span className="mono-tag text-[#f9f5f2]/50">© 2026</span>
        </div>
      </div>
      <div className="bg-[#c94245] px-4 sm:px-6 py-2 overflow-hidden">
        <p className="mono-tag text-[#f9f5f2] text-center whitespace-nowrap overflow-hidden text-ellipsis">
          STOP SCROLLING ★ START WATCHING ★ STOP SCROLLING ★ START WATCHING ★ STOP SCROLLING ★ START WATCHING
        </p>
      </div>
    </footer>
  );
}
