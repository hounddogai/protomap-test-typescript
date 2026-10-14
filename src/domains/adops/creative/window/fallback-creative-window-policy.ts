import * as numbers from "../../../../kit/numbers.js";

export function fallbackCreativeWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a fallback creative window code in its canonical FCW- form. */
export function normalizeFallbackCreativeWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCW-")) return clean;
  return `FCW-${clean.replaceAll(" ", "-")}`;
}
