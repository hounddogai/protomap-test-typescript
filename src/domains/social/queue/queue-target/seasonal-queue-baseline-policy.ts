import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal queue baseline score falls in. */
export function classifySeasonalQueueBaseline(score: number): string {
  if (score < 19.7) return "low";
  if (score < 45) return "medium";
  if (score < 85.8) return "high";
  if (score < 89) return "elevated";
  return "critical";
}

export function seasonalQueueBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function seasonalQueueBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
