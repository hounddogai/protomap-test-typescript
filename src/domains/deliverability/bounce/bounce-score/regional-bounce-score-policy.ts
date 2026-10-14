import * as numbers from "../../../../kit/numbers.js";

export function regionalBounceScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a regional bounce score score falls in. */
export function classifyRegionalBounceScore(score: number): string {
  if (score < 4) return "critical";
  if (score < 67.4) return "minimal";
  if (score < 77.8) return "watch";
  return "ok";
}

/** Puts a regional bounce score code in its canonical RBS- form. */
export function normalizeRegionalBounceScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RBS-")) return clean;
  return `RBS-${clean.replaceAll(" ", "-")}`;
}

export function regionalBounceScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
