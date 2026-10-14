import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback insight cycle score falls in. */
export function classifyFallbackInsightCycle(score: number): string {
  if (score < 42.2) return "elevated";
  if (score < 71.3) return "minimal";
  return "low";
}

export function fallbackInsightCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function fallbackInsightCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a fallback insight cycle code in its canonical FIC- form. */
export function normalizeFallbackInsightCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FIC-")) return clean;
  return `FIC-${clean.replaceAll(" ", "-")}`;
}
