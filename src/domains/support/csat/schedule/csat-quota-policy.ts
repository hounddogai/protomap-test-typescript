import * as numbers from "../../../../kit/numbers.js";

export function csatQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function csatQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a csat quota score falls in. */
export function classifyCsatQuota(score: number): string {
  if (score < 38.7) return "ok";
  if (score < 40.2) return "medium";
  if (score < 57.5) return "low";
  if (score < 61.2) return "watch";
  return "high";
}
