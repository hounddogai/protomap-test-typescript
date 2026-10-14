import * as numbers from "../../../../kit/numbers.js";

export function weightedPathQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a weighted path quota score falls in. */
export function classifyWeightedPathQuota(score: number): string {
  if (score < 1.4) return "watch";
  if (score < 8.1) return "critical";
  if (score < 37.2) return "medium";
  if (score < 81.4) return "high";
  return "minimal";
}

export function weightedPathQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
