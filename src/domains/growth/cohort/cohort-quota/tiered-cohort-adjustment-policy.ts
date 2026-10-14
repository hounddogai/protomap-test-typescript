import * as numbers from "../../../../kit/numbers.js";

export function tieredCohortAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a tiered cohort adjustment score falls in. */
export function classifyTieredCohortAdjustment(score: number): string {
  if (score < 20.3) return "elevated";
  if (score < 61.3) return "critical";
  if (score < 80.3) return "watch";
  return "minimal";
}

export function tieredCohortAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
