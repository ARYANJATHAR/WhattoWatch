"use client";

/* Last-resort boundary for crashes inside the root layout itself, where
   error.tsx can't reach. Own <html>/<body> required. No app CSS here —
   inline styles only, since global CSS may be what broke. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#8584bd",
          color: "#f9f5f2",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            background: "#f9f5f2",
            color: "#1a1a1a",
            border: "2px solid #000",
            borderRadius: "6px",
            padding: "2rem 1.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              background: "#c94245",
              color: "#f9f5f2",
              display: "inline-block",
              borderRadius: "100px",
              padding: "0.35rem 0.9rem",
              border: "1px solid #000",
            }}
          >
            ★ REEL MALFUNCTION
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: "1rem 0 0.5rem" }}>
            THE PROJECTOR JAMMED
          </h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6, fontSize: "0.9rem" }}>
            The site hit an unrecoverable error. Try again — if it keeps
            happening, the show can&apos;t go on from this reel.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.6 }}>
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: "0.8rem 1.75rem",
              background: "#1a1a1a",
              color: "#f4ed36",
              border: "2px solid #000",
              borderRadius: "100px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
