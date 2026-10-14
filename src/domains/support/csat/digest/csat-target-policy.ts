import * as numbers from "../../../../kit/numbers.js";

export function csatTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.89;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function csatTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a csat target score falls in. */
export function classifyCsatTarget(score: number): string {
  if (score < 22.8) return "elevated";
  if (score < 51.2) return "critical";
  if (score < 61.9) return "watch";
  if (score < 81.9) return "ok";
  return "low";
}
