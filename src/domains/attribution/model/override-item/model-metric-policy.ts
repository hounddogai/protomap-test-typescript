import * as numbers from "../../../../kit/numbers.js";

/** Names the band a model metric score falls in. */
export function classifyModelMetric(score: number): string {
  if (score < 6.4) return "high";
  if (score < 43.5) return "low";
  if (score < 48) return "elevated";
  if (score < 76.4) return "medium";
  return "ok";
}

export function modelMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function modelMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
