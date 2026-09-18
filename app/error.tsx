"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-[#8584bd] flex-1 grid place-items-center px-4 py-16">
      <div className="dark-text-card max-w-xl w-full text-center">
        <p className="mono-tag inline-block bg-[#c94245] text-[#f9f5f2] rounded-full px-3 py-1.5 border border-black">
          ★ Reel malfunction
        </p>
        <h2 className="font-poster mt-4 text-5xl leading-[0.95] text-[#1a1a1a]">
          THE PROJECTOR JAMMED
        </h2>
        <p className="mono-micro mt-3 text-[#1a1a1a]/70">
          {error.message || "Something broke mid-reel. The usher has been notified."}
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <button onClick={reset} className="btn-gate !bg-[#1a1a1a] !text-[#f4ed36]">
            Try again
          </button>
          <Link href="/" className="btn-outline !text-[#1a1a1a] !border-[#1a1a1a]">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
