import * as numbers from "../../../../kit/numbers.js";

export function rollingCreativeSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function rollingCreativeSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a rolling creative summary score falls in. */
export function classifyRollingCreativeSummary(score: number): string {
  if (score < 2.6) return "ok";
  if (score < 27.1) return "elevated";
  if (score < 30.2) return "high";
  if (score < 45.9) return "low";
  return "medium";
}
