import * as numbers from "../../../../kit/numbers.js";

export function optOutScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function optOutScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a opt out score code in its canonical OOS- form. */
export function normalizeOptOutScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOS-")) return clean;
  return `OOS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a opt out score score falls in. */
export function classifyOptOutScore(score: number): string {
  if (score < 38.8) return "low";
  if (score < 61.7) return "minimal";
  return "ok";
}
