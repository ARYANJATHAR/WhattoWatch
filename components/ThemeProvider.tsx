"use client";

import { createContext, useContext } from "react";

/* Flying Papers is a single-stage violet theme — no dark/light toggle.
   Kept as a passthrough so existing imports keep working. */

const ThemeCtx = createContext<{ theme: "light"; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

/** No-op: the violet stage needs no pre-paint class. */
export function ThemeScript() {
  return null;
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeCtx.Provider value={{ theme: "light", toggle: () => {} }}>
      {children}
    </ThemeCtx.Provider>
  );
}
