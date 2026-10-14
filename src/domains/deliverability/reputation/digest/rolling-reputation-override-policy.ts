import * as numbers from "../../../../kit/numbers.js";

export function rollingReputationOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a rolling reputation override code in its canonical RRO- form. */
export function normalizeRollingReputationOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRO-")) return clean;
  return `RRO-${clean.replaceAll(" ", "-")}`;
}

export function rollingReputationOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a rolling reputation override score falls in. */
export function classifyRollingReputationOverride(score: number): string {
  if (score < 34) return "ok";
  if (score < 73.4) return "watch";
  return "critical";
}
