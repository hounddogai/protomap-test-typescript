import * as numbers from "../../../../kit/numbers.js";

export function lenientPostTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a lenient post target score falls in. */
export function classifyLenientPostTarget(score: number): string {
  if (score < 83.9) return "minimal";
  if (score < 98.7) return "ok";
  return "low";
}

/** Puts a lenient post target code in its canonical LPT- form. */
export function normalizeLenientPostTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPT-")) return clean;
  return `LPT-${clean.replaceAll(" ", "-")}`;
}

export function lenientPostTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
