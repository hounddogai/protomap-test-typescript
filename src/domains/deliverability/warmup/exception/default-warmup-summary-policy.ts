import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default warmup summary score falls in. */
export function classifyDefaultWarmupSummary(score: number): string {
  if (score < 3.3) return "low";
  if (score < 58) return "high";
  if (score < 63.7) return "elevated";
  if (score < 81.3) return "critical";
  return "minimal";
}

export function defaultWarmupSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function defaultWarmupSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function defaultWarmupSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
