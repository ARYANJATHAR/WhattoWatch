import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-[#8584bd] flex-1 grid place-items-center px-4 py-16">
      <div className="dark-text-card max-w-xl w-full text-center">
        <p className="mono-tag inline-block bg-[#61609a] text-[#f9f5f2] rounded-full px-3 py-1.5 border border-black">
          ★ Lost reel
        </p>
        <h2 className="font-poster mt-4 text-6xl leading-[0.95] text-[#1a1a1a]">
          OFF THE REEL
        </h2>
        <p className="mono-micro mt-3 text-[#1a1a1a]/70">
          This frame doesn&apos;t exist. Let&apos;s get you back to the show.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link href="/quiz" className="btn-gate !bg-[#1a1a1a] !text-[#f4ed36]">
            Take the quiz
          </Link>
          <Link href="/" className="btn-outline !text-[#1a1a1a] !border-[#1a1a1a]">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
