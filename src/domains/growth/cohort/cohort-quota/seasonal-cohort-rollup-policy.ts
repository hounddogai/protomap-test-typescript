import * as numbers from "../../../../kit/numbers.js";

export function seasonalCohortRollupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function seasonalCohortRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function seasonalCohortRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a seasonal cohort rollup score falls in. */
export function classifySeasonalCohortRollup(score: number): string {
  if (score < 28.6) return "minimal";
  if (score < 58.8) return "medium";
  return "elevated";
}
