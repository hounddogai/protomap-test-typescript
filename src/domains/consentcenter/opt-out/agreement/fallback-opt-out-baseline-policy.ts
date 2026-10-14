import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback opt out baseline code in its canonical FOOB- form. */
export function normalizeFallbackOptOutBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FOOB-")) return clean;
  return `FOOB-${clean.replaceAll(" ", "-")}`;
}

export function fallbackOptOutBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function fallbackOptOutBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
